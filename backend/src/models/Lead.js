import mongoose from 'mongoose'

const leadStatuses = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost']

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      minlength: [2, 'Lead name must be at least 2 characters'],
      maxlength: [120, 'Lead name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Lead email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
      maxlength: [120, 'Company name cannot exceed 120 characters'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: leadStatuses,
        message: '{VALUE} is not a valid lead status',
      },
      default: 'New',
    },
    source: {
      type: String,
      trim: true,
      default: 'Website',
      maxlength: [100, 'Source cannot exceed 100 characters'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    aiAnalysis: {
      type: String,
      trim: true,
      default: '',
    },
    suggestedNextStep: {
      type: String,
      trim: true,
      default: '',
    },
    aiMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        isRealAI: false,
        provider: 'fallback',
        model: 'bounded-fallback-v1',
        leadQuality: 'Medium',
        humanReviewRequired: true,
      }),
    },
    aiIntelligence: {
      type: new mongoose.Schema(
        {
          score: { type: Number, min: 0, max: 100, default: 50 },
          priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
          summary: { type: String, default: '' },
          keySignals: { type: [String], default: [] },
          risks: { type: [String], default: [] },
          recommendedNextAction: { type: String, default: '' },
          followUpSuggestion: { type: String, default: '' },
          analyzedAt: { type: Date, default: Date.now },
          isRealAI: { type: Boolean, default: false },
          provider: { type: String, default: 'fallback' },
          model: { type: String, default: 'bounded-fallback-v1' },
          humanReviewRequired: { type: Boolean, default: true },
        },
        { _id: false },
      ),
      default: null,
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

// Indexes for common queries
leadSchema.index({ owner: 1, status: 1 })
leadSchema.index({ status: 1 })
leadSchema.index({ createdAt: -1 })

export const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema)

export default Lead
