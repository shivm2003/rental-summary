import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SHOWN_KEY = 'welcome-iframe-shown';

export default function useWelcomeIframe() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem(SHOWN_KEY)) return;
    sessionStorage.setItem(SHOWN_KEY, '1');
    setShow(true);
  }, [user]);

  const close = () => setShow(false);
  return [show, close];
}