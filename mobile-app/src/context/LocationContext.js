import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

const LocationContext = createContext(null);
const STORAGE_KEY = 'user_location';

const COMMON_CITIES = [
  'Agra','Ahmedabad','Ajmer','Aligarh','Allahabad','Amritsar','Aurangabad',
  'Bangalore','Bareilly','Bhopal','Bhubaneswar','Bikaner','Chandigarh',
  'Chennai','Coimbatore','Cuttack','Dehradun','Delhi','Dhanbad','Durgapur',
  'Faridabad','Ghaziabad','Goa','Gorakhpur','Gurgaon','Guwahati','Gwalior',
  'Howrah','Hyderabad','Imphal','Indore','Jabalpur','Jaipur','Jalandhar',
  'Jamshedpur','Jhansi','Jodhpur','Kanpur','Kochi','Kolkata','Kota',
  'Kozhikode','Lucknow','Ludhiana','Madurai','Mangalore','Meerut',
  'Moradabad','Mumbai','Mysore','Nagpur','Nashik','Navi Mumbai','Noida',
  'Patna','Pondicherry','Pune','Raipur','Rajkot','Ranchi','Rourkela',
  'Saharanpur','Salem','Shimla','Siliguri','Solapur','Srinagar','Surat',
  'Thane','Thiruvananthapuram','Tiruchirappalli','Tirunelveli','Tiruppur',
  'Udaipur','Ujjain','Vadodara','Varanasi','Vijayawada','Visakhapatnam',
  'Warangal',
].sort();


export const LocationProvider = ({ children }) => {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Load saved location on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { city: c, state: s } = JSON.parse(saved);
          if (c) { setCity(c); setState(s || ''); }
        } else {
          requestLocation(true);
        }
      } catch {}
    })();
  }, []);

  const persist = useCallback(async (c, s) => {
    setCity(c); setState(s);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ city: c, state: s }));
  }, []);

  const requestLocation = useCallback(async (silent = false) => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!silent) setShowPicker(true);
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo) {
        const detectedCity = geo.city || geo.subregion || geo.region || '';
        const detectedState = geo.region || '';
        persist(detectedCity, detectedState);
      }
    } catch (err) {
      console.warn('Location error:', err);
      if (!silent) setShowPicker(true);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const setManualCity = useCallback((selectedCity) => {
    persist(selectedCity, '');
    setShowPicker(false);
  }, [persist]);

  const clearLocation = useCallback(async () => {
    setCity(''); setState('');
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <LocationContext.Provider value={{
      city, state, loading, showPicker,
      setShowPicker, requestLocation,
      setManualCity, clearLocation,
      cities: COMMON_CITIES,
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
