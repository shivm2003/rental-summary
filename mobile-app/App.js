import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { LocationProvider } from './src/context/LocationContext';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import LocationPickerModal from './src/components/LocationPickerModal';
import ErrorBoundary from './src/components/ErrorBoundary';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <LocationProvider>
            <CartProvider>
              <AppNavigator />
              <LocationPickerModal />
              <Toast position="bottom" bottomOffset={80} />
            </CartProvider>
          </LocationProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
