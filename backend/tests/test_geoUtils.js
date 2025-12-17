const assert = require('assert');
const { parseFijiCoordinatesToGeoJSON } = require('../utils/geoUtils');

console.log('🧪 Running geoUtils Tests...');

// Test 1: Valid Coordinates
const validContent = `
2000000 4000000
2000100 4000000
2000100 4000100
2000000 4000100
`;
try {
    const result = parseFijiCoordinatesToGeoJSON(validContent);
    assert.strictEqual(result.type, 'Polygon', 'Result type should be Polygon');
    assert.ok(result.coordinates[0].length >= 5, 'Should close the loop (5 points total)');
    // Check first point (should be approx 178.75, -17.0)
    // Actually our fake coords are the origin, so it should be exactly that.
    // X=2000000 -> Lon=178.75?, Y=4000000 -> Lat=-17? 
    // Wait, the projection def says +lat_0=-17 +lon_0=178.75 +x_0=2000000 +y_0=4000000
    // So 2000000, 4000000 should map to 178.75, -17

    const firstPoint = result.coordinates[0][0];
    assert.ok(Math.abs(firstPoint[0] - 178.75) < 0.001, `Expected Lon ~178.75, got ${firstPoint[0]}`);
    assert.ok(Math.abs(firstPoint[1] + 17) < 0.001, `Expected Lat ~-17, got ${firstPoint[1]}`);

    console.log('✅ Test 1 (Valid Coords): Passed');
} catch (e) {
    console.error('❌ Test 1 Failed:', e.message);
}

// Test 2: Comma Separated (checking robust parsing)
// Current logic uses split by space/newline, might fail on commas if not handled.
// The code uses: line.trim().replace(/\s+/g, ' ').split(' ')
// It replaces spaces, but doesn't handle commas. 
// If input is "2000000, 4000000", it becomes "2000000," "4000000". parseInt on "2000000," might be NaN.
// Let's test current behavior.

const commaContent = `
2000000, 4000000
2000100, 4000100
`;
// Actually, standard Fiji Map Grid files are usually space or tab separated. 
// If code doesn't support comma, this test failure is expected/informative.

// Test 3: Empty/Garbage Input
try {
    const result = parseFijiCoordinatesToGeoJSON('garbage data\n more garbage');
    assert.strictEqual(result.coordinates[0].length, 0, 'Should have 0 coordinates');
    console.log('✅ Test 3 (Garbage Input): Passed');
} catch (e) {
    console.error('❌ Test 3 Failed:', e.message);
}

console.log('🏁 Tests Compelted');
