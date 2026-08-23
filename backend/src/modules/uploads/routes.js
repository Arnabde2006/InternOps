const {
  sanitizationMiddleware: sanitize,
} = require('../../middleware/sanitize');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const auth = require('../../middleware/auth');
const repo = require('./repository');
const config = require('../../config');

const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const ALLOWED_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

const MAGIC_BYTES = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],

  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
};

function detectMimeFromBuffer(buf) {
  if (!buf || buf.length < 4) {
    return null;
  }

  // WebP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }

  for (const [mime, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (signature.every((byte, index) => buf[index] === byte)) {
        return mime;
      }
    }
  }

  return null;
}

async function routes(fastify) {
  /*
   * Upload / replace current user's avatar
   */
  fastify.post(
    '/avatar',
    {
      preHandler: [auth, sanitize],

      schema: {
        tags: ['Uploads'],
        description: 'Upload/replace avatar image',
      },
    },

    async (req, reply) => {
      const data = await req.file();

      if (!data) {
        return reply.status(400).send({
          error: 'No file uploaded',
        });
      }

      const ext = path.extname(data.filename || '').toLowerCase();

      /*
       * Step 1:
       * Validate declared MIME type and extension
       */
      if (!ALLOWED.includes(data.mimetype) || !ALLOWED_EXTS.includes(ext)) {
        return reply.status(400).send({
          error: 'Only JPG, PNG and WEBP images are allowed',
        });
      }

      /*
       * Step 2:
       * Read uploaded file
       */
      const buffer = await data.toBuffer();

      /*
       * Step 3:
       * Check multipart size limit
       */
      if (data.file.truncated) {
        return reply.status(413).send({
          error: 'File exceeds maximum size of 5MB',
        });
      }

      /*
       * Step 4:
       * Verify actual file signature
       */
      const detectedMime = detectMimeFromBuffer(buffer);

      if (
        !detectedMime ||
        detectedMime !==
          (data.mimetype === 'image/jpg' ? 'image/jpeg' : data.mimetype)
      ) {
        return reply.status(400).send({
          error: 'File contents do not match declared image type',
        });
      }

      /*
       * Step 5:
       * Verify actual image using Sharp.
       * This also protects against malformed
       * image files that pass basic checks.
       */
      let metadata;

      try {
        metadata = await sharp(buffer).metadata();
      } catch (error) {
        return reply.status(400).send({
          error: 'Invalid or corrupted image',
        });
      }

      if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
        return reply.status(400).send({
          error: 'Only JPG, PNG and WEBP images are allowed',
        });
      }

      /*
       * Step 6:
       * Optimize image.
       *
       * Every uploaded avatar becomes:
       * 400 x 400 WEBP
       * quality = 80
       */
      let optimizedBuffer;

      try {
        optimizedBuffer = await sharp(buffer)
          .resize(400, 400, {
            fit: 'cover',
            position: 'centre',
          })
          .webp({
            quality: 80,
          })
          .toBuffer();
      } catch (error) {
        req.log.error(error, 'Image optimization failed');

        return reply.status(400).send({
          error: 'Unable to process uploaded image',
        });
      }

      /*
       * Step 7:
       * Use user ID based filename.
       *
       * Example:
       * avatar_<user-id>_<random>.webp
       */
      const fileName = `avatar_${req.user.id}_${crypto.randomBytes(6).toString('hex')}.webp`;

      const uploadPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        config.uploadDir
      );

      const targetFilePath = path.resolve(uploadPath, fileName);

      const absoluteUploadPath = path.resolve(uploadPath);

      /*
       * Path traversal protection
       */
      if (!targetFilePath.startsWith(absoluteUploadPath + path.sep)) {
        return reply.status(400).send({
          error: 'Invalid file path',
        });
      }

      /*
       * Step 8:
       * Ensure upload directory exists
       */
      fs.mkdirSync(uploadPath, {
        recursive: true,
      });

      /*
       * Step 9:
       * Save optimized image
       */
      fs.writeFileSync(targetFilePath, optimizedBuffer);

      const url = `/uploads/${fileName}`;

      /*
       * Step 10:
       * Save avatar URL.
       *
       * This keeps compatibility with the
       * existing users.avatar_url column.
       */
      await repo.updateAvatarUrl(req.user.id, url);

      /*
       * Step 11:
       * Save centralized image metadata.
       */
      if (typeof repo.createOrUpdateImage === 'function') {
        await repo.createOrUpdateImage({
          userId: req.user.id,
          fileName,
          filePath: targetFilePath,
          mimeType: 'image/webp',
          originalSize: buffer.length,
          optimizedSize: optimizedBuffer.length,
          width: 400,
          height: 400,
        });
      }

      return {
        success: true,
        avatar_url: url,
        image: {
          file_name: fileName,
          mime_type: 'image/webp',
          original_size: buffer.length,
          optimized_size: optimizedBuffer.length,
          width: 400,
          height: 400,
        },
      };
    }
  );
}

module.exports = routes;
