import { $Enums, Prisma } from "@prisma/client";

export function parseHistory(
  history: {
    role: $Enums.Role;
    content: Prisma.JsonValue;
  }[]
) {
  const result = history
    .filter(({ content }) => !!content)
    .map(({ role, content }) => {
      if (!content || typeof content !== "object") {
        return "";
      }

      if (Array.isArray(content)) {
        return "";
      }
      const parsedContent = content as Prisma.JsonObject;
      const contentType = (parsedContent.type ?? "") as string;
      if (contentType === "text") {
        const body = parsedContent[contentType];
        return `${role === "ai" ? "Asisten" : "Pengguna"}: ${body as string}`;
      }
    })
    .filter((string) => string !== undefined);

  return result;
}
