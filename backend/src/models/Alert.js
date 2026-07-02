import mongoose from 'mongoose';
import { SEVERITIES } from '../config/constants.js';

const ALERT_STATUSES = ['open', 'acknowledged', 'resolved', 'false_positive'];

const alertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    severity: { type: String, enum: SEVERITIES, required: true },
    status: { type: String, enum: ALERT_STATUSES, default: 'open', index: true },
    ruleId: { type: String, required: true, index: true },
    evidence: {
      summary: String,
      eventIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SecurityEvent' }],
      metrics: mongoose.Schema.Types.Mixed,
    },
    relatedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SecurityEvent' }],
    username: { type: String, index: true },
    ip: { type: String, index: true },
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', index: true },
    mitre: {
      tactic: String,
      technique: String,
      techniqueId: String,
      description: String,
      recommendedResponse: String,
    },
    riskScore: { type: Number, min: 0, max: 100 },
    threatIntel: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

alertSchema.index({ ruleId: 1, username: 1, status: 1, createdAt: -1 });
alertSchema.index({ ruleId: 1, ip: 1, status: 1, createdAt: -1 });

alertSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    userId: this.userId,
    title: this.title,
    severity: this.severity,
    status: this.status,
    ruleId: this.ruleId,
    evidence: this.evidence,
    relatedEvents: this.relatedEvents,
    username: this.username,
    ip: this.ip,
    incidentId: this.incidentId,
    mitre: this.mitre,
    riskScore: this.riskScore,
    threatIntel: this.threatIntel,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export { ALERT_STATUSES };
export default mongoose.model('Alert', alertSchema);
