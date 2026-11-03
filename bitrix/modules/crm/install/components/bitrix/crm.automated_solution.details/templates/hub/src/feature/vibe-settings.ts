import { Runtime } from 'main.core';

import { VibeWidgetStatus, type VibeWidgetStatusValue } from '../const/vibe-widget-status';
import { VibeService } from '../infrastructure/service/vibe-service';

export type VibeSettingsInput = {
	visible: boolean,
	enabled: boolean,
	vibeId: number,
	// A save that can create the page is running: the settings of the page appear after the slider reload.
	saving: boolean,
	solutionId: number | null,
};

export type VibeSettingsDeps = {
	onStatus: (status: VibeWidgetStatusValue) => void,
	// The node of the ready widget, once it is rendered.
	getContainer: () => Promise<HTMLElement | null>,
	getSettings?: (solutionId: number) => Promise<string>,
	renderHtml?: (container: HTMLElement, html: string) => Promise<unknown>,
};

// The settings of the home page embedded into its section. They are loaded only for a shown section with the page
// switched on and already created. Each change of what is shown starts a new generation, and an answer or a
// Runtime.html of an older one is dropped: a late request never writes into the widget on screen.
export class VibeSettings
{
	#deps: VibeSettingsDeps;
	#status: VibeWidgetStatusValue = VibeWidgetStatus.Hidden;
	#generation: number = 0;
	#context: string | null = null;
	#isDisposed: boolean = false;

	constructor(deps: VibeSettingsDeps)
	{
		this.#deps = deps;
	}

	getStatus(): VibeWidgetStatusValue
	{
		return this.#status;
	}

	update(input: VibeSettingsInput): void
	{
		if (this.#isDisposed)
		{
			return;
		}

		const context = resolveContext(input);
		if (context === null)
		{
			this.#stop(isFirstSaveOfPage(input) ? VibeWidgetStatus.Pending : VibeWidgetStatus.Hidden);

			return;
		}

		if (context !== this.#context)
		{
			void this.#load(context, input.solutionId as number);
		}
	}

	dispose(): void
	{
		this.#isDisposed = true;
		this.#generation++;
		this.#context = null;
	}

	#stop(status: VibeWidgetStatusValue): void
	{
		this.#generation++;
		this.#context = null;
		this.#setStatus(status);
	}

	async #load(context: string, solutionId: number): Promise<void>
	{
		const generation = ++this.#generation;
		const isCurrent = (): boolean => !this.#isDisposed && generation === this.#generation;

		this.#context = context;
		this.#setStatus(VibeWidgetStatus.Loading);

		let html = '';
		try
		{
			html = await (this.#deps.getSettings ?? VibeService.getSettings)(solutionId);
		}
		catch
		{
			this.#fail(isCurrent);

			return;
		}

		if (!isCurrent())
		{
			return;
		}

		if (html.trim() === '')
		{
			this.#setStatus(VibeWidgetStatus.Empty);

			return;
		}

		this.#setStatus(VibeWidgetStatus.Ready);
		const container = await this.#deps.getContainer();
		if (!isCurrent())
		{
			return;
		}

		if (!container)
		{
			this.#setStatus(VibeWidgetStatus.Error);

			return;
		}

		try
		{
			await (this.#deps.renderHtml ?? renderHtml)(container, html);
		}
		catch
		{
			this.#fail(isCurrent);
		}
	}

	#fail(isCurrent: () => boolean): void
	{
		if (isCurrent())
		{
			this.#setStatus(VibeWidgetStatus.Error);
		}
	}

	#setStatus(status: VibeWidgetStatusValue): void
	{
		if (this.#status === status)
		{
			return;
		}

		this.#status = status;
		this.#deps.onStatus(status);
	}
}

// The three conditions of the load, keyed by what the answer depends on; null when nothing is to be loaded.
function resolveContext({ visible, enabled, vibeId, solutionId }: VibeSettingsInput): string | null
{
	if (!visible || !enabled || vibeId <= 0 || !solutionId || solutionId <= 0)
	{
		return null;
	}

	return `${solutionId}:${vibeId}`;
}

function isFirstSaveOfPage({ visible, enabled, saving }: VibeSettingsInput): boolean
{
	return visible && enabled && saving;
}

function renderHtml(container: HTMLElement, html: string): Promise<unknown>
{
	return Promise.resolve(Runtime.html(container, html));
}
