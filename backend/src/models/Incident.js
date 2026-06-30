import mongoose from 'mongoose';
import { INCIDENT_STATUSES, INVESTIGATION_STATUSES, SEVERITIES } from '../config/constants.js';

const timelineEntrySchema = new mongoose.Schema(
  {
    timestamp: { type: Date, required: true },
    source: { type: String, enum: ['event', 'alert', 'agent', 'analyst'], required: true },
    title: { type: String, required: true },
    description: String,
    refId: mongoose.Schema.Types.ObjectId,
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    severity: { type: String, enum: SEVERITIES, default: 'high', index: true },
    status: { type: String, enum: INCIDENT_STATUSES, default: 'new', index: true },
    alerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
    relatedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SecurityEvent' }],
    username: { type: String, index: true },
    ip: { type: String, index: true },
    assignedAnalyst: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timeline: [timelineEntrySchema],
    aiSummary: String,
    threatClassification: {
      attackType: String,
      category: String,
      confidence: Number,
    },
    recommendations: [
      {
        actionType: String,
        description: String,
        priority: String,
      },
    ],
    report: {
      markdown: String,
      generatedAt: Date,
      version: Number,
    },
    investigationStatus: {
      type: String,
      enum: INVESTIGATION_STATUSES,
      default: 'not_started',
    },
  },
  { timestamps: true }
);

incidentSchema.index({ username: 1, createdAt: -1 });
incidentSchema.index({ ip: 1, createdAt: -1 });

incidentSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    title: this.title,
    severity: this.severity,
    status: this.status,
    alerts: this.alerts,
    relatedEvents: this.relatedEvents,
    username: this.username,
    ip: this.ip,
    assignedAnalyst: this.assignedAnalyst,
    timeline: this.timeline,
    aiSummary: this.aiSummary,
    threatClassification: this.threatClassification,
    recommendations: this.recommendations,
    report: this.report,
    investigationStatus: this.investigationStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Incident', incidentSchema);
