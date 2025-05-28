import { getMunicipalityByCoordinates, getDepartmentEmailsByLocation, getMunicipalityInfo } from './municipalityService';

// Test coordinates in different municipalities
const testLocations = [
  { name: 'Pretoria Central', lat: -25.7479, lng: 28.2293 }, // Tshwane
  { name: 'Sandton', lat: -26.1076, lng: 28.0567 },          // Johannesburg
  { name: 'OR Tambo Airport', lat: -26.1367, lng: 28.2411 }, // Ekurhuleni
  { name: 'Centurion', lat: -25.8601, lng: 28.1878 },       // Tshwane
  { name: 'Outside municipalities', lat: -24.0, lng: 29.0 }   // Outside defined areas
];

console.log('Testing Municipality Geo-location System\n');

testLocations.forEach(location => {
  console.log(`\n--- Testing: ${location.name} (${location.lat}, ${location.lng}) ---`);
  
  // Test municipality detection
  const municipality = getMunicipalityByCoordinates(location.lat, location.lng);
  console.log(`Municipality:`, municipality ? municipality.name : 'Not found');
  
  // Test municipality info
  const info = getMunicipalityInfo(location.lat, location.lng);
  console.log(`Info:`, info);
  
  // Test email routing for different issue types
  const issueTypes = ['streetlight', 'pothole', 'burst-pipe'];
  issueTypes.forEach(issueType => {
    const emails = getDepartmentEmailsByLocation(location.lat, location.lng, issueType);
    console.log(`${issueType} emails:`, emails);
  });
});