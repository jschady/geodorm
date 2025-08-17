import React from 'react';
import { StatusKey, StatusOption } from './types';

// --- ICON COMPONENTS ---
export const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

export const BookOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

export const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"></path>
    <path d="m21 21-1-1"></path>
    <path d="m3 3 1 1"></path>
    <path d="m18 22 4-4"></path>
    <path d="m6 2 4 4"></path>
    <path d="m3 10 7-7"></path>
    <path d="m14 21 7-7"></path>
  </svg>
);

export const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
  </svg>
);

export const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" x2="19" y1="12" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <line x1="19" x2="19" y1="8" y2="14"></line>
    <line x1="22" x2="16" y1="11" y2="11"></line>
  </svg>
);

export const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// --- STATUS OPTIONS CONFIGURATION ---
export const STATUS_OPTIONS: Record<StatusKey, StatusOption> = {
  'IN_ROOM': { 
    text: 'In the Room', 
    icon: HomeIcon, 
    color: 'text-green-400' 
  },
  'STUDYING': { 
    text: 'Studying / Class', 
    icon: BookOpenIcon, 
    color: 'text-blue-400' 
  },
  'AT_GYM': { 
    text: 'At the Gym', 
    icon: DumbbellIcon, 
    color: 'text-orange-400' 
  },
  'SLEEPING': { 
    text: 'Sleeping', 
    icon: MoonIcon, 
    color: 'text-purple-400' 
  },
  'AWAY': { 
    text: 'Out & About', 
    icon: ArrowRightIcon, 
    color: 'text-gray-400' 
  }
}; 