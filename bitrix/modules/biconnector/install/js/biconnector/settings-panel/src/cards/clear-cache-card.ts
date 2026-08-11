import { Dom, Tag, Event, Loc } from 'main.core';
import { Button, AirButtonStyle, ButtonSize } from 'ui.buttons';
import { Countdown } from 'ui.countdown';
import 'ui.hint';
import { CollapsibleCard } from '../card/collapsible-card';
import { CardHint } from '../card/card-hint';
import { SettingsApi } from '../api/settings-api';
import { type ClearCacheData, type CardConstructorOptions } from '../types';

declare const BX: any;

export class ClearCacheCard
{
	#card: CollapsibleCard;
	#button: Button | null = null;
	#canClear: boolean;
	#timeout: number;
	#hint: any = null;

	constructor(data: ClearCacheData, options: CardConstructorOptions = {})
	{
		this.#canClear = data.canClearCache;
		this.#timeout = data.clearCacheTimeout ?? 0;

		this.#card = new CollapsibleCard({
			id: 'clear-cache',
			title: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_TITLE') ?? '',
			iconClass: '--o-refresh',
			collapsed: options.collapsed,
		});
	}

	getLayout(): HTMLElement
	{
		const layout = this.#card.getLayout();
		const content = this.#card.getContentContainer();

		const hint = new CardHint({
			text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_HINT') ?? '',
			link: {
				text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LINK_MORE') ?? '',
				helpCode: '21000502',
			},
		});

		Dom.append(hint.getLayout(), content);

		this.#button = new Button({
			text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_BUTTON') ?? '',
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE_ACCENT_2,
			size: ButtonSize.SMALL,
			icon: 'o-refresh',
			onclick: () => {
				this.#clearCache();
			},
		} as any);

		if (!this.#canClear)
		{
			this.#button.setDisabled(true);
			this.#initCountdown();
		}

		const buttonContainer: HTMLElement = Tag.render`
			<div class="biconnector-settings-card__action-row"></div>
		`;
		this.#button.renderTo(buttonContainer);
		Dom.append(buttonContainer, content);

		this.#initButtonHint();

		return layout;
	}

	#initButtonHint(): void
	{
		if (!this.#button)
		{
			return;
		}

		const node = this.#button.getContainer();
		this.#hint = BX.UI.Hint.createInstance({
			popupParameters: {
				offsetLeft: -60,
				angle: {
					offset: 160,
				},
			},
		});

		Event.bind(node, 'mouseenter', () => {
			if (this.#timeout > 0)
			{
				node.setAttribute('data-hint-no-icon', '');
				const minutesLeft = Math.ceil(this.#timeout / 60);
				this.#hint.show(
					node,
					Loc.getMessagePlural(
						'BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_HINT_TIME_LEFT',
						minutesLeft,
						{ '#COUNT#': String(minutesLeft) },
					),
				);
			}
		});

		Event.bind(node, 'mouseleave', () => {
			this.#hint.hide(node);
		});
	}

	async #clearCache(): Promise<void>
	{
		if (!this.#canClear || !this.#button)
		{
			return;
		}

		this.#setButtonSpinning(true);
		this.#canClear = false;

		try
		{
			const response = await SettingsApi.clearCache();
			this.#setButtonSpinning(false);
			this.#button.setDisabled(true);
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_SUCCESS'),
				autoHideDelay: 2000,
			});
			this.#timeout = response.data.timeoutToNextClearCache;
			this.#initCountdown();
		}
		catch
		{
			this.#setButtonSpinning(false);
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_ERROR'),
				autoHideDelay: 2000,
			});
			this.#button.setDisabled(false);
			this.#canClear = true;
		}
	}

	#setButtonSpinning(spinning: boolean): void
	{
		if (!this.#button)
		{
			return;
		}

		const icon = this.#button.getContainer().querySelector('.ui-icon-set') as HTMLElement;
		if (icon)
		{
			Dom.toggleClass(icon, 'biconnector-settings-card__icon--spinning', spinning);
		}
	}

	#initCountdown(): void
	{
		if (this.#timeout <= 0)
		{
			return;
		}

		new Countdown({
			seconds: this.#timeout,
			onTimerEnd: () => {
				this.#canClear = true;
				this.#button?.setDisabled(false);
			},
			onTimerUpdate: (data: { seconds: number }) => {
				this.#timeout = data.seconds;
			},
		} as any);
	}
}
