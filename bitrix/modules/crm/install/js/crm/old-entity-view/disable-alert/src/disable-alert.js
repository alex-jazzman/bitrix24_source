import { Type } from 'main.core';
import 'ui.design-tokens';
import 'ui.design-tokens.air';
import './disable-alert.css';
import OldEntityDisableAlertContent from './alert-content/old-entity-disable';
import OldInvoiceReadonlyAlertContent from './alert-content/old-invoice-readonly';

export type DisableAlertOptions = {
	alertContainer: HTMLElement,
	contentName: string,
	contentOptions: Object,
};

export class DisableAlert
{
	#alertContainer: HTMLElement;
	#contentName: string;
	#contentOptions: Object;

	constructor(options: DisableAlertOptions): void
	{
		if (!Type.isElementNode(options.alertContainer))
		{
			throw new Error('OldCardLayout.DisableAlert: \'alertContainer\' must be a DOM element.');
		}

		if (!Type.isString(options.contentName))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'contentName\' must be string');
		}

		if (!Type.isObject(options.contentOptions))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'contentOptions\' must be object');
		}

		this.#alertContainer = options.alertContainer;
		this.#contentName = options.contentName;
		this.#contentOptions = options.contentOptions;
	}

	render(): void
	{
		const contentNode = this.#getContentByName(this.#contentName);

		this.#alertContainer.append(contentNode);
	}

	#getContentByName(name: string): HTMLElement
	{
		switch (name)
		{
			case 'old-invoice-readonly':
				return new OldInvoiceReadonlyAlertContent(this.#alertContainer, this.#contentOptions).createNode();
			default:
				return new OldEntityDisableAlertContent(this.#alertContainer, this.#contentOptions).createNode();
		}
	}
}
