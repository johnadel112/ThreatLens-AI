import { X } from 'lucide-react';

export default function JsonViewerModal({ open, title = 'Event Metadata', data, onClose }) {
  if (!open) return null;

  const formatted = JSON.stringify(data || {}, null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-panel w-full max-w-2xl max-h-[85vh] flex flex-col border-soc-border-bright/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Formatted JSON metadata</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <pre className="mt-4 flex-1 overflow-auto p-4 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono text-cyan-100/90 leading-relaxed">
          {formatted}
        </pre>
      </div>
    </div>
  );
}
