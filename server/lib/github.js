const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const crypto = require('crypto');

class GitHubImageStorage {
  constructor() {
    // Parse GITHUB_REPO environment variable (format: "owner/repo")
    const repoPath = process.env.GITHUB_REPO || 'daveenci-ai/daveenci-ai-avatar-images';
    const [owner, repo] = repoPath.split('/');
    
    if (!owner || !repo) {
      throw new Error('Invalid GITHUB_REPO format. Expected: "owner/repository"');
    }
    
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required for GitHub API authentication');
    }
    
    this.owner = owner;
    this.repo = repo;
    this.branch = 'main'; // Default to main branch
    
    // Initialize GitHub API client with Personal Access Token
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Download image from URL and return base64 encoded content
   */
  async downloadImage(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      });
      
      return Buffer.from(response.data).toString('base64');
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  /**
   * Generate a unique filename for the image
   */
  generateFilename(prompt, avatarName, extension = 'webp') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const promptHash = crypto.createHash('md5').update(prompt).digest('hex').substring(0, 8);
    const safeAvatarName = avatarName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    return `${timestamp}_${safeAvatarName}_${promptHash}.${extension}`;
  }

  /**
   * Upload image to GitHub repository
   */
  async uploadImage(imageUrl, prompt, avatarName) {
    try {
      console.log('📸 Downloading image from Replicate...');
      const imageBase64 = await this.downloadImage(imageUrl);
      
      // Generate filename
      const filename = this.generateFilename(prompt, avatarName);
      const path = `generated/${filename}`;
      
      console.log(`📤 Uploading image to GitHub: ${path}`);
      
      // Upload to GitHub
      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: path,
        message: `Add generated image: ${avatarName} - ${prompt.substring(0, 50)}...`,
        content: imageBase64,
        branch: this.branch
      });

      // Generate the raw GitHub URL
      const githubUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;
      
      console.log(`✅ Image uploaded successfully: ${githubUrl}`);
      
      return {
        url: githubUrl
      };
      
    } catch (error) {
      console.error('Error uploading image to GitHub:', error);
      throw new Error(`Failed to upload image to GitHub: ${error.message}`);
    }
  }



  /**
   * Test GitHub connection
   */
  async testConnection() {
    try {
      const response = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo
      });
      
      console.log(`✅ GitHub connection successful: ${response.data.full_name}`);
      return true;
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      throw new Error(`GitHub connection failed: ${error.message}`);
    }
  }
}

module.exports = new GitHubImageStorage(); 