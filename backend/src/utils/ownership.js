/**
 * Authorization and ownership utility helpers.
 * Ensures authenticated users only access or mutate their own resources.
 */

/**
 * Check if a resource belongs to the specified user.
 * @param {Object} resource - Mongoose document or plain object with owner field
 * @param {string|Object} userId - Authenticated user's ID
 * @returns {boolean} True if user is owner, false otherwise
 */
export const isOwner = (resource, userId) => {
  if (!resource || !userId) {
    return false
  }

  const resourceOwner = resource.owner
    ? typeof resource.owner === 'object' && resource.owner._id
      ? resource.owner._id.toString()
      : resource.owner.toString()
    : null

  const targetUserId = typeof userId === 'object' && userId !== null
    ? (userId._id || userId.id || '').toString()
    : userId.toString()

  return Boolean(resourceOwner && resourceOwner === targetUserId)
}

/**
 * Build a query filter that scopes database queries to the authenticated user.
 * @param {string|Object} userId - Authenticated user's ID
 * @param {Object} [baseQuery={}] - Additional query criteria
 * @returns {Object} Scoped query object
 */
export const scopeToUser = (userId, baseQuery = {}) => {
  const targetUserId = typeof userId === 'object' && userId !== null
    ? userId._id || userId.id
    : userId

  return {
    ...baseQuery,
    owner: targetUserId,
  }
}

export default {
  isOwner,
  scopeToUser,
}
