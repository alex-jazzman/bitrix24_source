import { Dom, Tag, Loc } from 'main.core';
import { Button, AirButtonStyle, ButtonSize } from 'ui.buttons';
import { PasswordInput } from 'ui.system.input';
import { CollapsibleCard } from '../card/collapsible-card';
import { CardHint } from '../card/card-hint';
import { SettingsApi } from '../api/settings-api';
import { type EncryptionKeyData, type CardConstructorOptions } from '../types';
import './encryption-key-card.css';

declare const BX: any;

export class EncryptionKeyCard
{
	#card: CollapsibleCard;
	#key: string;
	#componentName: string;
	#signedParameters: string;
	#keyField: PasswordInput | null = null;
	#refreshButton: Button | null = null;

	constructor(
		data: EncryptionKeyData,
		componentName: string,
		signedParameters: string,
		options: CardConstructorOptions = {},
	)
	{
		this.#key = data.key;
		this.#componentName = componentName;
		this.#signedParameters = signedParameters;

		this.#card = new CollapsibleCard({
			id: 'encryption-key',
			title: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_TITLE') ?? '',
			iconClass: '--o-key',
			collapsed: options.collapsed,
		});
	}

	getLayout(): HTMLElement
	{
		const layout = this.#card.getLayout();
		const content = this.#card.getContentContainer();

		const hint = new CardHint({
			text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_HINT') ?? '',
			link: {
				text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LINK_MORE') ?? '',
				helpCode: '20337242',
			},
		});
		Dom.append(hint.getLayout(), content);

		this.#keyField = new PasswordInput({
			value: this.#key,
			copyable: true,
			stretched: true,
		});

		const fieldElement = this.#keyField.render();
		Dom.addClass(fieldElement, 'biconnector-settings-key__field');
		this.#lockInput(fieldElement);
		Dom.append(fieldElement, content);

		this.#refreshButton = new Button({
			text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_REFRESH') ?? '',
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE_ACCENT_2,
			size: ButtonSize.SMALL,
			icon: 'o-refresh',
			onclick: () => {
				void this.#refreshKey();
			},
		} as any);

		const buttonsRow: HTMLElement = Tag.render`
			<div class="biconnector-settings-card__action-row"></div>
		`;
		this.#refreshButton.renderTo(buttonsRow);
		Dom.append(buttonsRow, content);

		return layout;
	}

	#lockInput(fieldElement: HTMLElement): void
	{
		const input = fieldElement.querySelector('input');
		if (input)
		{
			input.readOnly = true;
		}
	}

	async #refreshKey(): Promise<void>
	{
		this.#setRefreshSpinning(true);

		try
		{
			const response = await SettingsApi.changeBiToken(
				this.#componentName,
				this.#signedParameters,
			);

			const newKey = response.data;
			if (!newKey)
			{
				BX.UI.Notification.Center.notify({
					content: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_REFRESH_ERROR'),
					autoHideDelay: 2000,
				});

				return;
			}

			this.#key = newKey;
			this.#keyField?.setValue(newKey);
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_REFRESHED'),
				autoHideDelay: 2000,
			});
		}
		catch
		{
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_REFRESH_ERROR'),
				autoHideDelay: 2000,
			});
		}
		finally
		{
			this.#setRefreshSpinning(false);
		}
	}

	#setRefreshSpinning(spinning: boolean): void
	{
		if (!this.#refreshButton)
		{
			return;
		}

		const icon = this.#refreshButton.getContainer().querySelector('.ui-icon-set') as HTMLElement;
		if (icon)
		{
			Dom.toggleClass(icon, 'biconnector-settings-card__icon--spinning', spinning);
		}
	}
}
