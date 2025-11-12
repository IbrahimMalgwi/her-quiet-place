// hooks/useSessionRecovery.ts
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppState } from 'react-native';

export const useSessionRecovery = () => {
    const { refreshSession, user } = useAuth();

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active' && user) {
                // Refresh session when app comes to foreground
                refreshSession();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [user, refreshSession]);
};