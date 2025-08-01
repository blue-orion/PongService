export class ApiResponse {
  static ok(res, data, status = 200) {
    res.code(status).send({
      success: true,
      data,
      error: null,
    });
  }

  static error(res, error, code) {
    const status = code || error.statusCode || 500;
    res.code(status).send({
      success: false,
      data: null,
      error: error?.message ?? error,
    });
  }

  static notFound(res, message = "Resource not found") {
    res.code(404).send({
      success: false,
      data: null,
      error: message,
    });
  }

  static unauthorized(res, message = "Unauthorized") {
    res.code(401).send({
      success: false,
      data: null,
      error: message,
    });
  }

  static badRequest(res, message = "Bad Request") {
    res.code(400).send({
      success: false,
      data: null,
      error: message,
    });
  }

  static forbidden(res, message = "Forbidden") {
    res.code(403).send({
      success: false,
      data: null,
      error: message,
    });
  }

  static internalServerError(res, message = "Internal Server Error") {
    res.code(500).send({
      success: false,
      data: null,
      error: message,
    });
  }
}
