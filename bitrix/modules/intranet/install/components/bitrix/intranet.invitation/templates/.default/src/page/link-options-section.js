import { Dom, Event, Loc, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Input, InputDesign } from 'ui.system.input';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';
import { Switcher, SwitcherSize } from 'ui.switcher';
import { ChipDesign } from 'ui.system.chip';

export class LinkOptionsSection
{
	#isAdmin: boolean;
	#isCloud: boolean;
	#needConfirmRegistration: boolean;
	#whiteList: string;
	#linkRegisterEnabled: boolean;
	#analytics;
	#transport;

	#allowRegisterWhiteList: Input;
	#confirmRegistrationSwitcher: Switcher;
	#allowInviteWithLinkSwitcher: Switcher;
	#regenerateSecretButton: Button;
	#section: HTMLElement;
	#optionsExpanded: boolean = false;
	#isSaving: boolean = false;
	#isRegenerating: boolean = false;
	#needSaveAfterCurrentRequest: boolean = false;
	#isWhiteListEnterBound: boolean = false;
	#onRegenerateStart: ?Function = null;
	#onRegenerate: ?Function = null;
	#onRegenerateError: ?Function = null;
	#onNeedConfirmRegistrationChange: ?Function = null;
	#onNeedConfirmRegistrationChangeStart: ?Function = null;
	#onNeedConfirmRegistrationChangeEnd: ?Function = null;
	#onExpandedChange: ?Function = null;

	constructor(options)
	{
		this.#isAdmin = options.isAdmin === true;
		this.#isCloud = options.isCloud === true;
		this.#needConfirmRegistration = options.needConfirmRegistration === true;
		this.#whiteList = Type.isStringFilled(options.whiteList) ? options.whiteList : '';
		this.#linkRegisterEnabled = options.linkRegisterEnabled === true;
		this.#analytics = options.analytics;
		this.#transport = options.transport;
		this.#onRegenerateStart = Type.isFunction(options.onRegenerateStart) ? options.onRegenerateStart : null;
		this.#onRegenerate = Type.isFunction(options.onRegenerate) ? options.onRegenerate : null;
		this.#onRegenerateError = Type.isFunction(options.onRegenerateError) ? options.onRegenerateError : null;
		this.#onNeedConfirmRegistrationChange = Type.isFunction(options.onNeedConfirmRegistrationChange)
			? options.onNeedConfirmRegistrationChange
			: null
		;
		this.#onNeedConfirmRegistrationChangeStart = Type.isFunction(options.onNeedConfirmRegistrationChangeStart)
			? options.onNeedConfirmRegistrationChangeStart
			: null
		;
		this.#onNeedConfirmRegistrationChangeEnd = Type.isFunction(options.onNeedConfirmRegistrationChangeEnd)
			? options.onNeedConfirmRegistrationChangeEnd
			: null
		;
		this.#onExpandedChange = Type.isFunction(options.onExpandedChange) ? options.onExpandedChange : null;
	}

