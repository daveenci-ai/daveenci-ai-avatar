-- Add the two new columns to your existing users table
ALTER TABLE public.users 
ADD COLUMN validated BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN hf_repo TEXT NULL;

-- Optional: Add comments to document the new columns
COMMENT ON COLUMN public.users.validated IS 'Email validation status';
COMMENT ON COLUMN public.users.hf_repo IS 'HuggingFace repository for LoRA weights (format: username/repo-name)';

-- Create the generated_images table for storing AI-generated images
CREATE TABLE public.generated_images (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    lora_weights TEXT,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX generated_images_user_id_idx ON public.generated_images(user_id);
CREATE INDEX generated_images_created_at_idx ON public.generated_images(created_at DESC); 