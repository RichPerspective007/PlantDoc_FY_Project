import { useState, useCallback } from "react";

export function useFarmerLocation() {
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Wrapped in useCallback so it doesn't cause unnecessary re-renders when passed around
  const getLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = "Geolocation is not supported by your browser.";
        setError(msg);
        reject(new Error(msg));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoords(newCoords);
          setLoading(false);
          resolve(newCoords); // Successfully returns coordinates to the await call
        },
        (err) => {
          setLoading(false);
          const errorMessages = {
            [err.PERMISSION_DENIED]: "Please allow location access to check local climate risks.",
            [err.POSITION_UNAVAILABLE]: "Location information is unavailable.",
            [err.TIMEOUT]: "The request to get user location timed out."
          };
          const msg = errorMessages[err.code] || "An unknown error occurred.";
          setError(msg);
          reject(new Error(msg)); // Catches the failure so your UI can handle it
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  return { coords, error, loading, getLocation };
}