const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const repo = require('./repository');
const { z } = require('zod');
const { toSchema } = require('../../utils/schemaHelper');

async function routes(fastify) {
  // Get currently logged in user's latest assessment
  fastify.get(
    '/my-assessment',
    {
      schema: {
        tags: ['Assessments'],
        description: "Get the authenticated user's latest assessment",
      },
      preHandler: [auth],
    },
    async (req, reply) => {
      try {
        const assessment = await repo.getLatestAssessment(req.user.id);
        if (!assessment) {
          return reply.status(404).send({ error: 'No assessment found' });
        }
        return reply.send(assessment);
      } catch (err) {
        req.log.error({ err }, 'Error fetching own assessment');
        return reply.status(500).send({ error: 'Failed to fetch assessment' });
      }
    }
  );

  // Admin/Manager: Get assessment by user ID (can also be called by the user themselves)
  fastify.get(
    '/user/:userId',
    {
      schema: {
        tags: ['Assessments'],
        description: 'Get assessment by user email or ID',
        params: toSchema(z.object({ userId: z.string().uuid() })),
      },
      preHandler: [auth], // We check access programmatically to allow the user themselves OR managers
    },
    async (req, reply) => {
      const { userId } = req.params;

      // Access control: User themselves can access, or managers/admins
      const isSelf = req.user.id === userId;
      const isManager = ['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'].includes(
        req.user.role
      );

      if (!isSelf && !isManager) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      try {
        const assessment = await repo.getLatestAssessment(userId);
        if (!assessment) {
          return reply.status(404).send({ error: 'No assessment found' });
        }
        return reply.send(assessment);
      } catch (err) {
        req.log.error({ err }, 'Error fetching user assessment');
        return reply.status(500).send({ error: 'Failed to fetch assessment' });
      }
    }
  );
}

module.exports = routes;
