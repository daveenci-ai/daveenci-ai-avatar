import React, { useState, useEffect } from 'react';
import { imageAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchImages(currentPage);
  }, [currentPage]);

  const fetchImages = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await imageAPI.getHistory(page, 12);
      setImages(response.data.images);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await imageAPI.delete(imageId);
      setImages(images.filter(img => img.id !== imageId));
      setError('');
    } catch (error) {
      setError('Failed to delete image');
    }
  };

  const handleDownload = (imageUrl, prompt) => {
    const filename = `davinci-ai-${Date.now()}.jpg`;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Review action handlers
  const handleLike = async (imageId) => {
    try {
      setError('');
      const response = await imageAPI.like(imageId);
      
      // Update the image in the list to mark as approved
      setImages(images.map(img => 
        img.id === imageId 
          ? { ...response.data.image, isPendingReview: false }
          : img
      ));
    } catch (error) {
      console.error('Failed to approve image:', error);
      setError('Failed to approve image');
    }
  };

  const handleDislike = async (imageId) => {
    try {
      setError('');
      await imageAPI.dislike(imageId);
      
      // Remove the image from the list
      setImages(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Failed to reject image:', error);
      setError('Failed to reject image');
    }
  };

  const handleReviewDownload = async (imageId) => {
    try {
      setError('');
      const response = await imageAPI.download(imageId);
      
      // Update the image status and download
      const { downloadUrl, filename } = response.data;
      
      // Update image status in the list
      setImages(images.map(img => 
        img.id === imageId 
          ? { ...img, isPendingReview: false, imageUrl: downloadUrl }
          : img
      ));
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download image:', error);
      setError('Failed to download image');
    }
  };

  const handleCopyUrl = async (imageUrl) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const filteredImages = images.filter(image =>
    image.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (image.avatar?.fullName && image.avatar.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" style={{maxWidth: '1400px'}}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Gallery</h1>
        <p className="text-gray-600">Browse and manage your AI-generated images</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by prompt or avatar name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Images Grid */}
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredImages.map((image) => (
            <div key={image.id} className={`bg-white rounded-lg shadow-md overflow-hidden group relative ${image.isPendingReview ? 'ring-2 ring-orange-200' : ''}`}>
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                {/* Pending Review Badge */}
                {image.isPendingReview && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      Pending Review
                    </span>
                  </div>
                )}
                <img
                  src={image.imageUrl}
                  alt={image.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                />
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  {image.isPendingReview ? (
                    /* Review Actions */
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(image.id);
                        }}
                        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                        title="Like (Save to GitHub)"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReviewDownload(image.id);
                        }}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        title="Download (Save & Download)"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDislike(image.id);
                        }}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Dislike (Delete)"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    /* Regular Actions */
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image.imageUrl, image.prompt);
                        }}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Download"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUrl(image.imageUrl);
                        }}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Copy URL"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image.id);
                        }}
                        className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                    {image.prompt.length > 60 ? `${image.prompt.substring(0, 60)}...` : image.prompt}
                  </p>
                  {image.isPendingReview && (
                    <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      Review
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(image.createdAt).toLocaleDateString()}
                </p>
                {image.avatar && (
                  <p className="text-xs text-blue-600 mt-1">
                    Avatar: {image.avatar.fullName}
                  </p>
                )}
                
                {/* Review Actions (Mobile) */}
                {image.isPendingReview && (
                  <div className="mt-3 flex space-x-2 sm:hidden">
                    <button
                      onClick={() => handleLike(image.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      👍 Like
                    </button>
                    <button
                      onClick={() => handleReviewDownload(image.id)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      ⬇️ Download
                    </button>
                    <button
                      onClick={() => handleDislike(image.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      👎 Dislike
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No matching images' : 'No images yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Start generating some AI images to see them here!'
            }
          </p>
          {!searchTerm && (
            <a
              href="/generate"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Generate Your First Image
            </a>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="px-4 py-2 text-gray-700">
            Page {currentPage} of {pagination.pages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
            disabled={currentPage === pagination.pages}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="max-w-4xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg overflow-hidden">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.prompt}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Generated Image</h3>
                <p className="text-gray-600 mb-3">{selectedImage.prompt}</p>
                {selectedImage.avatar && (
                  <p className="text-sm text-blue-600 mb-3">
                    Avatar: {selectedImage.avatar.fullName} ({selectedImage.avatar.triggerWord})
                  </p>
                )}
                <p className="text-sm text-gray-500 mb-4">
                  Created: {new Date(selectedImage.createdAt).toLocaleDateString()}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.prompt)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleCopyUrl(selectedImage.imageUrl)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery; 