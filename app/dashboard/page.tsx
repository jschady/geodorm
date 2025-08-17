'use client';

import React, { useState } from 'react';
import { SignOutButton } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { useGeofences } from '../(dashboard)/(lib)/hooks/use-geofences';
import { GeofenceList } from '../(dashboard)/(components)/geofence/geofence-list';
import { CreateGeofenceModal } from '../(dashboard)/(components)/modals/create-geofence-modal';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const {
    geofences,
    isLoading: isLoadingGeofences,
    error: geofencesError,
    refreshGeofences,
    addGeofence,
    removeGeofence,
  } = useGeofences();

  // Show loading while auth is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated (this should not happen due to middleware)
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Please sign in to continue</h2>
          <p className="mt-2 text-sm text-gray-600">
            You need to be authenticated to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateGeofence = () => {
    setIsCreateModalOpen(true);
  };

  const handleGeofenceCreated = (geofence: any) => {
    addGeofence(geofence);
    setIsCreateModalOpen(false);
  };

  const handleDeleteGeofence = async (geofenceId: string) => {
    try {
      const response = await fetch(`/api/geofences/${geofenceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete geofence');
      }

      removeGeofence(geofenceId);
    } catch (error) {
      console.error('Failed to delete geofence:', error);
      // You could show a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Tiger Dorm Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <SignOutButton>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Alert */}
          {geofencesError && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error Loading Geofences
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    {geofencesError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Development Status (Temporary) */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-md font-semibold text-green-800 mb-2 flex items-center">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              🎉 Epic 2 - Geofence Creation: In Progress
            </h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>✅ Completed:</strong> Authentication system, Database integration, UI Components</p>
              <p><strong>🚧 Current:</strong> Geofence creation and management system</p>
              <p><strong>🔜 Next:</strong> Invitation system, Real-time status updates</p>
            </div>
          </div>

          {/* Geofences Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <GeofenceList
                geofences={geofences}
                isLoading={isLoadingGeofences}
                onCreateNew={handleCreateGeofence}
                onRefresh={refreshGeofences}
              />
            </div>
          </div>

          {/* Quick Stats */}
          {!isLoadingGeofences && geofences.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {geofences.length}
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Geofences
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {geofences.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {geofences.filter(g => g.role === 'owner').length}
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Owned
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {geofences.filter(g => g.role === 'owner').length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {geofences.filter(g => g.role === 'member').length}
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Joined
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {geofences.filter(g => g.role === 'member').length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {geofences.reduce((total, g) => total + g.member_count, 0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Members
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {geofences.reduce((total, g) => total + g.member_count, 0)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Geofence Modal */}
      <CreateGeofenceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGeofenceCreated={handleGeofenceCreated}
      />
    </div>
  );
} 