	renderSection(): HTMLElement | ''
	{
		if (!this.#isAdmin)
		{
			return '';
		}

		if (this.#section)
		{
			return this.#section;
		}

		const allowInviteWithLinkSwitcherContainer = Tag.render`
			<div class="intranet-invitation-link-options__switcher">
				<div class="intranet-invitation-link-options__switcher-header">
					${this.#getAllowInviteWithLinkSwitcher().getNode()}
					<span class="intranet-invitation-link-options__switcher-title">${Loc.getMessage('INTRANET_INVITE_ALLOW_INVITATION_LINK')}</span>
				</div>
				<div class="intranet-invitation-link-options__switcher-description">${Loc.getMessage('INTRANET_INVITE_ALLOW_INVITATION_LINK_HINT_MSGVER_1')}</div>
			</div>
		`;

		const confirmRegistrationSwitcherContainer = Tag.render`
			<div class="intranet-invitation-link-options__switcher">
				<div class="intranet-invitation-link-options__switcher-header">
					${this.#getConfirmRegistrationSwitcher().getNode()}
					<span class="intranet-invitation-link-options__switcher-title">${Loc.getMessage('INTRANET_INVITE_DIALOG_FAST_REG_TYPE')}</span>
				</div>
			</div>
		`;

		const body = Tag.render`
			<div class="intranet-invitation-link-options__body --divided">
				<div class="intranet-invitation-link-options__item">
					${allowInviteWithLinkSwitcherContainer}
				</div>
			</div>
		`;

		if (this.#isCloud)
		{
			Dom.append(Tag.render`
				<div class="intranet-invitation-link-options__item">
					${confirmRegistrationSwitcherContainer}
					${this.#getAllowRegisterWhiteList().render()}
				</div>
			`, body);
		}

		this.#section = Tag.render`
			<div class="intranet-invitation-block__options-section intranet-invitation-link-options">
				${body}
				<div class="intranet-invitation-link-options__footer">
					${this.#renderRegenerateSecretButton()}
				</div>
			</div>
		`;
		Dom.addClass(this.#section, '--collapsed');
		this.#refreshSectionHeight();
		this.#bindAllowRegisterWhiteListEnterHandler();

		return this.#section;
	}

	toggleSection(): void
	{
		if (this.#optionsExpanded)
		{
			this.#hideSection();

			return;
		}

		this.#showSection();
	}

	#showSection(): void
	{
		if (!this.#section)
		{
			return;
		}

		this.#optionsExpanded = true;
		this.#onExpandedChange?.(true);
		this.#refreshSectionHeight();
		requestAnimationFrame(() => {
			Dom.removeClass(this.#section, '--collapsed');
		});
	}

	#hideSection(): void
	{
		if (!this.#section)
		{
			return;
		}

		this.#optionsExpanded = false;
		this.#onExpandedChange?.(false);
		this.#refreshSectionHeight();
		requestAnimationFrame(() => {
			this.#section?.classList.add('--collapsed');
		});
	}

	#refreshSectionHeight(): void
	{
		if (!this.#section)
		{
			return;
		}

		this.#section.style.setProperty('--link-options-section-height', `${this.#section.scrollHeight}px`);
	}

	#renderRegenerateSecretButton(): HTMLElement
	{
		this.#regenerateSecretButton ??= new Button({
			useAirDesign: true,
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_OPTIONS_BUTTON_UPDATE'),
			style: AirButtonStyle.PLAIN_ACCENT,
			icon: BX.UI.IconSet.Outline.REFRESH,
			props: {
				id: 'invite-link-options-inline-regenerate-button',
			},
			onclick: this.#regenerateSecret.bind(this),
		});

		return this.#regenerateSecretButton.render();
	}

	#getAllowInviteWithLinkSwitcher(): Switcher
	{
		this.#allowInviteWithLinkSwitcher ??= new Switcher({
			id: 'allow-invite-with-link-switcher',
			checked: this.#linkRegisterEnabled,
			size: SwitcherSize.medium,
			useAirDesign: true,
			handlers: {
				unchecked: () => {
					this.#getAllowRegisterWhiteList().setDesign(
						this.#getConfirmRegistrationSwitcher().isChecked() ? InputDesign.Grey : InputDesign.Disabled,
					);
					this.#getConfirmRegistrationSwitcher().disable(false);
				},
				checked: () => {
					this.#getAllowRegisterWhiteList().setDesign(InputDesign.Disabled);
					this.#getConfirmRegistrationSwitcher().disable(true);
				},
				toggled: this.#saveOptions.bind(this),
			},
		});

		return this.#allowInviteWithLinkSwitcher;
	}

	#getAllowRegisterWhiteList(): Input
	{
		if (!this.#allowRegisterWhiteList)
		{
			this.#allowRegisterWhiteList = new Input({
				label: Loc.getMessage('BX24_INVITE_DIALOG_REGISTER_TYPE_DOMAINS'),
				placeholder: 'example.com',
				design: this.#needConfirmRegistration && this.#linkRegisterEnabled ? InputDesign.Grey : InputDesign.Disabled,
				onInput: this.#onAllowRegisterWhiteListInput.bind(this),
				onBlur: this.#onAllowRegisterWhiteListBlur.bind(this),
				onChipClear: (chip) => {
					this.#allowRegisterWhiteList.removeChip(chip);
					this.#refreshSectionHeight();
					this.#allowRegisterWhiteList.focus();
					void this.#saveOptions();
				},
			});
			this.#addDefaultChips();
		}

