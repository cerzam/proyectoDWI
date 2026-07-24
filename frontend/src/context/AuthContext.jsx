import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { apiClient } from '../lib/apiClient.js';
import { createSingleFlightQueue } from '../lib/singleFlightQueue.js';
import { getBackgroundProfileError } from '../lib/profileValidationPolicy.js';

const PROFILE_FRESHNESS_MS = 5000;

const AuthContext = createContext({
  session: null,
  user: null,
  account: null,
  initialLoading: true,
  profileRefreshing: false,
  profileError: '',
  refreshProfile: async () => null,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [profileRefreshing, setProfileRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const initialLoadingRef = useRef(true);
  const sessionRef = useRef(null);
  const accountRef = useRef(null);
  const lastValidatedRef = useRef({ token: null, userId: null, at: 0 });
  const validationWorkerRef = useRef(null);
  const validationQueueRef = useRef(null);

  const finishInitialLoading = useCallback(() => {
    if (!initialLoadingRef.current) return;
    initialLoadingRef.current = false;
    if (mountedRef.current) setInitialLoading(false);
  }, []);

  const applySession = useCallback((newSession) => {
    const previousUserId = sessionRef.current?.user?.id;
    const nextUserId = newSession?.user?.id;
    sessionRef.current = newSession;

    if (mountedRef.current) {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    }

    if (!newSession || (previousUserId && previousUserId !== nextUserId)) {
      accountRef.current = null;
      lastValidatedRef.current = { token: null, userId: null, at: 0 };
      if (mountedRef.current) {
        setAccount(null);
        setProfileError('');
      }
    }
  }, []);

  const performProfileValidation = useCallback(
    async ({ session: targetSession, initial, force }) => {
      const targetUserId = targetSession.user.id;
      const lastValidated = lastValidatedRef.current;
      const stillFresh =
        !force &&
        accountRef.current &&
        lastValidated.token === targetSession.access_token &&
        lastValidated.userId === targetUserId &&
        Date.now() - lastValidated.at < PROFILE_FRESHNESS_MS;

      if (stillFresh) {
        if (initial) finishInitialLoading();
        return accountRef.current;
      }

      if (!initial && mountedRef.current) setProfileRefreshing(true);
      if (mountedRef.current) setProfileError('');

      try {
        const response = await apiClient('/api/auth/me');
        const currentSession = sessionRef.current;

        if (currentSession?.user?.id === targetUserId) {
          accountRef.current = response.user;
          lastValidatedRef.current = {
            token: currentSession.access_token,
            userId: targetUserId,
            at: Date.now(),
          };
          if (mountedRef.current) setAccount(response.user);
        }

        return response.user;
      } catch (error) {
        const backgroundError = getBackgroundProfileError(error);
        if (
          mountedRef.current &&
          sessionRef.current?.user?.id === targetUserId &&
          backgroundError
        ) {
          setProfileError(backgroundError);
        }
        throw error;
      } finally {
        if (!initial && mountedRef.current) setProfileRefreshing(false);
        if (initial) finishInitialLoading();
      }
    },
    [finishInitialLoading]
  );

  validationWorkerRef.current = performProfileValidation;
  if (!validationQueueRef.current) {
    validationQueueRef.current = createSingleFlightQueue((job) =>
      validationWorkerRef.current(job)
    );
  }

  const requestProfileValidation = useCallback(
    (newSession, { force = false } = {}) => {
      applySession(newSession);

      if (!newSession) {
        finishInitialLoading();
        return Promise.resolve(null);
      }

      return validationQueueRef.current.enqueue({
        key: newSession.access_token,
        session: newSession,
        initial: initialLoadingRef.current,
        force,
      });
    },
    [applySession, finishInitialLoading]
  );

  const refreshProfile = useCallback(
    async ({ force = true, reason = 'manual' } = {}) => {
      const hadSession = Boolean(sessionRef.current);
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (!data.session && reason === 'visibility' && hadSession) {
        applySession(null);
        finishInitialLoading();
        if (window.location.pathname !== '/session-expired') {
          window.location.assign('/session-expired');
        }
        return null;
      }

      return requestProfileValidation(data.session, { force });
    },
    [applySession, finishInitialLoading, requestProfileValidation]
  );

  useEffect(() => {
    mountedRef.current = true;

    void refreshProfile({ force: true, reason: 'initial' }).catch(() => {
      finishInitialLoading();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT' || !newSession) {
        applySession(null);
        finishInitialLoading();
        return;
      }

      void requestProfileValidation(newSession).catch(() => {
        // apiClient conserva los redirects de sesión y cuenta no disponible.
      });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      void refreshProfile({ force: true, reason: 'visibility' }).catch(() => {
        // Un error de red conserva la interfaz y queda disponible en profileError.
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    applySession,
    finishInitialLoading,
    refreshProfile,
    requestProfileValidation,
  ]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        account,
        initialLoading,
        profileRefreshing,
        profileError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
