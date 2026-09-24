import { BadRequestException, PipeTransform } from "@nestjs/common";
import { z } from "zod";

// A 400 whose `message` a person can read ("value: A percentage can't be over
// 100"), with the full Zod tree under `issues` for API clients.
export function zodBadRequest(error: z.ZodError): BadRequestException {
  const message = error.issues
    .map((issue) =>
      issue.path.length > 0
        ? `${issue.path.join(".")}: ${issue.message}`
        : issue.message,
    )
    .join("; ");
  return new BadRequestException({
    message,
    issues: z.treeifyError(error),
  });
}

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw zodBadRequest(result.error);
    }
    return result.data;
  }
}
