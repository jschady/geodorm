'use client';

import React from 'react';
import { usePWA } from '../(lib)/hooks/use-pwa';

interface ProvidersProps {
    children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    // Use the custom PWA hook for all PWA functionality
    const pwa = usePWA();

    // Optional: Add any additional provider logic here
    // The PWA hook handles:
    // - Service Worker registration
    // - Install prompt management
    // - Online/offline detection
    // - App installation state

    // You can expose PWA state/actions to children via Context if needed
    // For now, the hook runs automatically to handle PWA functionality

    return (
        <>
            {children}
        </>
    );
} 