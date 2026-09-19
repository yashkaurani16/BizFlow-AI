import dotenv from 'dotenv'
import app from './app.js'
import { connectDatabase } from './config/database.js'

// Load environment variables
dotenv.config()

const PORT = process.env.PORT || 5000

// Initialize MongoDB connection safely
connectDatabase()

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`[BizFlow AI Backend] Server running on port ${PORT}`)
  console.log(`[BizFlow AI Backend] Health check: http://localhost:${PORT}/api/health`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`)
})

export default server
