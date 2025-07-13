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
}
