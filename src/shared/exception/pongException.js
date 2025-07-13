class PongException extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }

  static ENTITY_NOT_FOUND = new PongException("Entity not found", 400);
  static BAD_REQUEST = new PongException("Bad request", 400);
  static UNAUTHORIZE = new PongException("Unauthorize", 401);
  static FORBIDDEN = new PongException("Forbidden", 403);
  static NOT_FOUND = new PongException("Not found", 404);
}

export default PongException;
