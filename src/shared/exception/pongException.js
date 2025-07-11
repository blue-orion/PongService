class PongException extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }

  static ENTITY_NOT_FOUNT = new PongException("Entity not found", 400);
}

export default PongException;
