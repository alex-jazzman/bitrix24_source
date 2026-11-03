import { Content } from './content';
import { Tag } from 'main.core';

export class TelephonyContent extends Content
{
	constructor(options)
	{
		super(options);
		this.setEventNamespace('BX.Bitrix24.LicenseWidget.Content.Telephony');
	}

	getConfig(): Object
	{
		return {
			html: this.getLayout(),
			minHeight: '43px',
			sizeLoader: 30,
		};
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<a
					href="${this.getOptions().link}"
					data-id="license-widget-block-telephony"
					class="license-widget-item license-widget-item--secondary --pointer"
				>
					<span class="license-widget-inner">
						<span class="license-widget-content">
							<span
								class="license-widget-item-icon ${this.getOptions().isActive ? 'license-widget-item-icon--tel-active' : 'license-widget-item-icon--tel'}"
								aria-hidden="true"
							></span>
							<span class="license-widget-item-content">
								<span class="license-widget-item-name">
									${this.getOptions().title}
								</span>
							</span>
						</span>
						<span class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right" aria-hidden="true"></span>
					</span>
				</a>
			`;
		});
	}
}
