import mongoose, { Schema, Document } from 'mongoose';

export interface AssignmentDocument extends Document {
  input: any;
  status: string;
  jobId?: string;
  result?: any;
  variants?: any[];
  shareToken?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<AssignmentDocument>(
  {
    input: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    jobId: String,
    result: Schema.Types.Mixed,
    variants: [Schema.Types.Mixed],
    shareToken: String,
    error: String,
  },
  { timestamps: true }
);

AssignmentSchema.index({ shareToken: 1 });
AssignmentSchema.index({ createdAt: -1 });

export const AssignmentModel = mongoose.model<AssignmentDocument>('Assignment', AssignmentSchema);
