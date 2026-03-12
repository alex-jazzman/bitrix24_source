import { DocumentEditSessionLimit } from 'disk.onlyoffice-session-restrictions';
import { Settings } from './settings';

export class Checker
{
	static isServiceAvailable(code: string): boolean
	{
		return Settings.getAvailableServices().includes(code);
	}

	/**
	 * @returns {boolean}
	 */
	static isSessionBoostAvailable(): boolean
	{
		return Settings.canDisplay() && this.isServiceAvailable(Settings.getSessionBoostServiceCode());
	}

	/**
	 * @deprecated
	 * @returns {false|boolean|*}
	 */
	static shouldShowPromoSessionBoost(): boolean
	{
		return this.isSessionBoostAvailable() && DocumentEditSessionLimit.getInstance().isExceeded();
	}
}
