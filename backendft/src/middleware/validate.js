import { badRequest } from "../utils/AppError.js";

/**
 * Validates and parses req.body / req.query / req.params with zod schemas.
 * Parsed (coerced, trimmed) values replace the originals.
 */
export function validate(schemas) {
  return (req, res, next) => {
    for (const part of ["params", "query", "body"]) {
      if (!schemas[part]) continue;

      const result = schemas[part].safeParse(req[part] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join(".") || part,
          message: issue.message,
        }));
        throw badRequest("Validation failed", details);
      }

      // req.query is a getter in Express 5, so it has to be redefined instead of assigned
      Object.defineProperty(req, part, { value: result.data, writable: true, configurable: true });
    }
    next();
  };
}
