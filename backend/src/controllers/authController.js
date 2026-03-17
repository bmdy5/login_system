const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || null;
}

async function register(req, res, next) {
  try {
    const user = await authService.register({
      username: req.body?.username,
      password: req.body?.password,
      ipAddress: getClientIp(req)
    });

    return sendSuccess(
      res,
      {
        id: user.id,
        username: user.username,
        loginCount: user.login_count,
        failedCount: user.failed_count,
        lastLoginAt: user.last_login_at
      },
      '注册成功',
      201
    );
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const user = await authService.login({
      username: req.body?.username,
      password: req.body?.password,
      ipAddress: getClientIp(req)
    });

    return sendSuccess(res, {
      id: user.id,
      username: user.username,
      loginCount: user.login_count,
      failedCount: user.failed_count,
      lastLoginAt: user.last_login_at
    }, '登录成功');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login
};
