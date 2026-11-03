import { resolveGlobal } from '../../lib/global/global';
import { type PageSwapperHref } from '../../model/grid/types';

export type SliderHrefListRegistry = {
	pageSwapperHrefList: PageSwapperHref[],
	enableNextPage: boolean,
};

type SliderData = {
	set(key: string, value: unknown): void,
};

type Slider = {
	getData(): SliderData,
};

type SidePanelManager = {
	getTopSlider(): Slider | null,
	getSliderByWindow(frameWindow: Window): Slider | null,
};

/**
 * The addresses of the list into the slider that stands open over it.
 *
 * The slider of a message walks the neighbours of the one it shows and reads that list out of its
 * own dictionary once, as it opens (`message.view/templates/.default/script.js:445`). The screen
 * fills the dictionary on `SidePanel.Slider:onOpen` (`template.php:1902`) and never again, so
 * without this the reader stops at the last address the list held when the slider opened.
 *
 * The top slider is written into only while it is somebody else's, the condition the screen wrote
 * it with (`user-interface-manager.js:688`): where the whole screen lives in a slider, that one
 * knows the addresses already.
 */
export function publishHrefListToSlider(registry: SliderHrefListRegistry): void
{
	const sidePanel = resolveGlobal<SidePanelManager>('BX.SidePanel.Instance');
	const slider = sidePanel?.getTopSlider() ?? null;

	if (!sidePanel || slider === null || slider === sidePanel.getSliderByWindow(window))
	{
		return;
	}

	const data = slider.getData();

	data.set('hrefList', registry.pageSwapperHrefList);
	data.set('enableNextPage', registry.enableNextPage);
}
