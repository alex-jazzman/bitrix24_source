/**
 * @module im/messenger/lib/promotion/src/entities/folder-all
 */
jn.define('im/messenger/lib/promotion/src/entities/folder-all', (require, exports, module) => {
	const { PromotionAsset } = require('im/messenger/assets/promotion');
	const { NavigationTabId } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { FolderComposition } = require('im/messenger/controller/recent/service/lib/folder-composition');
	const { FolderSourcesSettings } = require('im/messenger/controller/folder/sources-settings');
	const { NavigationHelper } = require('im/messenger/controller/navigation');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { delay, withTimeout } = require('im/messenger/lib/utils');
	const { OnboardingHint } = require('im/messenger/lib/promotion/src/hint/onboarding-hint');

	const logger = getLoggerWithContext('promotion', 'FolderAllPromotion');

	const STEP_COUNT = 3;
	const SHOW_DELAY = 300;
	const TARGET_REF = `tab-${NavigationTabId.all}`;
	// The step points at the tab it speaks of: the one about task chats aims at "Tasks" and not at the
	// tab the onboarding started on. A tab the rail does not show leaves the ear where it stood.
	const STEP_TARGET_REFS = [
		TARGET_REF,
		`tab-${NavigationTabId.task}`,
		TARGET_REF,
	];
	// The tab whose card the step needs on the screen. The rail scrolls to the tab it makes active, and
	// that is the only handle on it from here: the native tabs widget has no scrolling of its own.
	const STEP_TAB_IDS = [
		NavigationTabId.all,
		NavigationTabId.task,
		NavigationTabId.all,
	];
	// Both the question "which tab is active" and the selection itself are answered by the native side
	// only once the tab that was selected last reports itself active - which happens when its list has
	// loaded, and sometimes not at all. The onboarding waits for neither longer than this: the step it
	// draws must not hang on the previous one.
	const TAB_SELECTION_TIMEOUT = 1000;
	const NAVIGATOR_ATTEMPTS = 3;
	const NAVIGATOR_RETRY_DELAY = 500;
	// The rail slides to the selected tab, and the target is measured against where it comes to rest.
	const TAB_SCROLL_DURATION = 400;
	const TEST_ID = 'tab-all-onboarding-aha';
	const PHRASE_CODE_PREFIX = 'IMMOBILE_MESSENGER_PROMO_FOLDER_ALL_ONBOARDING_STEP_';
	const STEP_IMAGE_URLS = [
		PromotionAsset.folderAllOnboardingFolderUrl,
		PromotionAsset.folderAllOnboardingTasksUrl,
		PromotionAsset.folderAllOnboardingSettingsUrl,
	];

	/**
	 * Onboarding of the "All" tab: three steps of one hint, a single promo queue request for all of
	 * them. The hint keeps the step in its own state, so moving between the steps only changes what
	 * the popup draws - it is neither a refusal nor a new show.
	 *
	 * The promo is marked read on the last step reaching the popup or on the close button, and the
	 * queue is released once, whichever way the onboarding ends. A show declined while the app is in
	 * background or while something stands over the messenger tabs is reported to the queue as
	 * postponed, and so is one declined because the navigator never said whether anything stands
	 * there: all of it passes by itself, and the promo is not spent on it.
	 *
	 * @class FolderAllPromotion
	 */
	class FolderAllPromotion
	{
		#onRead = null;

		#onFinish = null;

		#hint = null;

		#isRead = false;

		#isFinished = false;

		/** @type {boolean} canShow declined for a reason that passes by itself rather than for good */
		#isShowPostponed = false;

		/** @type {?string} the tab that was active before a step moved the rail onto its own tab */
		#tabIdBeforeReveal = null;

		/** @type {?string} the tab the onboarding put on the screen last; null until it moved the rail */
		#revealedTabId = null;

		/**
		 * @param {{ onRead: () => any, onFinish: (data?: PromotionCallbackData) => any }} callbacks
		 */
		static showOnboarding(callbacks)
		{
			const onboarding = new FolderAllPromotion(callbacks);

			onboarding.#show();
		}

		/**
		 * @param {{ onRead: () => any, onFinish: (data?: PromotionCallbackData) => any }} callbacks
		 */
		constructor({ onRead, onFinish })
		{
			this.#onRead = onRead;
			this.#onFinish = onFinish;
		}

		#show()
		{
			try
			{
				this.#hint = OnboardingHint.show({
					testId: TEST_ID,
					targetRef: TARGET_REF,
					delay: SHOW_DELAY,
					steps: this.#getSteps(),
					// the tab arrives with the startup response, later than the queue request is made,
					// hence the check right before the show rather than at the request. The answer is
					// awaited outside the try/catch below, so a failed check is caught here: it is a
					// refusal, never a postponement
					canShow: async () => {
						try
						{
							// a missing tab is not postponed: nothing brings it back within the session
							if (!FolderComposition.getFolderByTabId(NavigationTabId.all))
							{
								return false;
							}

							// the background and a screen over the tabs both pass by themselves; the
							// navigator is the costly question, so it is asked last
							this.#isShowPostponed = Application.isBackground()
								|| await FolderAllPromotion.#isSomethingOverTabs();

							return !this.#isShowPostponed;
						}
						catch (error)
						{
							logger.error('showOnboarding canShow:', error);

							return false;
						}
					},
					onAction: (step) => this.#handleActionButton(step),
					onClose: () => {
						this.#markRead();
						this.#finish();
					},
					onHide: () => this.#finish(),
					onShowSkipped: (error) => {
						logger.log('showOnboarding onShowSkipped:', error);

						// an error is a failed show, never a postponed one
						if (!error && this.#isShowPostponed)
						{
							this.#finish({ postponed: true });

							return;
						}

						this.#finish();
					},
				});
			}
			catch (error)
			{
				logger.error('showOnboarding catch:', error);
				this.#finish();
			}
		}

		/**
		 * @param {number} step the step the tapped button belongs to. The hint reports the step it drew
		 *   the button for, so a second tap that reached a button the native side has not redrawn yet
		 *   repeats the same transition instead of skipping a step.
		 */
		#handleActionButton(step)
		{
			// the button of the last step outlives the onboarding by the animation of the hint leaving
			if (this.#isFinished)
			{
				return;
			}

			if (step < STEP_COUNT)
			{
				this.#showStep(step + 1);

				return;
			}

			this.#hint?.hide();

			// the tab id travels to the entry as it is: the folder behind it and the parent widget are
			// both the entry's business, and nothing is awaited - the onboarding ends with its own code
			void FolderSourcesSettings.open({ folderId: NavigationTabId.all });

			this.#finish();
		}

		/**
		 * One question to the navigator, bounded by the timeout. A navigator that failed has answered -
		 * its failure is its answer and reaches the caller as it is; a navigator that kept silent has not.
		 *
		 * @return {Promise<?boolean>} what stands over the tabs, or null when the wait ran out
		 */
		static async #askNavigator()
		{
			const answer = NavigationHelper.isSomethingOverMessengerTabs();
			let isAnswered = false;
			const markAnswered = () => {
				isAnswered = true;
			};

			// the mark is added before the wait, so it is set by the time the same failure reaches the catch
			void answer.then(markAnswered, markAnswered);

			return withTimeout(answer, TAB_SELECTION_TIMEOUT).catch((error) => {
				if (isAnswered)
				{
					throw error;
				}

				return null;
			});
		}

		/**
		 * Silence is asked again: right after the startup the answer of the navigator comes late rather
		 * than not at all, and the promo is handed out once per process start, so a refusal spends that
		 * single chance. A navigator silent through every attempt postpones the show instead - the queue
		 * keeps the request - and the wait stays bounded by the limit of each attempt.
		 *
		 * @param {number} [attemptsLeft]
		 * @return {Promise<boolean>}
		 */
		static async #isSomethingOverTabs(attemptsLeft = NAVIGATOR_ATTEMPTS)
		{
			const answer = await FolderAllPromotion.#askNavigator();

			if (answer !== null)
			{
				return answer;
			}

			if (attemptsLeft <= 1)
			{
				logger.warn('isSomethingOverTabs: the navigator kept silent, the show is postponed');

				return true;
			}

			await delay(NAVIGATOR_RETRY_DELAY);

			return FolderAllPromotion.#isSomethingOverTabs(attemptsLeft - 1);
		}

		/**
		 * @param {number} step
		 */
		#showStep(step)
		{
			this.#hint?.showStep(step);

			// the popup is already on the screen, so the last step reaching it is a show that happened:
			// nothing between here and the screen can lose it any more
			if (step === STEP_COUNT)
			{
				this.#markRead();
			}
		}

		/**
		 * @return {OnboardingHintStep[]}
		 */
		#getSteps()
		{
			return STEP_IMAGE_URLS.map((imageUrl, index) => {
				const step = index + 1;

				return {
					imageUrl,
					targetRef: STEP_TARGET_REFS[index],
					revealTarget: () => this.#revealTab(STEP_TAB_IDS[index]),
					title: Loc.getMessage(`${PHRASE_CODE_PREFIX}${step}_TITLE`),
					description: Loc.getMessage(`${PHRASE_CODE_PREFIX}${step}_DESCRIPTION`),
					buttonText: Loc.getMessage(`${PHRASE_CODE_PREFIX}${step}_BUTTON`),
				};
			});
		}

		/**
		 * Brings the tab of the step onto the screen: it is made the active one, and the rail scrolls to
		 * it. The tab the onboarding took the screen on is remembered here, and the end of the onboarding
		 * gives it back.
		 *
		 * Nothing of this is reported upwards: the hint judges the attempt by measuring the target again,
		 * and a tab that stayed out of reach only means the ear does not move.
		 *
		 * @param {string} tabId
		 * @return {Promise<void>}
		 */
		async #revealTab(tabId)
		{
			try
			{
				if (this.#revealedTabId === tabId)
				{
					return;
				}

				const navigationManager = serviceLocator.get('navigation-manager');

				// the tab the onboarding started on is asked once, and only while it has not moved the
				// rail itself: after that it knows the answer without asking, and asking costs a wait
				if (this.#tabIdBeforeReveal === null && this.#revealedTabId === null)
				{
					this.#tabIdBeforeReveal = await withTimeout(
						navigationManager.getActiveTab(),
						TAB_SELECTION_TIMEOUT,
					).catch(() => null);

					if (this.#tabIdBeforeReveal === tabId)
					{
						this.#tabIdBeforeReveal = null;

						return;
					}
				}

				await FolderAllPromotion.#activateTab(navigationManager, tabId);
				this.#revealedTabId = tabId;

				if (this.#tabIdBeforeReveal === tabId)
				{
					this.#tabIdBeforeReveal = null;
				}
			}
			catch (error)
			{
				logger.error('revealTab:', error);
			}
		}

		/**
		 * The onboarding leaves the screen on the tab it found it on: a step that moved the rail is
		 * undone whichever way the onboarding ended.
		 *
		 * @return {Promise<void>}
		 */
		async #restoreTab()
		{
			const tabId = this.#tabIdBeforeReveal;

			if (tabId === null)
			{
				return;
			}

			this.#tabIdBeforeReveal = null;

			try
			{
				await FolderAllPromotion.#activateTab(serviceLocator.get('navigation-manager'), tabId);
			}
			catch (error)
			{
				logger.error('restoreTab:', error);
			}
		}

		/**
		 * @param {NavigationManager} navigationManager
		 * @param {string} tabId
		 * @return {Promise<void>}
		 */
		static async #activateTab(navigationManager, tabId)
		{
			const selectionResult = await withTimeout(navigationManager.setActiveTab(tabId), TAB_SELECTION_TIMEOUT)
				.catch((error) => {
					logger.warn('activateTab: selection is taking its time', tabId, error);

					return null;
				})
			;

			if (selectionResult?.isSuccess?.() === false)
			{
				logger.warn('activateTab refused:', tabId, selectionResult.getError?.());

				return;
			}

			// only the slide of the rail is waited out on top of that: the target is measured against
			// where the tab comes to rest, and the measurement retries on its own if it has not yet
			await delay(TAB_SCROLL_DURATION);
		}

		#markRead()
		{
			if (this.#isRead)
			{
				return;
			}

			this.#isRead = true;
			this.#onRead();
		}

		/**
		 * @param {PromotionCallbackData} [data]
		 */
		#finish(data)
		{
			if (this.#isFinished)
			{
				return;
			}

			this.#isFinished = true;
			void this.#restoreTab();
			this.#onFinish(data);
		}
	}

	module.exports = {
		FolderAllPromotion,
	};
});
