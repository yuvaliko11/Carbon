const proj4 = require('proj4');
const FIJI_PROJECTION = '+proj=tmerc +lat_0=-17 +lon_0=178.75 +k=0.99985 +x_0=2000000 +y_0=4000000 +ellps=WGS72 +towgs84=0,0,4.5,0,0,0.554,0.2263 +units=m +no_defs';
const WGS84 = 'EPSG:4326';

function parseFijiCoordinatesToGeoJSON(fileContent) {
    const lines = fileContent.split(/\r?\n/); // Handle both \n and \r\n
    const coordinates = [];

    lines.forEach(line => {
        // Pre-process: replace commas/tabs with spaces
        const normalized = line.trim().replace(/[,;\t]/g, ' ').replace(/\s+/g, ' ');
        if (!normalized) return;

        // Split and parse all potential numbers
        const tokenValues = normalized.split(' ').map(t => parseFloat(t));
        // Filter out NaNs
        const validNumbers = tokenValues.filter(n => !isNaN(n));

        // Strategy 1: Look for Fiji Grid range (Large numbers)
        // Easting ~ 1,800,000 - 2,200,000
        // Northing ~ 3,600,000 - 4,100,000
        // We use a broader check > 100,000 to be safe but avoid small FIDs (0, 1, 2...)
        const coordinateCandidates = validNumbers.filter(n => n > 100000);

        let easting, northing;

        if (coordinateCandidates.length === 2) {
            // High confidence: We found exactly 2 coordinate-like numbers
            easting = coordinateCandidates[0];
            northing = coordinateCandidates[1];
        } else if (validNumbers.length === 2) {
            // Strict 2-column mode (e.g. no PID)
            easting = validNumbers[0];
            northing = validNumbers[1];
        } else if (validNumbers.length >= 3) {
            // Likely PID, E, N or E, N, Z
            // If the first number is small (likely ID), skip it
            if (validNumbers[0] < 100000 && validNumbers[1] > 100000) {
                easting = validNumbers[1];
                northing = validNumbers[2];
            } else {
                // Fallback: take first two
                easting = validNumbers[0];
                northing = validNumbers[1];
            }
        }

        if (easting && northing && !isNaN(easting) && !isNaN(northing)) {
            try {
                const projected = proj4(FIJI_PROJECTION, WGS84, [easting, northing]);
                // Sanity Check: Fiji is roughly Lat -16 to -19, Lon 177 to 180 (or -179)
                // WGS84: Lon, Lat
                const [lon, lat] = projected;
                if (lat > -25 && lat < -12 && (lon > 175 || lon < -175)) {
                    coordinates.push(projected);
                }
            } catch (e) {
                // ignore projection errors
            }
        }
    });

    if (coordinates.length > 0) {
        const first = coordinates[0];
        const last = coordinates[coordinates.length - 1];
        // Close polygon if not closed
        if (first[0] !== last[0] || first[1] !== last[1]) {
            coordinates.push(first);
        }
    } else {
        return null; // Return null if no valid coordinates found
    }

    return { type: "Polygon", coordinates: [coordinates] };
}
module.exports = { parseFijiCoordinatesToGeoJSON };
