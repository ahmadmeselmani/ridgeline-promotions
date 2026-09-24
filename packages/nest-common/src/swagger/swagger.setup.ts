import type { INestApplication } from "@nestjs/common";
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from "@nestjs/swagger";
import {
  SWAGGER_JSON_PATH,
  SWAGGER_PATH,
  SWAGGER_SECURITY,
} from "./swagger.constants";

export interface SwaggerSetupOptions {
  title: string;
  description: string;
  version: string;
}

export function setupSwagger(
  app: INestApplication,
  options: SwaggerSetupOptions,
): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion(options.version)
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        description: "Any non-empty token is accepted in the sandbox",
      },
      SWAGGER_SECURITY.accessToken,
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: options.title,
    jsonDocumentUrl: SWAGGER_JSON_PATH,
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
      docExpansion: "list",
      filter: true,
      tagsSorter: "alpha",
    },
  });

  return document;
}
