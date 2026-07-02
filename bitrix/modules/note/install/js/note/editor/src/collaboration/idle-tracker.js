import { Event } from 'main.core';
import { IDLE_TIMEOUT_MS } from '../const';

export class IdleTracker
{
	idleTimer: number | null;
	boundResetIdleTimer: (() => void) | null;

	constructor()
	{
		this.idleTimer = null;
		this.boundResetIdleTimer = null;
	}

	start(onIdle: () => void, onResume: () => void): void
	{
		this.stop();
		this.boundResetIdleTimer = () => {
			if (onResume)
			{
				onResume();
			}

			this.resetTimer(onIdle);
		};
		Event.bind(document, 'pointerdown', this.boundResetIdleTimer);
		Event.bind(document, 'keydown', this.boundResetIdleTimer);
		Event.bind(document, 'scroll', this.boundResetIdleTimer, true);
		this.resetTimer(onIdle);
	}

	stop(): void
	{
		if (this.idleTimer !== null)
		{
			clearTimeout(this.idleTimer);
			this.idleTimer = null;
		}

		if (this.boundResetIdleTimer)
		{
			Event.unbind(document, 'pointerdown', this.boundResetIdleTimer);
			Event.unbind(document, 'keydown', this.boundResetIdleTimer);
			Event.unbind(document, 'scroll', this.boundResetIdleTimer, true);
			this.boundResetIdleTimer = null;
		}
	}

	isActive(): boolean
	{
		return this.idleTimer !== null;
	}

	resetTimer(onIdle: () => void): void
	{
		if (this.idleTimer !== null)
		{
			clearTimeout(this.idleTimer);
		}

		this.idleTimer = setTimeout(() => {
			this.idleTimer = null;
			if (onIdle)
			{
				onIdle();
			}
		}, IDLE_TIMEOUT_MS);
	}
}
