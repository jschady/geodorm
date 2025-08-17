"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { createClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// --- ICONS (No changes here, they are fine) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const DumbbellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1"></path><path d="m3 3 1 1"></path><path d="m18 22 4-4"></path><path d="m6 2 4 4"></path><path d="m3 10 7-7"></path><path d="m14 21 7-7"></path></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// --- Supabase Configuration ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase config is not set. Please update environment variables.');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Status Options ---
const STATUS_OPTIONS = {
    'IN_ROOM': { text: 'In the Room', icon: <HomeIcon />, color: 'text-green-400' },
    'STUDYING': { text: 'Studying / Class', icon: <BookOpenIcon />, color: 'text-blue-400' },
    'AT_GYM': { text: 'At the Gym', icon: <DumbbellIcon />, color: 'text-orange-400' },
    'SLEEPING': { text: 'Sleeping', icon: <MoonIcon />, color: 'text-purple-400' },
    'AWAY': { text: 'Out & About', icon: <ArrowRightIcon />, color: 'text-gray-400' }
};

// --- Types ---
interface Member {
    id_member: string;
    name: string;
    status: keyof typeof STATUS_OPTIONS;
    last_updated: string;
}

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
        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn("Supabase config is not set.");
            setIsLoading(false);
            return;
        }

        const initializeApp = async () => {
            // 1. Initial data fetch
            const { data, error } = await supabase.from('members').select('*').order('name', { ascending: true });
            if (error) {
                console.error("Error fetching initial members:", error);
            } else {
                setQuadMembers(data || []);
            }
            setIsLoading(false);

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
        };

        initializeApp();

        // **MODIFIED**: Set up real-time subscription with the new handler
        const channel = supabase
            .channel('members-channel')
            .on<Member>(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'members' }, 
                handleRealtimeUpdate
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
                if (status === 'SUBSCRIBED') setConnectionStatus('connected');
                else if (status === 'CLOSED') setConnectionStatus('disconnected');
                else setConnectionStatus('connecting');
            });

        // Cleanup function
        return () => {
            console.log('Cleaning up subscription');
            supabase.removeChannel(channel);
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
    const handleStatusUpdate = async (statusKey: keyof typeof STATUS_OPTIONS) => {
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

            const { error } = await supabase
                .from('members')
                .update({ 
                    status: statusKey, 
                    last_updated: new Date().toISOString() 
                })
                .eq('id_member', currentUser.id_member);
                
            if (error) {
                console.error("Error updating status:", error);
                alert("Failed to update status. Please try again.");
            } else {
                setShowStatusModal(false);
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
                    await supabase
                        .from('members')
                        .update({ 
                            status: update.status, 
                            last_updated: update.timestamp 
                        })
                        .eq('id_member', update.userId);
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
                    <title>Dorm Status - Loading</title>
                </Head>
                <p className="text-2xl animate-pulse">Loading Dashboard...</p>
            </div>
        );
    }
    
    if (!supabaseUrl || !supabaseAnonKey) {
        return (
             <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <Head>
                    <title>Dorm Status - Setup Required</title>
                </Head>
                <h1 className="text-4xl font-bold text-yellow-400 mb-4">Configuration Needed</h1>
                <p className="text-lg max-w-2xl">Welcome! To get started, set up environment variables for your Supabase project.</p>
                 <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="mt-6 bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors">Go to Supabase</a>
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>Dorm Status Dashboard</title>
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
                            <UsersIcon />
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

// --- Sub-Components (No changes needed) ---

function StatusCard({ member }: { member: Member }) {
    const statusInfo = STATUS_OPTIONS[member.status] || STATUS_OPTIONS['AWAY'];
    const formatTime = (timestamp: string) => {
        if (!timestamp) return '...';
        return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="bg-gray-800 rounded-2xl p-6 flex flex-col shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mr-4">
                    <span className="text-3xl font-bold">{member.name ? member.name.charAt(0) : '?'}</span>
                </div>
                <h3 className="text-2xl font-semibold truncate">{member.name}</h3>
            </div>
            <div className={`mt-auto flex items-center p-4 rounded-lg bg-gray-700/50 ${statusInfo.color}`}>
                <div className="mr-3">{statusInfo.icon}</div>
                <div>
                    <p className="font-bold text-lg">{statusInfo.text}</p>
                    <p className="text-sm text-gray-400">Updated at {formatTime(member.last_updated)}</p>
                </div>
            </div>
        </div>
    );
}

function StatusUpdateModal({ 
    currentUser, 
    onClose, 
    onStatusUpdate,
    isUpdating 
}: { 
    currentUser: Member; 
    onClose: () => void;
    onStatusUpdate: (statusKey: keyof typeof STATUS_OPTIONS) => Promise<void>;
    isUpdating: boolean;
}) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-center mb-6">What's your status, {currentUser.name}?</h2>
                {isUpdating && (
                    <div className="text-center mb-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                        <p className="text-sm text-gray-400 mt-2">Updating your status...</p>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(STATUS_OPTIONS).map(([key, { text, icon, color }]) => (
                        <button 
                            key={key} 
                            onClick={() => onStatusUpdate(key as keyof typeof STATUS_OPTIONS)} 
                            disabled={isUpdating}
                            className={`flex items-center p-4 rounded-lg text-left transition-colors ${
                                isUpdating 
                                    ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                    : 'bg-gray-700 hover:bg-indigo-600'
                            } ${color}`}
                        >
                            <div className="mr-4">{icon}</div>
                            <span className="text-lg font-semibold text-white">{text}</span>
                        </button>
                    ))}
                </div>
                <button 
                    onClick={onClose} 
                    disabled={isUpdating}
                    className={`mt-6 w-full font-bold py-2 px-4 rounded-lg ${
                        isUpdating 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-600 hover:bg-gray-500 text-white'
                    }`}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

function UserSelectionModal({ 
    members, 
    onSelectUser, 
    onClose, 
    isSwitchingUser 
}: { 
    members: Member[]; 
    onSelectUser: (member: Member) => void; 
    onClose: () => void;
    isSwitchingUser?: boolean;
}) {
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSwitchingUser) return;
        
        setError('');
        if (!newName.trim()) return setError("Name cannot be empty.");
        if (members.some(m => m.name.toLowerCase() === newName.trim().toLowerCase())) return setError("A member with this name already exists.");

        const { data, error: insertError } = await supabase
            .from('members')
            .insert([{ name: newName.trim(), status: 'AWAY', last_updated: new Date().toISOString() }])
            .select();

        if (insertError) {
             setError(insertError.message);
        } else if (data?.[0]) {
            // After inserting, the real-time 'INSERT' event will add the user to the state.
            // We just need to select them.
            onSelectUser(data[0] as Member);
            setNewName('');
        }
    };

    const handleUserSelect = (member: Member) => {
        if (isSwitchingUser) return;
        onSelectUser(member);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-center mb-6">Who are you?</h2>
                
                {isSwitchingUser && (
                    <div className="text-center mb-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                        <p className="text-sm text-gray-400 mt-2">Switching user...</p>
                    </div>
                )}
                
                <div className="space-y-2 max-h-48 overflow-y-auto mb-6">
                    {members.map(member => (
                        <button 
                            key={member.id_member} 
                            onClick={() => handleUserSelect(member)} 
                            disabled={isSwitchingUser}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                isSwitchingUser 
                                    ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                    : 'bg-gray-700 hover:bg-indigo-600'
                            }`}
                        >
                            {member.name}
                        </button>
                    ))}
                </div>
                <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-lg font-semibold text-center mb-3">Or, Add a New Roommate</h3>
                    <form onSubmit={handleAddMember} className="flex space-x-2">
                        <input 
                            type="text" 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)} 
                            placeholder="Enter your name" 
                            disabled={isSwitchingUser}
                            className={`flex-grow p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500 ${
                                isSwitchingUser ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        />
                        <button 
                            type="submit" 
                            disabled={isSwitchingUser}
                            className={`p-3 rounded-lg ${
                                isSwitchingUser 
                                    ? 'bg-gray-600 opacity-50 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-500'
                            }`}
                        >
                            <UserPlusIcon />
                        </button>
                    </form>
                    {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                </div>
                <button 
                    onClick={onClose} 
                    disabled={isSwitchingUser}
                    className={`mt-6 w-full font-bold py-2 px-4 rounded-lg ${
                        isSwitchingUser 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-600 hover:bg-gray-500 text-white'
                    }`}
                >
                    Close
                </button>
            </div>
        </div>
    );
}

// --- iOS Install Instructions Modal ---
function IOSInstallModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">📱 Install Dorm Status</h2>
                    <p className="text-gray-400">Add this app to your home screen for easy access!</p>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3">
                        <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                            <p className="text-white font-semibold">Tap the Share button</p>
                            <p className="text-gray-400 text-sm">Look for the <span className="inline-block">📤</span> icon at the bottom of Safari</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                        <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                            <p className="text-white font-semibold">Select "Add to Home Screen"</p>
                            <p className="text-gray-400 text-sm">Scroll down in the share menu and tap <span className="inline-block">➕</span> "Add to Home Screen"</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                        <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                            <p className="text-white font-semibold">Tap "Add"</p>
                            <p className="text-gray-400 text-sm">Confirm the app name and tap "Add" in the top right</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-indigo-900/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-indigo-400">✨</span>
                        <p className="text-indigo-300 font-semibold">Why install?</p>
                    </div>
                    <ul className="text-sm text-indigo-200 space-y-1">
                        <li>• Works offline with cached data</li>
                        <li>• Faster loading from your home screen</li>
                        <li>• No browser bars - just the app</li>
                        <li>• Real-time notifications (coming soon)</li>
                    </ul>
                </div>
                
                <div className="flex space-x-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button 
                        onClick={onClose}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Got It!
                    </button>
                </div>
            </div>
        </div>
    );
}