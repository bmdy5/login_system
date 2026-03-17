function sendSuccess(res, data, message = '操作成功', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

function sendError(res, message = '请求失败', status = 400, details = null) {
  return res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {})
  });
}

module.exports = {
  sendSuccess,
  sendError
};
