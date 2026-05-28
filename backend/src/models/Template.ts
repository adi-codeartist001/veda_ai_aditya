import mongoose, { Schema, Document } from 'mongoose';

export interface TemplateDocument extends Document {
  name: string;
  input: any;
  createdAt: Date;
}

const TemplateSchema = new Schema<TemplateDocument>(
  { name: { type: String, required: true }, input: { type: Schema.Types.Mixed, required: true } },
  { timestamps: true }
);

export const TemplateModel = mongoose.model<TemplateDocument>('Template', TemplateSchema);
