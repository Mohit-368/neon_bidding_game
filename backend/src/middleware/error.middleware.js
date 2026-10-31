function notFoundHandler(request, response) {
  response.status(404).json({ error: 'Route not found.' });
}

function errorHandler(error, _request, response, _next) {
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  response.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error.' : error.message,
    code: error.code || 'INTERNAL_ERROR'
  });
}

module.exports = { notFoundHandler, errorHandler };
