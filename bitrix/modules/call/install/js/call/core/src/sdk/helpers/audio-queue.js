import { AUDIO_QUEUE } from '../const';

// Pick the reconciliation operation when draining the single-slot audio queue.
export function selectAudioQueueOperation({ queue, isTrackLive, mutedBySystem })
{
	if (queue === AUDIO_QUEUE.ENABLE && !isTrackLive && !mutedBySystem)
	{
		return AUDIO_QUEUE.ENABLE;
	}

	if (queue === AUDIO_QUEUE.DISABLE && isTrackLive)
	{
		return AUDIO_QUEUE.DISABLE;
	}

	return AUDIO_QUEUE.INITIAL;
}

// A late trackCreated belongs to us when its cid is a known in-flight publication.
export function isOwnInflightPublication(cid, pendingPublications, ownInflightCids)
{
	return Boolean(pendingPublications?.[cid]) || Boolean(ownInflightCids?.has?.(cid));
}

// Decide how disableAudio reconciles the single-slot queue when the local track cannot be paused
// directly: 'pause' when a published sid exists, 'defer' when a publication is still in flight (its
// trackCreated will pause it), 'reset' when nothing will ever drain the queue so it must be freed.
export function selectDisableAudioReconciliation({ hasSid, hasInflightPublication })
{
	if (hasSid)
	{
		return 'pause';
	}

	if (hasInflightPublication)
	{
		return 'defer';
	}

	return 'reset';
}

// A late trackCreated is current only when its cid is the latest publication started for the source;
// a cid superseded by a newer publication must be ignored so it can't overwrite localTracks with a
// stale sid that later mute/unmute would target. An untracked source (no recorded cid) counts as current.
export function isCurrentPublication(cid, source, latestCidBySource)
{
	const latest = latestCidBySource?.[source];

	return latest === undefined || latest === cid;
}

// Keep the in-flight publication correlation window bounded: a publish timeout keeps the cid in the
// set (to still match a late trackCreated), so repeated failures would grow it without limit. Evict the
// oldest cids (Set preserves insertion order) once the cap is exceeded. Delete-before-add refreshes
// recency so re-adding a still-current cid isn't the first to be evicted.
export function addBoundedInflightCid(cids, cid, maxSize = 128)
{
	cids.delete(cid);
	cids.add(cid);

	while (cids.size > maxSize)
	{
		const oldest = cids.values().next().value;
		cids.delete(oldest);
	}

	return cids;
}
