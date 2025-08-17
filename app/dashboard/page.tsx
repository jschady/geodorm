import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  // Server-side authentication check
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

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
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Welcome to Your Dorm Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                You've successfully signed in! This is the foundation of your multi-user dorm status tracking system.
              </p>
              
              {/* Coming Soon Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-md font-semibold text-indigo-900 mb-2">
                    Create Geofences
                  </h3>
                  <p className="text-sm text-indigo-700">
                    Set up your dorm room location and invite roommates
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-md font-semibold text-green-900 mb-2">
                    Real-time Status
                  </h3>
                  <p className="text-sm text-green-700">
                    Track who's in the room and who's out & about
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-md font-semibold text-purple-900 mb-2">
                    Multi-Room Support
                  </h3>
                  <p className="text-sm text-purple-700">
                    Join multiple dorm rooms and manage your status
                  </p>
                </div>
              </div>

              {/* Development Status */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-md font-semibold text-yellow-800 mb-2">
                  🚧 Development Status
                </h3>
                <p className="text-sm text-yellow-700 mb-2">
                  <strong>Epic 1 - Authentication Foundation:</strong> ✅ Complete
                </p>
                <p className="text-sm text-yellow-600">
                  Next: Supabase integration, geofence management, and real-time features
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 