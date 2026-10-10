const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Ensure test environment flags
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'super_secure_test_jwt_secret_key_for_college_evaluation_2026';
process.env.PORT = '0'; // Ephemeral port

const app = require('../server');
const User = require('../models/User');

describe('EduPortal — Automated Backend & Authentication Test Suite', () => {
  let server;
  let baseUrl;
  let testStudentCookie = '';

  // In-memory mock student database for reproducible test execution
  const inMemoryDb = new Map();

  before(async () => {
    // Override Mongoose methods for standalone test stability
    User.findOne = async function (filter) {
      if (filter && filter.email) {
        return inMemoryDb.get(filter.email.toLowerCase()) || null;
      }
      return null;
    };

    User.findById = function (id) {
      return {
        select: async function (fields) {
          for (const user of inMemoryDb.values()) {
            if (String(user._id) === String(id) || String(user.id) === String(id)) {
              return user;
            }
          }
          return null;
        }
      };
    };

    User.prototype.save = async function () {
      if (!this._id) {
        this._id = '65239a1b897f1234567890ab';
      }
      // Hash password if not already hashed
      if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
        this.password = await bcrypt.hash(this.password, 10);
      }
      this.createdAt = this.createdAt || new Date();
      this.status = this.status || 'Active';
      inMemoryDb.set(this.email.toLowerCase(), this);
      return this;
    };

    // Spin up an ephemeral HTTP test server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ==============================================================
  // 1. HEALTH CHECK TEST
  // ==============================================================
  it('GET /api/health should return 200 OK and status "ok"', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.service.includes('EduPortal'));
  });

  // ==============================================================
  // 2. REGISTRATION VALIDATION TESTS
  // ==============================================================
  it('POST /api/auth/register should fail when required fields are missing', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@college.edu' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('All fields are required'));
  });

  it('POST /api/auth/register should fail with invalid email format', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Johnson',
        email: 'invalid-email-format',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('valid email'));
  });

  it('POST /api/auth/register should fail when password is weak (< 8 chars)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Johnson',
        email: 'alex@college.edu',
        password: 'Pass1',
        confirmPassword: 'Pass1'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('at least 8 characters'));
  });

  it('POST /api/auth/register should fail when passwords do not match', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Johnson',
        email: 'alex@college.edu',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('Passwords do not match'));
  });

  it('POST /api/auth/register should successfully register a new student and NOT return password hash', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Johnson',
        email: 'Alex.Johnson@College.edu',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.name, 'Alex Johnson');
    // Normalized lowercase email check
    assert.strictEqual(data.user.email, 'alex.johnson@college.edu');
    // Verify password is NOT exposed
    assert.strictEqual(data.user.password, undefined);
  });

  it('POST /api/auth/register should reject duplicate email registrations', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Duplicate',
        email: 'alex.johnson@college.edu', // Same email
        password: 'AnotherPassword123!',
        confirmPassword: 'AnotherPassword123!'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 409);
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('already registered'));
  });

  // ==============================================================
  // 3. LOGIN & AUTHENTICATION TESTS
  // ==============================================================
  it('POST /api/auth/login should fail with incorrect password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.johnson@college.edu',
        password: 'WrongPassword999!'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, 'Invalid email or password.');
  });

  it('POST /api/auth/login should fail for non-existent student email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ghost@college.edu',
        password: 'Password123!'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, 'Invalid email or password.');
  });

  it('POST /api/auth/login should succeed with valid credentials and issue HttpOnly cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.johnson@college.edu',
        password: 'SecurePassword123!'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, 'alex.johnson@college.edu');
    assert.strictEqual(data.user.password, undefined);

    // Verify Set-Cookie header contains HttpOnly token
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Set-Cookie header must be present');
    assert.ok(setCookie.includes('token='), 'Cookie must contain token');
    assert.ok(setCookie.includes('HttpOnly'), 'Cookie must have HttpOnly attribute');

    // Extract cookie for subsequent protected route tests
    testStudentCookie = setCookie.split(';')[0];
  });

  // ==============================================================
  // 4. PROTECTED ROUTES & LOGOUT TESTS
  // ==============================================================
  it('GET /api/auth/me should reject access when unauthenticated (no cookie)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    const data = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('Access denied'));
  });

  it('GET /api/auth/me should succeed and return student profile with valid cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Cookie': testStudentCookie
      }
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.name, 'Alex Johnson');
    assert.strictEqual(data.user.email, 'alex.johnson@college.edu');
    assert.strictEqual(data.user.password, undefined);
  });

  it('POST /api/auth/logout should clear the authentication cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': testStudentCookie
      }
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Logout must send Set-Cookie header to clear cookie');
    // Cookie cleared with past expiration or empty token
    assert.ok(setCookie.includes('token=') && (setCookie.includes('Expires=') || setCookie.includes('Max-Age=0') || setCookie.includes('token=;')));
  });

  // ==============================================================
  // 5. CRYPTOGRAPHY INTEGRITY TEST
  // ==============================================================
  it('Bcrypt must generate strong salted hashes and never store plaintext', async () => {
    const rawPassword = 'CollegeProject2026!';
    const hash = await bcrypt.hash(rawPassword, 12);

    assert.notStrictEqual(rawPassword, hash);
    assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));

    // Verification
    const isMatch = await bcrypt.compare(rawPassword, hash);
    const isMismatch = await bcrypt.compare('WrongPassword', hash);

    assert.strictEqual(isMatch, true);
    assert.strictEqual(isMismatch, false);
  });
});
