const { pool } = require('../config/db');

async function findByUsername(username) {
  const [rows] = await pool.query(
    `SELECT id, username, password_hash, login_count, failed_count, last_login_at, created_at, updated_at
     FROM users
     WHERE username = ?
     LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

async function createUser({ username, passwordHash }) {
  const [result] = await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES (?, ?)`,
    [username, passwordHash]
  );
  return result.insertId;
}

async function incrementLoginSuccess(userId) {
  await pool.query(
    `UPDATE users
     SET login_count = login_count + 1,
         last_login_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId]
  );
}

async function incrementFailedCount(userId) {
  await pool.query(
    `UPDATE users
     SET failed_count = failed_count + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId]
  );
}

async function createAuditLog({ userId = null, usernameSnapshot, status, message, ipAddress = null }) {
  await pool.query(
    `INSERT INTO login_audit (user_id, username_snapshot, status, message, ip_address)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, usernameSnapshot, status, message, ipAddress]
  );
}

async function findPublicUserById(userId) {
  const [rows] = await pool.query(
    `SELECT id, username, login_count, failed_count, last_login_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  findByUsername,
  createUser,
  incrementLoginSuccess,
  incrementFailedCount,
  createAuditLog,
  findPublicUserById
};
