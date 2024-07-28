import { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export const PaymentOption = ({
  label,
  srcImg,
  selectedValue,
  updateSelected,
}: {
  label: string;
  srcImg: string;
  selectedValue: string;
  updateSelected: (val: string) => void;
}) => {
  return (
    <Button
      variant={"outline"}
      className={cn(
        selectedValue === label ? "border-primary" : "border-plainSecondary",
        "border border-solid rounded-lg group hover:bg-secondary py-6 flex justify-start gap-4"
      )}
      onClick={() => {
        updateSelected(label);
      }}
    >
      <div className="w-4 h-4 border border-solid border-plainSecondary rounded-full p-[0.1rem]">
        <div className={cn(
          selectedValue === label ? "bg-secondary" : "bg-transparent",
          "w-full h-full rounded-full group-hover:bg-primary"
        )}/>
      </div>
      <div className={cn(
        selectedValue === label ? "bg-secondary" : "bg-plainSecondary",
        "p-2 rounded-lg w-8 h-8 flex items-center group-hover:bg-primary"
        )}>
        <img src={srcImg}/>
      </div>
      {label}
    </Button>
  );
};

export const PaymentDetails = () => {
  const [selectedLabel, setSelectedLabel] = useState<string>("Buddy Wallet");

  return (
    <div className="pt-3">
      <div className="flex flex-col gap-3 ">
        <PaymentOption
          label="Buddy Wallet"
          srcImg="wallet.svg"
          selectedValue={selectedLabel}
          updateSelected={(val) => setSelectedLabel(val)}
        />
        <PaymentOption
          label="Cash"
          srcImg="cash.svg"
          selectedValue={selectedLabel}
          updateSelected={(val) => setSelectedLabel(val)}
        />
      </div>
    </div>
  );
};
