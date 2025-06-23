import { ajax as Ajax, Loc, Tag } from 'main.core';
import 'ui.design-tokens';
import { Footer } from '../footer';
import type { WidgetParams, WidgetTypeEnum } from '../widget';
import { WidgetType } from '../widget';
import { Base } from './base';

export class Start extends Base
{
	#isFlowStarted: ?boolean = null;
	#showSettingsButton: boolean = true;

	constructor(params: WidgetParams)
	{
		super(params);

		this.#showSettingsButton = params.showSettingsButton ?? true;
	}

	getType(): WidgetTypeEnum
	{
		return WidgetType.start;
	}

	onClose(): void
	{
		super.onClose();

		void Ajax.runAction('crm.repeatsale.widget.incrementShowedFlowStartCount');
	}

	getPopupContent(data: Object): HTMLElement
	{
		if (this.#isFlowStarted === null)
		{
			const { isFlowStarted } = data;
			this.#isFlowStarted = isFlowStarted;
		}

		return Tag.render`
			<div>
				<header class="crm-rs__w-header">
					${this.#getTitle(data)}
				</header>
				<div class="crm-rs__w-body">
					<div class="crm-rs__w-body-content">
						<div class="crm-rs__w-body-title">
							${this.#getBodyTitle(data)}
						</div>
						${this.#getButton(data)}
					</div>
					<div class="crm-rs__w-body-bubble ${this.#isFlowStarted ? '--flow-started' : ''}">
						${this.renderLottieAnimation()}
						<div class="crm-rs__w-body-icon"></div>
					</div>
				</div>
				<footer class="crm-rs__w-footer">
					${this.#getFooterContent(data)}
				</footer>
			</div>
		`;
	}

	#getTitle(data: Object): string | HTMLElement
	{
		if (this.#isFlowStarted)
		{
			return Tag.render`
				<span>${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_FLOW_STARTED_POPUP_TITLE')}</span>
			`;
		}

		const code = (
			this.#hasClients(data)
				? 'CRM_REPEAT_SALE_WIDGET_START_POPUP_TITLE_WITH_CLIENTS'
				: 'CRM_REPEAT_SALE_WIDGET_START_POPUP_TITLE_WITHOUT_CLIENTS'
		);

		return Loc.getMessage(code);
	}

	#getBodyTitle(data: Object): string | HTMLElement
	{
		if (this.#isFlowStarted)
		{
			return Tag.render`
				<span>${Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_FLOW_STARTED_TITLE')}</span>
			`;
		}

		const hasClients = this.#hasClients(data);

		const code = (
			hasClients
				? 'CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_TITLE_WITH_CLIENTS'
				: 'CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_TITLE_WITHOUT_CLIENTS'
		);

		if (hasClients)
		{
			return Loc.getMessagePlural(code, data.count, { '#COUNT#': data.count });
		}

		return Loc.getMessage(code);
	}

	#getButton(data: Object): ?string
	{
		if (this.#isFlowStarted)
		{
			return null;
		}

		const hasClients = this.#hasClients(data);

		const code = (
			hasClients
				? 'CRM_REPEAT_SALE_WIDGET_START_POPUP_BTN_WITH_CLIENTS'
				: 'CRM_REPEAT_SALE_WIDGET_START_POPUP_BTN_WITHOUT_CLIENTS'
		);

		return Tag.render`
			<div class="crm-rs__w-body-title-btn ${hasClients ? '--has-clients' : ''}">
				<span
					onclick="${this.#onButtonClick.bind(this, data)}"
				>${Loc.getMessage(code)}</span>
			</div>
		`;
	}

	#getFooterContent(data: Object): HTMLElement
	{
		if (this.#isFlowStarted)
		{
			const footer = new Footer(this.#showSettingsButton);

			return footer.getFooterContent();
		}

		const code = (
			this.#hasClients(data)
				? 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITH_CLIENTS'
				: 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITHOUT_CLIENTS'
		);

		return Loc.getMessage(code);
	}

	#onButtonClick(data: Object): void
	{
		if (this.#hasClients(data))
		{
			Ajax
				.runAction('crm.repeatsale.flow.enable')
				.then(
					(response) => {
						if (response.status === 'success')
						{
							this.#isFlowStarted = true;
							this.setPopupContent(this.getPopupContent(data));

							return;
						}

						this.showError();
						this.close();
					},
					(response) => {
						this.showError();
						this.close();
					},
				)
				.catch((response) => {
					this.showError();
					this.close();
				})
			;
		}
		else
		{
			// @todo
			alert('empty clients, need show manual');

			void Ajax.runAction('crm.repeatsale.widget.finalizeShowedFlowStart');
		}
	}

	#hasClients(data: Object): boolean
	{
		return data.count > 0;
	}

	getFetchUrl(): string
	{
		return 'crm.repeatsale.statistics.getInitData';
	}

	getFetchParams(): Object
	{
		return {};
	}
}