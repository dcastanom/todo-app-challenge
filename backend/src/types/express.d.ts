import 'express';

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      email: string;
      jti: string;
      exp: number;
    }
    interface Request {
      user?: AuthUser;
      validatedQuery?: unknown;
    }
  }
}
