/* my-frontend/src/utils/push-notifications.js */
import axios from 'axios';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Converts a base64 string to a Uint8Array (required for push manager)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Requests notification permission and subscribes the user to push notifications
 */
export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser.');
    return;
  }

  try {
    // 1. Check current permission
    if (Notification.permission === 'denied') {
      console.warn('User has denied notification permission.');
      return;
    }

    // 2. Request permission if not granted yet
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('User did not grant notification permission.');
        return;
      }
    }

    // 3. Get the registered service worker
    const registration = await navigator.serviceWorker.ready;

    // 4. Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // 5. Subscribe if no subscription exists
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('New Push Subscription created');
    }

    // 6. Send subscription to backend
    await axios.post('/api/push/subscribe', {
      subscription: subscription.toJSON()
    }, { withCredentials: true });

    console.log('Push subscription successfully stored on server');
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
}
