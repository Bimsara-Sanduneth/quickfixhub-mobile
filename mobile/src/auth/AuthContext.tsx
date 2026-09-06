import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import * as authApi from '@/api/auth';
import { setUnauthenticatedHandler } from '@/api/client';
import type { LoginRequest, RegisterRequest } from '@/api/types';

import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokenStorage';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  // True for the one session right after a successful register, until profile-completion
  // clears it. (app)/_layout.tsx reads this to route new accounts through profile-completion
  // instead of straight to the home screen - the *only* place that decides where an
  // authenticated user lands, so there's no race between this and the (auth) group's own
  // "authenticated -> redirect to /(app)" logic.
  justRegistered: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearJustRegistered: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAccessToken().then((token) => {
      if (!cancelled) {
        setStatus(token ? 'authenticated' : 'unauthenticated');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setUnauthenticatedHandler(() => setStatus('unauthenticated'));
    return () => setUnauthenticatedHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      justRegistered,
      async login(payload) {
        const tokens = await authApi.login(payload);
        await saveTokens(tokens);
        setStatus('authenticated');
      },
      async register(payload) {
        const tokens = await authApi.register(payload);
        await saveTokens(tokens);
        setJustRegistered(true);
        setStatus('authenticated');
      },
      async logout() {
        const refreshToken = await getRefreshToken();
        await clearTokens();
        setStatus('unauthenticated');
        setJustRegistered(false);
        if (refreshToken) {
          // Best-effort server-side revoke; the client has already dropped its tokens either way.
          authApi.logout({ refreshToken }).catch(() => {});
        }
      },
      clearJustRegistered() {
        setJustRegistered(false);
      },
    }),
    [status, justRegistered],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
