import { Builder } from 'crm.integration.analytics';
import { Extension, Loc, Tag, Type } from 'main.core';
import { sendData } from 'ui.analytics';
import 'ui.feedback.form';
import { SidePanel } from 'ui.sidepanel';
import 'ui.system.highlighter';

type Analytics = {
	type: string,
	subSection: string,
}

type FooterOptions = {
	showSettingsButton?: boolean,
	analytics?: Analytics,
	isGlowingSettingsButton?: boolean,
}

export class Footer
{
	#showSettingsButton: boolean = false;
	#isGlowingSettingsButton: boolean = false;
	#analytics: Analytics = {};

	constructor(options: FooterOptions = {})
	{
		this.#showSettingsButton = options.showSettingsButton ?? false;
		this.#isGlowingSettingsButton = options.isGlowingSettingsButton ?? false;
		this.#analytics = options.analytics ?? {};
	}

	getFooterContent(): HTMLElement
	{
		return Tag.render`
			<div>
				<div class="crm-rs__w-footer-row">
					${this.#getFeedbackButton()}
					${this.#getSettingsButton()}
				</div>
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
				onkeydown="${(event) => this.#onButtonKeyDown(event, this.#onFeedbackClick.bind(this))}"
				class="crm-rs__w-footer-button --feedback"
				data-testid="repeat-sale-widget-footer-feedback"
				role="button"
				tabindex="0"
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
				onkeydown="${(event) => this.#onButtonKeyDown(event, this.#onSettingsClick.bind(this))}"
				class="crm-rs__w-footer-button --settings ${this.#isGlowingSettingsButton ? '--glowing' : ''}"
				data-testid="repeat-sale-widget-footer-settings"
				role="button"
				tabindex="0"
			>
				${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_FOOTER_SETTINGS')}
				${this.#isGlowingSettingsButton ? '<span class="ui-highlighter --with-glow --glow-md --border-md"></span>' : ''}
			</div>
		`;
	}

	// Both footer buttons are divs, so the browser turns neither Enter nor Space into a click on its
	// own, and Space would scroll the popup instead.
	#onButtonKeyDown(event: KeyboardEvent, activate: Function): void
	{
		if (event.key !== 'Enter' && event.key !== ' ')
		{
			return;
		}

		event.preventDefault();
		activate();
	}

	#onSettingsClick(): void
	{
		const eventBuilder = this.#getClickEventBuilder();
		eventBuilder.setElement('config');
		sendData(eventBuilder.buildData());

		SidePanel.Instance.open('/crm/repeat-sale-segment/');
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
