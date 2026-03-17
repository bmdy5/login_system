const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');

function validateUsername(username) {
  if (typeof username !== 'string') {
    throw new AppError(400, '用户名格式错误');
  }

  if (!username.trim()) {
    throw new AppError(400, '用户名不能为空');
  }
}

function validatePassword(password) {
  if (!password) {
    throw new AppError(400, '密码不能为空');
  }

  if (typeof password !== 'string') {
    throw new AppError(400, '密码格式错误');
  }

  if (password.length < 6) {
    throw new AppError(400, '密码长度不能小于6位');
  }
}

async function register({ username, password, ipAddress = null }) {
  validateUsername(username);
  validatePassword(password);

  const normalizedUsername = username.trim();
  const existingUser = await userRepository.findByUsername(normalizedUsername);
  if (existingUser) {
    await userRepository.createAuditLog({
      userId: existingUser.id,
      usernameSnapshot: normalizedUsername,
      status: 'FAILED',
      message: '用户名已存在',
      ipAddress
    });
    throw new AppError(409, '用户名已存在');
  }

  const userId = await userRepository.createUser({
    username: normalizedUsername,
    passwordHash: password
  });

  await userRepository.createAuditLog({
    userId,
    usernameSnapshot: normalizedUsername,
    status: 'SUCCESS',
    message: '注册成功',
    ipAddress
  });

  return userRepository.findPublicUserById(userId);
}

async function login({ username, password, ipAddress = null }) {
  validateUsername(username);
  validatePassword(password);

  const normalizedUsername = username.trim();
  const user = await userRepository.findByUsername(normalizedUsername);

  if (!user) {
    await userRepository.createAuditLog({
      userId: null,
      usernameSnapshot: normalizedUsername,
      status: 'FAILED',
      message: '用户不存在',
      ipAddress
    });
    throw new AppError(401, '用户名或密码错误');
  }

  const passwordMatched = password === user.password_hash;
  if (!passwordMatched) {
    await userRepository.incrementFailedCount(user.id);
    await userRepository.createAuditLog({
      userId: user.id,
      usernameSnapshot: normalizedUsername,
      status: 'FAILED',
      message: '密码错误',
      ipAddress
    });
    throw new AppError(401, '用户名或密码错误');
  }

  await userRepository.incrementLoginSuccess(user.id);
  await userRepository.createAuditLog({
    userId: user.id,
    usernameSnapshot: normalizedUsername,
    status: 'SUCCESS',
    message: '登录成功',
    ipAddress
  });

  return userRepository.findPublicUserById(user.id);
}

module.exports = {
  register,
  login
};
