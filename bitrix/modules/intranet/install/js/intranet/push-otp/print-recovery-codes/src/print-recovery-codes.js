import { Tag, Dom, Text, Loc, Event, Extension } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import './style.css';

export class PrintRecoveryCodes
{
	#options: Object;
	#content: HTMLElement;

	constructor(options)
	{
		this.#options = options;
	}

	renderTo(container: HTMLElement): void
	{
		Dom.append(this.#getContent(), container);
		Event.bind(window, 'afterprint', () => {
			SidePanel.Instance.getTopSlider().close();
		});
		window.print();
	}

	#getContent(): HTMLElement
	{
		if (!this.#content)
		{
			const logoUrl = Extension
				.getSettings('intranet.push-otp.print-recovery-codes')
				.get('logoUrl');
			this.#content = Tag.render`
				<div class="intranet-otp-codes-print-page__wrapper">
					<div class="intranet-otp-codes-print-page__header">
						<img 
							src="${logoUrl}"
							width="134"
							height="27"
							alt="logo"
						>
					</div>
					${this.#createDescription()}
					${this.#createManual()}
					${this.#createList()}
				</div>
			`;
		}

		return this.#content;
	}

	#createDescription(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-otp-codes-print-page__section">
				<div class="intranet-otp-codes-print-page-section__title">${Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_TITLE')}</div>
				<div class="intranet-otp-codes-print-page-section__description">${Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_DESCRIPTION', { '#DOMAIN#': this.#options.domain })}</div>
			</div>
		`;
	}

	#createManual(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-otp-codes-print-page__section">
				<div class="intranet-otp-codes-print-page-section__title">${Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_MANUAL_TITLE')}</div>
				<ol class="intranet-otp-codes-print-page-section__list">
					<li class="ui-text --md">${Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_MANUAL_STEP_1')}</li>
					<li class="ui-text --md">${Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_MANUAL_STEP_2')}</li>
					<li class="ui-text --md">${Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_MANUAL_STEP_3')}</li>
				</ol>
			</div>
		`;
	}

	#createList(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-otp-codes-print-page__section">
				<div class="intranet-otp-codes-print-page-section__title">${Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_LIST_TITLE')}</div>
				${this.#createRecoveryCodesGrid()}
				${this.#createRecoveryCodesDescription()}
			</div>
		`;
	}

	#createRecoveryCodesGrid(): HTMLElement
	{
		const grid = Tag.render`<ol class="intranet-otp-codes-print-page__grid ui-alert ui-alert-secondary"/>`;
		const container = Tag.render`
			<div class="intranet-otp-codes-print-page__grid-wrapper">
				${grid}
			</div>
		`;
		this.#setRecoveryCodes(grid);

		return container;
	}

	#setRecoveryCodes(container: HTMLElement): void
	{
		this.#options.codes.forEach((code) => {
			Dom.append(Tag.render`
				<li class="ui-text --sm intranet-otp-codes-print-page__grid-item">
					${Text.encode(code.VALUE)}
				</li>
			`, container);
		});
	}

	#createRecoveryCodesDescription(): HTMLElement
	{
		return Tag.render`
			<ul class="intranet-otp-codes-print-page-section__list --sm">
				<li class="ui-text --2xs">${Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_LIST_EXPLANATION_1')}</li>
				<li class="ui-text --2xs">${Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_LIST_EXPLANATION_2')}</li>
				<li class="ui-text --2xs">${Loc.getMessage('INTRANET_PUSH_OTP_PRINT_RECOVERY_CODES_LIST_EXPLANATION_3')}</li>
			</ul>
		`;
	}
}
