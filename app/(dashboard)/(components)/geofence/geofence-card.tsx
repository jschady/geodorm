'use client';

import React from 'react';
import { GeofenceCardProps } from '../../(lib)/types';
import { 
  MapPinIcon, 
  UserGroupIcon, 
  EllipsisVerticalIcon,
  StarIcon,
  ShareIcon,
  PencilSquareIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export function GeofenceCard({ geofence, onEdit, onDelete, onViewDetails, onShare }: GeofenceCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);

  const isOwner = geofence.role === 'owner';
  const createdDate = new Date(geofence.created_at).toLocaleDateString();

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(geofence.invite_code);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy invite code:', error);
    }
  };

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/join?invite=${geofence.invite_code}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy invite link:', error);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(geofence);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
      {/* Card Header */}
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isOwner ? 'bg-indigo-100' : 'bg-green-100'
              }`}>
                {isOwner ? (
                  <StarIcon className="w-5 h-5 text-indigo-600" />
                ) : (
                  <MapPinIcon className="w-5 h-5 text-green-600" />
                )}
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {geofence.name}
              </h3>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isOwner 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isOwner ? 'Owner' : 'Member'}
                </span>
                <span>Created {createdDate}</span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
            
            {isMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  {/* View Details */}
                  <button
                    onClick={() => {
                      onViewDetails?.(geofence.id_geofence);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    View Details
                  </button>
                  
                  {/* Share Options */}
                  <button
                    onClick={() => {
                      copyInviteLink();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Copy Invite Link
                  </button>
                  
                  <button
                    onClick={() => {
                      copyInviteCode();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Copy Invite Code
                  </button>
                  
                  {/* Owner-only Actions */}
                  {isOwner && (
                    <>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => {
                          onEdit?.(geofence);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <PencilSquareIcon className="w-4 h-4 mr-2" />
                        Edit Geofence
                      </button>
                      
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${geofence.name}"? This action cannot be undone.`)) {
                            onDelete?.(geofence.id_geofence);
                          }
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete Geofence
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Share Button for Owners */}
          {geofence.role === 'owner' && onShare && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              title="Share invitation"
            >
              <ShareIcon className="h-4 w-4" />
              Share
            </button>
          )}
        </div>

        {/* Card Stats */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <UserGroupIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
            <span>
              {geofence.member_count} {geofence.member_count === 1 ? 'member' : 'members'}
            </span>
          </div>

          {/* Invite Code Display */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInviteCode(!showInviteCode)}
              className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
            >
              {showInviteCode ? 'Hide Code' : 'Show Invite Code'}
            </button>
            
            {showInviteCode && (
              <code 
                onClick={copyInviteCode}
                className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono cursor-pointer hover:bg-gray-200 transition-colors"
                title="Click to copy"
              >
                {geofence.invite_code}
              </code>
            )}
          </div>
        </div>
      </div>

      {/* Click overlay for viewing details */}
      <div
        onClick={() => onViewDetails?.(geofence.id_geofence)}
        className="absolute inset-0 cursor-pointer z-0"
        style={{ zIndex: -1 }}
      />
    </div>
  );
} 