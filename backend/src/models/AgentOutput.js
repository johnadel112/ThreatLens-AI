import mongoose from 'mongoose';

const AGENT_NAMES = ['summary', 'triage', 'investigation', 'classification', 'mitigation', 'report', 'reviewer'];
const AGENT_STATUSES = ['waiting', 'running', 'completed', 'failed'];

const agentOutputSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true, index: true },
    agentName: { type: String, enum: AGENT_NAMES, required: true },
    status: { type: String, enum: AGENT_STATUSES, default: 'waiting' },
    output: { type: mongoose.Schema.Types.Mixed },
    confidence: { type: Number, min: 0, max: 1 },
    error: String,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

agentOutputSchema.index({ incidentId: 1, agentName: 1 });

agentOutputSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    incidentId: this.incidentId,
    agentName: this.agentName,
    status: this.status,
    output: this.output,
    confidence: this.confidence,
    error: this.error,
    startedAt: this.startedAt,
    completedAt: this.completedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export { AGENT_NAMES, AGENT_STATUSES };
export default mongoose.model('AgentOutput', agentOutputSchema);
