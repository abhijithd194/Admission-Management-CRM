import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/src/routers/index';
import { useAuthStore } from './store/authStore';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/trpc',
        headers() {
          const token = useAuthStore.getState().token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
