/* eslint-disable */
(function (biconnector_ahaMoment, biconnector_errorMessage, main_core, main_core_events, main_popup, ui_a11y) {
	'use strict';

	const TRANSPORT_ERROR_CODE = 'NETWORK_ERROR';
	const BUTTON_ICON_START = 'ui-btn-icon-start';
	const BUTTON_ICON_STOP = 'ui-btn-icon-stop';

	// the remainder is always counted by the server: client clocks differ from it and round the value up

	/**
	 * @namespace BX.BIConnector
	 */
	class UsageStatGridManager {
		#gridId;
		#externalStatButtonId;
		#externalStatBannerId;
		#isExternalStatEnabled;
		#externalStatHoursLeft;
		#isExternalStatToggling = false;
		#externalStatLabels;
		#onboardingOptions;
		#isOnboardingShown = false;
		constructor(props) {
			this.#gridId = props.gridId;
			this.#externalStatButtonId = props.externalStat?.buttonId ?? '';
			this.#externalStatBannerId = props.externalStat?.bannerId ?? '';
			this.#externalStatLabels = props.externalStat?.labels ?? {
				enable: '',
				enabled: ''
			};
			this.#onboardingOptions = props.externalStat?.onboarding ?? null;
			this.#setExternalStatState(props.externalStat);
			this.#initHints();
			main_core_events.EventEmitter.subscribe('Grid::updated', () => this.#initHints());
		}
		#getGrid() {
			const manager = BX.Main.gridManager.getById(this.#gridId);
			return manager ? manager.instance : null;
		}
		#initHints() {
			const grid = this.#getGrid();
			if (!grid) {
				return;
			}
			const manager = BX.UI.Hint.createInstance({
				popupParameters: {
					autoHide: true,
					offsetLeft: 10,
					offsetTop: 6,
					maxWidth: 320
				}
			});
			manager.init(grid.getContainer());
		}

		// noinspection JSUnusedGlobalSymbols
		openElement(entityType, entityId) {
			const grid = this.#getGrid();
			grid?.tableFade();
			main_core.ajax.runAction('biconnector.usagestat.getOpenUrl', {
				data: {
					entityType,
					entityId
				}
			}).then(response => {
				const link = response.data;
				if (link) {
					window.open(link, '_blank').focus();
				}
				grid?.tableUnfade();
			}).catch(response => {
				BX.UI.Notification.Center.notify({
					content: biconnector_errorMessage.resolveErrorHtml(response, main_core.Loc.getMessage('BIC_USAGE_STAT_OPEN_ERROR'))
				});
				grid?.tableUnfade();
			});
		}

		/**
		 * Called both from the toolbar button and from the grid stub button.
		 */
		// noinspection JSUnusedGlobalSymbols
		toggleExternalStatCollection() {
			if (this.#isExternalStatToggling) {
				return;
			}
			this.#isExternalStatToggling = true;
			const isEnabling = !this.#isExternalStatEnabled;
			main_core.ajax.runAction('biconnector.usagestat.toggleExternalStatCollection', {
				data: {
					enable: isEnabling ? 'Y' : 'N'
				}
			}).then(response => {
				this.#isExternalStatToggling = false;
				this.#setExternalStatState(response.data);
				this.#renderExternalStatButton();
				this.#renderExternalStatBanner();
				// the stub of an empty grid is rendered by the server for the current state
				this.#getGrid()?.reload();
			}).catch(response => {
				this.#isExternalStatToggling = false;
				this.#notifyExternalStatError(response, isEnabling);
			});
		}
		#setExternalStatState(state) {
			this.#isExternalStatEnabled = state?.active === true;
			this.#externalStatHoursLeft = main_core.Text.toInteger(state?.hoursLeft);
		}

		/**
		 * Shown once for a user who is able to manage keys, the server decides whether it can be shown.
		 */
		// noinspection JSUnusedGlobalSymbols
		showOnboarding() {
			const options = this.#onboardingOptions;
			if (this.#isOnboardingShown || !main_core.Type.isPlainObject(options) || options.canShow !== true || main_popup.PopupWindowManager.isAnyPopupShown()) {
				return;
			}
			const button = this.#getExternalStatButton();
			if (!button) {
				return;
			}
			this.#isOnboardingShown = true;
			new biconnector_ahaMoment.AhaMoment({
				...options,
				compact: true,
				title: main_core.Loc.getMessage('CT_BBSU_EXT_STAT_ONBOARDING_TITLE'),
				description: main_core.Loc.getMessage('CT_BBSU_EXT_STAT_ONBOARDING_TEXT'),
				bindElement: button,
				popupAlignment: 'start'
			}).show();
		}
		#getExternalStatButton() {
			if (!main_core.Type.isStringFilled(this.#externalStatButtonId)) {
				return null;
			}
			return document.querySelector(`[data-btn-uniqid="${this.#externalStatButtonId}"]`);
		}
		#renderExternalStatButton() {
			const button = this.#getExternalStatButton();
			if (!button) {
				return;
			}

			// in the AIR design the caption lives in a nested node, writing to the outer one would drop it
			const textNode = button.querySelector('.ui-btn-text-inner') ?? button.querySelector('.ui-btn-text') ?? button;
			textNode.textContent = this.#getExternalStatButtonText();
			button.classList.toggle(BUTTON_ICON_START, !this.#isExternalStatEnabled);
			button.classList.toggle(BUTTON_ICON_STOP, this.#isExternalStatEnabled);
		}
		#getExternalStatButtonText() {
			if (!this.#isExternalStatEnabled) {
				return this.#externalStatLabels.enable;
			}
			return this.#externalStatLabels.enabled;
		}
		#getExternalStatBanner() {
			if (!main_core.Type.isStringFilled(this.#externalStatBannerId)) {
				return null;
			}
			return document.getElementById(this.#externalStatBannerId);
		}
		#renderExternalStatBanner() {
			const banner = this.#getExternalStatBanner();
			if (!banner) {
				return;
			}
			if (this.#isExternalStatEnabled) {
				const text = this.#getExternalStatBannerText();
				const textNode = banner.querySelector('.ui-alert-message') ?? banner;
				textNode.textContent = text;
				if (main_core.Type.isStringFilled(text)) {
					// the banner is hidden with display none, so it cannot serve as a live region itself
					ui_a11y.LiveAnnouncer.announce(text);
				}
			}

			// the alert is display: flex by its own class, so only an inline value can hide it
			main_core.Dom.style(banner, 'display', this.#isExternalStatEnabled ? null : 'none');
		}
		#getExternalStatBannerText() {
			const hours = String(this.#externalStatHoursLeft);
			return main_core.Loc.getMessage('CT_BBSU_EXT_STAT_ACTIVE_BANNER', {
				'#HOURS#': hours
			}) ?? '';
		}
		#notifyExternalStatError(response, isEnabling) {
			const error = response?.errors?.[0];
			// a transport failure comes from the core with its own untranslated message, so it is not shown as is
			const isServerMessage = error?.code !== TRANSPORT_ERROR_CODE && main_core.Type.isStringFilled(error?.message);
			const phraseCode = isEnabling ? 'CT_BBSU_EXT_STAT_TOGGLE_ON_ERROR' : 'CT_BBSU_EXT_STAT_TOGGLE_OFF_ERROR';
			const message = isServerMessage ? error.message : main_core.Loc.getMessage(phraseCode);
			BX.UI.Notification.Center.notify({
				content: isServerMessage ? main_core.Text.encode(message) : message,
				autoHideDelay: 2000
			});
			// the notification has no live region of its own
			ui_a11y.LiveAnnouncer.announce(message, 'assertive');
		}
	}
	main_core.Reflection.namespace('BX.BIConnector').UsageStatGridManager = UsageStatGridManager;

})(BX.BIConnector, BX.BIConnector, BX, BX.Event, BX.Main, BX.UI.Accessibility);
//# sourceMappingURL=script.js.map
