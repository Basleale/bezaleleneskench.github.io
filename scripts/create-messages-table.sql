-- Create public messages table
CREATE TABLE IF NOT EXISTS public_messages (
    id SERIAL PRIMARY KEY,
    content TEXT,
    sender_id VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    message_type VARCHAR(10) NOT NULL DEFAULT 'text',
    voice_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create private messages table
CREATE TABLE IF NOT EXISTS private_messages (
    id SERIAL PRIMARY KEY,
    content TEXT,
    sender_id VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    recipient_id VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    message_type VARCHAR(10) NOT NULL DEFAULT 'text',
    voice_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_public_messages_created_at ON public_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_users ON private_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at DESC);
