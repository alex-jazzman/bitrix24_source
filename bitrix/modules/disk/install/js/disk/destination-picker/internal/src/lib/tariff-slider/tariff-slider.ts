import { Reflection, Runtime } from 'main.core';

const INFO_HELPER_EXTENSION = 'ui.info-helper';
const INFO_HELPER_CLASS = 'BX.UI.InfoHelper';

// `ui.info-helper` is a vanilla extension: it publishes its class into the BX
// namespace instead of exporting a module the render tree could import.
type InfoHelperApi = Function & {
	show?: (helperId: string) => void,
};

/**
 * Opens the tariff slider of the restriction.
 *
 * The extension is asked for on the click rather than imported: it pulls a large
 * dependency surface behind it and a person who never meets a locked storage never
 * pays for it. The slider is a vanilla surface outside the render tree, so nothing
 * about the popup state changes here.
 */
export async function showTariffSlider(helperId: string): Promise<void>
{
	try
	{
		await Runtime.loadExtension(INFO_HELPER_EXTENSION);
		(Reflection.getClass(INFO_HELPER_CLASS) as InfoHelperApi | null)?.show?.(helperId);
	}
	catch
	{
		console.error('DestinationPicker: tariff slider is unavailable');
	}
}
