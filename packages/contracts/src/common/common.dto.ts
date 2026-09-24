import { z } from "zod";

export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export function createSuccessResponseSchema<DataSchema extends z.ZodType>(
  dataSchema: DataSchema,
) {
  return z.object({
    message: z.string(),
    data: dataSchema,
  });
}

export type SuccessResponse<DataSchema extends z.ZodType> = z.infer<
  ReturnType<typeof createSuccessResponseSchema<DataSchema>>
>;