		return this.#allowRegisterWhiteList;
	}

	#getConfirmRegistrationSwitcher(): Switcher
	{
		this.#confirmRegistrationSwitcher ??= new Switcher({
			id: 'confirm-registration-switcher',
			checked: this.#needConfirmRegistration,
			size: SwitcherSize.medium,
			useAirDesign: true,
			disabled: !this.#linkRegisterEnabled,
			handlers: {
				unchecked: () => {
					this.#getAllowRegisterWhiteList().setDesign(InputDesign.Grey);
				},
				checked: () => {
					this.#getAllowRegisterWhiteList().setDesign(InputDesign.Disabled);
				},
				toggled: this.#saveOptions.bind(this),
			},
		});

		return this.#confirmRegistrationSwitcher;
	}

	#bindAllowRegisterWhiteListEnterHandler(): void
	{
		if (this.#isWhiteListEnterBound)
		{
			return;
		}

		const input = this.#getAllowRegisterWhiteList().render().querySelector('.ui-system-input-value');
		if (!input)
		{
			return;
		}

		Event.bind(input, 'keydown', this.#onAllowRegisterWhiteListKeydown.bind(this));
		this.#isWhiteListEnterBound = true;
	}

	async #regenerateSecret(): Promise<void>
	{
		if (this.#isRegenerating)
		{
			return;
		}

		this.#isRegenerating = true;
		this.#setRegenerateButtonLoadingState(true);
		this.#onRegenerateStart?.();

		try
		{
			await this.#transport.send(
				{
					action: 'self',
					data: { allow_register_secret: Text.getRandom(8) },
				},
				(reject) => {
					this.#transport.onError(reject);
					throw reject;
				},
			);

			top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_UPDATE_SUCCESS'),
				autoHideDelay: 2500,
			});
			this.#analytics.sendRegenerateLink();
			await this.#onRegenerate?.();
		}
		catch
		{
			this.#onRegenerateError?.();
			top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_UPDATE_ERROR'),
				autoHideDelay: 2500,
			});
		}
		finally
		{
			this.#isRegenerating = false;
			this.#setRegenerateButtonLoadingState(false);
		}
	}

	#setRegenerateButtonLoadingState(isLoading: boolean): void
	{
		this.#regenerateSecretButton?.setState(isLoading ? ButtonState.WAITING : null);
	}

	#onAllowRegisterWhiteListBlur(): void
	{
		this.#commitWhiteListInput();
	}

	#onAllowRegisterWhiteListInput(event: InputEvent): void
	{
		if (![' ', ','].includes(event.data))
		{
			return;
		}

		this.#collectWhiteListInputValue(false);
	}

	#onAllowRegisterWhiteListKeydown(event: KeyboardEvent): void
	{
		if (event.key !== 'Enter')
		{
			return;
		}

		event.preventDefault();
		this.#commitWhiteListInput();
	}

	#addDefaultChips(): void
	{
		this.#allowRegisterWhiteList?.removeChips();

		if (this.#whiteList.trim().length > 0)
		{
			this.#whiteList.split(';').forEach((domain: string) => {
				if (domain.trim().length > 0)
				{
					this.#addChip(domain.trim());
				}
			});
		}

		this.#refreshSectionHeight();
	}

	#addChip(value: string): void
	{
		if (this.#isValidDomain(value))
		{
			this.#allowRegisterWhiteList?.addChip({
				text: value,
				design: ChipDesign.TintedSuccess,
				withClear: true,
			});
		}
		else
		{
			this.#allowRegisterWhiteList?.addChip({
				text: value,
				design: ChipDesign.TintedAlert,
				withClear: true,
			});
		}
	}

	#isValidDomain(domain: string): boolean
	{
		if (!domain)
		{
			return true;
		}

		const domainPattern = /^(?:[\da-z](?:[\da-z-]{0,61}[\da-z])?\.)+[a-z]{2,}$/i;

		return domainPattern.test(domain);
	}

	#getWhiteListValue(): string
	{
		return this.#getAllowRegisterWhiteList()
			.getChips()
			.filter((chip) => chip.getDesign() !== ChipDesign.TintedAlert)
			.map((chip) => chip.getText())
			.join(';')
		;
	}

	#commitWhiteListInput(): void
	{
		this.#collectWhiteListInputValue(true);
	}

	#collectWhiteListInputValue(shouldSave: boolean): void
	{
		const input = this.#getAllowRegisterWhiteList();
		const normalizedValue = input
			.getValue()
			.replace(/[,\s]+$/g, '')
			.trim()
		;

		if (normalizedValue.length > 0)
		{
			this.#addChip(normalizedValue);
			input.setValue('');
			this.#refreshSectionHeight();
		}

		if (shouldSave)
		{
			void this.#saveOptions();
		}
	}

	async #saveOptions(): Promise<void>
	{
		const allowRegister = this.#getAllowInviteWithLinkSwitcher().isChecked();
		const needConfirmRegistration = this.#getConfirmRegistrationSwitcher().isChecked();
		const whiteList = this.#getWhiteListValue();
		const isNeedConfirmRegistrationChanged = needConfirmRegistration === this.#needConfirmRegistration;

		if (
			allowRegister === this.#linkRegisterEnabled
			&& needConfirmRegistration === this.#needConfirmRegistration
			&& whiteList === this.#whiteList
		)
		{
			return;
		}

		if (this.#isSaving)
		{
			this.#needSaveAfterCurrentRequest = true;

			return;
		}

		this.#isSaving = true;
		this.#needSaveAfterCurrentRequest = false;
		this.#setSavingState(true);

		if (isNeedConfirmRegistrationChanged)
		{
			this.#onNeedConfirmRegistrationChangeStart?.();
			await this.#waitForNextFrame();
		}

		const savedLinkRegisterEnabled = this.#linkRegisterEnabled;
		const savedNeedConfirmRegistration = this.#needConfirmRegistration;
		const savedWhiteList = this.#whiteList;

		try
		{
			await this.#transport.send(
				{
					action: 'self',
					data: {
						allow_register: allowRegister ? 'Y' : 'N',
						allow_register_confirm: needConfirmRegistration ? 'Y' : 'N',
						allow_register_whitelist: whiteList,
					},
				},
				(reject) => {
					this.#transport.onError(reject);
					throw reject;
				},
			);

			this.#linkRegisterEnabled = allowRegister;
			this.#needConfirmRegistration = needConfirmRegistration;
			this.#whiteList = whiteList;
			this.#onNeedConfirmRegistrationChange?.(this.#needConfirmRegistration);

			if (!this.#linkRegisterEnabled)
			{
				EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:selfChange', {
					selfEnabled: false,
				});
			}
		}
		catch (reject)
		{
			this.#linkRegisterEnabled = savedLinkRegisterEnabled;
			this.#needConfirmRegistration = savedNeedConfirmRegistration;
			this.#whiteList = savedWhiteList;
			this.#getAllowInviteWithLinkSwitcher().check(this.#linkRegisterEnabled, false);
			this.#getConfirmRegistrationSwitcher().check(this.#needConfirmRegistration, false);
			this.#getConfirmRegistrationSwitcher().disable(!this.#linkRegisterEnabled, false);
			this.#addDefaultChips();
			console.error(reject);
		}
		finally
		{
			if (isNeedConfirmRegistrationChanged)
			{
				this.#onNeedConfirmRegistrationChangeEnd?.();
			}

			this.#isSaving = false;
			this.#setSavingState(false);

			if (this.#needSaveAfterCurrentRequest)
			{
				void this.#saveOptions();
			}
		}
	}

	#waitForNextFrame(): Promise<void>
	{
		return new Promise((resolve) => {
			requestAnimationFrame(() => resolve());
		});
	}

	#setSavingState(isSaving: boolean): void
	{
		this.#allowInviteWithLinkSwitcher?.setLoading(isSaving);
		this.#confirmRegistrationSwitcher?.setLoading(isSaving);
		this.#getAllowRegisterWhiteList().setDesign(
			isSaving
				? InputDesign.Disabled
				: (this.#getConfirmRegistrationSwitcher().isChecked() && this.#getAllowInviteWithLinkSwitcher().isChecked()
					? InputDesign.Grey
					: InputDesign.Disabled),
		);
	}
}
