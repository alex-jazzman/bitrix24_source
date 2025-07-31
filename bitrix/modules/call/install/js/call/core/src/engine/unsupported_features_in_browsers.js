export class UnsupportedBrowserFeatures
{
	static listOfDevicesBeforeStream = [BX.browser.IsFirefox()];
	static get isNotSupportDevicesListBeforeStream(): boolean
	{
		return this.listOfDevicesBeforeStream.some((browser) => browser);
	}
}