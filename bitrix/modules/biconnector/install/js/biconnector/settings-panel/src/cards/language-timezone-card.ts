import { Dom, Tag, Type, Loc } from 'main.core';
import { Button, AirButtonStyle, ButtonSize } from 'ui.buttons';
import { CollapsibleCard } from '../card/collapsible-card';
import { CardHint } from '../card/card-hint';
import { SettingsApi } from '../api/settings-api';
import { type LanguageTimezoneData, type CardConstructorOptions } from '../types';
import './language-timezone-card.css';

declare const BX: any;

export class LanguageTimezoneCard
{
	#card: CollapsibleCard;
	#data: LanguageTimezoneData;
	#componentName: string;
	#signedParameters: string;
	#languageValue: HTMLElement | null = null;
	#timezoneValue: HTMLElement | null = null;

	constructor(
		data: LanguageTimezoneData,
		componentName: string,
		signedParameters: string,
		options: CardConstructorOptions = {},
	)
	{
		this.#data = data;
		this.#componentName = componentName;
		this.#signedParameters = signedParameters;

		this.#card = new CollapsibleCard({
			id: 'language-timezone',
			title: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LANG_TZ_TITLE') ?? '',
			iconClass: '--o-earth',
			collapsed: options.collapsed,
		});
	}

	getLayout(): HTMLElement
	{
		const layout = this.#card.getLayout();
		const content = this.#card.getContentContainer();

		const hint = new CardHint({
			text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LANG_TZ_HINT') ?? '',
		});
		Dom.append(hint.getLayout(), content);

		this.#languageValue = Tag.render`
			<span class="biconnector-settings-lang-tz__value">${this.#data.currentLanguage}</span>
		`;
		this.#timezoneValue = Tag.render`
			<span class="biconnector-settings-lang-tz__value">${this.#data.currentTimeZone}</span>
		`;

		const infoBlock: HTMLElement = Tag.render`
			<div class="biconnector-settings-lang-tz__info">
				<div class="biconnector-settings-lang-tz__row">
					<span class="biconnector-settings-lang-tz__label">
						${Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LANG_TZ_LANGUAGE') ?? ''}
					</span>
					${this.#languageValue}
				</div>
				<div class="biconnector-settings-lang-tz__row">
					<span class="biconnector-settings-lang-tz__label">
						${Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LANG_TZ_TIMEZONE') ?? ''}
					</span>
					${this.#timezoneValue}
				</div>
			</div>
		`;
		Dom.append(infoBlock, content);

		const button = new Button({
			text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LANG_TZ_BUTTON') ?? '',
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE_ACCENT_2,
			size: ButtonSize.SMALL,
			icon: 'o-settings',
			onclick: () => {
				this.#openSettings();
			},
		} as any);

		const buttonContainer: HTMLElement = Tag.render`
			<div class="biconnector-settings-card__action-row"></div>
		`;
		button.renderTo(buttonContainer);
		Dom.append(buttonContainer, content);

		return layout;
	}

	#openSettings(): void
	{
		this.#suppressIntranetReloadAfterClose();

		(top as any).BX.SidePanel.Instance.open(this.#data.settingsUrl, {
			cacheable: false,
			width: 1034,
			events: {
				onCloseComplete: () => {
					void this.#refreshData();
				},
			},
		});
	}

	// Intranet settings slider redirects the host page (e.g. to /online/) after
	// save unless the consumer flips reloadAfterClose=false on the save payload.
	// We don't want the host grid to reload just because the user changed the
	// portal language from our settings panel.
	#suppressIntranetReloadAfterClose(): void
	{
		const hostBX = (top as any)?.BX;
		const HostEmitter = hostBX?.Event?.EventEmitter;
		if (!HostEmitter)
		{
			return;
		}

		HostEmitter.subscribeOnce(
			HostEmitter.GLOBAL_TARGET,
			'SidePanel.Slider:onLoad',
			(baseEvent: any) => {
				const slider = baseEvent.getTarget();
				const innerBX = slider?.getWindow?.()?.BX;
				const InnerEmitter = innerBX?.Event?.EventEmitter;
				if (!InnerEmitter)
				{
					return;
				}

				InnerEmitter.subscribeOnce(
					InnerEmitter.GLOBAL_TARGET,
					'BX.Intranet.Settings:onSuccessSave',
					(innerEvent: any) => {
						const extraSettings = innerEvent.getData();
						if (extraSettings && typeof extraSettings === 'object')
						{
							extraSettings.reloadAfterClose = false;
						}
					},
				);
			},
		);
	}

	async #refreshData(): Promise<void>
	{
		try
		{
			const [langResponse, tzResponse] = await Promise.all([
				SettingsApi.getDashboardLanguage(this.#componentName, this.#signedParameters),
				SettingsApi.getTimeZone(this.#componentName, this.#signedParameters),
			]);

			const language = langResponse.data?.currentLanguage;
			if (Type.isStringFilled(language) && this.#languageValue)
			{
				this.#languageValue.textContent = language;
			}

			const timeZone = tzResponse.data?.currentTimeZone;
			if (Type.isStringFilled(timeZone) && this.#timezoneValue)
			{
				this.#timezoneValue.textContent = timeZone;
			}
		}
		catch
		{
			// silent fail on refresh
		}
	}
}
