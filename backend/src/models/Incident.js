import mongoose from 'mongoose';
import {
  CASE_PRIORITIES,
  CASE_TASK_STATUSES,
  INCIDENT_STATUSES,
  INVESTIGATION_STATUSES,
  SEVERITIES,
} from '../config/constants.js';

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

const caseNoteSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: String,
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const caseTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    status: { type: String, enum: CASE_TASK_STATUSES, default: 'open' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedName: String,
    dueAt: Date,
    completedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const incidentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    caseNumber: { type: String, index: true },
    title: { type: String, required: true },
    priority: { type: String, enum: CASE_PRIORITIES, default: 'P2', index: true },
    tags: [{ type: String, trim: true }],
    notes: [caseNoteSchema],
    tasks: [caseTaskSchema],
    slaDueAt: Date,
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
      mitreTactic: String,
      mitreTechnique: String,
      techniqueId: String,
    },
    mitre: {
      primaryTactic: String,
      tactics: [String],
      techniques: [
        {
          technique: String,
          techniqueId: String,
          source: String,
        },
      ],
      tacticCount: Number,
    },
    correlationScore: { type: Number, min: 0, max: 100, default: 0 },
    correlation: {
      narrative: String,
      matchedChains: mongoose.Schema.Types.Mixed,
      groupingKeys: mongoose.Schema.Types.Mixed,
      stages: mongoose.Schema.Types.Mixed,
      alertCount: Number,
      eventCount: Number,
      ruleIds: [String],
      windowMinutes: Number,
    },
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
    threatIntel: mongoose.Schema.Types.Mixed,
    reportQuality: {
      evidenceCompleteness: Number,
      timelineQuality: Number,
      threatClassificationConfidence: Number,
      mitigationQuality: Number,
      reportClarity: Number,
      overallConfidence: Number,
      missingEvidence: [String],
      warnings: [String],
    },
    aiExplainability: {
      reasoningSummary: String,
      reasoningPoints: [String],
      relatedAlertIds: [String],
      relatedEventIds: [String],
      assumptions: [String],
      missingEvidence: [String],
      knowledgeSources: [String],
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
      generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
incidentSchema.index({ userId: 1, caseNumber: 1 }, { unique: true, sparse: true });

incidentSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    userId: this.userId,
    caseNumber: this.caseNumber,
    title: this.title,
    priority: this.priority,
    tags: this.tags,
    notes: this.notes,
    tasks: this.tasks,
    slaDueAt: this.slaDueAt,
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
    mitre: this.mitre,
    correlationScore: this.correlationScore,
    correlation: this.correlation,
    riskScore: this.riskScore,
    confidenceScore: this.confidenceScore,
    threatIntel: this.threatIntel,
    reportQuality: this.reportQuality,
    aiExplainability: this.aiExplainability,
    recommendations: this.recommendations,
    report: this.report,
    investigationStatus: this.investigationStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Incident', incidentSchema);
