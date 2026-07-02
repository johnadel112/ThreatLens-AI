import { BookOpen, FileSearch } from 'lucide-react';

export default function ExplainableEvidencePanel({ explainability, agentOutput }) {
  const data = explainability || agentOutput || {};
  const hasContent =
    data.reasoningSummary
    || data.reasoningPoints?.length
    || data.relatedAlertIds?.length
    || data.relatedEventIds?.length;

  if (!hasContent) {
    return (
      <p className="text-sm text-gray-500">
        Explainable evidence references appear after the Investigation Agent completes.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {data.reasoningSummary && (
        <div className="rounded-lg border border-soc-accent/20 bg-soc-accent/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileSearch className="w-4 h-4 text-soc-accent" />
            <p className="text-xs font-medium text-soc-accent uppercase tracking-wide">Reasoning Summary</p>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{data.reasoningSummary}</p>
        </div>
      )}

      {data.reasoningPoints?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Why the AI concluded this</p>
          <ul className="space-y-2">
            {data.reasoningPoints.map((point, i) => (
              <li key={i} className="text-sm text-gray-300 pl-3 border-l-2 border-soc-accent/30 leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.relatedAlertIds?.length > 0 && (
          <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
            <p className="text-xs text-gray-500 mb-2">Related Alert IDs</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {data.relatedAlertIds.map((id) => (
                <code key={id} className="block text-[10px] text-soc-accent font-mono truncate">{id}</code>
              ))}
            </div>
          </div>
        )}
        {data.relatedEventIds?.length > 0 && (
          <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
            <p className="text-xs text-gray-500 mb-2">Related Event IDs ({data.relatedEventIds.length})</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {data.relatedEventIds.slice(0, 8).map((id) => (
                <code key={id} className="block text-[10px] text-gray-400 font-mono truncate">{id}</code>
              ))}
              {data.relatedEventIds.length > 8 && (
                <p className="text-[10px] text-gray-600">+{data.relatedEventIds.length - 8} more</p>
              )}
            </div>
          </div>
        )}
      </div>

      {data.assumptions?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Assumptions</p>
          <ul className="text-xs text-gray-500 space-y-1">
            {data.assumptions.map((a, i) => <li key={i}>• {a}</li>)}
          </ul>
        </div>
      )}

      {data.knowledgeSources?.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-300" />
          <div>
            <span className="text-purple-300">RAG knowledge sources: </span>
            {data.knowledgeSources.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
