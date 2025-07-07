const express = require('express');
const Joi = require('joi');
const prisma = require('../lib/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schema for avatar creation/update
const avatarSchema = Joi.object({
  fullName: Joi.string().min(2).max(255).required(),
  replicateModelUrl: Joi.string().required(),
  triggerWord: Joi.string().min(1).max(100).required(),
  description: Joi.string().optional().allow('', null),
  visible: Joi.boolean().default(true)
});

// Get all user's avatars (through contacts relationship)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);
    
    const avatars = await prisma.avatar.findMany({
      where: { 
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null } // Include avatars without contact association
        ],
        visible: true
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        replicateModelUrl: true,
        triggerWord: true,
        description: true,
        visible: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Convert BigInt to string for JSON serialization
    const serializedAvatars = avatars.map(avatar => ({
      ...avatar,
      id: avatar.id.toString()
    }));

    res.json({ avatars: serializedAvatars });
  } catch (error) {
    console.error('Avatars fetch error:', error);
    res.status(500).json({ message: 'Error fetching avatars' });
  }
});

// Get single avatar
router.get('/:avatarId', authenticateToken, async (req, res) => {
  try {
    const avatarId = BigInt(req.params.avatarId);
    
    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);
    
    const avatar = await prisma.avatar.findFirst({
      where: {
        id: avatarId,
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null } // Include avatars without contact association
        ]
      },
      select: {
        id: true,
        fullName: true,
        replicateModelUrl: true,
        triggerWord: true,
        description: true,
        visible: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!avatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    // Convert BigInt to string for JSON serialization
    const serializedAvatar = {
      ...avatar,
      id: avatar.id.toString()
    };

    res.json({ avatar: serializedAvatar });
  } catch (error) {
    console.error('Avatar fetch error:', error);
    res.status(500).json({ message: 'Error fetching avatar' });
  }
});

// Create new avatar (without contact association for now)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = avatarSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { fullName, replicateModelUrl, triggerWord, description, visible } = value;

    // Check if replicate_model_url already exists
    const existingAvatar = await prisma.avatar.findUnique({
      where: { replicateModelUrl }
    });

    if (existingAvatar) {
      return res.status(400).json({ message: 'This Replicate model URL is already in use' });
    }

    const avatar = await prisma.avatar.create({
      data: {
        contactId: null, // Set to null for now since we don't have direct user relationship
        fullName,
        replicateModelUrl,
        triggerWord,
        description,
        visible
      },
      select: {
        id: true,
        fullName: true,
        replicateModelUrl: true,
        triggerWord: true,
        description: true,
        visible: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Convert BigInt to string for JSON serialization
    const serializedAvatar = {
      ...avatar,
      id: avatar.id.toString()
    };

    res.status(201).json({
      message: 'Avatar created successfully',
      avatar: serializedAvatar
    });
  } catch (error) {
    console.error('Avatar creation error:', error);
    res.status(500).json({ message: 'Error creating avatar' });
  }
});

// Update avatar
router.put('/:avatarId', authenticateToken, async (req, res) => {
  try {
    const avatarId = BigInt(req.params.avatarId);
    
    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);
    
    // Check if avatar exists and belongs to user
    const existingAvatar = await prisma.avatar.findFirst({
      where: {
        id: avatarId,
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null } // Include avatars without contact association
        ]
      }
    });

    if (!existingAvatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    const { error, value } = avatarSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { fullName, replicateModelUrl, triggerWord, description, visible } = value;

    // Check if replicate_model_url already exists (excluding current avatar)
    if (replicateModelUrl !== existingAvatar.replicateModelUrl) {
      const duplicateRepo = await prisma.avatar.findUnique({
        where: { replicateModelUrl }
      });

      if (duplicateRepo) {
        return res.status(400).json({ message: 'This Replicate model URL is already in use' });
      }
    }

    const updatedAvatar = await prisma.avatar.update({
      where: { id: avatarId },
      data: {
        fullName,
        replicateModelUrl,
        triggerWord,
        description,
        visible,
        updatedAt: new Date()
      },
      select: {
        id: true,
        fullName: true,
        replicateModelUrl: true,
        triggerWord: true,
        description: true,
        visible: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Convert BigInt to string for JSON serialization
    const serializedUpdatedAvatar = {
      ...updatedAvatar,
      id: updatedAvatar.id.toString()
    };

    res.json({
      message: 'Avatar updated successfully',
      avatar: serializedUpdatedAvatar
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(500).json({ message: 'Error updating avatar' });
  }
});

// Delete avatar
router.delete('/:avatarId', authenticateToken, async (req, res) => {
  try {
    const avatarId = BigInt(req.params.avatarId);
    
    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);
    
    // Check if avatar exists and belongs to user
    const existingAvatar = await prisma.avatar.findFirst({
      where: {
        id: avatarId,
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null } // Include avatars without contact association
        ]
      }
    });

    if (!existingAvatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    await prisma.avatar.delete({
      where: { id: avatarId }
    });

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Avatar deletion error:', error);
    res.status(500).json({ message: 'Error deleting avatar' });
  }
});

module.exports = router; 