import { Runtime } from 'main.core';

const OPEN_APP_EXTENSION = 'vibecodeconnector.open-app';

type OpenAppExports = {
	openAppSlider?: (itemId: number) => boolean;
};

export async function openAppSlider(catalogItemId: number): Promise<boolean>
{
	try
	{
		const openApp = await Runtime.loadExtension(OPEN_APP_EXTENSION) as OpenAppExports;

		return openApp.openAppSlider?.(catalogItemId) === true;
	}
	catch
	{
		return false;
	}
}
