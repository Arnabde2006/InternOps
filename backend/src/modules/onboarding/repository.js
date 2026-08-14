const pool = require('../../config/db');

async function getTemplate(role, department) {
  const result = await pool.query(
    `SELECT
       ot.*,
       COALESCE(
         json_agg(
           json_build_object(
             'id', oti.id,
             'title', oti.title,
             'description', oti.description,
             'due_day_offset', oti.due_day_offset,
             'social_task_id', oti.social_task_id,
             'position', oti.position
           )
           ORDER BY oti.position, oti.id
         ) FILTER (WHERE oti.id IS NOT NULL),
         '[]'::json
       ) AS items
     FROM onboarding_templates ot
     LEFT JOIN onboarding_template_items oti
       ON oti.template_id = ot.id
     WHERE ot.role = $1
       AND (ot.department = $2 OR ot.department IS NULL)
     GROUP BY ot.id
     ORDER BY
       CASE WHEN ot.department = $2 THEN 0 ELSE 1 END,
       ot.updated_at DESC
     LIMIT 1`,
    [role, department || null]
  );

  return result.rows[0] || null;
}

async function createTemplate(
  { role, department, title, createdBy },
  items = []
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const templateResult = await client.query(
      `INSERT INTO onboarding_templates
        (role, department, title, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [role, department || null, title, createdBy]
    );

    const template = templateResult.rows[0];

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];

      await client.query(
        `INSERT INTO onboarding_template_items
          (
            template_id,
            title,
            description,
            due_day_offset,
            social_task_id,
            position
          )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          template.id,
          item.title,
          item.description || null,
          item.due_day_offset ?? null,
          item.social_task_id || null,
          item.position ?? i,
        ]
      );
    }

    await client.query('COMMIT');

    return getTemplate(role, department);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createChecklist(
  { internId, title, role, department, createdBy },
  items = []
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const checklistResult = await client.query(
      `INSERT INTO onboarding_checklists
        (intern_id, title, role, department, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        internId,
        title,
        role,
        department || null,
        createdBy,
      ]
    );

    const checklist = checklistResult.rows[0];

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];

      await client.query(
        `INSERT INTO onboarding_checklist_items
          (
            checklist_id,
            title,
            description,
            due_day_offset,
            social_task_id,
            position
          )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          checklist.id,
          item.title,
          item.description || null,
          item.due_day_offset ?? null,
          item.social_task_id || null,
          item.position ?? i,
        ]
      );
    }

    await client.query('COMMIT');

    return getChecklistById(checklist.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getChecklistById(checklistId) {
  const result = await pool.query(
    `SELECT
       oc.*,
       COALESCE(
         json_agg(
           json_build_object(
             'id', oci.id,
             'title', oci.title,
             'description', oci.description,
             'due_day_offset', oci.due_day_offset,
             'social_task_id', oci.social_task_id,
             'position', oci.position,
             'completed', oci.completed
           )
           ORDER BY oci.position, oci.id
         ) FILTER (WHERE oci.id IS NOT NULL),
         '[]'::json
       ) AS items
     FROM onboarding_checklists oc
     LEFT JOIN onboarding_checklist_items oci
       ON oci.checklist_id = oc.id
     WHERE oc.id = $1
     GROUP BY oc.id`,
    [checklistId]
  );

  return result.rows[0] || null;
}

async function getChecklistForIntern(internId) {
  const result = await pool.query(
    `SELECT
       oc.*,
       COALESCE(
         json_agg(
           json_build_object(
             'id', oci.id,
             'title', oci.title,
             'description', oci.description,
             'due_day_offset', oci.due_day_offset,
             'social_task_id', oci.social_task_id,
             'position', oci.position,
             'completed', oci.completed
           )
           ORDER BY oci.position, oci.id
         ) FILTER (WHERE oci.id IS NOT NULL),
         '[]'::json
       ) AS items
     FROM onboarding_checklists oc
     LEFT JOIN onboarding_checklist_items oci
       ON oci.checklist_id = oc.id
     WHERE oc.intern_id = $1
     GROUP BY oc.id
     ORDER BY oc.created_at DESC
     LIMIT 1`,
    [internId]
  );

  return result.rows[0] || null;
}

async function updateChecklist(
  checklistId,
  { title, role, department },
  items = []
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const checklistResult = await client.query(
      `UPDATE onboarding_checklists
       SET
         title = COALESCE($1, title),
         role = COALESCE($2, role),
         department = COALESCE($3, department),
         updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        title || null,
        role || null,
        department || null,
        checklistId,
      ]
    );

    if (checklistResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `DELETE FROM onboarding_checklist_items
       WHERE checklist_id = $1`,
      [checklistId]
    );

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];

      await client.query(
        `INSERT INTO onboarding_checklist_items
          (
            checklist_id,
            title,
            description,
            due_day_offset,
            social_task_id,
            position
          )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          checklistId,
          item.title,
          item.description || null,
          item.due_day_offset ?? null,
          item.social_task_id || null,
          item.position ?? i,
        ]
      );
    }

    await client.query('COMMIT');

    return getChecklistById(checklistId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateChecklistItem(itemId, completed) {
  const result = await pool.query(
    `UPDATE onboarding_checklist_items
     SET completed = $1
     WHERE id = $2
     RETURNING *`,
    [completed, itemId]
  );

  return result.rows[0] || null;
}

module.exports = {
  getTemplate,
  createTemplate,
  createChecklist,
  getChecklistById,
  getChecklistForIntern,
  updateChecklist,
  updateChecklistItem,
};