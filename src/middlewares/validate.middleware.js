/**
 * Middleware validator wrapper for Zod schemas.
 * Validates request body, query params, and route parameters.
 * Automatically forwards Zod errors to the global error handler.
 */
export default function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
