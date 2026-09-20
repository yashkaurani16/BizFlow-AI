/**
 * MongoDB ObjectId Validation Middleware
 * Validates route parameters to ensure they conform to the 24-character hexadecimal ObjectId format.
 * Prevents CastError crashes, malformed queries, and internal database exception disclosure.
 */
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

export const validateObjectId = (...paramNames) => {
  const paramsToCheck = paramNames.length > 0 ? paramNames : ['id']

  return (req, res, next) => {
    for (const paramName of paramsToCheck) {
      const val = req.params[paramName]
      if (val !== undefined && val !== null) {
        if (!OBJECT_ID_REGEX.test(val.toString())) {
          return res.status(400).json({
            success: false,
            message: `Invalid identifier format for parameter '${paramName}'. Must be a 24-character hexadecimal identifier.`,
          })
        }
      }
    }
    next()
  }
}

export default validateObjectId
