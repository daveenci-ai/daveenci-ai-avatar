# 🎨 DaVinci AI Avatar Generator

A full-stack application for creating stunning AI avatars using [FLUX-dev-lora](https://replicate.com/black-forest-labs/flux-dev-lora) with custom LoRA weights. Built with React, Node.js, Express, PostgreSQL, and Replicate AI.

## ✨ Features

- 🔐 **User Authentication** - Secure login/registration with JWT
- 🎭 **Custom LoRA Integration** - Use your own HuggingFace LoRA weights
- 🎨 **Advanced Image Generation** - Fine-tune parameters for perfect results
- 🖼️ **Image Gallery** - View, search, and manage your creations
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- ⚡ **Fast Generation** - Optimized with FLUX fast mode
- 💾 **Image Management** - Download, share, and organize your images

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL database
- [Replicate API account](https://replicate.com)
- HuggingFace account (for LoRA weights)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd daveenci-ai-avatar
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**

   **Backend (`server/.env`):**
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/daveenci_db"
   
   # JWT Secret (generate a secure random string)
   JWT_SECRET="your-super-secret-jwt-key-here"
   
   # Replicate API
   REPLICATE_API_TOKEN="your-replicate-api-token-here"
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # CORS Origins
   CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
   ```

   **Frontend (`src/.env.local`):**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Set up the database**
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend on http://localhost:3000

## 🔧 Configuration

### Getting Your Replicate API Token

1. Sign up at [Replicate](https://replicate.com)
2. Go to your [Account Settings](https://replicate.com/account/api-tokens)
3. Create a new API token
4. Add it to your server `.env` file

### Setting Up LoRA Weights

1. **Train your LoRA model** (or find pre-trained ones)
2. **Upload to HuggingFace** in format: `username/repository-name`
3. **Configure in your profile** once logged in
4. **Start generating** personalized images!

## 📖 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Image Generation Endpoints

- `POST /api/images/generate` - Generate new image
- `GET /api/images/history` - Get user's images
- `GET /api/images/:id` - Get specific image
- `DELETE /api/images/:id` - Delete image

### User Endpoints

- `GET /api/users/stats` - Get user statistics

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** with Prisma ORM
- **JWT** authentication
- **Replicate AI** for image generation
- **Rate limiting** and security middleware

### Frontend
- **React 18** with hooks
- **React Router** for navigation
- **React Hook Form** for forms
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

## 🎨 Usage

1. **Sign up** for an account
2. **Configure your LoRA repository** in profile settings
3. **Generate images** with custom prompts
4. **View and manage** your creations in the gallery
5. **Download or share** your favorite images

## ⚙️ Advanced Configuration

### Image Generation Parameters

- **Prompt**: Describe your desired image
- **LoRA Scale**: Strength of your custom weights (0-1)
- **Guidance Scale**: How closely to follow prompt (1-20)
- **Inference Steps**: Quality vs speed tradeoff (1-50)
- **Aspect Ratio**: Various ratios supported
- **Output Format**: WebP, JPEG, or PNG

### Database Customization

The app uses Prisma ORM. To modify the database schema:

1. Edit `server/prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Run `npx prisma generate` to update the client

## 🐳 Production Deployment

### Environment Setup
- Set `NODE_ENV=production`
- Use secure JWT secrets
- Configure production database
- Set up CORS for your domain

### Database Migration
```bash
cd server
npx prisma migrate deploy
```

### Build Frontend
```bash
cd src
npm run build
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your environment variables
3. Ensure your Replicate API token is valid
4. Check that your LoRA repository exists on HuggingFace

## 🔗 Links

- [FLUX-dev-lora on Replicate](https://replicate.com/black-forest-labs/flux-dev-lora)
- [HuggingFace LoRA Training Guide](https://huggingface.co/docs/diffusers/training/lora)
- [Replicate API Documentation](https://replicate.com/docs)

---

**Happy generating! 🎨✨**