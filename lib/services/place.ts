type GeocodeResult = {
  lat: number;
  lon: number;
};

export async function geocodeCity(city: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      city
    )}&key=${apiKey}`
  );
  if (!response.ok) {
    return null;
  }
  const json = await response.json();
  const location = json.results?.[0]?.geometry?.location;
  if (!location) return null;
  return {
    lat: location.lat,
    lon: location.lng,
  };
}
