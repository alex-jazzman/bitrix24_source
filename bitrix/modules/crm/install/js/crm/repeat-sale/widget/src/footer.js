import { Extension, Loc, Tag, Type } from 'main.core';

export class Footer
{
	#showSettingsButton: boolean = false;

	constructor(showSettingsButton: boolean = false)
	{
		this.#showSettingsButton = showSettingsButton;
	}

	getFooterContent(): HTMLElement
	{
		const settingsButton = this.#showSettingsButton ? Tag.render`
			<div
				onclick="${this.#onSettingsClick.bind(this)}"
			 	class="crm-rs__w-footer-button --settings"
			 >
				${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_FOOTER_SETTINGS')}
			</div>
		` : '';

		const feedbackButton = Tag.render`
			<div
				onclick="${this.#onFeedbackClick.bind(this)}"
				class="crm-rs__w-footer-button --feedback"
			>
				${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_FOOTER_FEEDBACK')}
			</div>
		`;

		return Tag.render`
			<div class="crm-rs__w-footer-row">
				${Type.isArrayFilled(this.#getFeedbackFormParams()) ? feedbackButton : '<div></div>'}
				${settingsButton}
			</div>
		`;
	}

	#onSettingsClick(): void
	{
		window.location.href = '/crm/repeat-sale-segment/';
	}

	#onFeedbackClick(): void
	{
		const [numberCode, stringCode] = this.#getFeedbackFormParams();

		this.#showFeedbackCrmForm(numberCode, stringCode);
	}

	#showFeedbackCrmForm(numberCode: number, stringCode: string): void
	{
		BX.SidePanel.Instance.open(
			'bx-repeat-sale-slider',
			{
				contentCallback: () => {
					return `<script data-b24-form="inline/${numberCode}/${stringCode}" data-skip-moving="true"></script>`;
				},
				width: 664,
				loader: 'default-loader',
				cacheable: false,
				closeByEsc: false,
				data: { rightBoundary: 0 },
				events: {
					onOpen: () => {
						(function(w,d,u){
							var s=d.createElement('script');
							s.async=true;
							s.src=u+'?'+(Date.now()/180000|0);
							var h=d.getElementsByTagName('script')[0];
							h.parentNode.insertBefore(s,h);
						})(window,document,`https://cdn.bitrix24.com/b5309667/crm/form/loader_${numberCode}.js`);
					},
				},
			},
		);
	}

	#getFeedbackFormParams(): Array
	{
		return Extension.getSettings('crm.repeat-sale.widget').get('feedbackFormParams');
	}
}
