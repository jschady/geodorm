'use client';

import React from 'react';
import { IOSInstallModalProps } from '../../(lib)/types';

export default function IOSInstallModal({ onClose }: IOSInstallModalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">📱 Install Tiger Dorm</h2>
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