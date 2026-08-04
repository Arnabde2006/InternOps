const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const { generateAIResponse } = require('../../services/aiProviderService');
const onboardingRepo = require('./repository');

function normalizeItem(item) {
  return {
    title: item.title,
    description: typeof item.description === 'string' ? item.description : '',
    dueDayOffset:
      Number.isInteger(item.dueDayOffset) && item.dueDayOffset >= 0
        ? item.dueDayOffset
        : null,
    socialTaskId:
      typeof item.socialTaskId === 'string' ? item.socialTaskId : null,
  };
}

function validateItems(items) {
  if (!Array.isArray(items)) {
    return false;
  }

  return items.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof item.title === 'string' &&
      item.title.trim()
  );
}

async function routes(fastify) {
  // ---------------------------------------------------------
  // POST /api/v1/onboarding/generate
  // Generate an AI-assisted onboarding checklist
  // ---------------------------------------------------------
  fastify.post(
    '/generate',
    {
      preHandler: [auth, rbac('ADMIN', 'SENIOR_TL', 'TL')],
      schema: {
        tags: ['Onboarding'],
        description: 'Generate an AI-assisted onboarding checklist',
      },
    },
    async (req, reply) => {
      const { role, department } = req.body || {};

      if (
        typeof role !== 'string' ||
        !role.trim() ||
        typeof department !== 'string' ||
        !department.trim()
      ) {
        return reply.status(400).send({
          error: 'role and department are required',
        });
      }

      const prompt = `
Generate an onboarding checklist for a new intern.

Role: ${role.trim()}
Department: ${department.trim()}

Return ONLY valid JSON in this format:

{
  "title": "Onboarding Checklist",
  "items": [
    {
      "title": "Task title",
      "description": "Short description",
      "dueDayOffset": 1
    }
  ]
}

Requirements:
- Make the checklist specific to the role and department.
- Include relevant documents to read.
- Include people or teams to meet.
- Include initial environment/setup tasks.
- Include first tasks the intern should complete.
- dueDayOffset must be a non-negative integer.
- Return only valid JSON.
`;

      try {
        const result = await generateAIResponse({
          userId: req.user.id,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        let checklist;

        try {
          let content = result.content.trim();

          // Providers sometimes wrap JSON in markdown fences.
          if (content.startsWith('```')) {
            content = content
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```$/, '');
          }

          checklist = JSON.parse(content);
        } catch (error) {
          req.log.error(
            { err: error },
            'AI returned invalid onboarding checklist JSON'
          );

          return reply.status(502).send({
            error: 'AI returned an invalid checklist format',
          });
        }

        if (
          !checklist ||
          typeof checklist !== 'object' ||
          typeof checklist.title !== 'string' ||
          !Array.isArray(checklist.items)
        ) {
          return reply.status(502).send({
            error: 'AI returned an invalid checklist structure',
          });
        }

        const items = checklist.items
          .filter(
            (item) =>
              item &&
              typeof item === 'object' &&
              typeof item.title === 'string' &&
              item.title.trim()
          )
          .map(normalizeItem);

        return {
          title: checklist.title,
          role: role.trim(),
          department: department.trim(),
          items,
          provider: result.provider,
          cached: result.cached,
        };
      } catch (error) {
        req.log.error(
          { err: error },
          'Failed to generate onboarding checklist'
        );

        if (error.statusCode === 413) {
          return reply.status(413).send({
            error: 'AI provider response too large',
          });
        }

        return reply.status(503).send({
          error: 'AI service unavailable',
        });
      }
    }
  );

  // ---------------------------------------------------------
  // POST /api/v1/onboarding/templates
  // Save an edited checklist as a reusable template
  // ---------------------------------------------------------
  fastify.post(
    '/templates',
    {
      preHandler: [auth, rbac('ADMIN', 'SENIOR_TL')],
      schema: {
        tags: ['Onboarding'],
        description: 'Save an onboarding checklist as a reusable template',
      },
    },
    async (req, reply) => {
      const { title, role, departmentId, items } = req.body || {};

      if (
        typeof title !== 'string' ||
        !title.trim() ||
        typeof role !== 'string' ||
        !role.trim()
      ) {
        return reply.status(400).send({
          error: 'title and role are required',
        });
      }

      if (!validateItems(items)) {
        return reply.status(400).send({
          error: 'items must be a valid checklist item array',
        });
      }

      try {
        const template = await onboardingRepo.createTemplate({
          title: title.trim(),
          role: role.trim(),
          departmentId: departmentId || req.user.departmentId || null,
          createdBy: req.user.id,
          items: items.map(normalizeItem),
        });

        return reply.status(201).send(template);
      } catch (error) {
        req.log.error({ err: error }, 'Failed to create onboarding template');

        return reply.status(500).send({
          error: 'Failed to save onboarding template',
        });
      }
    }
  );

  // ---------------------------------------------------------
  // GET /api/v1/onboarding/templates/match
  // Find reusable template for role + department
  // ---------------------------------------------------------
  fastify.get(
    '/templates/match',
    {
      preHandler: [auth, rbac('ADMIN', 'SENIOR_TL', 'TL')],
      schema: {
        tags: ['Onboarding'],
        description: 'Find a reusable onboarding template',
      },
    },
    async (req, reply) => {
      const { role, departmentId } = req.query || {};

      if (typeof role !== 'string' || !role.trim()) {
        return reply.status(400).send({
          error: 'role is required',
        });
      }

      try {
        const template = await onboardingRepo.findTemplate(
          role.trim(),
          departmentId || req.user.departmentId || null
        );

        if (!template) {
          return reply.status(404).send({
            error: 'No onboarding template found',
          });
        }

        return template;
      } catch (error) {
        req.log.error({ err: error }, 'Failed to find onboarding template');

        return reply.status(500).send({
          error: 'Failed to retrieve onboarding template',
        });
      }
    }
  );

  // ---------------------------------------------------------
  // GET /api/v1/onboarding/templates/:templateId
  // ---------------------------------------------------------
  fastify.get(
    '/templates/:templateId',
    {
      preHandler: [auth, rbac('ADMIN', 'SENIOR_TL', 'TL')],
      schema: {
        tags: ['Onboarding'],
        description: 'Get an onboarding template by ID',
      },
    },
    async (req, reply) => {
      try {
        const template = await onboardingRepo.getTemplateById(
          req.params.templateId
        );

        if (!template) {
          return reply.status(404).send({
            error: 'Onboarding template not found',
          });
        }

        return template;
      } catch (error) {
        req.log.error({ err: error }, 'Failed to retrieve onboarding template');

        return reply.status(500).send({
          error: 'Failed to retrieve onboarding template',
        });
      }
    }
  );

  // ---------------------------------------------------------
  // POST /api/v1/onboarding/checklists
  // Attach edited checklist to an intern
  // ---------------------------------------------------------
  fastify.post(
    '/checklists',
    {
      preHandler: [auth, rbac('ADMIN', 'SENIOR_TL', 'TL')],
      schema: {
        tags: ['Onboarding'],
        description: 'Attach an onboarding checklist to an intern',
      },
    },
    async (req, reply) => {
      const { internId, templateId, title, role, departmentId, items } =
        req.body || {};

      if (
        !internId ||
        typeof title !== 'string' ||
        !title.trim() ||
        typeof role !== 'string' ||
        !role.trim()
      ) {
        return reply.status(400).send({
          error: 'internId, title and role are required',
        });
      }

      if (!validateItems(items)) {
        return reply.status(400).send({
          error: 'items must be a valid checklist item array',
        });
      }

      try {
        const checklist = await onboardingRepo.createChecklist({
          internId,
          templateId: templateId || null,
          title: title.trim(),
          role: role.trim(),
          departmentId: departmentId || req.user.departmentId || null,
          assignedBy: req.user.id,
          items: items.map(normalizeItem),
        });

        return reply.status(201).send(checklist);
      } catch (error) {
        req.log.error({ err: error }, 'Failed to attach onboarding checklist');

        return reply.status(500).send({
          error: 'Failed to attach onboarding checklist',
        });
      }
    }
  );

  // ---------------------------------------------------------
  // GET /api/v1/onboarding/checklists/:checklistId
  //
  // Visible to:
  // - assigned intern
  // - direct manager
  // - ADMIN / SENIOR_TL / TL
  // ---------------------------------------------------------
  fastify.get(
    '/checklists/:checklistId',
    {
      preHandler: [auth],
      schema: {
        tags: ['Onboarding'],
        description: 'Get an onboarding checklist',
      },
    },
    async (req, reply) => {
      try {
        const checklist = await onboardingRepo.getChecklistById(
          req.params.checklistId
        );

        if (!checklist) {
          return reply.status(404).send({
            error: 'Onboarding checklist not found',
          });
        }

        const privilegedRoles = ['ADMIN', 'SENIOR_TL', 'TL'];

        const isIntern = checklist.intern_id === req.user.id;

        const isDirectManager = checklist.manager_id === req.user.id;

        const isPrivileged = privilegedRoles.includes(req.user.role);

        if (!isIntern && !isDirectManager && !isPrivileged) {
          return reply.status(403).send({
            error: 'Forbidden',
          });
        }

        return checklist;
      } catch (error) {
        req.log.error(
          { err: error },
          'Failed to retrieve onboarding checklist'
        );

        return reply.status(500).send({
          error: 'Failed to retrieve onboarding checklist',
        });
      }
    }
  );

  // ---------------------------------------------------------
  // GET /api/v1/onboarding/interns/:internId/checklists
  // ---------------------------------------------------------
  fastify.get(
    '/interns/:internId/checklists',
    {
      preHandler: [auth],
      schema: {
        tags: ['Onboarding'],
        description: 'Get onboarding checklists for an intern',
      },
    },
    async (req, reply) => {
      const { internId } = req.params;

      const privilegedRoles = ['ADMIN', 'SENIOR_TL', 'TL'];

      if (
        req.user.id !== internId &&
        !privilegedRoles.includes(req.user.role)
      ) {
        return reply.status(403).send({
          error: 'Forbidden',
        });
      }

      try {
        return await onboardingRepo.getChecklistsForIntern(internId);
      } catch (error) {
        req.log.error(
          { err: error },
          'Failed to retrieve intern onboarding checklists'
        );

        return reply.status(500).send({
          error: 'Failed to retrieve onboarding checklists',
        });
      }
    }
  );

  // ---------------------------------------------------------
  // PATCH /api/v1/onboarding/checklists/:checklistId/items/:itemId
  // Mark checklist item complete/incomplete
  // ---------------------------------------------------------
  fastify.patch(
    '/checklists/:checklistId/items/:itemId',
    {
      preHandler: [auth],
      schema: {
        tags: ['Onboarding'],
        description: 'Update onboarding checklist item completion',
      },
    },
    async (req, reply) => {
      const { completed } = req.body || {};

      if (typeof completed !== 'boolean') {
        return reply.status(400).send({
          error: 'completed must be a boolean',
        });
      }

      try {
        const checklist = await onboardingRepo.getChecklistById(
          req.params.checklistId
        );

        if (!checklist) {
          return reply.status(404).send({
            error: 'Onboarding checklist not found',
          });
        }

        const privilegedRoles = ['ADMIN', 'SENIOR_TL', 'TL'];

        const isIntern = checklist.intern_id === req.user.id;

        const isDirectManager = checklist.manager_id === req.user.id;

        const isPrivileged = privilegedRoles.includes(req.user.role);

        if (!isIntern && !isDirectManager && !isPrivileged) {
          return reply.status(403).send({
            error: 'Forbidden',
          });
        }

        const item = await onboardingRepo.updateChecklistItemCompletion({
          itemId: req.params.itemId,
          checklistId: req.params.checklistId,
          completed,
        });

        if (!item) {
          return reply.status(404).send({
            error: 'Checklist item not found',
          });
        }

        return item;
      } catch (error) {
        req.log.error(
          { err: error },
          'Failed to update onboarding checklist item'
        );

        return reply.status(500).send({
          error: 'Failed to update checklist item',
        });
      }
    }
  );
}

module.exports = routes;
