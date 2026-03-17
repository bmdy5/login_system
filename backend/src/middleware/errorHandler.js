const AppError = require('../utils/AppError');
const { sendError } = require('../utils/response');

function notFoundHandler(req, res) {
  return sendError(res, '接口不存在', 404);
}

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  console.error('Unhandled error:', err);
  return sendError(res, '服务器内部错误', 500);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
