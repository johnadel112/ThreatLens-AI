import mongoose from 'mongoose';
import { SEVERITIES } from '../config/constants.js';

const detectionRuleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    ruleId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: String,
    eventTypes: [String],
    severity: { type: String, enum: SEVERITIES, default: 'medium' },
    windowMinutes: { type: Number, default: 5 },
    threshold: { type: Number, default: 1 },
    enabled: { type: Boolean, default: true, index: true },
    mitreTactic: String,
    mitreTechniqueId: String,
    version: { type: Number, default: 1 },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

detectionRuleSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    ruleId: this.ruleId,
    name: this.name,
    description: this.description,
    eventTypes: this.eventTypes,
    severity: this.severity,
    windowMinutes: this.windowMinutes,
    threshold: this.threshold,
    enabled: this.enabled,
    mitreTactic: this.mitreTactic,
    mitreTechniqueId: this.mitreTechniqueId,
    version: this.version,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('DetectionRule', detectionRuleSchema);
