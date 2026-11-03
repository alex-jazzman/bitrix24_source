import { Runtime, Type } from 'main.core';

/**
 * The viewer is weight no one who never opens a file has to carry, so it is fetched on the first
 * sign that such a click is coming - a pointer over a chip or the focus landing on one. The state is
 * of the page rather than of a grid: the extension loads once for both lists.
 */
let loading: Promise<void> | null = null;
let ready = false;

type TopWindowApi = {
	loadExt?(name: string): Promise<unknown>,
	UI?: { Viewer?: { Instance?: unknown } },
};

/**
 * The viewer shows itself in the top window, and the list lives in a slider of that window. Until
 * the top window has the viewer too, its listener answers a click from a promise - too late to call
 * off the default, and the file opens in a tab of its own. So the click waits for both windows.
 */
async function loadInTopWindow(): Promise<void>
{
	try
	{
		if (window.top === window)
		{
			return;
		}

		const topBx = (window.top as unknown as { BX?: TopWindowApi })?.BX;
		if (!topBx || Type.isObject(topBx.UI?.Viewer?.Instance) || !topBx.loadExt)
		{
			return;
		}

		await topBx.loadExt('ui.viewer');
	}
	catch
	{
		// a top window of another origin is not ours to load anything into
	}
}

export function prefetchViewer(): Promise<void>
{
	loading ??= Runtime.loadExtension('ui.viewer')
		.then(loadInTopWindow)
		.then((): void => {
			ready = true;
		})
		.catch((): void => {
			// the file still opens by its own address; only the viewer is missing
		})
	;

	return loading;
}

/**
 * A click on a file the viewer is not loaded for yet would be followed by the browser and open the
 * file in a tab of its own. Such a click is held back and repeated once the viewer is there to catch
 * it by its own listener on the document.
 */
export function openThroughViewer(event: MouseEvent, link: HTMLElement): void
{
	if (ready)
	{
		return;
	}

	event.preventDefault();

	void prefetchViewer().then((): void => {
		if (ready && link.isConnected)
		{
			link.click();
		}
	});
}
