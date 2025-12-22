import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export const AUDIT_KEY = 'audit';
export interface AuditMetadata {
  action: string;
  entityType: string;
  description?: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Log successful operations
          const duration = Date.now() - startTime;
          // Audit logging is handled by the AuditService in each service method
          // This interceptor can be used for automatic logging if needed
        },
        error: (error) => {
          // Optionally log failed operations
        },
      }),
    );
  }
}
