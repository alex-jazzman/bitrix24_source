import { Tag } from 'main.core';
import type { PurchaseHistoryContentOptions } from '../types/options';
import { Content } from './content';

export class PurchaseHistoryContent extends Content
{
	constructor(options: PurchaseHistoryContentOptions)
	{
		super(options);
		this.setEventNamespace('BX.Bitrix24.LicenseWidget.Content.Orders');
	}

	getConfig(): Object
	{
		return {
			html: this.getLayout(),
			minHeight: '50px',
		};
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<form
					id="form-purchase-history"
					class="license-widget-item-form --purchase-history"
					action="${this.getOptions().link}"
					method="post"
					target="_blank"
				>
					<input type="hidden" name="license_key" value="${this.getOptions().hashKey}">
					<button
						type="submit"
						data-id="license-widget-block-orders"
						class="license-widget-item license-widget-item--secondary --pointer"
					>
						<span class="license-widget-inner">
							<span class="license-widget-content">
								<span class="license-widget-item-icon license-widget-item-icon--order" aria-hidden="true"></span>
								<span class="license-widget-item-content">
									${this.getTitle()}
								</span>
							</span>
							<span class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right" aria-hidden="true"></span>
						</span>
					</button>
				</form>
			`;
		});
	}

	getTitle(): HTMLSpanElement
	{
		return this.cache.remember('title', () => {
			return Tag.render`
				<span class="license-widget-item-name">
					<span>
						${this.getOptions().text}
					</span>
				</span>
			`;
		});
	}
}
