import { HttpStatus, applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  type SchemaObject,
} from "@nestjs/swagger";
import { createSuccessResponseSchema } from "@ridgeline/contracts/common";
import { z } from "zod";
import { SWAGGER_SECURITY } from "./swagger.constants";

type ApiSchema = z.ZodType;
type ApiParameterMap = Readonly<Record<string, ApiSchema>>;
type ApiSecurity = keyof typeof SWAGGER_SECURITY;

export interface ApiEndpointResponse {
  status: number;
  description?: string;
  schema?: ApiSchema;
}

export const apiResponse = {
  ok: (schema: ApiSchema): ApiEndpointResponse => ({
    status: HttpStatus.OK,
    schema: createSuccessResponseSchema(schema),
  }),
  okArray: (schema: ApiSchema): ApiEndpointResponse => ({
    status: HttpStatus.OK,
    schema: createSuccessResponseSchema(z.array(schema)),
  }),
  created: (schema: ApiSchema): ApiEndpointResponse => ({
    status: HttpStatus.CREATED,
    schema: createSuccessResponseSchema(schema),
  }),
  empty: (status: number = HttpStatus.OK): ApiEndpointResponse => ({ status }),
  badRequest: (): ApiEndpointResponse => ({ status: HttpStatus.BAD_REQUEST }),
  unauthorized: (): ApiEndpointResponse => ({
    status: HttpStatus.UNAUTHORIZED,
  }),
  forbidden: (): ApiEndpointResponse => ({ status: HttpStatus.FORBIDDEN }),
  notFound: (): ApiEndpointResponse => ({ status: HttpStatus.NOT_FOUND }),
  conflict: (): ApiEndpointResponse => ({ status: HttpStatus.CONFLICT }),
} as const;

export interface ApiEndpointOptions {
  summary: string;
  description?: string;
  security?: ApiSecurity;
  request?: {
    body?: ApiSchema;
    params?: ApiParameterMap;
    query?: ApiParameterMap;
  };
  responses: readonly ApiEndpointResponse[];
}

const RESPONSE_DESCRIPTIONS: Readonly<Partial<Record<number, string>>> = {
  [HttpStatus.OK]: "Request succeeded",
  [HttpStatus.CREATED]: "Resource created",
  [HttpStatus.NO_CONTENT]: "Request succeeded with no response body",
  [HttpStatus.BAD_REQUEST]: "Request validation failed",
  [HttpStatus.UNAUTHORIZED]: "Authentication is required or invalid",
  [HttpStatus.FORBIDDEN]:
    "The authenticated user is not allowed to perform this action",
  [HttpStatus.NOT_FOUND]: "Resource not found",
  [HttpStatus.CONFLICT]:
    "The request conflicts with the current resource state",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "Unexpected server error",
};

export function ApiControllerDocs(tag: string): ClassDecorator {
  return applyDecorators(ApiTags(tag));
}

export function ApiEndpoint(options: ApiEndpointOptions): MethodDecorator {
  const decorators: Array<ClassDecorator | MethodDecorator> = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
  ];

  addSecurityDecorator(decorators, options.security);
  addRequestDecorators(decorators, options.request);

  const responses = withImpliedUnauthorized(options.responses, options.security);

  for (const response of responses) {
    decorators.push(
      ApiResponse({
        status: response.status,
        description:
          response.description ??
          RESPONSE_DESCRIPTIONS[response.status] ??
          "Response",
        ...(response.schema
          ? { schema: toOpenApiSchema(response.schema, "output") }
          : {}),
      }),
    );
  }

  return applyDecorators(...decorators);
}

// A secured endpoint always documents 401 whether the caller remembered to
// list it or not — one less thing to duplicate across every controller.
function withImpliedUnauthorized(
  responses: readonly ApiEndpointResponse[],
  security: ApiSecurity | undefined,
): readonly ApiEndpointResponse[] {
  if (!security) {
    return responses;
  }

  const unauthorized: number = HttpStatus.UNAUTHORIZED;
  const hasUnauthorized = responses.some(
    (response) => response.status === unauthorized,
  );

  return hasUnauthorized
    ? responses
    : [...responses, apiResponse.unauthorized()];
}

function addSecurityDecorator(
  decorators: Array<ClassDecorator | MethodDecorator>,
  security?: ApiSecurity,
): void {
  if (security === "accessToken") {
    decorators.push(ApiBearerAuth(SWAGGER_SECURITY.accessToken));
  }
}

function addRequestDecorators(
  decorators: Array<ClassDecorator | MethodDecorator>,
  request?: ApiEndpointOptions["request"],
): void {
  if (!request) {
    return;
  }

  if (request.body) {
    decorators.push(
      ApiBody({
        required: isRequired(request.body),
        schema: toOpenApiSchema(request.body, "input"),
      }),
    );
  }

  for (const [name, schema] of Object.entries(request.params ?? {})) {
    decorators.push(
      ApiParam({
        name,
        required: true,
        schema: toOpenApiSchema(schema, "input"),
      }),
    );
  }

  for (const [name, schema] of Object.entries(request.query ?? {})) {
    decorators.push(
      ApiQuery({
        name,
        required: isRequired(schema),
        schema: toOpenApiSchema(schema, "input"),
      }),
    );
  }
}

function isRequired(schema: ApiSchema): boolean {
  return !schema.safeParse(undefined).success;
}

function toOpenApiSchema(
  schema: ApiSchema,
  io: "input" | "output",
): SchemaObject {
  const generated = z.toJSONSchema(schema, {
    io,
    reused: "inline",
    target: "openapi-3.0",
    unrepresentable: "any",
  });
  const normalized: Record<string, unknown> = { ...generated };

  delete normalized["~standard"];
  delete normalized.$schema;

  return normalized;
}
