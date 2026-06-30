import mongoose from 'mongoose';
import {
  PLAYBOOK_ACTION_TYPES,
  PLAYBOOK_PRIORITIES,
  PLAYBOOK_STATUSES,
} from '../config/constants.js';

const playbookActionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true, index: true },
    actionType: { type: String, enum: PLAYBOOK_ACTION_TYPES, required: true },
    description: { type: String, required: true },
    justification: String,
    priority: { type: String, enum: PLAYBOOK_PRIORITIES, default: 'medium' },
    status: { type: String, enum: PLAYBOOK_STATUSES, default: 'pending', index: true },
    source: { type: String, enum: ['ai_mitigation', 'manual'], default: 'ai_mitigation' },
    target: {
      username: String,
      ip: String,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String,
    executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    executedAt: Date,
    executionResult: {
      success: Boolean,
      message: String,
      simulatedAt: Date,
      details: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

playbookActionSchema.index({ incidentId: 1, actionType: 1, status: 1 });

playbookActionSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    incidentId: this.incidentId,
    actionType: this.actionType,
    description: this.description,
    justification: this.justification,
    priority: this.priority,
    status: this.status,
    source: this.source,
    target: this.target,
    approvedBy: this.approvedBy,
    approvedAt: this.approvedAt,
    rejectedBy: this.rejectedBy,
    rejectedAt: this.rejectedAt,
    rejectionReason: this.rejectionReason,
    executedBy: this.executedBy,
    executedAt: this.executedAt,
    executionResult: this.executionResult,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('PlaybookAction', playbookActionSchema);
