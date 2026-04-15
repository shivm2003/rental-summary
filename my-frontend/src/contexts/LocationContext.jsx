// src/contexts/LocationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const LocationContext = createContext(null);
const STORAGE_KEY = 'user_location';
const COMMON_DISTRICTS = [
  // Delhi
  'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi',
  'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi',
  // Maharashtra
  'Mumbai City', 'Mumbai Suburban', 'Mumbai', 'Thane', 'Navi Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur',
  // Karnataka
  'Bangalore Urban', 'Bangalore Rural', 'Bengaluru', 'Mysuru', 'Mysore', 'Mangaluru', 'Hubli-Dharwad', 'Belagavi',
  // Uttar Pradesh
  'Lucknow', 'Kanpur Nagar', 'Agra', 'Varanasi', 'Ghaziabad', 'Noida', 'Greater Noida', 'Meerut', 'Allahabad', 'Prayagraj',
  // Rajasthan
  'Jaipur', 'Jodhpur', 'Udaipur', 'Ajmer', 'Kota', 'Bikaner',
  // Tamil Nadu
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode',
  // Gujarat
  'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar',
  // West Bengal
  'Kolkata', 'Howrah', 'North 24 Parganas', 'South 24 Parganas', 'Hooghly', 'Burdwan',
  // Telangana
  'Hyderabad', 'Rangareddy', 'Medchal', 'Warangal', 'Karimnagar',
  // Andhra Pradesh
  'Visakhapatnam', 'Vijayawada', 'Guntur', 'Kurnool', 'Tirupati',
  // Punjab
  'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Chandigarh',
  // Haryana
  'Gurugram', 'Gurgaon', 'Faridabad', 'Hisar', 'Rohtak', 'Panipat', 'Ambala', 'Sonipat',
  // Madhya Pradesh
  'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar',
  // Bihar
  'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga',
  // Jharkhand
  'Ranchi', 'Dhanbad', 'Jamshedpur', 'Bokaro',
  // Odisha
  'Khordha', 'Cuttack', 'Ganjam', 'Sambalpur',
  // Assam
  'Kamrup Metropolitan', 'Dibrugarh', 'Sonitpur', 'Jorhat',
  // Himachal Pradesh
  'Shimla', 'Kangra', 'Mandi', 'Kullu', 'Solan',
  // Uttarakhand
  'Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar',
  // Kerala
  'Thiruvananthapuram', 'Ernakulam', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad',
].sort();

// Read location from localStorage synchronously (used for lazy state init)
function readSavedLocation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { district: d, city: c, state: s } = JSON.parse(saved);
      if (c) return { district: d || '', city: c, state: s || '' };
      if (d) {
        // Migrate old format: district → city
        const migrated = { district: '', city: d, state: s || '' };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch {}
  return null;
}

export const LocationProvider = ({ children }) => {
  // Lazy init so city is SYNCHRONOUSLY set from localStorage on first render
  // This prevents the race condition where Home loads before city is restored
  const [district, setDistrict] = useState(() => readSavedLocation()?.district ?? '');
  const [city, setCity]         = useState(() => readSavedLocation()?.city ?? '');
  const [state, setState]       = useState(() => readSavedLocation()?.state ?? '');
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const persist = useCallback((d, c, s) => {
    setDistrict(d); setCity(c); setState(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ district: d, city: c, state: s }));
  }, []);

  const requestLocation = useCallback((silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) {
        setLocationDenied(true);
        setShowPicker(true);
      }
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data?.address) {
            const addr = data.address;
            const extractedDistrict =
              addr.county || addr.city_district || addr.state_district ||
              addr.district || addr.suburb || addr.city || addr.town || '';
            const extractedCity  = addr.city || addr.town || addr.village || '';
            const extractedState = addr.state || '';
            persist(extractedDistrict, extractedCity, extractedState);
            if (!silent) {
              toast.success(`Location set to ${extractedCity || extractedDistrict}`, { duration: 2000 });
            }
          }
        } catch (err) {
          console.warn('Nominatim reverse geocode failed:', err);
          if (!silent) {
            setLocationDenied(true);
            setShowPicker(true);
          }
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        if (!silent) {
          setLocationDenied(true);
          setShowPicker(true);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [persist]);

  // When user picks a city manually — store as `city` so filter works with l.location / l.city
  const setManualDistrict = useCallback((selectedCity) => {
    persist('', selectedCity, '');
    setLocationDenied(false);
    setShowPicker(false);
    toast.success(`Showing products in ${selectedCity}`, { duration: 2000 });
  }, [persist]);

  const clearLocation = useCallback(() => {
    setDistrict(''); setCity(''); setState('');
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // On mount: if no city saved, ask for GPS SILENTLY
  useEffect(() => {
    if (!readSavedLocation()) {
      requestLocation(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LocationContext.Provider value={{
      district, city, state,
      locationDenied, loading, showPicker,
      setShowPicker, requestLocation,
      setManualDistrict, clearLocation,
      districts: COMMON_DISTRICTS,
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
};
