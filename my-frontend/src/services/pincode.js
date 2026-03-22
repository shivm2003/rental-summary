const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Fetch location details by pincode
 * @param {string} pincode - 6-digit pincode
 * @returns {Promise<Object>} Location details
 */
export const fetchPincodeDetails = async (pincode) => {
  try {
    const response = await fetch(`${API_URL}/api/pincode/${pincode}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Invalid pincode');
    }
    
    return data.pincode;
  } catch (error) {
    console.error('Pincode fetch error:', error);
    throw error;
  }
};

/**
 * Reverse geocode using Nominatim API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Address details
 */
export const reverseGeocode = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch location details');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

/**
 * Extract pincode from Nominatim display_name
 * @param {string} displayName - Nominatim display_name
 * @returns {string|null} Extracted pincode or null
 */
export const extractPincodeFromDisplayName = (displayName) => {
  if (!displayName) return null;
  const match = displayName.match(/\\b\\d{6}\\b/);
  return match ? match[0] : null;
};

/**
 * Parse Nominatim address response to form fields
 * @param {Object} address - Nominatim address object
 * @param {string} displayName - Full display name
 * @returns {Object} Parsed form data
 */
export const parseNominatimAddress = (address, displayName) => {
  const pincode = extractPincodeFromDisplayName(displayName);
  
  return {
    pincode: pincode || '',
    state: address.state || address.state_district || '',
    city: address.city || address.town || address.village || address.county || '',
    locality: address.suburb || address.neighbourhood || address.residential || 
              address.road || address.city_district || '',
  };
};