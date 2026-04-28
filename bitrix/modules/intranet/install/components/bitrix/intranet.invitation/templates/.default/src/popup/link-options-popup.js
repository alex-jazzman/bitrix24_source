import { CloseIconSize, Popup } from 'main.popup';
import { Switcher, SwitcherSize } from 'ui.switcher';
import { Input, InputDesign } from 'ui.system.input';
import { Dom, Event, Loc, Tag, Text } from 'main.core';
import { AirButtonStyle, ButtonState, CancelButton, SaveButton } from 'ui.buttons';
import { BaseEvent } from 'main.core.events';
import type { Transport } from '../transport';
import { ChipDesign, Chip } from 'ui.system.chip';
import { Analytics } from '../analytics';

export class LinkOptionsPopup
{
	#optionsPopup: Popup;
	#linkRegisterEnabled: boolean;
	#needConfirmRegistration: boolean;
	#isCloud: boolean;
	#allowRegisterWhiteList: Input;
	#transport: Transport;
	#whitelist: string;
	#confirmRegistrationSwitcher: Switcher;
	#allowInviteWithLinkSwitcher: Switcher;
	#onDisable: Function;
	#saveButton: SaveButton;
	#analytics: Analytics;

	constructor(options)
	{
		this.#linkRegisterEnabled = options.linkRegisterEnabled;
		this.#needConfirmRegistration = options.needConfirmRegistration;
		this.#isCloud = options.isCloud;
		this.#transport = options.transport;
		this.#whitelist = options.whiteList;
		this.#onDisable = options.onDisable;
		this.#analytics = options.analytics;
	}

	show(): void
	{
		this.#getPopup().show();
	}

