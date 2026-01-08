// Test script to check MapMyIndia reverse geocoding
const { getHumanReadableLocation, getCoordinatesFromMapMyIndia } = require('./dist/utils/geolocation.js');

async function testReverseGeocoding() {
  console.log('Testing reverse geocoding with coordinates: 22.7586, 88.3808');
  
  try {
    // Test the coordinates from your image
    const coordinates = { latitude: 22.7586, longitude: 88.3808 };
    
    console.log('Calling getHumanReadableLocation...');
    const humanReadable = await getHumanReadableLocation(coordinates);
    console.log('Human readable result:', humanReadable);
    
    console.log('\nCalling getCoordinatesFromMapMyIndia with coordinate string...');
    const coordinateString = `${coordinates.latitude},${coordinates.longitude}`;
    const mapMyIndiaResult = await getCoordinatesFromMapMyIndia(coordinateString);
    console.log('MapMyIndia result:', JSON.stringify(mapMyIndiaResult, null, 2));
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testReverseGeocoding();