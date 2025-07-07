const express = require('express');
const prisma = require('../lib/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's contact IDs
    const userContacts = await prisma.contact.findMany({
      where: { userId },
      select: { id: true }
    });
    
    const contactIds = userContacts.map(contact => contact.id);

    // Get avatars accessible to the user
    const userAvatars = await prisma.avatar.findMany({
      where: {
        OR: [
          { contactId: { in: contactIds } },
          { contactId: null } // Include avatars without contact association
        ],
        visible: true
      },
      select: { id: true }
    });

    const avatarIds = userAvatars.map(avatar => avatar.id);
    
    const [imageStats, avatarStats, recentImages] = await Promise.all([
      prisma.avatarGenerated.aggregate({
        where: { avatarId: { in: avatarIds } },
        _count: { id: true }
      }),
      prisma.avatar.aggregate({
        where: { 
          OR: [
            { contactId: { in: contactIds } },
            { contactId: null } // Include avatars without contact association
          ],
          visible: true
        },
        _count: { id: true }
      }),
      prisma.avatarGenerated.findMany({
        where: { avatarId: { in: avatarIds } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          prompt: true,
          githubImageUrl: true,
          createdAt: true,
          avatar: {
            select: {
              id: true,
              fullName: true,
              triggerWord: true
            }
          }
        }
      })
    ]);

    // Convert BigInt to string for JSON serialization and map field names
    const serializedRecentImages = recentImages.map(image => ({
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
      totalImages: imageStats._count.id,
      totalAvatars: avatarStats._count.id,
      recentImages: serializedRecentImages,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        validated: req.user.validated
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
});

module.exports = router; 