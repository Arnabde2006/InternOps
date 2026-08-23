const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

async function updateAvatarUrl(userId, avatarUrl) {
  await pool.query(
    `
      UPDATE users
      SET avatar_url = $1,
          updated_at = NOW()
      WHERE id = $2
    `,
    [avatarUrl, userId]
  );
}

async function createOrUpdateImage({
  userId,
  fileName,
  filePath,
  mimeType,
  originalSize,
  optimizedSize,
  width,
  height,
}) {
  const result = await pool.query(
    `
      INSERT INTO user_images (
        user_id,
        file_name,
        file_path,
        mime_type,
        original_size,
        optimized_size,
        width,
        height
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id)
      DO UPDATE SET
        file_name = EXCLUDED.file_name,
        file_path = EXCLUDED.file_path,
        mime_type = EXCLUDED.mime_type,
        original_size = EXCLUDED.original_size,
        optimized_size = EXCLUDED.optimized_size,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        updated_at = NOW()
      RETURNING *
    `,
    [
      userId,
      fileName,
      filePath,
      mimeType,
      originalSize,
      optimizedSize,
      width,
      height,
    ]
  );

  return result.rows[0];
}

async function getUserImage(userId) {
  const result = await pool.query(
    `
      SELECT *
      FROM user_images
      WHERE user_id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function deleteUserImage(userId) {
  await pool.query(
    `
      DELETE FROM user_images
      WHERE user_id = $1
    `,
    [userId]
  );
}

async function deleteFile(dbSavedPath) {
  const projectRoot = path.resolve(__dirname, '..', '..', '..');

  const uploadsRoot = path.resolve(projectRoot, config.uploadDir);

  const absolutePath = path.resolve(projectRoot, dbSavedPath);

  const relative = path.relative(uploadsRoot, absolutePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Directory traversal attempt detected');
  }

  try {
    await fs.promises.unlink(absolutePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }

    console.warn(
      `[deleteFile] File not found, skipping unlink: ${absolutePath}`
    );
  }
}

module.exports = {
  updateAvatarUrl,
  createOrUpdateImage,
  getUserImage,
  deleteUserImage,
  deleteFile,
};
