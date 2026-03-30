import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { trpc, createTRPCClient } from './trpc';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Masters } from './pages/Masters';
import { Quotas } from './pages/Quotas';
import { Applicants } from './pages/Applicants';
import { ApplicantDetail } from './pages/ApplicantDetail';
import { Allocation } from './pages/Allocation';
import { Admissions } from './pages/Admissions';

function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false },
    },
  }));
  const [trpcClient] = useState(() => createTRPCClient());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/masters" element={<ProtectedRoute roles={['admin']} />}>
                  <Route index element={<Masters />} />
                </Route>
                <Route path="/quotas" element={<ProtectedRoute roles={['admin']} />}>
                  <Route index element={<Quotas />} />
                </Route>
                <Route path="/applicants" element={<ProtectedRoute roles={['admin', 'officer']} />}>
                  <Route index element={<Applicants />} />
                  <Route path=":id" element={<ApplicantDetail />} />
                </Route>
                <Route path="/allocation" element={<ProtectedRoute roles={['admin', 'officer']} />}>
                  <Route index element={<Allocation />} />
                </Route>
                <Route path="/admissions" element={<ProtectedRoute roles={['admin', 'officer']} />}>
                  <Route index element={<Admissions />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
