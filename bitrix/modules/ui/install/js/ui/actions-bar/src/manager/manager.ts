import { Extension } from 'main.core';

import { pickTarget } from './layout';
import { calibrate } from './measure';
import { MutationGate } from './mutation-gate';
import { Panels } from './panels';
import { RafGate } from './raf-gate';
import { type LayoutMeasurements, type ManagerOptions } from './types';

export class Manager
{
	#container: HTMLElement;
	#panels: Panels;
	#measurements: LayoutMeasurements = { counter: null, nav: null, buttons: null, leftButtons: null };

	#resizeObserver: ResizeObserver | null = null;
	#mutationGate: MutationGate | null = null;

	#fitGate: RafGate = new RafGate();
	#resyncGate: RafGate = new RafGate();

	constructor(options: ManagerOptions)
	{
		this.#container = options.container;
		this.#panels = new Panels(this.#container);
	}

	init(): void
	{
		if (!this.#isAirDesignEnabled())
		{
			return;
		}

		this.#panels.discover();
		this.#observeResize();
		this.#observeMutations();
		this.#calibrate();
		this.#fit();
	}

	/** Cheap path: pick a target from the cached measurements and apply. */
	#fit(): void
	{
		const target = pickTarget(this.#measurements, this.#container, this.#panels);
		this.#mutationGate?.pause(() => this.#panels.apply(target));
	}

	/** Expensive path: rediscover panels, drop the cache, remeasure, refit. */
	#resync(): void
	{
		this.#panels.discover();
		this.#measurements = { counter: null, nav: null, buttons: null, leftButtons: null };
		this.#calibrate();
		this.#fit();
	}

	#calibrate(): void
	{
		this.#mutationGate?.pause(() => {
			this.#measurements = calibrate(this.#container, this.#panels, this.#measurements);
		});
	}

	#observeResize(): void
	{
		// Observe the parent — its content area defines the budget. The
		// container's own width grows with content (min-width: auto), so it's
		// not diagnostic.
		const target = this.#container.parentElement ?? this.#container;
		this.#resizeObserver = new ResizeObserver(() => {
			this.#fitGate.request(() => this.#fit());
		});
		this.#resizeObserver.observe(target);
	}

	#observeMutations(): void
	{
		this.#mutationGate = new MutationGate(this.#container, { childList: true, subtree: true }, () => {
			// Defer to rAF so multiple mutations in one frame batch into a
			// single recalibration, and so RightButtons' own MutationObserver
			// finishes rebuilding its internal buttons array before we read it.
			this.#resyncGate.request(() => this.#resync());
		});
	}

	#isAirDesignEnabled(): boolean
	{
		return Boolean(Extension.getSettings('ui.actions-bar').get('useAirDesign'));
	}
}
