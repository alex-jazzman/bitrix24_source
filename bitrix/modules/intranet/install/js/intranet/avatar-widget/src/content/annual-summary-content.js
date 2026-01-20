import { Content } from './content';
import { Runtime, Tag, ajax, Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';

export class AnnualSummaryContent extends Content
{
	#annualSummaryPopup = null;

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div
						data-testid="bx-avatar-widget-tool-${this.getId()}"
						onclick="${this.onClick.bind(this)}"
						class="intranet-avatar-widget-item__wrapper intranet-avatar-widget-annual-summary-tool__wrapper"
						>
						<div class="intranet-avatar-widget-annual-summary-tool__background"></div>
						<span class="intranet-avatar-widget-annual-summary-tool__title">
							${this.getTitle()}
						</span>
				</div>
			`;
		});
	}

	getTitle(): string
	{
		return this.getOptions().title;
	}

	onClick(): void
	{
		if (this.#annualSummaryPopup)
		{
			this.#annualSummaryPopup.show();
			EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');

			return;
		}

		Dom.addClass(this.getLayout(), 'intranet-avatar-widget-annual-summary-tool__wrapper--loading');

		Promise.all([
			ajax.runAction('intranet.v2.AnnualSummary.load', {}),
			Runtime.loadExtension('intranet.notify-banner.annual-summary'),
		]).then(([response, { AnnualSummary }]) => {
			const { topFeatures, options } = response.data;
			Dom.removeClass(this.getLayout(), 'intranet-avatar-widget-annual-summary-tool__wrapper--loading');
			EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
			this.#annualSummaryPopup = new AnnualSummary(topFeatures, { ...options, section: 'profile' });
			this.#annualSummaryPopup.subscribe('onShow', () => BX.userOptions.save('intranet', 'annual_summary_25_last_show', null, Math.floor(Date.now() / 1000)));
			this.#annualSummaryPopup.show();
		}).catch((error) => {
			console.error(error);
		});
	}

	getId(): string
	{
		return 'annual-summary';
	}
}
