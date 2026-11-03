import { Runtime } from 'main.core';

/** Where the mark of the show is kept: the very same option the server reads before the page is built. */
export type UserOptionAddress = {
	category: string,
	name: string,
};

/**
 * Everything about the widget of the boosts the header cannot learn from the composition. The decision
 * to open the widget by itself belongs to the server: it is taken once per pair of the user and the
 * extension of the file, and the header neither repeats nor overrides it.
 */
export type SessionBoostContext = {
	shouldShowWidgetInstantly: boolean,
	widgetViewOption: UserOptionAddress,
};

export type ShowBoostRequest = {
	containerId: string,
	sessionBoost: SessionBoostContext | null,
	/** The object may be closed while the package is still being loaded; nothing is drawn after that. */
	isCancelled: () => boolean,
};

type BoostButton = {
	init: () => void,
	setOverlayToWidget: () => void,
	showWidget: () => void,
};

type PromoBoostExtension = {
	Factory: {
		getSessionBoostButton: (containerId: string) => BoostButton,
	},
};

type UserOptionsGlobal = {
	userOptions: {
		save: (category: string, name: string, valueName: string | null, value: number) => void,
		send: (callback: (() => void) | null) => void,
	},
};

/**
 * The button of the boosts. It is drawn by `disk.promo-boost` into the container the header rendered,
 * and the same side plays the scenario of the purchase: the widget is laid over the page and, when the
 * server says the user has not seen it yet, opened right away with the mark of the show.
 */
export async function showBoost(request: ShowBoostRequest): Promise<void>
{
	const button = await loadButton(request.containerId);
	if (button === null || request.isCancelled())
	{
		return;
	}

	button.init();
	button.setOverlayToWidget();

	const boost = request.sessionBoost;
	if (boost === null || !boost.shouldShowWidgetInstantly)
	{
		return;
	}

	button.showWidget();
	markWidgetShown(boost.widgetViewOption);
}

async function loadButton(containerId: string): Promise<BoostButton | null>
{
	try
	{
		const extension = await Runtime.loadExtension('disk.promo-boost') as unknown as PromoBoostExtension;

		return extension.Factory.getSessionBoostButton(containerId);
	}
	catch
	{
		// the boost package reports its own failures; a missing button leaves the rest of the header alive
		return null;
	}
}

/** The mark is sent at once: the next opening of the object must already know the widget was shown. */
function markWidgetShown(option: UserOptionAddress): void
{
	const { userOptions } = BX as unknown as UserOptionsGlobal;

	userOptions.save(option.category, option.name, null, Math.floor(Date.now() / 1000));
	userOptions.send(null);
}
