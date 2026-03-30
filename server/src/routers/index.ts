import { router } from '../trpc';
import { authRouter } from './auth';
import { mastersRouter } from './masters';
import { quotasRouter } from './quotas';
import { applicantsRouter } from './applicants';
import { allocationRouter } from './allocation';
import { admissionRouter } from './admission';
import { dashboardRouter } from './dashboard';

export const appRouter = router({
  auth: authRouter,
  masters: mastersRouter,
  quotas: quotasRouter,
  applicants: applicantsRouter,
  allocation: allocationRouter,
  admission: admissionRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
