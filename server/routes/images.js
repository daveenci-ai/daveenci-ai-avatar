const express = require('express');
const Joi = require('joi');
const Replicate = require('replicate');
const prisma = require('../lib/database');
const { authenticateToken } = require('../middleware/auth');
const githubStorage = require('../lib/github');

const router = express.Router();

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Validation schema for image generation
const generateImageSchema = Joi.object({
  prompt: Joi.string().min(3).max(1000).required(),
  avatarId: Joi.string().required(), // Now required to select an avatar
  lora_scale: Joi.number().min(0).max(1).default(0.8),
  num_outputs: Joi.number().integer().min(1).max(4).default(1),
  aspect_ratio: Joi.string().valid('1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3').default('1:1'),
  output_format: Joi.string().valid('webp', 'jpg', 'png').default('webp'),
  guidance_scale: Joi.number().min(1).max(20).default(3.5),
  num_inference_steps: Joi.number().integer().min(1).max(50).default(28),
  seed: Joi.number().integer().optional(),
  go_fast: Joi.boolean().default(true)
});

// Generate image endpoint
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { error, value } = generateImageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { prompt, avatarId, ...options } = value;
    const user = req.user;

    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);

    // Get the selected avatar
    const avatar = await prisma.avatar.findFirst({
      where: {
        id: BigInt(avatarId),
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null } // Include avatars without contact association
        ],
        visible: true
      }
    });

    if (!avatar) {
      return res.status(400).json({ 
        message: 'Avatar not found or not accessible.' 
      });
    }

    console.log(`🎨 Generating image for user ${user.email} with avatar: "${avatar.fullName}"`);
    console.log(`📦 Using Replicate model: ${avatar.replicateModelUrl}`);
    console.log(`🎯 Trigger word: ${avatar.triggerWord}`);

    // Enhance prompt with trigger word if not already included
    let enhancedPrompt = prompt;
    if (!prompt.toLowerCase().includes(avatar.triggerWord.toLowerCase())) {
      enhancedPrompt = `${avatar.triggerWord} ${prompt}`;
    }

    // Prepare Replicate input
    const input = {
      prompt: enhancedPrompt,
      lora_weights: avatar.replicateModelUrl,
      ...options
    };

    // Generate image using Replicate
    const output = await replicate.run(
      "black-forest-labs/flux-dev-lora",
      { input }
    );

    // Output is an array of image URLs
    const imageUrls = Array.isArray(output) ? output : [output];

    // Save images for review (temporary Replicate URLs)
    const savedImages = await Promise.all(
      imageUrls.map(async (imageUrl) => {
        console.log(`💾 Saving image for review: ${avatar.fullName}`);
        
        // Save with temporary Replicate URL for review
        // Add "PENDING_REVIEW:" prefix to distinguish from approved images
        return await prisma.avatarGenerated.create({
          data: {
            prompt: enhancedPrompt,
            githubImageUrl: `PENDING_REVIEW:${imageUrl}`, // Temporary URL with review flag
            avatarId: BigInt(avatarId)
          },
          include: {
            avatar: {
              select: {
                id: true,
                fullName: true,
                replicateModelUrl: true,
                triggerWord: true
              }
            }
          }
        });
      })
    );

    // Serialize BigInt values and prepare for review
    const serializedImages = savedImages.map(image => {
      const isPendingReview = image.githubImageUrl.startsWith('PENDING_REVIEW:');
      const actualImageUrl = isPendingReview ? image.githubImageUrl.replace('PENDING_REVIEW:', '') : image.githubImageUrl;
      
      return {
        ...image,
        id: image.id.toString(),
        avatarId: image.avatarId.toString(),
        imageUrl: actualImageUrl, // Clean URL for frontend display
        isPendingReview: isPendingReview,
        avatar: image.avatar ? {
          ...image.avatar,
          id: image.avatar.id.toString()
        } : image.avatar
      };
    });

    res.json({
      message: 'Images generated successfully - ready for review',
      images: serializedImages,
      count: serializedImages.length,
      pendingReview: true,
      avatar: {
        id: avatar.id.toString(),
        fullName: avatar.fullName,
        triggerWord: avatar.triggerWord
      }
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    if (error.message?.includes('Invalid token')) {
      return res.status(401).json({ message: 'Invalid Replicate API token' });
    }
    
    if (error.message?.includes('rate limit')) {
      return res.status(429).json({ message: 'Rate limit exceeded. Please try again later.' });
    }

    res.status(500).json({ 
      message: 'Error generating image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's generated images
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);

    // Get avatars accessible to the user
    const userAvatars = await prisma.avatar.findMany({
      where: {
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null } // Include avatars without contact association
        ]
      },
      select: { id: true }
    });

    const avatarIds = userAvatars.map(avatar => avatar.id);

    const [images, total] = await Promise.all([
      prisma.avatarGenerated.findMany({
        where: { 
          avatarId: { in: avatarIds },
          githubImageUrl: { not: { startsWith: 'PENDING_REVIEW:' } } // Only show approved images
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          prompt: true,
          githubImageUrl: true,
          createdAt: true,
          avatar: {
            select: {
              id: true,
              fullName: true,
              replicateModelUrl: true,
              triggerWord: true
            }
          }
        }
      }),
      prisma.avatarGenerated.count({
        where: { 
          avatarId: { in: avatarIds },
          githubImageUrl: { not: { startsWith: 'PENDING_REVIEW:' } } // Only count approved images
        }
      })
    ]);

    // Convert BigInt to string for JSON serialization and handle review status
    const serializedImages = images.map(image => {
      const isPendingReview = image.githubImageUrl.startsWith('PENDING_REVIEW:');
      const actualImageUrl = isPendingReview ? image.githubImageUrl.replace('PENDING_REVIEW:', '') : image.githubImageUrl;
      
      return {
        id: image.id.toString(),
        prompt: image.prompt,
        imageUrl: actualImageUrl, // Clean URL for frontend display
        isPendingReview: isPendingReview,
        createdAt: image.createdAt,
        avatar: image.avatar ? {
          ...image.avatar,
          id: image.avatar.id.toString()
        } : null
      };
    });

    res.json({
      images: serializedImages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ message: 'Error fetching image history' });
  }
});

