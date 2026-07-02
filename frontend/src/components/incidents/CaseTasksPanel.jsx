import { useState } from 'react';
import toast from 'react-hot-toast';
import { addIncidentTask, updateIncidentTask } from '../../api/incidents';

const STATUS_STYLES = {
  open: 'text-amber-300',
  in_progress: 'text-soc-accent',
  done: 'text-emerald-300',
  cancelled: 'text-gray-500',
};

export default function CaseTasksPanel({ incident, canEdit, onUpdated }) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const data = await addIncidentTask(incident.id, { title: title.trim() });
      setTitle('');
      onUpdated?.(data.incident);
      toast.success('Task added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add task');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(task, status) {
    try {
      const data = await updateIncidentTask(incident.id, task._id, { status });
      onUpdated?.(data.incident);
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update task');
    }
  }

  const tasks = incident.tasks || [];

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No case tasks yet. Track follow-up actions for this investigation.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task._id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-black/20 border border-white/[0.06]">
              <div>
                <p className="text-sm text-white">{task.title}</p>
                <p className="text-[10px] text-gray-600 mt-1">
                  {task.createdByName || 'Analyst'} · {new Date(task.createdAt).toLocaleString()}
                </p>
              </div>
              {canEdit ? (
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task, e.target.value)}
                  className={`text-xs bg-transparent border border-white/10 rounded-md px-2 py-1 ${STATUS_STYLES[task.status] || ''}`}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              ) : (
                <span className={`text-xs capitalize ${STATUS_STYLES[task.status] || ''}`}>{task.status?.replace(/_/g, ' ')}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task…"
            className="flex-1 px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white text-sm focus:outline-none focus:border-soc-accent"
          />
          <button type="submit" disabled={saving || !title.trim()} className="btn-primary text-xs py-2 px-4">
            Add
          </button>
        </form>
      )}
    </div>
  );
}
