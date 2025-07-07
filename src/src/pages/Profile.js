import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { avatarAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || ''
  });
  const [avatars, setAvatars] = useState([]);
  const [showAvatarForm, setShowAvatarForm] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(null);
  const [avatarForm, setAvatarForm] = useState({
    fullName: '',
    replicateModelUrl: '',
    triggerWord: '',
    description: '',
    visible: true
  });
  const [loading, setLoading] = useState(false);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAvatars();
  }, []);

  useEffect(() => {
    setProfileData({
      name: user?.name || ''
    });
  }, [user]);

  const fetchAvatars = async () => {
    try {
      setAvatarsLoading(true);
      const response = await avatarAPI.getAll();
      setAvatars(response.data.avatars);
    } catch (error) {
      console.error('Failed to fetch avatars:', error);
      setError('Failed to load avatars');
    } finally {
      setAvatarsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setSuccess('Profile updated successfully');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingAvatar) {
        await avatarAPI.update(editingAvatar.id, avatarForm);
        setSuccess('Avatar updated successfully');
      } else {
        await avatarAPI.create(avatarForm);
        setSuccess('Avatar created successfully');
      }
      
      // Reset form and refresh avatars
          setAvatarForm({
      fullName: '',
      replicateModelUrl: '',
      triggerWord: '',
      description: '',
      visible: true
    });
      setShowAvatarForm(false);
      setEditingAvatar(null);
      await fetchAvatars();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAvatar = (avatar) => {
    setEditingAvatar(avatar);
          setAvatarForm({
        fullName: avatar.fullName,
        replicateModelUrl: avatar.replicateModelUrl,
        triggerWord: avatar.triggerWord,
        description: avatar.description || '',
        visible: avatar.visible
      });
    setShowAvatarForm(true);
  };

  const handleDeleteAvatar = async (avatarId) => {
    if (!window.confirm('Are you sure you want to delete this avatar?')) {
      return;
    }

    try {
      await avatarAPI.delete(avatarId);
      setSuccess('Avatar deleted successfully');
      await fetchAvatars();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete avatar');
    }
  };

  const resetAvatarForm = () => {
    setAvatarForm({
      fullName: '',
      replicateModelUrl: '',
      triggerWord: '',
      description: '',
      visible: true
    });
    setShowAvatarForm(false);
    setEditingAvatar(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
        
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Account Status:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                user?.validated 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user?.validated ? 'Validated' : 'Pending Validation'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Avatar Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Avatars</h2>
          <button
            onClick={() => setShowAvatarForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add New Avatar
          </button>
        </div>

        {avatarsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : avatars.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No avatars yet</h3>
            <p className="text-gray-600 mb-4">Create your first avatar to start generating images</p>
            <button
              onClick={() => setShowAvatarForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Avatar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {avatars.map((avatar) => (
              <div key={avatar.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">{avatar.fullName}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditAvatar(avatar)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAvatar(avatar.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Trigger Word:</span> {avatar.triggerWord}</p>
                  <p><span className="font-medium">Replicate Model URL:</span> {avatar.replicateModelUrl}</p>
                  {avatar.description && (
                    <p><span className="font-medium">Description:</span> {avatar.description}</p>
                  )}
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                      avatar.visible 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {avatar.visible ? 'Active' : 'Hidden'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avatar Form Modal */}
      {showAvatarForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAvatar ? 'Edit Avatar' : 'Create New Avatar'}
            </h3>
            
            <form onSubmit={handleAvatarSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={avatarForm.fullName}
                  onChange={(e) => setAvatarForm(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Avatar's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replicate Model URL *
                </label>
                <input
                  type="text"
                  value={avatarForm.replicateModelUrl}
                  onChange={(e) => setAvatarForm(prev => ({ ...prev, replicateModelUrl: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://replicate.com/username/model-name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be a valid Replicate model URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Word *
                </label>
                <input
                  type="text"
                  value={avatarForm.triggerWord}
                  onChange={(e) => setAvatarForm(prev => ({ ...prev, triggerWord: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="trigger_word"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Word that activates this avatar in prompts
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={avatarForm.description}
                  onChange={(e) => setAvatarForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description of this avatar"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={avatarForm.visible}
                    onChange={(e) => setAvatarForm(prev => ({ ...prev, visible: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Make this avatar visible/active
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetAvatarForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Saving...' : (editingAvatar ? 'Update Avatar' : 'Create Avatar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 