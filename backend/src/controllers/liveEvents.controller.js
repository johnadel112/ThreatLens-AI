import {
  getLiveEventStatus,
  startLiveEventsForUser,
  stopLiveEventsForUser,
} from '../services/live/liveEventGenerator.service.js';

export async function startLiveEvents(req, res) {
  const status = startLiveEventsForUser(req.user._id);
  res.json({ message: 'Live event monitoring started', ...status });
}

export async function stopLiveEvents(req, res) {
  const status = stopLiveEventsForUser(req.user._id);
  res.json({ message: 'Live event monitoring stopped', ...status });
}

export async function liveEventsStatus(req, res) {
  res.json(getLiveEventStatus(req.user._id));
}
