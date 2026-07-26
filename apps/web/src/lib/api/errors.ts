export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static isApiError(err: unknown): err is ApiError {
    return err instanceof ApiError;
  }

  static fromResponse(status: number, body: { code?: string; message?: string; details?: unknown }): ApiError {
    const code = body.code ?? "UNKNOWN_ERROR";
    const message = body.message ?? `HTTP ${status}`;
    return new ApiError(code, message, status, body.details);
  }
}
