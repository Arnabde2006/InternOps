CREATE TABLE IF NOT EXISTS user_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,

    mime_type VARCHAR(50) NOT NULL,

    original_size BIGINT NOT NULL,
    optimized_size BIGINT NOT NULL,

    width INTEGER,
    height INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT user_images_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT user_images_mime_type_check
        CHECK (
            mime_type IN (
                'image/jpeg',
                'image/png',
                'image/webp'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_user_images_user_id
    ON user_images(user_id);

CREATE INDEX IF NOT EXISTS idx_user_images_created_at
    ON user_images(created_at);