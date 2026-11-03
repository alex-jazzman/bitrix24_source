import { AhaMoment } from 'biconnector.aha-moment';
import { resolveErrorHtml } from 'biconnector.error-message';
import { ajax as Ajax, Dom, Loc, Reflection, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PopupWindowManager } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';

const TRANSPORT_ERROR_CODE = 'NETWORK_ERROR';
const BUTTON_ICON_START = 'ui-btn-icon-start';
const BUTTON_ICON_STOP = 'ui-btn-icon-stop';

// the remainder is always counted by the server: client clocks differ from it and round the value up
type ExternalStatState = {
	active: boolean,
	hoursLeft: number,
};

type ExternalStatOnboarding = {
	canShow: boolean,
	id: ?string,
	showDelaySeconds: ?number,
};

type ExternalStatLabels = {
	enable: string,
	enabled: string,
};

type UsageStatGridManagerProps = {
	gridId: string,
	externalStat: ?{
		buttonId: string,
		bannerId: string,
		active: boolean,
		hoursLeft: number,
		labels: ?ExternalStatLabels,
		onboarding: ?ExternalStatOnboarding,
	},
};

/**
 * @namespace BX.BIConnector
 */
class UsageStatGridManager
{
	#gridId: string;
	#externalStatButtonId: string;
	#externalStatBannerId: string;
	#isExternalStatEnabled: boolean;
	#externalStatHoursLeft: number;
	#isExternalStatToggling: boolean = false;
	#externalStatLabels: ExternalStatLabels;
	#onboardingOptions: ?ExternalStatOnboarding;
	#isOnboardingShown: boolean = false;

