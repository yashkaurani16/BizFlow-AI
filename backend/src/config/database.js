import mongoose from 'mongoose'

/**
 * Connect to MongoDB safely using MONGODB_URI.
 * Configured with a 5-second connection timeout to avoid blocking server
 * boot if local MongoDB daemon is not running.
 */
export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI environment variable is not defined.')
    return null
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
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
