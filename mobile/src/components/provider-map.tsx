import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { ThemedText } from './themed-text';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

export type ProviderMapProps = {
  markers: MapMarker[];
  center: { lat: number; lng: number };
  zoom?: number;
  // A distinct pin (e.g. "you are here") - not one of `markers`, never tappable.
  userLocation?: { lat: number; lng: number };
  // Draws a translucent circle of this radius (km) around `userLocation`, if given.
  radiusKm?: number;
  onMarkerPress?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

// react-native-maps needs a custom dev-client build (it links native code, which Expo Go doesn't
// ship) - this project stays on Expo Go, so the map is a self-authored HTML page using the
// Google Maps JavaScript API, rendered in a WebView (fully supported by Expo Go). Full control
// over multiple markers/circles, at the cost of a full-page reload whenever the marker set
// changes (source.html changing remounts the page) rather than an imperative marker update -
// fine at this data size and update frequency.
function buildMapHtml(props: ProviderMapProps): string {
  const { markers, center, zoom = 12, userLocation, radiusKm } = props;
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head>
<body>
<div id="map"></div>
<script>
  function initMap() {
    var center = ${JSON.stringify(center)};
    var map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: center.lat, lng: center.lng },
      zoom: ${zoom},
      disableDefaultUI: true,
      zoomControl: true,
    });

    ${JSON.stringify(markers)}.forEach(function (m) {
      var marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: map,
        title: m.label,
      });
      marker.addListener('click', function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id }));
      });
    });

    ${
      userLocation
        ? `var youMarker = new google.maps.Marker({
      position: ${JSON.stringify(userLocation)},
      map: map,
      title: 'Your location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });`
        : ''
    }

    ${
      userLocation && radiusKm
        ? `new google.maps.Circle({
      map: map,
      center: ${JSON.stringify(userLocation)},
      radius: ${radiusKm * 1000},
      fillColor: '#ec3013',
      fillOpacity: 0.08,
      strokeColor: '#ec3013',
      strokeOpacity: 0.4,
      strokeWeight: 1,
    });`
        : ''
    }
  }
</script>
<script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap" async defer></script>
</body>
</html>`;
}

export function ProviderMap(props: ProviderMapProps) {
  const { onMarkerPress, style } = props;

  if (!API_KEY || API_KEY === 'replace-me') {
    return (
      <View style={[styles.fallback, style]}>
        <ThemedText type="small" themeColor="textSecondary">
          Map unavailable - no Google Maps key configured.
        </ThemedText>
      </View>
    );
  }

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerPress' && typeof data.id === 'string') {
        onMarkerPress?.(data.id);
      }
    } catch {
      // Ignore malformed messages - nothing else posts into this WebView.
    }
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildMapHtml(props) }}
        onMessage={handleMessage}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
