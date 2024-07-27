import { z } from "zod";

export interface ErrorField {
  field: string;
  message: string;
}

/**
 * Parse Zod error to ErrorField.
 *
 * Only get the first error field if there are multiple errors in one field.
 *
 * @param zodParseResult
 * @returns ErrorField[]
 */
export const getZodParsingErrorFields = <T>(
  zodParseResult: z.SafeParseError<T>
): ErrorField[] => {
  const addedField = new Map();
  const errors: ErrorField[] = [];

  zodParseResult.error.errors.forEach((error) => {
    if (!addedField.has(error.path[0])) {
      addedField.set(error.path[0], true);
      errors.push({
        field: String(error.path[0]),
        message: error.message,
      });
    }
  });

  return errors;
};
