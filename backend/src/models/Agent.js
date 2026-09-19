import mongoose from 'mongoose'

const agentTypes = [
  'Sales',
  'Customer Support',
  'Marketing',
  'Sales Agent',
  'Customer Support Agent',
  'Marketing Agent',
]

const agentStatuses = ['Active', 'Inactive']

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
      minlength: [2, 'Agent name must be at least 2 characters'],
      maxlength: [100, 'Agent name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: [true, 'Agent type is required'],
      enum: {
        values: agentTypes,
        message: '{VALUE} is not a valid agent type',
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Instructions cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: agentStatuses,
        message: '{VALUE} is not a valid agent status',
      },
      default: 'Active',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
agentSchema.index({ owner: 1, status: 1 })
agentSchema.index({ type: 1 })

export const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema)

export default Agent
