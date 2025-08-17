'use client';

import React from 'react';
import { StatusUpdateModalProps, StatusKey } from '../../(lib)/types';
import { STATUS_OPTIONS } from '../../(lib)/constants';

export default function StatusUpdateModal({ 
    currentUser, 
    onClose, 
    onStatusUpdate,
    isUpdating 
}: StatusUpdateModalProps) {
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
                            onClick={() => onStatusUpdate(key as StatusKey)} 
                            disabled={isUpdating}
                            className={`flex items-center p-4 rounded-lg text-left transition-colors ${
                                isUpdating 
                                    ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                    : 'bg-gray-700 hover:bg-indigo-600'
                            } ${color}`}
                        >
                            <div className="mr-4">{React.createElement(icon)}</div>
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