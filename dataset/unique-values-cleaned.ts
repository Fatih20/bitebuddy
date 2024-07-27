import { ActuallyFinal, FinalDataCsv } from "./type.ts";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import { convertData } from "./common.ts";

function setArrayAdd(set: Set<string>, values: string[] | string) {
  if (Array.isArray(values)) {
    values.forEach((val) => {
      set.add(val);
    });
  } else {
    set.add(values);
  }
}

(async function main() {
  const raw = await fs.readFile("cleaned.json", { encoding: "utf-8" });

  const data = JSON.parse(raw) as ActuallyFinal[];

  const menuTag = new Set<string>();
  const dishType = new Set<string>();
  const cuisine = new Set<string>();
  const flavor = new Set<string>();

  data.forEach((e) => {
    setArrayAdd(menuTag, e.menuTag);
    setArrayAdd(dishType, e.dishType);
    setArrayAdd(cuisine, e.cuisine);
    setArrayAdd(flavor, e.flavor);
  });

  const result = {
    menuTag: [...menuTag.values()],
    dishType: [...dishType.values()],
    cuisine: [...cuisine.values()],
    flavor: [...flavor.values()],
  };

  await fs.writeFile("unique-values-cleaned.json", JSON.stringify(result), {
    encoding: "utf-8",
  });
})();
