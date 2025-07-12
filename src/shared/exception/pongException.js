class PongException extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }

  static ENTITY_NOT_FOUNT = new PongException("Entity not found", 400);
  static UNAUTHORIZE = new PongException("Unauthorize", 401);
  static FORBIDDEN = new PongException("Forbidden", 403);
  static NOT_FOUND = new PongException("Not found", 404);
  static CONFILICT = new PongException("Conflict", 409);
}

export default PongException;
