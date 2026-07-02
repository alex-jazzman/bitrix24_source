import { Builder } from 'crm.integration.analytics';
import { Extension, Loc, Tag, Type } from 'main.core';
import { sendData } from 'ui.analytics';
import 'ui.feedback.form';
import 'ui.system.highlighter';

type Analytics = {
	type: string,
	subSection: string,
}

export class Footer
{
	#showSettingsButton: boolean = false;
	#isGlowingSettingsButton: boolean = false;
	#analytics: Analytics = {};

	constructor(showSettingsButton: boolean = false, analytics: Analytics = {}, isGlowingSettingsButton: boolean = false)
	{
		this.#showSettingsButton = showSettingsButton;
		this.#isGlowingSettingsButton = isGlowingSettingsButton;
		this.#analytics = analytics;
	}

	getFooterContent(): HTMLElement
	{
		return Tag.render`
			<div class="crm-rs__w-footer-row">
				${this.#getFeedbackButton()}
				${this.#getSettingsButton()}
			</div>
		`;
	}

	#getFeedbackButton(): ?HTMLElement
	{
		if (!Type.isArrayFilled(this.#getFeedbackFormParams()))
		{
			return Tag.render`<div></div>`;
		}

		return Tag.render`
			<div
				onclick="${this.#onFeedbackClick.bind(this)}"
				class="crm-rs__w-footer-button --feedback"
			>
				${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_FOOTER_FEEDBACK')}
			</div>
		`;
	}

	#getSettingsButton(): ?HTMLElement
	{
		if (!this.#showSettingsButton)
		{
			return null;
		}

		return Tag.render`
			<div
				onclick="${this.#onSettingsClick.bind(this)}"
				class="crm-rs__w-footer-button --settings ${this.#isGlowingSettingsButton ? '--glowing' : ''}"
			>
				${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_FOOTER_SETTINGS')}
				${this.#isGlowingSettingsButton ? '<span class="ui-highlighter --with-glow --glow-md --border-md"></span>' : ''}
			</div>
		`;
	}

	#onSettingsClick(): void
	{
		const eventBuilder = this.#getClickEventBuilder();
		eventBuilder.setElement('config');
		sendData(eventBuilder.buildData());

		window.location.href = '/crm/repeat-sale-segment/';
	}

	#onFeedbackClick(): void
	{
		const eventBuilder = this.#getClickEventBuilder();
		eventBuilder.setElement('feedback');
		sendData(eventBuilder.buildData());

		this.#showFeedbackCrmForm();
	}

	#showFeedbackCrmForm(): void
	{
		BX.UI.Feedback.Form.open({
			id: Math.random().toString(),
			forms: this.#getFeedbackFormParams(),
		});
	}

	#getFeedbackFormParams(): Array
	{
		return Extension.getSettings('crm.repeat-sale.widget').get('feedbackFormParams');
	}

	#getClickEventBuilder(): Builder.RepeatSale.Banner.ClickEvent
	{
		const type = this.#analytics.type;
		const subSection = this.#analytics.subSection;

		return Builder.RepeatSale.Banner.ClickEvent.createDefault(type, subSection);
	}
}
