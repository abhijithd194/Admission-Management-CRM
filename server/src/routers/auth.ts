import { router, publicProcedure } from '../trpc';
import { loginSchema } from './schemas';
import { JWT_SECRET } from '../context';
import jwt from 'jsonwebtoken';

const USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' as const },
  { username: 'officer', password: 'officer123', role: 'officer' as const },
  { username: 'mgmt', password: 'mgmt123', role: 'management' as const },
];

export const authRouter = router({
  login: publicProcedure.input(loginSchema).mutation(({ input }) => {
    const user = USERS.find(
      (u) => u.username === input.username && u.password === input.password
    );
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return { token, username: user.username, role: user.role };
  }),
});
