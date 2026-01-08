// Helper: Haversine distance (meters)
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // meters
    const toRadians = (deg) => (deg * Math.PI) / 180;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
// Map MapMyIndia place_type to granularity
function detectMapMyIndiaGranularity(place_type) {
    if (!place_type)
        return 'unknown';
    switch (place_type.toLowerCase()) {
        case 'house':
        case 'building':
        case 'poi':
            return 'exact';
        case 'street':
        case 'road':
            return 'street';
        case 'locality':
        case 'sublocality':
            return 'neighbourhood';
        case 'city':
        case 'village':
            return 'city';
        case 'district':
        case 'state':
            return 'region';
        case 'country':
            return 'country';
        default:
            return 'unknown';
    }
}
// Helper: determine granularity from nominatim result.type/class
function detectGranularity(t, c) {
    let gran = 'unknown';
    const exactTypes = new Set(['house', 'building', 'residential', 'yes', 'commercial', 'apartments']);
    const streetTypes = new Set(['street', 'road', 'pedestrian']);
    const neighbourhoodTypes = new Set(['neighbourhood', 'suburb', 'quarter']);
    const cityTypes = new Set(['city', 'town', 'village', 'municipality']);
    const regionTypes = new Set(['state', 'region', 'province', 'county']);
    const countryTypes = new Set(['country']);
    if (t && exactTypes.has(t))
        gran = 'exact';
    else if (t && streetTypes.has(t))
        gran = 'street';
    else if (t && neighbourhoodTypes.has(t))
        gran = 'neighbourhood';
    else if (t && cityTypes.has(t))
        gran = 'city';
    else if (t && regionTypes.has(t))
        gran = 'region';
    else if (t && countryTypes.has(t))
        gran = 'country';
    else if (c && c === 'place' && t === 'house')
        gran = 'exact';
    return gran;
}
// Forward geocoding with MapMyIndia API
export async function getCoordinatesFromMapMyIndia(locationText) {
    try {
        if (!locationText || locationText.trim() === '')
            return null;
        const MAPMYINDIA_API_KEY = process.env.MAPMYINDIA_API_KEY || 'YOUR_MAPMYINDIA_API_KEY';
        const url = `https://atlas.mapmyindia.com/api/places/geocode?address=${encodeURIComponent(locationText)}&itemCount=5`;
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${MAPMYINDIA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            console.error({ event: 'mapmyindia_geocode_error', status: res.status, statusText: res.statusText });
            throw new Error('LOCATION_SERVICE_ERROR');
        }
        const data = await res.json();
        if (!data.copResults || data.copResults.length === 0)
            return null;
        // Map MapMyIndia result to ForwardGeocodeResult
        const enriched = data.copResults.map((result) => {
            const latitude = parseFloat(result.latitude || result.lat);
            const longitude = parseFloat(result.longitude || result.lng);
            const granularity = detectMapMyIndiaGranularity(result.type);
            // MapMyIndia doesn't provide bounding box in the same format, so we'll estimate
            let estimatedRadiusMeters;
            if (granularity === 'exact')
                estimatedRadiusMeters = 50;
            else if (granularity === 'street')
                estimatedRadiusMeters = 200;
            else if (granularity === 'neighbourhood')
                estimatedRadiusMeters = 1000;
            else if (granularity === 'city')
                estimatedRadiusMeters = 5000;
            else if (granularity === 'region')
                estimatedRadiusMeters = 50000;
            return {
                latitude,
                longitude,
                displayName: result.formattedAddress || result.placeName,
                osmType: undefined,
                osmClass: undefined,
                type: result.type,
                boundingbox: undefined,
                granularity,
                estimatedRadiusMeters,
                importance: result.confidenceScore || 1,
                raw: result
            };
        });
        const rankMap = {
            exact: 6,
            street: 5,
            neighbourhood: 4,
            city: 3,
            region: 2,
            country: 1,
            unknown: 0
        };
        enriched.sort((a, b) => {
            const ra = rankMap[a.granularity] ?? 0;
            const rb = rankMap[b.granularity] ?? 0;
            if (ra !== rb)
                return rb - ra;
            const ea = a.estimatedRadiusMeters ?? Number.POSITIVE_INFINITY;
            const eb = b.estimatedRadiusMeters ?? Number.POSITIVE_INFINITY;
            if (ea !== eb)
                return ea - eb;
            return (b.importance ?? 0) - (a.importance ?? 0);
        });
        return enriched[0] || null;
    }
    catch (err) {
        console.error({ event: 'mapmyindia_geocode_failure', error: err instanceof Error ? err.message : err });
        return null;
    }
}
// Forward geocoding with Nominatim (OpenStreetMap)
export async function getCoordinatesFromLocation(locationText) {
    try {
        if (!locationText || locationText.trim() === '')
            return null;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText)}&limit=5&addressdetails=1`, {
            headers: {
                'User-Agent': 'AttendanceApp/1.0 (+https://your-org.example)'
            }
        });
        if (!res.ok) {
            console.error({ event: 'geocode_forward_error', status: res.status, statusText: res.statusText });
            throw new Error('LOCATION_SERVICE_ERROR');
        }
        const arr = await res.json();
        if (!arr || arr.length === 0)
            return null;
        // Build enriched results with granularity and estimated radius
        const enriched = arr.map((result) => {
            const t = result.type;
            const c = result.class;
            const granularity = detectGranularity(t, c);
            let estimatedRadiusMeters;
            if (result.boundingbox && result.boundingbox.length === 4) {
                const [latMinStr, latMaxStr, lonMinStr, lonMaxStr] = result.boundingbox;
                const latMin = parseFloat(latMinStr);
                const latMax = parseFloat(latMaxStr);
                const lonMin = parseFloat(lonMinStr);
                const lonMax = parseFloat(lonMaxStr);
                estimatedRadiusMeters = Math.round(calculateDistanceMeters(latMin, lonMin, latMax, lonMax) / 2);
            }
            const importance = result.importance ? parseFloat(result.importance) : 0;
            return {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                displayName: result.display_name,
                osmType: result.osm_type,
                osmClass: result.class,
                type: result.type,
                boundingbox: result.boundingbox,
                granularity,
                estimatedRadiusMeters,
                importance,
                raw: result
            };
        });
        // Ranking preference: prefer higher granularity
        const rankMap = {
            exact: 6,
            street: 5,
            neighbourhood: 4,
            city: 3,
            region: 2,
            country: 1,
            unknown: 0
        };
        enriched.sort((a, b) => {
            const ra = rankMap[a.granularity] ?? 0;
            const rb = rankMap[b.granularity] ?? 0;
            if (ra !== rb)
                return rb - ra;
            const ea = a.estimatedRadiusMeters ?? Number.POSITIVE_INFINITY;
            const eb = b.estimatedRadiusMeters ?? Number.POSITIVE_INFINITY;
            if (ea !== eb)
                return ea - eb;
            return (b.importance ?? 0) - (a.importance ?? 0);
        });
        return enriched[0] || null;
    }
    catch (err) {
        console.error({ event: 'geocode_forward_failure', error: err instanceof Error ? err.message : err });
        return null;
    }
}
// Reverse geocode to human-readable address
export async function getHumanReadableLocation(coordinates) {
    try {
        const location = await getCoordinatesFromLocation(`${coordinates.latitude},${coordinates.longitude}`);
        if (!location)
            return `Coordinates: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
        return location.displayName || `Coordinates: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
    }
    catch (err) {
        console.error({ event: 'human_readable_failure', error: err instanceof Error ? err.message : err });
        return `Coordinates: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
    }
}
// Convenience format
export function formatCoordinates(coordinates) {
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
}
