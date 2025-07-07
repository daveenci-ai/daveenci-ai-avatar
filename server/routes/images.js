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

    // Upload images to GitHub and save to database
    const savedImages = await Promise.all(
      imageUrls.map(async (imageUrl) => {
        try {
          // Upload to GitHub repository
          console.log(`📤 Uploading image to GitHub for avatar: ${avatar.fullName}`);
          const uploadResult = await githubStorage.uploadImage(
            imageUrl, 
            enhancedPrompt, 
            avatar.fullName
          );

          // Save to database with GitHub URL
          return await prisma.avatarGenerated.create({
            data: {
              prompt: enhancedPrompt,
              githubImageUrl: uploadResult.url,
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
        } catch (uploadError) {
          console.error('Failed to upload image to GitHub:', uploadError);
          
          // Fallback: save with original Replicate URL if GitHub upload fails
          console.log('⚠️ Falling back to Replicate URL due to GitHub upload failure');
          return await prisma.avatarGenerated.create({
            data: {
              prompt: enhancedPrompt,
              githubImageUrl: imageUrl, // Keep original Replicate URL as fallback
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
        }
      })
    );

    res.json({
      message: 'Images generated successfully',
      images: savedImages,
      count: savedImages.length,
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
        where: { avatarId: { in: avatarIds } },
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
        where: { avatarId: { in: avatarIds } }
      })
    ]);

    // Convert BigInt to string for JSON serialization and map field names
    const serializedImages = images.map(image => ({
      id: image.id.toString(),
      prompt: image.prompt,
      imageUrl: image.githubImageUrl, // Map to frontend expected field name
      createdAt: image.createdAt,
      avatar: image.avatar ? {
        ...image.avatar,
        id: image.avatar.id.toString()
      } : null
    }));

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

module.exports = router; 