'use client';

import React, { useState } from 'react';
import { UserSelectionModalProps, Member } from '../../(lib)/types';
import { UserPlusIcon } from '../../(lib)/constants';
import supabase from '../../(lib)/supabase-client';

export default function UserSelectionModal({ 
    members, 
    onSelectUser, 
    onClose, 
    isSwitchingUser 
}: UserSelectionModalProps) {
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