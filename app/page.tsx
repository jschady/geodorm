"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

// --- ICONS (as SVG components for better styling) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const DumbbellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1"></path><path d="m3 3 1 1"></path><path d="m18 22 4-4"></path><path d="m6 2 4 4"></path><path d="m3 10 7-7"></path><path d="m14 21 7-7"></path></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// --- Supabase Configuration ---
// IMPORTANT: Replace this with your actual Supabase project URL and anon key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase config is not set. Please update environment variables.');
}

// Create Supabase client
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

    useEffect(() => {
        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn("Supabase config is not set. Please update environment variables.");
            setIsLoading(false);
            return;
        }

        const fetchMembers = async () => {
            const { data, error } = await supabase.from('members').select('*').order('name', { ascending: true });
            if (error) console.error("Error fetching members:", error);
            else setQuadMembers(data || []);
        };

        fetchMembers();
        setIsLoading(false);

        const channel = supabase
            .channel('members-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, fetchMembers)
            .subscribe();
            
        const savedUser = typeof window !== 'undefined' ? sessionStorage.getItem('quadCurrentUser') : null;
        if(savedUser) {
            setCurrentUser(JSON.parse(savedUser));
        } else {
            setShowUserModal(true);
        }

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSetCurrentUser = (member: Member) => {
        setCurrentUser(member);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('quadCurrentUser', JSON.stringify(member));
        }
        setShowUserModal(false);
    };

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
                    <h1 className="text-4xl md:text-5xl font-bold">Quad Status</h1>
                    <div className="flex items-center space-x-4">
                         <button onClick={() => setShowUserModal(true)} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <UsersIcon />
                            <span>{currentUser ? `Hi, ${currentUser.name}` : 'Select User'}</span>
                        </button>
                        <button 
                            onClick={() => currentUser ? setShowStatusModal(true) : setShowUserModal(true)} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Update Status
                        </button>
                    </div>
                </header>

                <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quadMembers.length > 0 ? (
                        quadMembers.map(member => <StatusCard key={member.id_member} member={member} />)
                    ) : (
                        <div className="col-span-full text-center text-gray-400 mt-10">
                            <p>No quad members found.</p>
                            <p>Click "Select User" to add the first person!</p>
                        </div>
                    )}
                </main>

                {showStatusModal && currentUser && <StatusUpdateModal currentUser={currentUser} onClose={() => setShowStatusModal(false)} />}
                {showUserModal && <UserSelectionModal members={quadMembers} onSelectUser={handleSetCurrentUser} onClose={() => setShowUserModal(false)} />}
            </div>
        </>
    );
}

// --- Sub-Components ---

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

function StatusUpdateModal({ currentUser, onClose }: { currentUser: Member; onClose: () => void }) {
    const handleStatusUpdate = async (statusKey: keyof typeof STATUS_OPTIONS) => {
        const { error } = await supabase
            .from('members')
            .update({ status: statusKey, last_updated: new Date().toISOString() })
            .eq('id_member', currentUser.id_member);
        if (error) console.error("Error updating status: ", error);
        else onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-center mb-6">What's your status, {currentUser.name}?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(STATUS_OPTIONS).map(([key, { text, icon, color }]) => (
                        <button key={key} onClick={() => handleStatusUpdate(key as keyof typeof STATUS_OPTIONS)} className={`flex items-center p-4 rounded-lg text-left transition-colors bg-gray-700 hover:bg-indigo-600 ${color}`}>
                            <div className="mr-4">{icon}</div>
                            <span className="text-lg font-semibold text-white">{text}</span>
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
            </div>
        </div>
    );
}

function UserSelectionModal({ members, onSelectUser, onClose }: { members: Member[]; onSelectUser: (member: Member) => void; onClose: () => void }) {
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!newName.trim()) return setError("Name cannot be empty.");
        if (members.some(m => m.name.toLowerCase() === newName.trim().toLowerCase())) return setError("A member with this name already exists.");

        const { data, error: insertError } = await supabase
            .from('members')
            .insert([{ name: newName.trim(), status: 'AWAY', last_updated: new Date().toISOString() }])
            .select();

        if (insertError) setError(insertError.message);
        else if (data?.[0]) {
            onSelectUser(data[0] as Member);
            setNewName('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-center mb-6">Who are you?</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto mb-6">
                    {members.map(member => (
                        <button key={member.id_member} onClick={() => onSelectUser(member)} className="w-full text-left p-3 bg-gray-700 hover:bg-indigo-600 rounded-lg transition-colors">{member.name}</button>
                    ))}
                </div>
                <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-lg font-semibold text-center mb-3">Or, Add a New Roommate</h3>
                    <form onSubmit={handleAddMember} className="flex space-x-2">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter your name" className="flex-grow p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-500" />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-lg"><UserPlusIcon /></button>
                    </form>
                    {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Close</button>
            </div>
        </div>
    );
} 