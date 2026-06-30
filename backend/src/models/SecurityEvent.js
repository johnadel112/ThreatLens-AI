import mongoose from 'mongoose';
import { EVENT_TYPES } from '../config/eventTypes.js';
import { SEVERITIES } from '../config/constants.js';

const securityEventSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true, index: true },
    eventType: { type: String, required: true, enum: EVENT_TYPES, index: true },
    username: { type: String, trim: true, index: true },
    ip: { type: String, trim: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    severity: { type: String, enum: SEVERITIES, default: 'low', index: true },
    timestamp: { type: Date, required: true, index: true },
    ingestedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

securityEventSchema.index({ username: 1, timestamp: -1 });
securityEventSchema.index({ ip: 1, timestamp: -1 });
securityEventSchema.index({ eventType: 1, timestamp: -1 });

securityEventSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    source: this.source,
    eventType: this.eventType,
    username: this.username,
    ip: this.ip,
    metadata: this.metadata,
    severity: this.severity,
    timestamp: this.timestamp,
    ingestedAt: this.ingestedAt,
  };
};

export default mongoose.model('SecurityEvent', securityEventSchema);
