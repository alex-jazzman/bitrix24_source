import { Util } from 'call.core';

// Marks the emptied event that our own assignment of srcObject causes. The release of a track is
// already written by playAudio, and a reattachment is not an event of its own; what the watcher of
// the element must not miss is an emptied nobody asked for.
export const EXPECTED_EMPTIED = 'bxExpectedEmptied';

// Marks the volumechange event that our own assignment of the volume causes. Muting the speaker
// walks every element of the call at once and is written by one record of the whole walk; what the
// watcher of the element must not miss is a volume change nobody asked for.
export const EXPECTED_VOLUME_CHANGE = 'bxExpectedVolumeChange';

/* eslint-disable no-param-reassign -- writing on the element given is the whole job of these helpers */
// Assigned and not raised: on a freshly created element the assignment queues no emptied at all,
// because its networkState is still empty, and a second assignment before the event is delivered
// cancels the one the first assignment queued. Reading the current srcObject answers both.
export function setSrcObject(element, srcObject)
{
	element[EXPECTED_EMPTIED] = element.srcObject !== null;
	element.srcObject = srcObject;
}

// Assigned by the fact of the change and not raised unconditionally: an assignment of the value the
// element already holds queues no volumechange at all, and a mark left standing would swallow the
// next change, an alien one.
export function setVolume(element, volume)
{
	element[EXPECTED_VOLUME_CHANGE] = volume !== element.volume;
	element.volume = volume;
}
/* eslint-enable no-param-reassign */

export function logPlaybackError(error)
{
	console.error("Playback start error: ", error);
	
	Util.sendLog({
		description: 'Playback start error',
		error: error,
	});
}

export function checkAndEncodeURI(uri)
{
	return decodeURI(uri) === uri ? encodeURI(uri) : uri;
}