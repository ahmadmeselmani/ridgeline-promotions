import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

export const SUCCESS_MESSAGE = "Success";

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) =>
        data === undefined || data === null
          ? data
          : { message: SUCCESS_MESSAGE, data },
      ),
    );
  }
}
