const app = require('../../src/app');
const { generateAccessToken } = require('../../src/utils/tokens');
const pool = require('../../src/config/db');

describe('Assessments Integration Tests', () => {
  let internId;
  let captainId;
  let internToken;
  let captainToken;
  let otherInternToken;
  let otherInternId;

  beforeAll(async () => {
    await app.ready();

    // Find our seeded users from seed-intern.js
    const internRes = await pool.query("SELECT id FROM users WHERE email = 'intern@internops.com'");
    if (internRes.rowCount === 0) {
      throw new Error('Please run node seeds/seed-intern.js first');
    }
    internId = internRes.rows[0].id;

    const captainRes = await pool.query("SELECT id FROM users WHERE email = 'captain@internops.com'");
    captainId = captainRes.rows[0].id;

    // Create a third user (another intern) to test access control
    const otherHash = 'mockedhash';
    const otherRes = await pool.query(
      "INSERT INTO users (email, password_hash, role, full_name) VALUES ('otherintern@internops.com', $1, 'INTERN', 'Other Intern') RETURNING id",
      [otherHash]
    );
    otherInternId = otherRes.rows[0].id;

    // Generate tokens
    internToken = generateAccessToken({ id: internId, role: 'INTERN' });
    captainToken = generateAccessToken({ id: captainId, role: 'CAPTAIN' });
    otherInternToken = generateAccessToken({ id: otherInternId, role: 'INTERN' });
  });

  afterAll(async () => {
    // Cleanup other intern user
    await pool.query("DELETE FROM assessments WHERE user_id = $1", [otherInternId]);
    await pool.query("DELETE FROM users WHERE id = $1", [otherInternId]);
    await app.close();
  });

  describe('GET /api/v1/assessments/my-assessment', () => {
    it('should require authentication', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/assessments/my-assessment',
      });
      expect(res.statusCode).toBe(401);
    });

    it('should return 404 if user has no assessment', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/assessments/my-assessment',
        headers: { Authorization: `Bearer ${otherInternToken}` },
      });
      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body)).toEqual({ error: 'No assessment found' });
    });

    it("should return the user's latest assessment", async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/assessments/my-assessment',
        headers: { Authorization: `Bearer ${internToken}` },
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.user_id).toBe(internId);
      expect(data.score).toBe(85);
      expect(data.category).toBe('Excellent');
    });
  });

  describe('GET /api/v1/assessments/user/:userId', () => {
    it("should allow a manager to check the intern's assessment", async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/assessments/user/${internId}`,
        headers: { Authorization: `Bearer ${captainToken}` },
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.user_id).toBe(internId);
    });

    it("should allow the intern to check their own assessment", async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/assessments/user/${internId}`,
        headers: { Authorization: `Bearer ${internToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("should forbid another intern from checking the assessment", async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/assessments/user/${internId}`,
        headers: { Authorization: `Bearer ${otherInternToken}` },
      });
      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body)).toEqual({ error: 'Forbidden' });
    });
  });
});
