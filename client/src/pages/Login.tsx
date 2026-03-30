import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../../shared/schemas';
import { trpc } from '../trpc';
import { useAuthStore } from '../store/authStore';
import type { z } from 'zod';

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_CREDS = [
  { label: 'Admin', username: 'admin', password: 'admin123', desc: 'Full access' },
  { label: 'Admission Officer', username: 'officer', password: 'officer123', desc: 'Manage applicants' },
  { label: 'Management', username: 'mgmt', password: 'mgmt123', desc: 'View only' },
];

export function Login() {
  const login = useAuthStore((s) => s.login);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      login(data.token, data.username, data.role);
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const fillCredentials = (username: string, password: string) => {
    setValue('username', username);
    setValue('password', password);
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div className="sidebar-logo-icon" style={{ margin: '0 auto 1rem', width: 56, height: 56, fontSize: '1.5rem' }}>A</div>
        </div>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to AdmissionCRM</p>

        <div className="login-demo">
          <div className="login-demo-title">Demo Credentials</div>
          {DEMO_CREDS.map((c) => (
            <div
              key={c.username}
              className="login-demo-cred"
              onClick={() => fillCredentials(c.username, c.password)}
            >
              <span>{c.label}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{c.desc}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              {...register('username')}
              className="form-input"
              placeholder="Enter username"
              autoComplete="username"
            />
            {errors.username && <p className="form-error">{errors.username.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              {...register('password')}
              type="password"
              className="form-input"
              placeholder="Enter password"
              autoComplete="current-password"
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          {loginMutation.isError && (
            <p className="form-error" style={{ marginBottom: 'var(--space-4)' }}>
              Invalid credentials. Please try again.
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-3)' }}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
