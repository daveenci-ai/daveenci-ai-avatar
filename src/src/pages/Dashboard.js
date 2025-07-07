import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Sparkles, 
  Image, 
  User, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Camera,
  ArrowRight,
  Calendar,
  Activity
} from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{maxWidth: '1400px'}}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your AI avatars today
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <Calendar className="w-4 h-4 inline mr-1" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Generated Images */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">GENERATED IMAGES</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalImages || 0}</p>
                <div className="flex items-center mt-2 text-blue-100">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-xs">+0% 30d</span>
                </div>
              </div>
              <div className="bg-blue-400 bg-opacity-50 rounded-lg p-3">
                <Image className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* My Avatars */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">MY AVATARS</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalAvatars || 0}</p>
                <div className="flex items-center mt-2 text-emerald-100">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-xs">+0% 30d</span>
                </div>
              </div>
              <div className="bg-emerald-400 bg-opacity-50 rounded-lg p-3">
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className={`${
            user?.validated 
              ? 'bg-gradient-to-br from-green-500 to-green-600' 
              : 'bg-gradient-to-br from-amber-500 to-amber-600'
          } rounded-xl shadow-lg p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${
                  user?.validated ? 'text-green-100' : 'text-amber-100'
                } text-sm font-medium`}>ACCOUNT STATUS</p>
                <p className="text-3xl font-bold mt-2">
                  {user?.validated ? 'VERIFIED' : 'PENDING'}
                </p>
                <div className={`flex items-center mt-2 ${
                  user?.validated ? 'text-green-100' : 'text-amber-100'
                }`}>
                  {user?.validated ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <Clock className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-xs">
                    {user?.validated ? 'All verified' : 'Verification needed'}
                  </span>
                </div>
              </div>
              <div className={`${
                user?.validated 
                  ? 'bg-green-400 bg-opacity-50' 
                  : 'bg-amber-400 bg-opacity-50'
              } rounded-lg p-3`}>
                {user?.validated ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
            </div>
          </div>

          {/* Activity Score */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">ACTIVITY SCORE</p>
                <p className="text-3xl font-bold mt-2">
                  {stats?.totalImages && stats?.totalAvatars 
                    ? Math.min(100, ((stats.totalImages + stats.totalAvatars * 10) / 20) * 100).toFixed(0)
                    : 0}
                </p>
                <div className="flex items-center mt-2 text-purple-100">
                  <Activity className="w-4 h-4 mr-1" />
                  <span className="text-xs">+0% 30d</span>
                </div>
              </div>
              <div className="bg-purple-400 bg-opacity-50 rounded-lg p-3">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  to="/generate" 
                  className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group"
                >
                  <div className="bg-blue-600 rounded-lg p-2 mr-4">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Generate Images</h4>
                    <p className="text-sm text-gray-600">Create new AI avatars</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </Link>

                <Link 
                  to="/profile" 
                  className="flex items-center p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 group"
                >
                  <div className="bg-emerald-600 rounded-lg p-2 mr-4">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Manage Avatars</h4>
                    <p className="text-sm text-gray-600">Create and edit avatars</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </Link>

                <Link 
                  to="/gallery" 
                  className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-200 group"
                >
                  <div className="bg-purple-600 rounded-lg p-2 mr-4">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">View Gallery</h4>
                    <p className="text-sm text-gray-600">Browse your creations</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Images</h3>
                {stats?.recentImages && stats.recentImages.length > 0 && (
                  <Link 
                    to="/gallery" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                )}
              </div>
              
              {stats?.recentImages && stats.recentImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {stats.recentImages.slice(0, 8).map((image) => (
                    <div key={image.id} className="group cursor-pointer">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.imageUrl}
                          alt="Generated"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {image.prompt}
                        </p>
                        {image.avatar && (
                          <p className="text-xs text-gray-500 mt-1">
                            {image.avatar.fullName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No images yet</h4>
                  <p className="text-gray-600 mb-4">
                    Create your first avatar and start generating amazing images
                  </p>
                  {(!stats?.totalAvatars || stats.totalAvatars === 0) ? (
                    <Link
                      to="/profile"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Create Avatar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  ) : (
                    <Link
                      to="/generate"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Generate Images
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 