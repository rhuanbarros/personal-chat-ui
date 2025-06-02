import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  role?: 'system' | 'user' | 'assistant';
}

const MessageSchema: Schema = new Schema({
  sender: {
    type: String,
    required: true,
    enum: ['user', 'ai']
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  role: {
    type: String,
    enum: ['system', 'user', 'assistant'],
    required: false
  }
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema); 