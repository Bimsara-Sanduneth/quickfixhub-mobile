import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type CurrentLocationState =
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'ready'; lat: number; lng: number };

// Only requests the permission/fix when `enabled` is true - the discovery map is the only screen
// that needs this, so a customer who never opens it is never prompted.
export function useCurrentLocation(enabled: boolean): CurrentLocationState {
  const [state, setState] = useState<CurrentLocationState>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setState({ status: 'denied' });
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        if (!cancelled) {
          setState({ status: 'ready', lat: position.coords.latitude, lng: position.coords.longitude });
        }
      } catch {
        if (!cancelled) setState({ status: 'unavailable' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
