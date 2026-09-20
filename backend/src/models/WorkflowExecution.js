import mongoose from 'mongoose'

const executionStatuses = [
  'Pending',
  'Running',
  'Succeeded',
  'Failed',
  'Waiting for Human Review',
]

const workflowExecutionSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: false,
      index: true,
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
    status: {
      type: String,
      required: true,
      enum: {
        values: executionStatuses,
        message: '{VALUE} is not a valid execution status',
      },
      default: 'Pending',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    error: {
      type: String,
      trim: true,
      default: null,
    },
    stepResults: {
      type: [
        {
          stepNumber: Number,
          nodeType: String,
          name: String,
          status: String,
          detail: String,
          output: mongoose.Schema.Types.Mixed,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

// Indexes
workflowExecutionSchema.index({ workflow: 1, status: 1 })
workflowExecutionSchema.index({ createdAt: -1 })

export const WorkflowExecution =
  mongoose.models.WorkflowExecution ||
  mongoose.model('WorkflowExecution', workflowExecutionSchema)

export default WorkflowExecution
