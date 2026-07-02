import mongoose from 'mongoose';
import { PLAYBOOK_ACTION_TYPES, PLAYBOOK_PRIORITIES } from '../config/constants.js';

const playbookStepSchema = new mongoose.Schema(
  {
    actionType: { type: String, enum: PLAYBOOK_ACTION_TYPES, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: PLAYBOOK_PRIORITIES, default: 'medium' },
    requiresApproval: { type: Boolean, default: true },
  },
  { _id: false }
);

const playbookTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    category: { type: String, default: 'response' },
    triggerRules: [String],
    steps: { type: [playbookStepSchema], default: [] },
    enabled: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

playbookTemplateSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    category: this.category,
    triggerRules: this.triggerRules,
    steps: this.steps,
    enabled: this.enabled,
    isSystem: this.isSystem,
    stepCount: this.steps?.length || 0,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('PlaybookTemplate', playbookTemplateSchema);
