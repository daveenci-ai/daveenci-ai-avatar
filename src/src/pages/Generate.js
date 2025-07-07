import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { imageAPI, avatarAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Generate = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    prompt: '',
    avatarId: '',
    lora_scale: 1,
    num_outputs: 4,
    aspect_ratio: '1:1',
    output_format: 'jpg',
    guidance_scale: 2,
    num_inference_steps: 36,
    seed: '',
    go_fast: true
  });
  
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    try {
      setAvatarsLoading(true);
      const response = await avatarAPI.getAll();
      setAvatars(response.data.avatars);
      
      // Auto-select first avatar if available
      if (response.data.avatars.length > 0) {
        setFormData(prev => ({
          ...prev,
          avatarId: response.data.avatars[0].id.toString()
        }));
      }
    } catch (error) {
      console.error('Failed to fetch avatars:', error);
      setError('Failed to load avatars. Please try again.');
    } finally {
      setAvatarsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!formData.avatarId) {
      setError('Please select an avatar');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Prepare data for API
      const requestData = {
        ...formData,
        seed: formData.seed ? parseInt(formData.seed) : undefined
      };

      // Remove empty seed
      if (!requestData.seed) {
        delete requestData.seed;
      }

      console.log('Generating image with data:', requestData);
      
      const response = await imageAPI.generate(requestData);
      setGeneratedImages(response.data.images);
      
      // Clear form on success
      setFormData(prev => ({
        ...prev,
        prompt: '',
        seed: ''
      }));
      
    } catch (error) {
      console.error('Generation error:', error);
      setError(error.response?.data?.message || 'Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Review action handlers
  const handleLike = async (imageId) => {
    try {
      setError('');
      const response = await imageAPI.like(imageId);
      
      // Update the image in the list to mark as approved
      setGeneratedImages(generatedImages.map(img => 
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
      setGeneratedImages(generatedImages.filter(img => img.id !== imageId));
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
      setGeneratedImages(generatedImages.map(img => 
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

  const handleRegularDownload = (imageUrl, prompt) => {
    const filename = `davinci-ai-${Date.now()}.jpg`;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (avatarsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (avatars.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Avatars Found</h2>
          <p className="text-yellow-700 mb-4">
            You need to create at least one avatar before you can generate images.
          </p>
          <a 
            href="/profile" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create Avatar
          </a>
        </div>
      </div>
    );
  }

  const selectedAvatar = avatars.find(avatar => avatar.id.toString() === formData.avatarId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" style={{maxWidth: '1400px'}}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Images</h1>
        <p className="text-gray-600">Create AI-generated images using your custom avatars</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generation Form - 1/3 width */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Avatar *
              </label>
              <select
                name="avatarId"
                value={formData.avatarId}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an avatar...</option>
                {avatars.map((avatar) => (
                  <option key={avatar.id} value={avatar.id.toString()}>
                    {avatar.fullName} ({avatar.triggerWord})
                  </option>
                ))}
              </select>
              {selectedAvatar && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Trigger word:</span> {selectedAvatar.triggerWord}
                  </p>
                  {selectedAvatar.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Description:</span> {selectedAvatar.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt *
              </label>
              <textarea
                name="prompt"
                value={formData.prompt}
                onChange={handleInputChange}
                placeholder="Describe the image you want to generate..."
                required
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedAvatar && (
                <p className="text-xs text-gray-500 mt-1">
                  Tip: The trigger word "{selectedAvatar.triggerWord}" will be automatically added if not included in your prompt.
                </p>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LoRA Scale: {formData.lora_scale}
                  </label>
                  <input
                    type="range"
                    name="lora_scale"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.lora_scale}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Images
                  </label>
                  <select
                    name="num_outputs"
                    value={formData.num_outputs}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    name="aspect_ratio"
                    value={formData.aspect_ratio}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1:1">Square (1:1)</option>
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="9:16">Portrait (9:16)</option>
                    <option value="4:3">Standard (4:3)</option>
                    <option value="3:4">Portrait (3:4)</option>
                    <option value="3:2">Photo (3:2)</option>
                    <option value="2:3">Portrait Photo (2:3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format
                  </label>
                  <select
                    name="output_format"
                    value={formData.output_format}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="webp">WebP</option>
                    <option value="jpg">JPEG</option>
                    <option value="png">PNG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guidance Scale: {formData.guidance_scale}
                  </label>
                  <input
                    type="range"
                    name="guidance_scale"
                    min="1"
                    max="20"
                    step="0.5"
                    value={formData.guidance_scale}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inference Steps: {formData.num_inference_steps}
                  </label>
                  <input
                    type="range"
                    name="num_inference_steps"
                    min="1"
                    max="50"
                    step="1"
                    value={formData.num_inference_steps}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seed (optional)
                  </label>
                  <input
                    type="number"
                    name="seed"
                    value={formData.seed}
                    onChange={handleInputChange}
                    placeholder="Leave empty for random"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="go_fast"
                      checked={formData.go_fast}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Fast generation (recommended)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.avatarId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Generating...</span>
                </div>
              ) : (
                'Generate Images'
              )}
            </button>
          </form>
        </div>

        {/* Generated Images - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Images</h2>
          
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner />
                <p className="text-gray-600 mt-4">Generating your images...</p>
                <p className="text-sm text-gray-500 mt-2">This usually takes 30-60 seconds</p>
              </div>
            </div>
          )}

          {generatedImages.length > 0 && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {generatedImages.map((image, index) => (
                <div key={image.id} className={`border rounded-lg overflow-hidden group relative ${image.isPendingReview ? 'ring-2 ring-orange-200' : ''}`}>
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
                      alt={`Generated ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      {image.isPendingReview ? (
                        /* Review Actions */
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleLike(image.id)}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            title="Like (Save to GitHub)"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReviewDownload(image.id)}
                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                            title="Download (Save & Download)"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDislike(image.id)}
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
                            onClick={() => handleRegularDownload(image.imageUrl, image.prompt)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                            title="Download"
                          >
                            <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm text-gray-600 line-clamp-2 flex-1">
                        {image.prompt}
                      </p>
                      {image.isPendingReview && (
                        <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                          Review
                        </span>
                      )}
                    </div>
                    {image.avatar && (
                      <p className="text-xs text-gray-500 mt-1">
                        Avatar: {image.avatar.fullName}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
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
          )}

          {generatedImages.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600">No images generated yet</p>
              <p className="text-sm text-gray-500 mt-2">Fill out the form and click "Generate Images" to start</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generate; 