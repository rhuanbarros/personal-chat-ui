import mongoose, { Document, Schema } from 'mongoose';

export interface IPromptVersion {
  _id?: string;
  text: string;
  dateCreated: Date;
}

export interface ISavedPrompt extends Document {
  _id: string;
  name: string;
  versions: IPromptVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const PromptVersionSchema: Schema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  dateCreated: {
    type: Date,
    default: Date.now,
    required: true
  }
});

const SavedPromptSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  versions: [PromptVersionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

// Update the updatedAt field before saving
SavedPromptSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to get the latest version
SavedPromptSchema.methods.getLatestVersion = function(): IPromptVersion | null {
  if (this.versions.length === 0) return null;
  return this.versions.sort((a: IPromptVersion, b: IPromptVersion) => 
    new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
  )[0];
};

export default mongoose.models.SavedPrompt || mongoose.model<ISavedPrompt>('SavedPrompt', SavedPromptSchema); 