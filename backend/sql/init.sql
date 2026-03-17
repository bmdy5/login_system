-- ==========================================
-- Login System MySQL Init Script
-- DB: login_system
-- Charset: utf8mb4
-- ==========================================

CREATE DATABASE IF NOT EXISTS login_system
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE login_system;

-- 用户表：保存账号和登录统计
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  login_count INT UNSIGNED NOT NULL DEFAULT 0,
  failed_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  KEY idx_users_last_login_at (last_login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 登录审计表：记录每次登录尝试（成功/失败、时间、IP、消息）
CREATE TABLE IF NOT EXISTS login_audit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  username_snapshot VARCHAR(64) NOT NULL,
  status ENUM('SUCCESS', 'FAILED') NOT NULL,
  message VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_login_audit_user_id (user_id),
  KEY idx_login_audit_username (username_snapshot),
  KEY idx_login_audit_attempted_at (attempted_at),
  CONSTRAINT fk_login_audit_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 可选测试账号（密码明文: 123456）
-- 说明：当前为演示模式，密码以明文保存。
INSERT INTO users (username, password_hash)
VALUES ('demo_user', '123456')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash);
