/**
 * @module mail/message-grid/src/conversation-aha
 */
jn.define('mail/message-grid/src/conversation-aha', (require, exports, module) => {
	/**
	 * Dependency free on purpose: the grouping toggle of the more menu and the onboarding of the grid
	 * controller are built from the pure helpers and the two small state machines here, and the unit
	 * suite covers the apply/rollback of the setting and the once-only onboarding flow
	 * defined below. No `require` of Loc, ajax, redux or the aha popup may enter this module - the
	 * transport, the store reads and the popup all arrive as injected ports.
	 */
	const CONVERSATION_ONBOARDING_TEST_ID = 'mail-conversation-onboarding';
	const conversationSettingsState = {
		settings: {},
		get()
		{
			return this.settings;
		},
		set(settings = {})
		{
			this.settings = { ...settings };
		},
	};

	/**
	 * State of the grouping toggle for the more menu. The switch is hidden whole while the feature is
	 * unavailable, and the shared user setting defaults to on, so an absent flag reads as enabled.
	 *
	 * @param {ConversationSettings} settings the `settings` block of the grid page response
	 * @return {{visible: boolean, enabled: boolean}}
	 */
	const resolveGroupingMenuState = (settings = {}) => ({
		visible: settings.featureAvailable === true,
		enabled: settings.enabled !== false,
	});
	const resolveGroupingMenuItemState = (settings = {}) => ({
		checked: resolveGroupingMenuState(settings).enabled,
		showCheckedIcon: false,
	});
	const applyGroupingSetting = (settings = {}, enabled) => ({
		...settings,
		enabled: enabled === true,
	});

	/**
	 * Whether the mobile onboarding popup may appear at all: only for a user the server marked eligible
	 * (an existing portal opened before the release) and only until it has been seen on this platform.
	 * The eligibility itself carries no tariff or region condition.
	 *
	 * @param {{onboardingEligible?: boolean, onboardingSeen?: boolean}} eligibility API-04 getSettings
	 * @return {boolean}
	 */
	const shouldShowConversationOnboarding = (eligibility = {}) => (
		eligibility.onboardingEligible === true && eligibility.onboardingSeen !== true
	);

	class ConversationOnboardingEligibilityCapture
	{
		constructor()
		{
			this.candidate = null;
			this.capture = null;
			this.confirmation = null;
		}

		schedule(candidate, capture)
		{
			if (this.candidate === null && typeof candidate === 'boolean')
			{
				this.candidate = candidate;
				this.capture = capture;
			}

			return this.#confirm();
		}

		loadConfirmed(loadEligibility)
		{
			return this.#confirm().then(() => loadEligibility());
		}

		#confirm()
		{
			if (this.candidate === null || typeof this.capture !== 'function')
			{
				return Promise.reject(new Error('The onboarding eligibility candidate is unavailable.'));
			}

			if (this.confirmation === null)
			{
				this.confirmation = Promise.resolve()
					.then(() => this.capture(this.candidate))
					.catch((error) => {
						this.confirmation = null;

						throw error;
					})
				;
			}

			return this.confirmation;
		}
	}

	const conversationOnboardingEligibilityCapture = new ConversationOnboardingEligibilityCapture();

	/**
	 * Applies a grouping switch over API-04 setSettings and rolls the value back on a failed save. The
	 * request is optimistic in intent, but the value it reports is the committed one only on success:
	 * a rejected or refused save returns the previous value, so the caller keeps the setting unchanged.
	 *
	 * Ports:
	 * - `persist(nextEnabled)`  performs API-04 setSettings and resolves truthy on a saved change;
	 * - `onCommitted(enabled)`  the save succeeded, so the list is reloaded with the new value;
	 * - `onReverted(enabled)`   the save failed, so the previous value stays and an error is surfaced.
	 */
	class ConversationGroupingSetting
	{
		constructor({
			persist,
			onCommitted = () => {},
			onReverted = () => {},
		} = {})
		{
			this.persist = persist;
			this.onCommitted = onCommitted;
			this.onReverted = onReverted;
		}

		/**
		 * @param {boolean} currentEnabled the value the menu currently shows
		 * @return {Promise<{enabled: boolean, committed: boolean}>} the value after the attempt
		 */
		toggle(currentEnabled)
		{
			const next = !currentEnabled;

			return Promise.resolve()
				.then(() => this.persist(next))
				.then((saved) => {
					if (saved === false)
					{
						this.onReverted(currentEnabled);

						return { enabled: currentEnabled, committed: false };
					}

					this.onCommitted(next);

					return { enabled: next, committed: true };
				})
				.catch(() => {
					this.onReverted(currentEnabled);

					return { enabled: currentEnabled, committed: false };
				});
		}
	}

	/**
	 * Drives the one-time mobile onboarding. The first successful expansion of a chain wakes it up; it
	 * reads the eligibility from the server, shows the popup only when it is due, and marks the popup
	 * seen once - on a close or on a jump to the settings alike. It never blocks the expansion and never
	 * changes the grouping setting on its own.
	 *
	 * Ports:
	 * - `loadEligibility()`         reads API-04 getSettings for `platform=mobile`;
	 * - `showBanner({onAcknowledge})` shows the aha popup and hands back the acknowledge callback;
	 * - `markSeen()`               performs API-04 markOnboarding for `platform=mobile`.
	 */
	class ConversationOnboarding
	{
		constructor({
			loadEligibility = () => Promise.resolve({}),
			showBanner = () => {},
			markSeen = () => {},
		} = {})
		{
			this.loadEligibility = loadEligibility;
			this.showBanner = showBanner;
			this.markSeen = markSeen;
			this.started = false;
			this.seenMarked = false;
		}

		/**
		 * The first successful expansion. Idempotent: only the first call runs the flow, so a repeated
		 * expansion never re-queries the server or shows the popup again.
		 *
		 * @return {Promise|null} null when the flow has already run
		 */
		notifyExpanded()
		{
			if (this.started)
			{
				return null;
			}

			this.started = true;

			return Promise.resolve()
				.then(() => this.loadEligibility())
				.then((eligibility) => {
					if (!shouldShowConversationOnboarding(eligibility ?? {}))
					{
						return null;
					}

					return this.showBanner({ onAcknowledge: () => this.#acknowledge() });
				})
				.catch(() => null);
		}

		#acknowledge()
		{
			if (this.seenMarked)
			{
				return;
			}

			this.seenMarked = true;
			this.markSeen();
		}
	}

	module.exports = {
		applyGroupingSetting,
		ConversationOnboardingEligibilityCapture,
		conversationOnboardingEligibilityCapture,
		CONVERSATION_ONBOARDING_TEST_ID,
		ConversationGroupingSetting,
		ConversationOnboarding,
		conversationSettingsState,
		resolveGroupingMenuItemState,
		resolveGroupingMenuState,
		shouldShowConversationOnboarding,
	};
});
