import { useState } from 'react';
import toast from 'react-hot-toast';
import { addIncidentNote } from '../../api/incidents';

export default function CaseNotesPanel({ incident, canEdit, onUpdated }) {
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim()) return;

    setSaving(true);
    try {
      const data = await addIncidentNote(incident.id, body.trim());
      setBody('');
      onUpdated?.(data.incident);
      toast.success('Case note added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  }

  const notes = [...(incident.notes || [])].reverse();

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <p className="text-sm text-gray-500">No analyst notes yet. Add investigation context for your team.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {notes.map((note) => (
            <div key={note._id || note.createdAt} className="p-3 rounded-xl bg-black/20 border border-white/[0.06]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-soc-accent">{note.authorName || 'Analyst'}</span>
                <span className="text-[10px] text-gray-600">{new Date(note.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{note.body}</p>
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Add investigation note…"
            className="w-full px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white text-sm focus:outline-none focus:border-soc-accent resize-none"
          />
          <button type="submit" disabled={saving || !body.trim()} className="btn-primary text-xs py-2">
            {saving ? 'Saving…' : 'Add Note'}
          </button>
        </form>
      )}
    </div>
  );
}
