import { Extension } from 'main.core';

export class Settings
{
	static getSessionBoostServiceCode(): string
	{
		return this.getExtensionParam('sessionBoostServiceCode');
	}

	static getAvailableServices(): Array<string>
	{
		return this.getExtensionParam('availableServices');
	}

	static canDisplay(): boolean
	{
		return this.getExtensionParam('canDisplay');
	}

	static getExtensionParam(parameterName: string): any
	{
		return Extension.getSettings('disk.promo-boost').get(parameterName);
	}
}
