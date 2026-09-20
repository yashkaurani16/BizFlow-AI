import mongoose from 'mongoose'

const activityStatuses = ['New', 'Pending', 'Succeeded', 'Failed', 'Completed']

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Activity type is required'],
      trim: true,
      maxlength: [100, 'Activity type cannot exceed 100 characters'],
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
      minlength: [2, 'Activity title must be at least 2 characters'],
      maxlength: [200, 'Activity title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: false,
      index: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: false,
    },
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: false,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: activityStatuses,
        message: '{VALUE} is not a valid activity status',
      },
      default: 'New',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    channel: {
      type: String,
      trim: true,
      default: 'system',
    },
    recipient: {
      type: String,
      trim: true,
      default: '',
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    humanApproved: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

// Indexes
activitySchema.index({ owner: 1, createdAt: -1 })
activitySchema.index({ createdAt: -1 })

export const Activity =
  mongoose.models.Activity || mongoose.model('Activity', activitySchema)

export default Activity
