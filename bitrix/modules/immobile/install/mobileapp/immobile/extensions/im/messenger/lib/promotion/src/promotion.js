/**
 * @module im/messenger/lib/promotion/src/promotion
 */
jn.define('im/messenger/lib/promotion/src/promotion', (require, exports, module) => {
	const { Type } = require('type');

	const { BackgroundUI, EventType, Promo } = require('im/messenger/const');
	const { PromotionRest } = require('im/messenger/provider/rest');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { CopilotPromotion } = require('im/messenger/lib/promotion/src/entities/copilot');
	const { FolderAllPromotion } = require('im/messenger/lib/promotion/src/entities/folder-all');
	const { TasksPromotion } = require('im/messenger/lib/promotion/src/entities/tasks');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('promotion', 'Promotion');

	const COMPONENT_NAME = 'im.messenger.Promotion';
	// the close reaches the arbiter and the messenger in different contexts in no guaranteed order:
	// a request sent at once could come before the slot is free and be dropped
	const RETRY_DELAY = 300;

	/**
	 * @implements {Unsubscribable}
	 * @class Promotion
	 */
	class Promotion
	{
		constructor()
		{
			this.#bindMethods();

			this.promoCollection = [];
			this.promoQueue = [];
			this.pendingPromoQueue = [];
			this.isPromoCollectionLoaded = false;
			this.isShowing = false;
			this.isOwnReleasePending = false;
			this.retryTimer = null;
			this.messengerInitService = serviceLocator.get('messenger-init-service');
			this.subscribeEvents();
		}

		subscribeEvents()
		{
			this.#subscribeInitMessengerEvent();
			this.#subscribeToBackgroundUIManagerEvents();
			this.#subscribeAppActiveEvent();
		}

		unsubscribeEvents()
		{
			BX.removeCustomEvent(
				BackgroundUI.manager.openComponentInAnotherContext,
				this.openPromotionFromBackgroundUIManagerEvent,
			);
			BX.removeCustomEvent(BackgroundUI.manager.onCloseActiveComponent, this.onActiveComponentClose);
			BX.removeCustomEvent(EventType.app.active, this.scheduleRetry);
			clearTimeout(this.retryTimer);
			this.retryTimer = null;
		}

		#subscribeToBackgroundUIManagerEvents()
		{
			BX.addCustomEvent(
				BackgroundUI.manager.openComponentInAnotherContext,
				this.openPromotionFromBackgroundUIManagerEvent,
			);
			BX.addCustomEvent(BackgroundUI.manager.onCloseActiveComponent, this.onActiveComponentClose);
		}

		// a request the arbiter dropped while the app was in background gets another chance on return
		#subscribeAppActiveEvent()
		{
			BX.addCustomEvent(EventType.app.active, this.scheduleRetry);
		}

		#bindMethods()
		{
			this.handlePromotionGet = this.#handlePromotionGet.bind(this);
			this.onReadPromo = this.#onReadPromo.bind(this);
			this.openPromotionFromBackgroundUIManagerEvent = this.#openPromotionFromBackgroundUIManagerEvent.bind(this);
			this.onActiveComponentClose = this.#onActiveComponentClose.bind(this);
			this.scheduleRetry = this.#scheduleRetry.bind(this);
			this.onShowPromoCallback = this.#onShowPromoCallback.bind(this);
		}

		/**
		 * @param {string} componentName
		 */
		#openPromotionFromBackgroundUIManagerEvent(componentName)
		{
			logger.log('openPromotionFromBackgroundUIManagerEvent', componentName);

			// a second grant while a promo is on screen would take the next one out of the queue on top of it
			if (componentName !== COMPONENT_NAME || this.isShowing)
			{
				return;
			}

			// the arbiter holds the slot for us even when a retry has emptied the queue
			if (this.promoQueue.length === 0)
			{
				this.#releaseScreen();

				return;
			}

			this.isShowing = true;
			const nextPromo = this.promoQueue.shift();
			nextPromo.callback();
		}

		#onActiveComponentClose()
		{
			// the close carries no component name: ours is told apart by the flag set right before posting it
			if (this.isOwnReleasePending)
			{
				this.isOwnReleasePending = false;

				return;
			}

			this.#scheduleRetry();
		}

		#scheduleRetry()
		{
			clearTimeout(this.retryTimer);
			this.retryTimer = setTimeout(() => this.#retry(), RETRY_DELAY);
		}

		#retry()
		{
			this.retryTimer = null;
			if (this.isShowing)
			{
				return;
			}

			// the copilot request aims at a sidebar card that may be closed by now, and the sidebar asks again
			// on open; nobody asks again for the others, so they stay
			this.promoQueue = this.promoQueue.filter((request) => request.promoId !== Promo.copilotSidebarEngine);
			this.#flushPendingPromoQueue();
			this.#requestScreen();
		}

		#subscribeInitMessengerEvent()
		{
			this.messengerInitService.onInit(this.handlePromotionGet);
		}

		/**
		 * @param {immobileTabsLoadCommonResult} data
		 */
		#handlePromotionGet(data)
		{
			if (Type.isArray(data?.promotion))
			{
				this.promoCollection = data.promotion;
				this.isPromoCollectionLoaded = true;
				this.#flushPendingPromoQueue();
			}
		}

		// the requests set aside - before the promo list came or by a postponed show - go through the
		// regular check again, so a promo read in the meantime does not come back
		#flushPendingPromoQueue()
		{
			if (!this.isPromoCollectionLoaded)
			{
				return;
			}

			const requests = this.pendingPromoQueue;
			this.pendingPromoQueue = [];
			requests.forEach((params) => {
				this.addToPromoQueue(params);
			});
		}

		/**
		 * @param {string} promoId
		 * @return {boolean}
		 */
		shouldShowPromo(promoId)
		{
			return this.promoCollection.includes(promoId);
		}

		/**
		 * @param {string} promoId
		 * @param {() => any} callback
		 */
		addToPromoQueue({ promoId, callback = () => {} })
		{
			if (!this.isPromoCollectionLoaded)
			{
				this.pendingPromoQueue.push({ promoId, callback });

				return;
			}

			if (!this.promoCollection.includes(promoId))
			{
				return;
			}

			this.promoQueue.push({ promoId, callback });
			if (this.promoQueue.length === 1)
			{
				this.#requestScreen();
			}
		}

		#requestScreen()
		{
			logger.log('requestScreen queue:', this.promoQueue);

			if (this.promoQueue.length === 0 || this.isShowing)
			{
				return;
			}

			BX.postComponentEvent(
				BackgroundUI.events.tryToOpenComponentFromAnotherContext,
				[
					{
						componentName: COMPONENT_NAME,
						priority: 1000,
					},
				],
			);
		}

		// the slot is released only after it was given to us: a request must not close another feature's window
		#releaseScreen()
		{
			this.isOwnReleasePending = true;
			BX.postComponentEvent(BackgroundUI.manager.onCloseActiveComponent, []);
		}

		/**
		 * @param {string} promoId
		 */
		#onReadPromo(promoId)
		{
			logger.log('onReadPromo', promoId);

			if (Type.isStringFilled(promoId))
			{
				this.promoCollection = this.promoCollection.filter((activePromoListId) => activePromoListId !== promoId);
				PromotionRest.read(promoId);
			}
		}

		/**
		 * @param {PromotionCallbackData} callbackData
		 */
		#onShowPromoCallback(callbackData)
		{
			if (callbackData?.read && callbackData?.promoId)
			{
				this.onReadPromo(callbackData.promoId);
			}

			this.isShowing = false;
			this.#releaseScreen();
			this.#requestScreen();
		}

		/**
		 * @param {LayoutComponent} targetRef
		 */
		showCopilotSidebarChangeEnginePromotion = (targetRef) => {
			CopilotPromotion.showCopilotSidebarChangeEngine(targetRef, this.onShowPromoCallback);
		};

		showTasksRecentPromotion = () => {
			TasksPromotion.showRecentAvailable(this.onShowPromoCallback);
		};

		// the onboarding takes several steps, and moving between them is not a refusal: the read mark and
		// the queue release come from different points of it. A postponed show sets its request aside
		// before the release, so the release does not ask for the screen for it at once
		showFolderAllOnboardingPromotion = () => {
			FolderAllPromotion.showOnboarding({
				onRead: () => this.onReadPromo(Promo.folderAllOnboarding),
				onFinish: (data) => {
					if (data?.postponed)
					{
						this.pendingPromoQueue.push({
							promoId: Promo.folderAllOnboarding,
							callback: this.showFolderAllOnboardingPromotion,
						});
					}

					this.onShowPromoCallback(data);
				},
			});
		};
	}

	module.exports = {
		Promotion,
	};
});
