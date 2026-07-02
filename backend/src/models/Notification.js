import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../config/constants.js';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    link: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

notificationSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    message: this.message,
    read: this.read,
    link: this.link,
    metadata: this.metadata,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('Notification', notificationSchema);
