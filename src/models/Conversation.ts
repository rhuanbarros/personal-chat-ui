import mongoose, { Document, Schema } from 'mongoose';
import { IMessage } from './Message';

export interface IConversation extends Document {
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
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

const ConversationSchema: Schema = new Schema({
  title: {
    type: String,
    default: 'Untitled Conversation',
    required: true
  },
  messages: [MessageSchema],
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
ConversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema); 