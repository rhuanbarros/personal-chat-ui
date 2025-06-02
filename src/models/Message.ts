import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
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
  }
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema); 