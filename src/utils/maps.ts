const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let mapsPromise = null;

export function loadGoogleMaps() {
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('No Google Maps API key configured'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => {
      mapsPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return mapsPromise;
}

export async function calculateRoute(origin, destination) {
  const maps = await loadGoogleMaps();
  const service = new maps.DirectionsService();

  return new Promise((resolve, reject) => {
    service.route(
      { origin, destination, travelMode: maps.TravelMode.WALKING },
      (result, status) => {
        if (status === 'OK') {
          const leg = result.routes[0].legs[0];
          resolve({
            distance: leg.distance.text,
            distanceMeters: leg.distance.value,
            duration: leg.duration.text,
            durationSeconds: leg.duration.value,
            steps: leg.steps,
            polyline: result.routes[0].overview_polyline,
            startLocation: { lat: leg.start_location.lat(), lng: leg.start_location.lng() },
            endLocation: { lat: leg.end_location.lat(), lng: leg.end_location.lng() },
          });
        } else {
          reject(new Error(`Directions failed: ${status}`));
        }
      }
    );
  });
}

export async function reverseGeocode(lat, lng) {
  const maps = await loadGoogleMaps();
  const geocoder = new maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

// Haversine formula — returns distance in meters
export function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isNearDestination(curLat, curLng, destLat, destLng, radiusMeters = 50) {
  return getDistanceMeters(curLat, curLng, destLat, destLng) <= radiusMeters;
}
