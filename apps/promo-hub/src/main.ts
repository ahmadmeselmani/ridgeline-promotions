import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { SWAGGER_PATH, setupSwagger } from "@ridgeline/nest-common";
import { AppModule } from "./app.module";
import { HUB_SWAGGER_OPTIONS } from "./common/swagger/swagger.constants";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:3003").split(","),
  });
  const port = Number(process.env.PORT) || 3004;
  setupSwagger(app, HUB_SWAGGER_OPTIONS);
  await app.listen(port);

  console.log(`Server is running on: http://localhost:${port}`);
  console.log(`Swagger is running on: http://localhost:${port}/${SWAGGER_PATH}`);
}
void bootstrap();
