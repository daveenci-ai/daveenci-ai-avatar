import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-600">Here's your AI avatar generation dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Images */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Generated Images</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalImages || 0}</p>
            </div>
          </div>
        </div>

        {/* Total Avatars */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">My Avatars</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalAvatars || 0}</p>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${
              user?.validated ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <svg className={`w-6 h-6 ${
                user?.validated ? 'text-green-600' : 'text-yellow-600'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {user?.validated ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.734 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                )}
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <p className={`text-2xl font-bold ${
                user?.validated ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {user?.validated ? 'Verified' : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="/generate" 
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center">
              <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900">Generate Images</h3>
                <p className="text-sm text-gray-500">Create new AI avatars</p>
              </div>
            </div>
          </a>

          <a 
            href="/profile" 
            className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="flex items-center">
              <svg className="w-8 h-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900">Manage Avatars</h3>
                <p className="text-sm text-gray-500">Add or edit your avatars</p>
              </div>
            </div>
          </a>

          <a 
            href="/gallery" 
            className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center">
              <svg className="w-8 h-8 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900">View Gallery</h3>
                <p className="text-sm text-gray-500">Browse your creations</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Images */}
      {stats?.recentImages && stats.recentImages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Images</h2>
            <a 
              href="/gallery" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </a>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {stats.recentImages.map((image) => (
              <div key={image.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <img
                  src={image.imageUrl}
                  alt="Generated"
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                    {image.prompt}
                  </p>
                  {image.avatar && (
                    <p className="text-xs text-gray-500">
                      Avatar: {image.avatar.fullName}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {(!stats?.totalAvatars || stats.totalAvatars === 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Get Started</h2>
          <p className="text-blue-800 mb-4">
            You haven't created any avatars yet. Create your first avatar to start generating personalized images!
          </p>
          <a 
            href="/profile" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create Your First Avatar
          </a>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 