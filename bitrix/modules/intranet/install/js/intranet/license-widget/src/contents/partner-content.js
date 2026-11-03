import { Tag } from 'main.core';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { Content } from './content';

export class PartnerContent extends Content
{
	constructor(options)
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
			if (this.getOptions().landingCode)
			{
				const onclick = () => {
					FeaturePromotersRegistry.getPromoter({ code: this.getOptions().landingCode }).show();
				};

				return Tag.render`
					<button
						type="button"
						data-id="license-widget-block-orders"
						onclick="${onclick}"
						class="license-widget-item license-widget-item--secondary --pointer"
					>
						${this.#getLayoutContent()}
					</button>
				`;
			}

			return Tag.render`
				<a
					href="${this.getOptions().link}"
					target="_blank"
					rel="noopener noreferrer"
					data-id="license-widget-block-orders"
					class="license-widget-item license-widget-item--secondary --pointer"
				>
					${this.#getLayoutContent()}
				</a>
			`;
		});
	}

	#getLayoutContent(): HTMLElement
	{
		return Tag.render`
			<span class="license-widget-inner">
				<span class="license-widget-content">
					<span class="license-widget-item-icon license-widget-item-icon--partner" aria-hidden="true"></span>
					<span class="license-widget-item-content">
						${this.getTitle()}
					</span>
				</span>
				<span class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right" aria-hidden="true"></span>
			</span>
		`;
	}

	getTitle(): HTMLSpanElement
	{
		return this.cache.remember('title', () => {
			return Tag.render`
				<span class="license-widget-item-name">
					<span>
						${this.getOptions().title}
					</span>
				</span>
			`;
		});
	}
}