// Get single image details
router.get('/:imageId', authenticateToken, async (req, res) => {
  try {
    const imageId = BigInt(req.params.imageId);

    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);

    // Get avatars accessible to the user
    const userAvatars = await prisma.avatar.findMany({
      where: {
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null } // Include avatars without contact association
        ]
      },
      select: { id: true }
    });

    const avatarIds = userAvatars.map(avatar => avatar.id);

    const image = await prisma.avatarGenerated.findFirst({
      where: {
        id: imageId,
        avatarId: { in: avatarIds }
      },
      include: {
        avatar: {
          select: {
            id: true,
            fullName: true,
            replicateModelUrl: true,
            triggerWord: true
          }
        }
      }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Convert BigInt to string for JSON serialization and map field names
    const serializedImage = {
      id: image.id.toString(),
      prompt: image.prompt,
      imageUrl: image.githubImageUrl, // Map to frontend expected field name
      createdAt: image.createdAt,
      avatar: image.avatar ? {
        ...image.avatar,
        id: image.avatar.id.toString()
      } : null
    };

    res.json({ image: serializedImage });
  } catch (error) {
    console.error('Image fetch error:', error);
    res.status(500).json({ message: 'Error fetching image' });
  }
});

// Delete image
router.delete('/:imageId', authenticateToken, async (req, res) => {
  try {
    const imageId = BigInt(req.params.imageId);

    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);

    // Get avatars accessible to the user
    const userAvatars = await prisma.avatar.findMany({
      where: {
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null } // Include avatars without contact association
        ]
      },
      select: { id: true }
    });

    const avatarIds = userAvatars.map(avatar => avatar.id);

    const image = await prisma.avatarGenerated.findFirst({
      where: {
        id: imageId,
        avatarId: { in: avatarIds }
      }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from database (GitHub images remain for now)
    await prisma.avatarGenerated.delete({
      where: { id: imageId }
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

// Image Review Actions

// Like action - Approve and upload to GitHub
router.post('/:imageId/like', authenticateToken, async (req, res) => {
  try {
    const imageId = BigInt(req.params.imageId);

    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);

    // Get avatars accessible to the user
    const userAvatars = await prisma.avatar.findMany({
      where: {
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null }
        ]
      },
      select: { id: true }
    });

    const avatarIds = userAvatars.map(avatar => avatar.id);

    const image = await prisma.avatarGenerated.findFirst({
      where: {
        id: imageId,
        avatarId: { in: avatarIds }
      },
      include: {
        avatar: {
          select: {
            id: true,
            fullName: true,
            replicateModelUrl: true,
            triggerWord: true
          }
        }
      }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if it's pending review
    if (!image.githubImageUrl.startsWith('PENDING_REVIEW:')) {
      return res.status(400).json({ message: 'Image is not pending review' });
    }

    const replicateUrl = image.githubImageUrl.replace('PENDING_REVIEW:', '');

    try {
      // Upload to GitHub
      console.log(`👍 Approving and uploading image to GitHub for avatar: ${image.avatar.fullName}`);
      const uploadResult = await githubStorage.uploadImage(
        replicateUrl, 
        image.prompt, 
        image.avatar.fullName
      );

      // Update database with GitHub URL
      const updatedImage = await prisma.avatarGenerated.update({
        where: { id: imageId },
        data: {
          githubImageUrl: uploadResult.url
        },
        include: {
          avatar: {
            select: {
              id: true,
              fullName: true,
              replicateModelUrl: true,
              triggerWord: true
            }
          }
        }
      });

      // Serialize response
      const serializedImage = {
        ...updatedImage,
        id: updatedImage.id.toString(),
        avatarId: updatedImage.avatarId.toString(),
        imageUrl: updatedImage.githubImageUrl,
        isPendingReview: false,
        avatar: updatedImage.avatar ? {
          ...updatedImage.avatar,
          id: updatedImage.avatar.id.toString()
        } : updatedImage.avatar
      };

      res.json({
        message: 'Image approved and uploaded to GitHub successfully',
        image: serializedImage
      });

    } catch (uploadError) {
      console.error('Failed to upload approved image to GitHub:', uploadError);
      res.status(500).json({ message: 'Failed to upload image to GitHub' });
    }

  } catch (error) {
    console.error('Image approval error:', error);
    res.status(500).json({ message: 'Error approving image' });
  }
});

// Dislike action - Reject and delete
router.post('/:imageId/dislike', authenticateToken, async (req, res) => {
  try {
    const imageId = BigInt(req.params.imageId);

    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);

    // Get avatars accessible to the user
    const userAvatars = await prisma.avatar.findMany({
      where: {
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null }
        ]
      },
      select: { id: true }
    });

    const avatarIds = userAvatars.map(avatar => avatar.id);

    const image = await prisma.avatarGenerated.findFirst({
      where: {
        id: imageId,
        avatarId: { in: avatarIds }
      }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if it's pending review
    if (!image.githubImageUrl.startsWith('PENDING_REVIEW:')) {
      return res.status(400).json({ message: 'Image is not pending review' });
    }

    // Delete from database
    await prisma.avatarGenerated.delete({
      where: { id: imageId }
    });

    console.log(`👎 Image rejected and deleted: ${imageId}`);
    res.json({ message: 'Image rejected and deleted successfully' });

  } catch (error) {
    console.error('Image rejection error:', error);
    res.status(500).json({ message: 'Error rejecting image' });
  }
});

// Download action - Approve, upload to GitHub, and provide download
router.post('/:imageId/download', authenticateToken, async (req, res) => {
  try {
    const imageId = BigInt(req.params.imageId);

    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);

    // Get avatars accessible to the user
    const userAvatars = await prisma.avatar.findMany({
      where: {
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null }
        ]
      },
      select: { id: true }
    });

    const avatarIds = userAvatars.map(avatar => avatar.id);

    const image = await prisma.avatarGenerated.findFirst({
      where: {
        id: imageId,
        avatarId: { in: avatarIds }
      },
      include: {
        avatar: {
          select: {
            id: true,
            fullName: true,
            replicateModelUrl: true,
            triggerWord: true
          }
        }
      }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    let downloadUrl;
    
    if (image.githubImageUrl.startsWith('PENDING_REVIEW:')) {
      // Upload to GitHub first
      const replicateUrl = image.githubImageUrl.replace('PENDING_REVIEW:', '');

      try {
        console.log(`💾 Approving and uploading image for download: ${image.avatar.fullName}`);
        const uploadResult = await githubStorage.uploadImage(
          replicateUrl, 
          image.prompt, 
          image.avatar.fullName
        );

        // Update database with GitHub URL
        await prisma.avatarGenerated.update({
          where: { id: imageId },
          data: {
            githubImageUrl: uploadResult.url
          }
        });

        downloadUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Failed to upload image for download:', uploadError);
        // Fallback to original Replicate URL
        downloadUrl = replicateUrl;
      }
    } else {
      // Already uploaded, use existing GitHub URL
      downloadUrl = image.githubImageUrl;
    }

    res.json({
      message: 'Image ready for download',
      downloadUrl: downloadUrl,
      filename: `${image.avatar.fullName}-${image.id}.webp`
    });

  } catch (error) {
    console.error('Image download error:', error);
    res.status(500).json({ message: 'Error preparing image for download' });
  }
});

module.exports = router; 