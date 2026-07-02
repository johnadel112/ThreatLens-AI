import mongoose from 'mongoose';
import { AUDIT_ACTIONS, ENTITY_TYPES } from '../config/constants.js';

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    entityType: { type: String, enum: ENTITY_TYPES, default: 'playbook_action' },
    entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userEmail: String,
    details: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

auditLogSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    action: this.action,
    entityType: this.entityType,
    entityId: this.entityId,
    incidentId: this.incidentId,
    userId: this.userId,
    userName: this.userName,
    userEmail: this.userEmail,
    details: this.details,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('AuditLog', auditLogSchema);
