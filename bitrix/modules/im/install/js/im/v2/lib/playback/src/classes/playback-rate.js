import { EventEmitter } from 'main.core.events';

import { AudioPlaybackRate, EventType, LocalStorageKey } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';

type PlaybackRateValue = $Values<typeof AudioPlaybackRate>;

export class PlaybackRate
{
	static get(): PlaybackRateValue
	{
		const storedRate = LocalStorageManager.getInstance().get(LocalStorageKey.audioPlaybackRate);
		// the storage is shared, so the stored value is checked against the catalogue of known-good
		// ones: a media element throws on a non-numeric rate and on one outside the range it supports
		const isKnownRate = Object.values(AudioPlaybackRate).includes(storedRate);

		return isKnownRate ? storedRate : AudioPlaybackRate['1'];
	}

	// the broadcast is required so that a write cannot leave the players that are already running
	// behind: they take the new value from it, not from a re-read of the storage. It goes to the
	// global emitter, because the listeners live on both sides of an application boundary - the
	// players sit in Vue applications with an emitter of their own, the playback service is a
	// singleton outside all of them
	static set(rate: PlaybackRateValue): void
	{
		LocalStorageManager.getInstance().set(LocalStorageKey.audioPlaybackRate, rate);
		EventEmitter.emit(EventType.player.rateChange, { rate });
	}

	static getNext(rate: PlaybackRateValue): PlaybackRateValue
	{
		// integer-like keys come first in Object.values, so the raw order is [1, 2, 1.5] - keep the cycle ascending
		const rates = Object.values(AudioPlaybackRate).sort((a, b) => a - b);
		const currentIndex = rates.indexOf(rate);
		const nextIndex = (currentIndex + 1) % rates.length;

		return rates[nextIndex];
	}
}
