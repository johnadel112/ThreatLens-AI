import Incident from '../models/Incident.js';
import { ownerFilter, assertDocumentOwner } from '../utils/ownerScope.js';

function toReportSummary(incident) {
  return {
    id: incident._id,
    title: incident.title,
    severity: incident.severity,
    status: incident.status,
    username: incident.username,
    ip: incident.ip,
    threatClassification: incident.threatClassification,
    aiSummary: incident.aiSummary,
    report: {
      generatedAt: incident.report?.generatedAt,
      version: incident.report?.version,
      preview: incident.report?.markdown?.slice(0, 200),
    },
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
  };
}

export async function listReports(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const filter = {
      ...ownerFilter(req.user._id),
      'report.markdown': { $exists: true, $nin: [null, ''] },
    };

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .sort({ 'report.generatedAt': -1 })
        .skip(skip)
        .limit(limit),
      Incident.countDocuments(filter),
    ]);

    res.json({
      reports: incidents.map(toReportSummary),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getReport(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.incidentId);
    if (!incident?.report?.markdown) {
      return res.status(404).json({ error: 'Report not found', code: 'NOT_FOUND' });
    }
    assertDocumentOwner(incident, req.user._id);

    res.json({
      report: {
        incidentId: incident._id,
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
        username: incident.username,
        ip: incident.ip,
        aiSummary: incident.aiSummary,
        threatClassification: incident.threatClassification,
        recommendations: incident.recommendations,
        markdown: incident.report.markdown,
        generatedAt: incident.report.generatedAt,
        version: incident.report.version,
      },
    });
  } catch (err) {
    next(err);
  }
}
