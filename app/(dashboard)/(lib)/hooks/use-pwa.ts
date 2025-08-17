import { useEffect, useState, useCallback } from 'react';

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  deferredPrompt: any | null;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
}

export interface PWAActions {
  install: () => Promise<void>;
  dismiss: () => void;
}

export interface UsePWAReturn extends PWAState, PWAActions {}

/**
 * Custom hook for Progressive Web App functionality
 * Handles service worker registration, install prompts, and offline detection
 */
export function usePWA(): UsePWAReturn {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if app is running in standalone mode (already installed)
  const checkIfInstalled = useCallback(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
      return isStandalone;
    }
    return false;
  }, []);

  // Handle online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Service Worker Registration
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { 
          scope: '/' 
        });
        
        console.log('Service Worker registered successfully:', registration);
        setServiceWorkerRegistration(registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('Service Worker update found');
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    // Register on load
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerServiceWorker);
    } else {
      registerServiceWorker();
    }

    return () => {
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  // Install Prompt Handling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt fired');
      e.preventDefault();
      
      // Don't show install prompt if already installed
      if (!checkIfInstalled()) {
        setDeferredPrompt(e);
        setIsInstallable(true);
      }
    };

    const handleAppInstalled = () => {
      console.log('App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Check initial install state
    checkIfInstalled();

    // Listen for install events
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkIfInstalled]);

  // Install function
  const install = useCallback(async (): Promise<void> => {
    if (!deferredPrompt) {
      console.warn('No install prompt available');
      return;
    }

    try {
      // Show the install prompt
      const result = await deferredPrompt.prompt();
      console.log('Install prompt result:', result);

      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstallable(false);
        setDeferredPrompt(null);
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during app installation:', error);
    }
  }, [deferredPrompt]);

  // Dismiss install prompt
  const dismiss = useCallback(() => {
    console.log('Install prompt dismissed by user');
    setIsInstallable(false);
    setDeferredPrompt(null);
  }, []);

  return {
    // State
    isInstallable,
    isInstalled,
    isOffline,
    deferredPrompt,
    serviceWorkerRegistration,
    
    // Actions
    install,
    dismiss,
  };
} 