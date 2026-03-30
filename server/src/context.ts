import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'admission-mgmt-secret-key-2026';

export interface UserPayload {
  username: string;
  role: 'admin' | 'officer' | 'management';
}

export function createContext({ req }: CreateExpressContextOptions) {
  let user: UserPayload | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      user = jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch {
      // invalid token — user stays null
    }
  }

  return { user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
export { JWT_SECRET };
