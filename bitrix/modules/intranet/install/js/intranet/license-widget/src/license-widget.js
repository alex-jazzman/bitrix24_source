import { Cache, Type } from 'main.core';
import { MainButton } from './main-button';
import { Popup } from './popup';
import type { GeneralOptions } from './types/options';
import './style.css';

export class LicenseWidget
{
	#cache = new Cache.MemoryCache();

	constructor(options: GeneralOptions)
	{
		if (!Type.isDomNode(options.buttonWrapper))
		{
			throw new Error('LicenseWidget: The buttonWrapper option is required.');
		}

		this.setOptions(options);
		this.getMainButton().replaceSkeleton();
		this.getMainButton().subscribe('click', () => {
			this.getPopup().show();
		});
	}

	setOptions(options: GeneralOptions): LicenseWidget
	{
		this.#cache.set('options', options);

		return this;
	}

	getOptions(): GeneralOptions
	{
		return this.#cache.get('options', {});
	}

	getPopup(): Popup
	{
		return this.#cache.remember('popup', () => {
			return new Popup({
				target: this.getMainButton().getContent(),
				content: {
					...this.getOptions(),
				}
			});
		});
	}

	getMainButton(): MainButton
	{
		return this.#cache.remember('main-button', () => {
			return new MainButton({
				wrapper: this.getOptions().buttonWrapper,
				isLicenseExpired: this.getOptions().license.isExpired,
				className: this.getOptions()['main-button'].className,
				text: this.getOptions()['main-button'].text,
			});
		});
	}
}
