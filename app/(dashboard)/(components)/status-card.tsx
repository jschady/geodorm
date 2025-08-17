'use client';

import React from 'react';
import { StatusCardProps } from '../(lib)/types';
import { STATUS_OPTIONS } from '../(lib)/constants';

export default function StatusCard({ member }: StatusCardProps) {
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
                <div className="mr-3">
                    {React.createElement(statusInfo.icon)}
                </div>
                <div>
                    <p className="font-bold text-lg">{statusInfo.text}</p>
                    <p className="text-sm text-gray-400">Updated at {formatTime(member.last_updated)}</p>
                </div>
            </div>
        </div>
    );
} 