import mongoose from 'mongoose'

const taskStatuses = ['Pending', 'Completed', 'Cancelled']

const followUpTaskSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: false,
      index: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: false,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Task title must be at least 2 characters'],
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: taskStatuses,
        message: '{VALUE} is not a valid task status',
      },
      default: 'Pending',
    },
    dueDate: {
      type: Date,
      required: false,
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
followUpTaskSchema.index({ owner: 1, status: 1 })
followUpTaskSchema.index({ dueDate: 1 })

export const FollowUpTask =
  mongoose.models.FollowUpTask ||
  mongoose.model('FollowUpTask', followUpTaskSchema)

export default FollowUpTask
