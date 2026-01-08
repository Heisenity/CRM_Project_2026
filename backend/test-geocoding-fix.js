const { getCoordinatesFromMapMyIndia } = require('./dist/utils/geolocation.js');

async function testGeocoding() {
  console.log('Testing MapMyIndia geocoding with the fixed implementation...\n');
  
  const testAddress = "1/1A, East chandmari 2nd lane, barrackpore, North 24 parganas, kolkata 700122";
  
  console.log(`Testing address: "${testAddress}"`);
  
  try {
    const result = await getCoordinatesFromMapMyIndia(testAddress);
    
    if (result) {
      console.log('\n✅ SUCCESS! Geocoding result:');
      console.log(`Coordinates: ${result.latitude}, ${result.longitude}`);
      console.log(`Display Name: ${result.displayName}`);
      console.log(`Granularity: ${result.granularity}`);
      console.log(`Estimated Radius: ${result.estimatedRadiusMeters}m`);
      console.log(`Importance/Confidence: ${result.importance}`);
    } else {
      console.log('\n❌ FAILED: No result returned from geocoding');
    }
  } catch (error) {
    console.error('\n❌ ERROR during geocoding:', error.message);
  }
}

testGeocoding();