import { Dom, Type } from 'main.core';
import { AccessibilityLogger } from '../accessibility-logger/accessibility-logger';

export type AriaLivePoliteness = 'polite' | 'assertive';

type QueueItem = {
	message: string;
	politeness: AriaLivePoliteness;
};

export type LiveAnnouncerOptions = {
	politeness?: AriaLivePoliteness;
	container?: HTMLElement;
	baseDelay?: number;
	charDelay?: number;
	maxDelay?: number;
	maxMessageLength?: number;
};

/**
 * @memberof BX.UI.Accessibility
 */
export class LiveAnnouncer
{
	static #instance: LiveAnnouncer | null = null;

	readonly #el: HTMLElement;
	#queue: Array<QueueItem> = [];
	#isSpeaking: boolean = false;
	#frameId: number | null = null;
	#timerId: ReturnType<typeof setTimeout> | null = null;
	#ready: boolean = false;
	#readyFrameId: number | null = null;
	readonly #baseDelay: number = 500;
	readonly #charDelay: number = 30;
	readonly #maxDelay: number = 4000;
	readonly #maxMessageLength: number = 160;

	static enableDebug(): void
	{
		AccessibilityLogger.enable('live-announcer');
	}

	static disableDebug(): void
	{
		AccessibilityLogger.disable('live-announcer');
	}

	static announce(message: string, politeness: AriaLivePoliteness = 'polite'): void
	{
		if (!LiveAnnouncer.#instance)
		{
			LiveAnnouncer.#instance = new LiveAnnouncer();
		}

		LiveAnnouncer.#instance.announce(message, politeness);
	}

	static destroy(): void
	{
		LiveAnnouncer.#instance?.destroy();
		LiveAnnouncer.#instance = null;
	}

	constructor(options?: LiveAnnouncerOptions)
	{
		const {
			politeness = 'polite',
			container = document.body || document.documentElement,
			baseDelay,
			charDelay,
			maxDelay,
			maxMessageLength,
		} = options ?? {};

		if (Type.isNumber(baseDelay))
		{
			this.#baseDelay = baseDelay as number;
		}

		if (Type.isNumber(charDelay))
		{
			this.#charDelay = charDelay as number;
		}

		if (Type.isNumber(maxDelay))
		{
			this.#maxDelay = maxDelay as number;
		}

		if (Type.isNumber(maxMessageLength))
		{
			this.#maxMessageLength = maxMessageLength as number;
		}

		this.#el = this.#createLiveRegion(politeness);
		Dom.append(this.#el, container);

		// Screen readers (NVDA, VoiceOver, JAWS) need a tick between the live region
		// being inserted into the DOM and the first content mutation — otherwise the
		// first announcement is silently dropped. Hold processing until a frame passes.
		this.#readyFrameId = requestAnimationFrame(() => {
			this.#readyFrameId = null;
			this.#ready = true;
			this.#process();
		});
	}

	announce(message: string, politeness: AriaLivePoliteness = 'polite'): void
	{
		const normalized = this.#normalizeMessage(message);
		if (!normalized)
		{
			return;
		}

		AccessibilityLogger.log('live-announcer', `[${politeness}] ${normalized}`);

		const last = this.#queue[this.#queue.length - 1];
		if (last && last.message === normalized && last.politeness === politeness)
		{
			return;
		}

		if (politeness === 'assertive')
		{
			this.#clearPendingAnnouncement();
			this.#queue.unshift({ message: normalized, politeness });
		}
		else
		{
			this.#queue.push({ message: normalized, politeness });
		}

		this.#process();
	}

	destroy(): void
	{
		if (this.#readyFrameId !== null)
		{
			cancelAnimationFrame(this.#readyFrameId);
			this.#readyFrameId = null;
		}

		this.#queue.length = 0;
		this.#clearPendingAnnouncement();

		this.#el.remove();
	}

	#process(): void
	{
		if (!this.#ready || this.#isSpeaking || this.#queue.length === 0)
		{
			return;
		}

		const item = this.#queue.shift();
		if (!item)
		{
			return;
		}

		this.#isSpeaking = true;
		const { message, politeness } = item;
		const delay = this.#getDelay(message);

		this.#el.setAttribute('aria-live', politeness);
		this.#el.textContent = '';

		this.#frameId = requestAnimationFrame(() => {
			this.#frameId = null;
			this.#el.textContent = message;

			this.#timerId = setTimeout(() => {
				this.#timerId = null;
				this.#isSpeaking = false;

				if (this.#queue.length === 0)
				{
					this.#el.textContent = '';
				}

				this.#process();
			}, delay);
		});
	}

	#clearPendingAnnouncement(): void
	{
		this.#isSpeaking = false;

		if (this.#frameId !== null)
		{
			cancelAnimationFrame(this.#frameId);
			this.#frameId = null;
		}

		if (this.#timerId !== null)
		{
			clearTimeout(this.#timerId);
			this.#timerId = null;
		}

		this.#el.textContent = '';
	}

	#getDelay(message: string): number
	{
		const delay = this.#baseDelay + message.length * this.#charDelay;

		return Math.min(delay, this.#maxDelay);
	}

	#normalizeMessage(message: string): string
	{
		if (!Type.isStringFilled(message))
		{
			return '';
		}

		const text = message.trim();
		if (!text)
		{
			return '';
		}

		if (text.length <= this.#maxMessageLength)
		{
			return text;
		}

		const truncated = text.slice(0, this.#maxMessageLength - 1);
		const trimmedToWord = truncated.replace(/\s+\S*$/, '');

		return `${trimmedToWord || truncated}\u2026`;
	}

	#createLiveRegion(politeness: AriaLivePoliteness): HTMLElement
	{
		const el = document.createElement('div');

		el.setAttribute('aria-live', politeness);
		el.setAttribute('aria-atomic', 'true');
		el.setAttribute('data-a11y-ignore-inert', 'true');

		Dom.style(el, {
			position: 'absolute',
			width: '1px',
			height: '1px',
			margin: '-1px',
			padding: '0',
			overflow: 'hidden',
			clip: 'rect(0 0 0 0)',
			whiteSpace: 'nowrap',
			border: '0',
		});

		return el;
	}
}
