import mongoose from 'mongoose'

const workflowStatuses = ['Active', 'Inactive']

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
      minlength: [2, 'Workflow name must be at least 2 characters'],
      maxlength: [120, 'Workflow name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    trigger: {
      type: String,
      required: [true, 'Workflow trigger is required'],
      trim: true,
      default: 'New Lead Created',
      maxlength: [100, 'Trigger cannot exceed 100 characters'],
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: false,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: workflowStatuses,
        message: '{VALUE} is not a valid workflow status',
      },
      default: 'Active',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    nodes: {
      type: [
        {
          id: { type: String, required: true },
          type: { type: String, required: true },
          label: { type: String, default: '' },
          category: {
            type: String,
            enum: ['trigger', 'ai', 'crm', 'communication'],
            required: true,
          },
          position: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
          },
          config: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
          },
        },
      ],
      default: [],
    },
    edges: {
      type: [
        {
          id: { type: String, required: true },
          source: { type: String, required: true },
          target: { type: String, required: true },
          label: { type: String, default: '' },
        },
      ],
      default: [],
    },
    isVisualWorkflow: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
workflowSchema.index({ owner: 1, status: 1 })

export const Workflow =
  mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema)

export default Workflow
