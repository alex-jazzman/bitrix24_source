import { Reflection, Type } from 'main.core';

/** Isolates the site template's undeclared right-panel API. */
const TEMPLATE_CLASS = 'BX.Intranet.Bitrix24.Template';
const PANEL_GETTER = 'getRightPanelAiChat';

const EXPAND_EVENT = 'onExpand';

const EXPAND_TIMEOUT = 3000;

export const PanelOutcome = Object.freeze({
	NoSurface: 'no_surface',
	Shown: 'shown',
	PanelFailed: 'panel_failed',
});

export type RightPanelSurface = {
	isExpanded: () => boolean,
	preload: () => Promise<unknown>,
	expand: (params: { chatId: number }) => void,
	subscribeOnce: (eventName: string, listener: () => void) => unknown,
	unsubscribe: (eventName: string, listener: () => void) => unknown,
};

const isSurface = (candidate: unknown): boolean => {
	if (!Type.isObject(candidate))
	{
		return false;
	}

	const surface = candidate as { [key: string]: unknown };

	return Type.isFunction(surface.isExpanded)
		&& Type.isFunction(surface.preload)
		&& Type.isFunction(surface.expand)
		&& Type.isFunction(surface.subscribeOnce)
		&& Type.isFunction(surface.unsubscribe)
	;
};

const resolveSurface = (): RightPanelSurface | null => {
	try
	{
		const template = Reflection.getClass(TEMPLATE_CLASS) as unknown as { [key: string]: unknown } | null;
		if (!Type.isObject(template) || !Type.isFunction(template[PANEL_GETTER]))
		{
			return null;
		}

		const surface = (template[PANEL_GETTER] as () => unknown).call(template);

		return isSurface(surface) ? surface as RightPanelSurface : null;
	}
	catch
	{
		return null;
	}
};

export class RightPanel
{
	#surface: RightPanelSurface | null;
	#preloadPromise: Promise<unknown> | null = null;

	constructor(surface: RightPanelSurface | null = resolveSurface())
	{
		this.#surface = surface;
	}

	hasSurface(): boolean
	{
		return this.#surface !== null;
	}

	preload(): void
	{
		if (this.#surface === null)
		{
			return;
		}

		try
		{
			this.#preloadPromise = Promise.resolve(this.#surface.preload());
		}
		catch (error)
		{
			this.#preloadPromise = Promise.reject(error);
		}

		// Handle rejection until show() consumes the preload result.
		this.#preloadPromise.catch((): void => {});
	}

	async show(chatId: number): Promise<string>
	{
		const surface = this.#surface;
		if (surface === null)
		{
			return PanelOutcome.NoSurface;
		}

		try
		{
			if (surface.isExpanded())
			{
				await this.#preloadPromise;

				if (surface.isExpanded())
				{
					// An expanded panel switches dialogs without emitting onExpand.
					surface.expand({ chatId });

					return PanelOutcome.Shown;
				}
			}

			return await this.#waitForExpand(surface, chatId);
		}
		catch
		{
			return PanelOutcome.PanelFailed;
		}
	}

	#waitForExpand(surface: RightPanelSurface, chatId: number): Promise<string>
	{
		return new Promise((resolve): void => {
			let listener: (() => void) | null = null;
			let timeoutId: number | null = null;

			const finish = (outcome: string): void => {
				if (timeoutId !== null)
				{
					clearTimeout(timeoutId);
					timeoutId = null;
				}

				if (listener !== null)
				{
					try
					{
						surface.unsubscribe(EXPAND_EVENT, listener);
					}
					catch
					{
						// The outcome must not depend on cleanup of a foreign surface.
					}
					listener = null;
				}

				resolve(outcome);
			};

			listener = (): void => {
				finish(PanelOutcome.Shown);
			};

			try
			{
				// Subscribe before expand(): the event may be synchronous.
				surface.subscribeOnce(EXPAND_EVENT, listener);
				timeoutId = setTimeout((): void => {
					finish(PanelOutcome.PanelFailed);
				}, EXPAND_TIMEOUT);

				surface.expand({ chatId });
			}
			catch
			{
				finish(PanelOutcome.PanelFailed);
			}
		});
	}
}
