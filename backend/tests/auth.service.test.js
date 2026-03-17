import { createRequire } from 'node:module';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const require = createRequire(import.meta.url);
const repo = require('../src/repositories/userRepository');
const authService = require('../src/services/authService');

beforeEach(() => {
  repo.findByUsername = vi.fn();
  repo.createUser = vi.fn();
  repo.incrementLoginSuccess = vi.fn();
  repo.incrementFailedCount = vi.fn();
  repo.createAuditLog = vi.fn();
  repo.findPublicUserById = vi.fn();
});

describe('authService', () => {
  test('register should create user with submitted password', async () => {
    repo.findByUsername.mockResolvedValue(null);
    repo.createUser.mockResolvedValue(1);
    repo.createAuditLog.mockResolvedValue(undefined);
    repo.findPublicUserById.mockResolvedValue({
      id: 1,
      username: 'alice',
      login_count: 0,
      failed_count: 0,
      last_login_at: null
    });

    const result = await authService.register({ username: 'alice', password: 'abc123' });

    expect(result.id).toBe(1);
    expect(repo.createUser).toHaveBeenCalledWith({
      username: 'alice',
      passwordHash: 'abc123'
    });
  });

  test('register should reject duplicated username and write failed audit', async () => {
    repo.findByUsername.mockResolvedValue({ id: 7, username: 'alice' });
    repo.createAuditLog.mockResolvedValue(undefined);

    await expect(
      authService.register({ username: 'alice', password: '123456', ipAddress: '127.0.0.1' })
    ).rejects.toThrow('用户名已存在');

    expect(repo.createAuditLog).toHaveBeenCalledWith({
      userId: 7,
      usernameSnapshot: 'alice',
      status: 'FAILED',
      message: '用户名已存在',
      ipAddress: '127.0.0.1'
    });
  });

  test('register should validate password', async () => {
    await expect(
      authService.register({ username: 'alice', password: '' })
    ).rejects.toThrow('密码不能为空');
  });

  test('login should throw on wrong password and increment failed count', async () => {
    repo.findByUsername.mockResolvedValue({
      id: 2,
      username: 'bob',
      password_hash: '123456'
    });
    repo.incrementFailedCount.mockResolvedValue(undefined);
    repo.createAuditLog.mockResolvedValue(undefined);

    await expect(
      authService.login({ username: 'bob', password: 'wrong123' })
    ).rejects.toThrow('用户名或密码错误');

    expect(repo.incrementFailedCount).toHaveBeenCalledWith(2);
  });
});
