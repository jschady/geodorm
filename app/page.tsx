"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { createClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Extracted components
import StatusCard from './(dashboard)/(components)/status-card';
import StatusUpdateModal from './(dashboard)/(components)/modals/status-update-modal';
import UserSelectionModal from './(dashboard)/(components)/modals/user-selection-modal';
import IOSInstallModal from './(dashboard)/(components)/modals/ios-install-modal';

// Types and constants
import { Member, StatusKey, ConnectionStatus } from './(dashboard)/(lib)/types';
import { STATUS_OPTIONS, UsersIcon } from './(dashboard)/(lib)/constants';
import { supabaseService } from './(dashboard)/(lib)/supabase-client';

// --- Main App Component ---
export default function Home() {
    const [quadMembers, setQuadMembers] = useState<Member[]>([]);
    const [currentUser, setCurrentUser] = useState<Member | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isSwitchingUser, setIsSwitchingUser] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [isOnline, setIsOnline] = useState(true);
    const [showIOSInstall, setShowIOSInstall] = useState(false);

    // Detect if user is on iOS
    const isIOS = () => {
        if (typeof window === 'undefined') return false;
        
        const userAgent = window.navigator.userAgent.toLowerCase();
        const platform = window.navigator.platform.toLowerCase();
        
        return /ipad|iphone|ipod/.test(userAgent) || 
               /ipad|iphone|ipod/.test(platform) ||
               (platform === 'macintel' && navigator.maxTouchPoints > 1);
    };

    // Detect if app is already installed (running in standalone mode)
    const isStandalone = () => {
        if (typeof window === 'undefined') return false;
        
        return window.matchMedia('(display-mode: standalone)').matches ||
               (window.navigator as any).standalone === true;
    };

    // Show iOS install instructions
    useEffect(() => {
        if (isIOS() && !isStandalone()) {
            // Show iOS install after a short delay to let page load
            setTimeout(() => setShowIOSInstall(true), 2000);
        }
    }, []);

    // Handle online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            console.log('Back online');
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            setConnectionStatus('disconnected');
            console.log('Gone offline');
        };

        setIsOnline(navigator.onLine);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // **NEW**: Handle incoming real-time updates directly
    const handleRealtimeUpdate = (payload: RealtimePostgresChangesPayload<Member>) => {
        console.log("Real-time event received:", payload);
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        setQuadMembers(currentMembers => {
            let updatedMembers = [...currentMembers];

            if (eventType === 'INSERT') {
                updatedMembers.push(newRecord as Member);
            } else if (eventType === 'UPDATE') {
                const index = updatedMembers.findIndex(m => m.id_member === newRecord.id_member);
                if (index !== -1) {
                    updatedMembers[index] = newRecord as Member;
                }
            } else if (eventType === 'DELETE') {
                 // Supabase returns the old record's id in a different format for DELETE
                const deletedId = (oldRecord as { id_member: string }).id_member;
                updatedMembers = updatedMembers.filter(m => m.id_member !== deletedId);
            }
            // Sort to maintain consistent order
            return updatedMembers.sort((a, b) => a.name.localeCompare(b.name));
        });
    };

    // Main useEffect for initialization and subscriptions
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // 1. Initial data fetch
                const data = await supabaseService.getMembers();
                setQuadMembers(data);
                
                // 2. Load user from session storage
                const savedUser = sessionStorage.getItem('quadCurrentUser');
                if (savedUser) {
                    try {
                        setCurrentUser(JSON.parse(savedUser));
                    } catch (e) {
                        setShowUserModal(true);
                    }
                } else {
                    setShowUserModal(true);
                }
            } catch (error) {
                console.error("Error initializing app:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();

        // **MODIFIED**: Set up real-time subscription with the new handler and status callback
        const channel = supabaseService.subscribeToMembers(
            handleRealtimeUpdate,
            (status) => {
                console.log('Subscription status:', status);
                if (status === 'SUBSCRIBED') setConnectionStatus('connected');
                else if (status === 'CLOSED') setConnectionStatus('disconnected');
                else setConnectionStatus('connecting');
            }
        );

        // Cleanup function
        return () => {
            console.log('Cleaning up subscription');
            supabaseService.removeChannel(channel);
        };
    }, []); // Empty dependency array ensures this runs only once

    // This useEffect keeps the `currentUser` object in sync with the main `quadMembers` list
    useEffect(() => {
        if (currentUser) {
            const updatedUser = quadMembers.find(member => member.id_member === currentUser.id_member);
            if (updatedUser) {
                setCurrentUser(updatedUser);
                sessionStorage.setItem('quadCurrentUser', JSON.stringify(updatedUser));
            }
        }
    }, [quadMembers, currentUser?.id_member]);

    // Handle PWA shortcuts and URL parameters
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action === 'update-status' && currentUser) {
            setTimeout(() => setShowStatusModal(true), 1000); // Delay to let app load
        }
        
        // Clean up URL parameters
        if (action) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        }
    }, [currentUser]);

    // Show offline-ready notification
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(() => {
                console.log('PWA is ready for offline use');
                // You could show a toast notification here
            });
        }
    }, []);


    const handleSetCurrentUser = (member: Member) => {
        setIsSwitchingUser(true);
        setCurrentUser(member);
        sessionStorage.setItem('quadCurrentUser', JSON.stringify(member));
        setShowUserModal(false);
        setTimeout(() => setIsSwitchingUser(false), 100);
    };

    // Enhanced status update with offline support
    const handleStatusUpdate = async (statusKey: StatusKey) => {
        if (!currentUser) return;
        
        setIsUpdatingStatus(true);
        try {
            if (!isOnline) {
                // Store update for when back online
                const pendingUpdate = {
                    userId: currentUser.id_member,
                    status: statusKey,
                    timestamp: new Date().toISOString()
                };
                
                if (typeof window !== 'undefined') {
                    const pending = JSON.parse(localStorage.getItem('pendingUpdates') || '[]');
                    pending.push(pendingUpdate);
                    localStorage.setItem('pendingUpdates', JSON.stringify(pending));
                }
                
                // Update local state optimistically
                setQuadMembers(current => 
                    current.map(member => 
                        member.id_member === currentUser.id_member 
                            ? { ...member, status: statusKey, last_updated: new Date().toISOString() }
                            : member
                    )
                );
                
                setShowStatusModal(false);
                alert("You're offline. Status will sync when back online.");
                return;
            }

            try {
                await supabaseService.updateMemberStatus(currentUser.id_member, statusKey);
                setShowStatusModal(false);
            } catch (serviceError) {
                console.error("Error updating status via service:", serviceError);
                alert("Failed to update status. Please try again.");
            }
        } catch (error) {
            console.error("Error in handleStatusUpdate:", error);
            alert("An unexpected error occurred. Please try again.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Sync pending updates when back online
    useEffect(() => {
        const syncPendingUpdates = async () => {
            if (!isOnline || typeof window === 'undefined') return;
            
            const pending = JSON.parse(localStorage.getItem('pendingUpdates') || '[]');
            if (pending.length === 0) return;
            
            console.log('Syncing pending updates:', pending);
            
            try {
                for (const update of pending) {
                    await supabaseService.updateMemberStatus(update.userId, update.status);
                }
                
                localStorage.removeItem('pendingUpdates');
                console.log('Pending updates synced successfully');
            } catch (error) {
                console.error('Failed to sync pending updates:', error);
            }
        };
        
        if (isOnline) {
            syncPendingUpdates();
        }
    }, [isOnline]);

    // --- RENDER LOGIC (No changes needed below this line) ---

    if (isLoading) {
         return (
            <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <Head>
                    <title>Tiger Dorm - Loading</title>
                </Head>
                <p className="text-2xl animate-pulse">Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Tiger Dorm Dashboard</title>
                <meta name="description" content="Real-time status dashboard for dorm roommates" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
                <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold">Quad Status</h1>
                        <div className="flex items-center mt-2 space-x-4">
                            <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                    !isOnline ? 'bg-red-500' :
                                    connectionStatus === 'connected' ? 'bg-green-400' : 
                                    connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                                }`}></div>
                                <span className="text-sm text-gray-400">
                                    {!isOnline ? 'Offline' :
                                     connectionStatus === 'connected' ? 'Connected' : 
                                     connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                                </span>
                            </div>
                            
                            {showIOSInstall && (
                                <button
                                    onClick={() => {}} // Modal shows automatically, button is just visual indicator
                                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-1 px-3 rounded-lg transition-colors"
                                >
                                    📱 <span>Install Guide</span>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                         <button 
                            onClick={() => setShowUserModal(true)} 
                            disabled={isSwitchingUser}
                            className={`flex items-center space-x-2 font-bold py-2 px-4 rounded-lg transition-colors ${
                                isSwitchingUser 
                                    ? 'bg-gray-700 opacity-50 cursor-not-allowed text-gray-400' 
                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                        >
                            {React.createElement(UsersIcon)}
                            <span>
                                {isSwitchingUser 
                                    ? 'Switching...' 
                                    : currentUser 
                                        ? `Hi, ${currentUser.name}` 
                                        : 'Select User'
                                }
                            </span>
                        </button>
                        <button 
                            onClick={() => currentUser ? setShowStatusModal(true) : setShowUserModal(true)} 
                            className={`font-bold py-2 px-4 rounded-lg transition-colors ${
                                isUpdatingStatus 
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </header>

                <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quadMembers.length > 0 ? (
                        quadMembers.map(member => <StatusCard key={member.id_member} member={member} />)
                    ) : (
                        <div className="col-span-full text-center text-gray-400 mt-10">
                            <p>No quad members found.</p>
                            <p>You can add the first person via the "Select User" button.</p>
                        </div>
                    )}
                </main>

                {showStatusModal && currentUser && (
                    <StatusUpdateModal 
                        currentUser={currentUser} 
                        onClose={() => setShowStatusModal(false)}
                        onStatusUpdate={handleStatusUpdate}
                        isUpdating={isUpdatingStatus}
                    />
                )}
                {showUserModal && <UserSelectionModal members={quadMembers} onSelectUser={handleSetCurrentUser} onClose={() => setShowUserModal(false)} isSwitchingUser={isSwitchingUser} />}
                
                {/* iOS Install Instructions Modal */}
                {showIOSInstall && (
                    <IOSInstallModal onClose={() => setShowIOSInstall(false)} />
                )}
            </div>
        </>
    );
}