	constructor(props: UsageStatGridManagerProps)
	{
		this.#gridId = props.gridId;
		this.#externalStatButtonId = props.externalStat?.buttonId ?? '';
		this.#externalStatBannerId = props.externalStat?.bannerId ?? '';
		this.#externalStatLabels = props.externalStat?.labels ?? { enable: '', enabled: '' };
		this.#onboardingOptions = props.externalStat?.onboarding ?? null;
		this.#setExternalStatState(props.externalStat);
		this.#initHints();
		EventEmitter.subscribe('Grid::updated', () => this.#initHints());
	}

	#getGrid(): ?BX.Main.grid
	{
		const manager = BX.Main.gridManager.getById(this.#gridId);

		return manager ? manager.instance : null;
	}

	#initHints(): void
	{
		const grid = this.#getGrid();
		if (!grid)
		{
			return;
		}

		const manager = BX.UI.Hint.createInstance({
			popupParameters: {
				autoHide: true,
				offsetLeft: 10,
				offsetTop: 6,
				maxWidth: 320,
			},
		});
		manager.init(grid.getContainer());
	}

	// noinspection JSUnusedGlobalSymbols
	openElement(entityType: string, entityId: number): void
	{
		const grid = this.#getGrid();
		grid?.tableFade();

		Ajax.runAction('biconnector.usagestat.getOpenUrl', {
			data: { entityType, entityId },
		})
			.then((response) => {
				const link = response.data;
				if (link)
				{
					window.open(link, '_blank').focus();
				}
				grid?.tableUnfade();
			})
			.catch((response) => {
				BX.UI.Notification.Center.notify({
					content: resolveErrorHtml(response, Loc.getMessage('BIC_USAGE_STAT_OPEN_ERROR')),
				});
				grid?.tableUnfade();
			});
	}

	/**
	 * Called both from the toolbar button and from the grid stub button.
	 */
	// noinspection JSUnusedGlobalSymbols
	toggleExternalStatCollection(): void
	{
		if (this.#isExternalStatToggling)
		{
			return;
		}

		this.#isExternalStatToggling = true;
		const isEnabling = !this.#isExternalStatEnabled;

		Ajax.runAction('biconnector.usagestat.toggleExternalStatCollection', {
			data: { enable: isEnabling ? 'Y' : 'N' },
		})
			.then((response) => {
				this.#isExternalStatToggling = false;
				this.#setExternalStatState(response.data);
				this.#renderExternalStatButton();
				this.#renderExternalStatBanner();
				// the stub of an empty grid is rendered by the server for the current state
				this.#getGrid()?.reload();
			})
			.catch((response) => {
				this.#isExternalStatToggling = false;
				this.#notifyExternalStatError(response, isEnabling);
			});
	}

	#setExternalStatState(state: ?ExternalStatState): void
	{
		this.#isExternalStatEnabled = state?.active === true;
		this.#externalStatHoursLeft = Text.toInteger(state?.hoursLeft);
	}

	/**
	 * Shown once for a user who is able to manage keys, the server decides whether it can be shown.
	 */
	// noinspection JSUnusedGlobalSymbols
	showOnboarding(): void
	{
		const options = this.#onboardingOptions;
		if (
			this.#isOnboardingShown
			|| !Type.isPlainObject(options)
			|| options.canShow !== true
			|| PopupWindowManager.isAnyPopupShown()
		)
		{
			return;
		}

		const button = this.#getExternalStatButton();
		if (!button)
		{
			return;
		}

		this.#isOnboardingShown = true;

		new AhaMoment({
			...options,
			compact: true,
			title: Loc.getMessage('CT_BBSU_EXT_STAT_ONBOARDING_TITLE'),
			description: Loc.getMessage('CT_BBSU_EXT_STAT_ONBOARDING_TEXT'),
			bindElement: button,
			popupAlignment: 'start',
		}).show();
	}

	#getExternalStatButton(): ?HTMLElement
	{
		if (!Type.isStringFilled(this.#externalStatButtonId))
		{
			return null;
		}

		return document.querySelector(`[data-btn-uniqid="${this.#externalStatButtonId}"]`);
	}

	#renderExternalStatButton(): void
	{
		const button = this.#getExternalStatButton();
		if (!button)
		{
			return;
		}

		// in the AIR design the caption lives in a nested node, writing to the outer one would drop it
		const textNode = button.querySelector('.ui-btn-text-inner')
			?? button.querySelector('.ui-btn-text')
			?? button
		;
		textNode.textContent = this.#getExternalStatButtonText();

		button.classList.toggle(BUTTON_ICON_START, !this.#isExternalStatEnabled);
		button.classList.toggle(BUTTON_ICON_STOP, this.#isExternalStatEnabled);
	}

	#getExternalStatButtonText(): string
	{
		if (!this.#isExternalStatEnabled)
		{
			return this.#externalStatLabels.enable;
		}

		return this.#externalStatLabels.enabled;
	}

	#getExternalStatBanner(): ?HTMLElement
	{
		if (!Type.isStringFilled(this.#externalStatBannerId))
		{
			return null;
		}

		return document.getElementById(this.#externalStatBannerId);
	}

	#renderExternalStatBanner(): void
	{
		const banner = this.#getExternalStatBanner();
		if (!banner)
		{
			return;
		}

		if (this.#isExternalStatEnabled)
		{
			const text = this.#getExternalStatBannerText();
			const textNode = banner.querySelector('.ui-alert-message') ?? banner;
			textNode.textContent = text;

			if (Type.isStringFilled(text))
			{
				// the banner is hidden with display none, so it cannot serve as a live region itself
				LiveAnnouncer.announce(text);
			}
		}

		// the alert is display: flex by its own class, so only an inline value can hide it
		Dom.style(banner, 'display', this.#isExternalStatEnabled ? null : 'none');
	}

	#getExternalStatBannerText(): string
	{
		const hours = String(this.#externalStatHoursLeft);

		return Loc.getMessage('CT_BBSU_EXT_STAT_ACTIVE_BANNER', { '#HOURS#': hours }) ?? '';
	}

	#notifyExternalStatError(response, isEnabling: boolean): void
	{
		const error = response?.errors?.[0];
		// a transport failure comes from the core with its own untranslated message, so it is not shown as is
		const isServerMessage = error?.code !== TRANSPORT_ERROR_CODE && Type.isStringFilled(error?.message);
		const phraseCode = isEnabling ? 'CT_BBSU_EXT_STAT_TOGGLE_ON_ERROR' : 'CT_BBSU_EXT_STAT_TOGGLE_OFF_ERROR';
		const message = isServerMessage ? error.message : Loc.getMessage(phraseCode);

		BX.UI.Notification.Center.notify({
			content: isServerMessage ? Text.encode(message) : message,
			autoHideDelay: 2000,
		});
		// the notification has no live region of its own
		LiveAnnouncer.announce(message, 'assertive');
	}
}

Reflection.namespace('BX.BIConnector').UsageStatGridManager = UsageStatGridManager;