	#getPopup(): Popup
	{
		this.#optionsPopup ??= new Popup({
			id: 'intranet-invitation-link-options-popup',
			content: this.#getPopupContent(),
			closeByEsc: true,
			closeIcon: true,
			closeIconSize: CloseIconSize.LARGE,
			autoHide: true,
			padding: 0,
			overlay: {
				backgroundColor: 'rgba(0, 32, 78, 0.46)',
			},
			events: {
				onClose: this.#resetOptions.bind(this),
			},
		});

		return this.#optionsPopup;
	}

	#getPopupContent(): HTMLElement
	{
		const allowInviteWithLinkSwitcherContainer = Tag.render`
			<div class="intranet-invitation-popup__switcher">
				<div class="intranet-invitation-popup__switcher-header">
					${this.#getAllowInviteWithLinkSwitcher().getNode()}
					<span class="intranet-invitation-popup__switcher-title">${Loc.getMessage('INTRANET_INVITE_ALLOW_INVITATION_LINK')}</span>
				</div>
				<div class="intranet-invitation-popup__switcher-description">${Loc.getMessage('INTRANET_INVITE_ALLOW_INVITATION_LINK_HINT')}</div>
			</div>
		`;

		const confirmRegistrationSwitcherContainer = Tag.render`
			<div class="intranet-invitation-popup__switcher">
				<div class="intranet-invitation-popup__switcher-header">
					${this.#getConfirmRegistrationSwitcher().getNode()}
					<span class="intranet-invitation-popup__switcher-title">${Loc.getMessage('INTRANET_INVITE_DIALOG_FAST_REG_TYPE')}</span>
				</div>
			</div>
		`;

		const optionsContainer = Tag.render`
			<div class="intranet-invitation-popup__body --divided">
				<div class="intranet-invitation-popup__item">
					${allowInviteWithLinkSwitcherContainer}
				</div>
			</div>
		`;

		if (this.#isCloud)
		{
			Dom.append(Tag.render`
				<div class="intranet-invitation-popup__item">
					${confirmRegistrationSwitcherContainer}
					${this.#getAllowRegisterWhiteList().render()}
				</div>
			`, optionsContainer);
		}

		return Tag.render`
			<div class="intranet-invitation-popup">
				<div class="intranet-invitation-popup__title">
					<span class="ui-headline --sm">${Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_OPTIONS')}</span>
				</div>
				${optionsContainer}
				<div class="intranet-invitation-popup__footer">
					<div class="intranet-invitation-popup__footer-button-container">
						${this.#getSaveButton().render()}
						${this.#getCancelButton().render()}
					</div>
					${this.#renderRegenerateSecretButton()}
				</div>
			</div>
		`;
	}

	#renderRegenerateSecretButton(): HTMLElement
	{
		const regenerateSecretButton = Tag.render`
			<div class="intranet-invitation-popup__footer-link" id="invite-link-options-popup-regenerate-button">
				<i class="ui-icon-set --o-refresh"></i>
				<span class="ui-link ui-link-secondary ui-link-dashed">${Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_OPTIONS_BUTTON_UPDATE')}</span>
			</div>
		`;
		Event.bind(regenerateSecretButton, 'click', this.#regenerateSecret.bind(this));

		return regenerateSecretButton;
	}

	#getSaveButton(): Button
	{
		this.#saveButton ??= new SaveButton({
			id: 'invite-link-options-popup-save-button',
			useAirDesign: true,
			style: AirButtonStyle.FILLED,
			onclick: () => {
				if (this.#saveButton.isWaiting())
				{
					return;
				}

				const whiteListChipsToSave = this.#getAllowRegisterWhiteList()
					.getChips()
					.filter((chip: Chip) => chip.getDesign() !== ChipDesign.TintedAlert);
				const whiteList = whiteListChipsToSave
					.map((chip: Chip) => chip.getText())
					.join(';');

				this.#saveButton.setState(ButtonState.WAITING);
				this.#transport.send(
					{
						action: 'self',
						data: {
							allow_register: this.#getAllowInviteWithLinkSwitcher().isChecked() ? 'Y' : 'N',
							allow_register_secret: Text.getRandom(8),
							allow_register_confirm: this.#getConfirmRegistrationSwitcher().isChecked() ? 'Y' : 'N',
							allow_register_whitelist: whiteList,
						},
					},
					() => {},
				).then(() => {
					this.#linkRegisterEnabled = this.#getAllowInviteWithLinkSwitcher().isChecked();
					this.#needConfirmRegistration = this.#getConfirmRegistrationSwitcher().isChecked();
					this.#whitelist = whiteList;
					this.#addDefaultChips();
					this.#saveButton.setState(null);
					this.#getPopup().close();

					if (!this.#linkRegisterEnabled)
					{
						this.#getPopup().destroy();
						this.#onDisable();
					}
				}).catch((reject) => {
					console.error(reject);
					this.#saveButton.setState(null);
				});
			},
		});

		return this.#saveButton;
	}

	#getCancelButton(): Button
	{
		return new CancelButton({
			id: 'invite-link-options-popup-cancel-button',
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			onclick: () => {
				this.#getPopup().close();
			},
		});
	}

	#getAllowInviteWithLinkSwitcher(): Switcher
	{
		this.#allowInviteWithLinkSwitcher ??= new Switcher({
			id: 'allow-invite-with-link-switcher',
			checked: this.#linkRegisterEnabled,
			size: SwitcherSize.medium,
			useAirDesign: true,
			handlers: {
				// There is in error in Switcher UI, so we have inversion in event names
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
				onChipClear: (chip, event) => {
					this.#allowRegisterWhiteList.removeChip(chip);
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
				// There is in error in Switcher UI, so we have inversion in event names
				unchecked: () => {
					this.#getAllowRegisterWhiteList().setDesign(InputDesign.Grey);
				},
				checked: () => {
					this.#getAllowRegisterWhiteList().setDesign(InputDesign.Disabled);
				},
			},
		});

		return this.#confirmRegistrationSwitcher;
	}

	#resetOptions(): void
	{
		this.#getConfirmRegistrationSwitcher().check(this.#needConfirmRegistration);
		this.#getAllowInviteWithLinkSwitcher().check(this.#linkRegisterEnabled);
		this.#addDefaultChips();
	}

	#regenerateSecret(): void
	{
		this.#transport.send({
			action: 'self',
			data: { allow_register_secret: Text.getRandom(8) },
		}).then((response) => {
			top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_UPDATE_SUCCESS'),
				autoHideDelay: 2500,
			});
			this.#analytics.sendRegenerateLink();
		}).catch((reject) => {
			top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_UPDATE_ERROR'),
				autoHideDelay: 2500,
			});
		});
	}

	#onAllowRegisterWhiteListInput(event: BaseEvent): void
	{
		const specialSymbols = [' ', ',', ';'];

		if (specialSymbols.includes(event.data))
		{
			const value = this.#getAllowRegisterWhiteList().getValue().slice(0, -1).trim();

			if (value.length > 0)
			{
				this.#addChip(value);
				this.#getAllowRegisterWhiteList().setValue('');
			}
		}
	}

	#addDefaultChips(): void
	{
		this.#allowRegisterWhiteList?.removeChips();

		if (this.#whitelist.trim().length > 0)
		{
			this.#whitelist.split(';').forEach((domain: string) => {
				if (domain.trim().length > 0)
				{
					this.#addChip(domain.trim());
				}
			});
		}
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
}
