import mongoose from 'mongoose'

/**
 * Connect to MongoDB safely using MONGODB_URI.
 * Configured with a 5-second connection timeout to avoid blocking server
 * boot if local MongoDB daemon is not running.
 */
export const connectDatabase = async () => {
  let uri = (process.env.MONGODB_URI || '').trim()

  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI environment variable is not defined.')
    return null
  }

  // Strip accidental enclosing single or double quotes from dashboard copy-paste
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim()
  }

  // Diagnostic warning if unreplaced template placeholders are detected
  if (/<[^>]+>/.test(uri)) {
    console.warn('[MongoDB] Warning: MONGODB_URI contains placeholder angle brackets (< or >). Ensure <username> and <password> are replaced without brackets.')
  }

  try {
    // For MongoDB Atlas, users are stored in the admin database.
    // If authSource is not explicitly in the URI and credentials are present,
    // route SCRAM authentication to 'admin' while preserving the target database.
    const hasCredentials = uri.includes('@')
    const hasExplicitAuthSource = uri.includes('authSource=')
    const authSourceOption = (!hasExplicitAuthSource && hasCredentials) ? 'admin' : undefined

    // Ensure connection always targets 'bizflow_ai' database even if omitted in the URI path
    const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/)
    const dbInPath = match && match[1] && match[1].length > 0 ? match[1] : null
    const dbNameOption = (!dbInPath && hasCredentials) ? 'bizflow_ai' : undefined

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      ...(authSourceOption ? { authSource: authSourceOption } : {}),
      ...(dbNameOption ? { dbName: dbNameOption } : {}),
    })

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`)
    return conn
  } catch (error) {
    // Sanitize message to ensure no connection credentials leak
    const safeMessage = (error.message || '').replace(/\/\/[^@]+@/, '//***:***@')
    console.error(`[MongoDB] Connection error: ${safeMessage}`)
    return null
  }
}

export default connectDatabase
