/**
 * @module timeman/workday-intent
 */
jn.define('timeman/workday-intent', (require, exports, module) => {
	const { BackgroundUIManager } = require('background/ui-manager');
	const { requireLazy } = require('require-lazy');
	const { ComponentHelper } = require('helpers/component');
	const { StorageCache } = require('storage-cache');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');

	/** @type {?typeof import('stafftrack/feature').Feature} */
	let Feature = null;
	try
	{
		Feature = require('stafftrack/feature').Feature;
	}
	catch (error)
	{
		console.error(error);
	}

	// Two box families coexist; the check-in rollout flag picks one before every show. The name of the
	// component is the whole answer of that flag: nothing downstream is told it a second time.
	const BOX_FAMILY = {
		BASE: {
			componentName: 'timeman:workday-intent-box',
			layoutExtension: 'timeman:layout/workday-intent-box',
		},
		V3: {
			componentName: 'timeman:workday-intent-box-v3',
			layoutExtension: 'timeman:layout/workday-intent-box-v3',
		},
	};

	class WorkdayIntent
	{
		constructor()
		{
			this.storage = new StorageCache('timeman', 'workdayIntent');
			this.storage.setDefaultData({ timestampToOpenAt: Date.now() });

			this.lastPeriodKey = null;
			this.lastRetryIntervalSeconds = 3600;

			this.isComponentOpen = false;
			this.isComponentTryingToOpen = false;
			this.sessionHasTargetAction = false;

			this.#subscribeToBoxEvents();
			this.#subscribeToOpenEvents();

			void this.#tryToOpenComponent(true);
		}

		#subscribeToBoxEvents()
		{
			BX.addCustomEvent('workday-intent-box.onViewRemoved', () => {
				const wasOpen = this.isComponentOpen;

				this.isComponentOpen = false;
				this.isComponentTryingToOpen = false;

				if (wasOpen && !this.sessionHasTargetAction)
				{
					void this.#registerOutcome('dismiss');
				}

				BX.postComponentEvent('BackgroundUIManager::onCloseActiveComponent');
			});
			BX.addCustomEvent('workday-intent-box.onChatOpen', ({ dialogId }) => {
				void DialogOpener.open({ dialogId });
			});
			// The EVENT-01 payload { intentId } is intentionally ignored here:
			// the outcome is the same for every intent — targetAction.
			BX.addCustomEvent('workday-intent-box.onTargetAction', () => {
				this.sessionHasTargetAction = true;

				void this.#registerOutcome('targetAction');
			});
		}

		#subscribeToOpenEvents()
		{
			const events = [
				'onTabsSelected',

				'DetailCard::onClose_Global',
				'livefeed.postform::onClose',
				'calendar.event:onClosed',
				'tasks.view-new:onClosed',
				'tasks.create-new:onClosedAfterSave',

				'callList:onTabSelected',
				'mail.message-grid:onTabSelected',
				'sign.grid:onTabSelected',
				'stream.tabs:onTabSelected',
				'crm.tabs:onTabSelected',
				'disk.tabs:onTabSelected',
				'catalog.store.document.list:onTabSelected',
				'tasks.tabs:onTabSelected',
				'stafftrack.check-in-v2.tabs:onTabSelected',
			];
			// Wrapper ignores the event payload so it is not passed as the `force` argument.
			const handler = () => {
				void this.#tryToOpenComponent(false);
			};

			events.forEach((event) => BX.addCustomEvent(event, handler));

			// App returning to foreground is an authoritative trigger: ask the backend
			// bypassing the local timer, which may be stuck in the future.
			BX.addCustomEvent('onAppActive', () => {
				void this.#tryToOpenComponent(true);
			});

			BX.addCustomEvent('Comments.UploadQueue::setItem', (data) => {
				if (data.formId === 'bitrix:socialnetwork.blog.post.comment')
				{
					handler();
				}
			});

			void requireLazy('im:messenger/api/event-handler', false)
				.then(({ navigationHandler, dialogHandler }) => {
					navigationHandler.onTabChanged(() => handler());
					dialogHandler.onClosed(() => handler());
				})
			;
		}

		async #tryToOpenComponent(force = false)
		{
			if (this.isComponentTryingToOpen && !force)
			{
				return;
			}

			this.isComponentTryingToOpen = true;

			if (!force && !this.#isReadyToOpenByTime())
			{
				this.isComponentTryingToOpen = false;

				return;
			}

			const data = await this.#getWorkdayIntentBoxData();
			if (data?.canOpen)
			{
				// Only #openComponent (the real show) and #registerShow (backend reschedule) advance the timer.
				// Here we just remember the schedule: if the show is cancelled (app backgrounded, screen left),
				// timestampToOpenAt stays "ready" and the retry happens on the next trigger.
				this.#rememberSchedule(data.schedule);

				const family = await this.#resolveBoxFamily();

				// Defensive (Android lifecycle): a previously scheduled open can latch BackgroundUIManager
				// (currentComponent set, openCallback never fired because JS timers were suspended while the
				// app was backgrounded during the debounce). A latched slot with an equal priority blocks every
				// new open. Release our own stuck slot before retrying; guarded so we never cancel another
				// feature's pending component.
				if (
					!this.isComponentOpen
					&& this.#isOwnComponent(BackgroundUIManager.currentComponent?.componentName)
					&& !BackgroundUIManager.isComponentOpened
				)
				{
					BackgroundUIManager.onCloseActiveComponent();
				}

				BackgroundUIManager.openComponent(
					family.componentName,
					this.#openComponent.bind(this, data, family),
					10000,
				);
				setTimeout(() => {
					this.isComponentTryingToOpen = false;
				}, 3000);

				return;
			}

			if (data)
			{
				this.#planNextAttempt(data.schedule);
			}
			else
			{
				this.#planNextAttempt(undefined);
			}

			this.isComponentTryingToOpen = false;
		}

		async #resolveBoxFamily()
		{
			const isCheckInRolloutEnabled = (await Feature?.isCheckInRolloutEnabled()) === true;

			return isCheckInRolloutEnabled ? BOX_FAMILY.V3 : BOX_FAMILY.BASE;
		}

		#isOwnComponent(componentName)
		{
			return Object.values(BOX_FAMILY).some((family) => family.componentName === componentName);
		}

		async #openComponent(data, requestedFamily)
		{
			if (this.isComponentOpen)
			{
				this.#setToOpenInMinutes(this.lastRetryIntervalSeconds / 60);

				return;
			}

			const loaded = await this.#loadBoxFamily(requestedFamily);
			if (!loaded)
			{
				this.#setToOpenInMinutes(10);

				return;
			}

			const { WorkdayIntentBox, family } = loaded;

			this.#setToOpenInMinutes(this.lastRetryIntervalSeconds / 60);

			this.isComponentOpen = true;
			this.sessionHasTargetAction = false;

			ComponentHelper.openLayout(
				{
					name: family.componentName,
					object: 'layout',
					canOpenInDefault: true,
					componentParams: {
						intentList: data.intentList,
						shifts: data.shifts,
						preselectedIntentId: data.preselectedIntentId,
						chatIdWithAiAdvice: data.chatIdWithAiAdvice,
						isDayStartCheckInEnabled: data.isDayStartCheckInEnabled,
					},
					widgetParams: WorkdayIntentBox.getWidgetParams(data),
				},
				PageManager,
			);

			void this.#registerShow();
		}

		/**
		 * The rollout flag belongs to another module than the V3 family, and that family requires
		 * extensions of that module statically: a portal with the flag already on may still run a
		 * version of it without them, and there the family never resolves. One step back to the base
		 * family keeps the start of the day reachable instead of leaving the employee with no box at
		 * all. The step is a decision of this attempt alone - the flag is read anew before every
		 * show, so a family that becomes loadable after an update is taken on the next one.
		 *
		 * The slot of the show stays registered under the name the flag asked for: the guard of a
		 * latched slot counts both names as its own, and either family publishes the same event of
		 * the closing, so the slot is released the same way.
		 * @param {object} family descriptor the flag picked
		 * @return {Promise<?object>} the box and the descriptor it belongs to, null when neither
		 *   family resolves
		 */
		async #loadBoxFamily(family)
		{
			const { WorkdayIntentBox } = await requireLazy(family.layoutExtension, false) ?? {};
			if (WorkdayIntentBox)
			{
				return { WorkdayIntentBox, family };
			}

			if (family === BOX_FAMILY.BASE)
			{
				return null;
			}

			const { WorkdayIntentBox: baseBox } = await requireLazy(BOX_FAMILY.BASE.layoutExtension, false) ?? {};

			return baseBox ? { WorkdayIntentBox: baseBox, family: BOX_FAMILY.BASE } : null;
		}

		async #registerShow()
		{
			const periodKey = this.lastPeriodKey;
			if (!periodKey)
			{
				return;
			}

			const response = await this.#registerShowApi(periodKey);
			if (response === null)
			{
				this.#setToOpenInMinutes(this.lastRetryIntervalSeconds / 60);

				return;
			}

			const errors = response.errors ?? [];
			const isPeriodMismatchOrLimit = errors.some(
				(error) => error?.code === 'period_mismatch_or_limit',
			);
			if (isPeriodMismatchOrLimit)
			{
				const data = await this.#getWorkdayIntentBoxData();
				this.#planNextAttempt(data ? data.schedule : undefined);

				return;
			}

			this.#planNextAttempt(response.data?.schedule);
		}

		async #registerOutcome(outcome)
		{
			const periodKey = this.lastPeriodKey;
			if (!periodKey)
			{
				return;
			}

			const response = await this.#registerOutcomeApi(periodKey, outcome);
			if (response === null)
			{
				this.#setToOpenInMinutes(this.lastRetryIntervalSeconds / 60);

				return;
			}

			const errors = response.errors ?? [];
			const isPeriodMismatchOrLimit = errors.some(
				(error) => error?.code === 'period_mismatch_or_limit',
			);
			if (isPeriodMismatchOrLimit)
			{
				const data = await this.#getWorkdayIntentBoxData();
				this.#planNextAttempt(data ? data.schedule : undefined);

				return;
			}

			this.#planNextAttempt(response.data?.schedule);
		}

		#rememberSchedule(schedule)
		{
			if (schedule)
			{
				this.lastPeriodKey = schedule.periodKey;
				this.lastRetryIntervalSeconds = schedule.retryIntervalSeconds;
			}
		}

		#planNextAttempt(schedule)
		{
			const now = Date.now();
			const nowSec = Math.floor(now / 1000);

			let openAtMs;
			if (schedule === undefined)
			{
				openAtMs = now + 10 * 60 * 1000;
			}
			else if (schedule === null)
			{
				openAtMs = this.#startOfNextLocalDayMs();
			}
			else
			{
				const s = schedule;

				this.lastPeriodKey = s.periodKey;
				this.lastRetryIntervalSeconds = s.retryIntervalSeconds;

				if (s.targetStartTimestamp === 0)
				{
					openAtMs = this.#startOfNextLocalDayMs();
				}
				else if (
					s.suppressedUntilTimestamp > nowSec
					|| s.hasTargetAction
					|| s.showCount >= s.maxShows
					|| s.dismissCount >= s.maxDismisses
				)
				{
					openAtMs = Math.max(s.suppressedUntilTimestamp, s.periodEndTimestamp) * 1000;
				}
				else if (nowSec < s.targetStartTimestamp)
				{
					openAtMs = s.targetStartTimestamp * 1000;
				}
				else
				{
					openAtMs = now + s.retryIntervalSeconds * 1000;
				}
			}

			this.#setTimestampToOpenAt(openAtMs);
		}

		#startOfNextLocalDayMs()
		{
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(0, 0, 0, 0);

			return tomorrow.getTime();
		}

		#setToOpenInMinutes(minutes)
		{
			this.#setTimestampToOpenAt(Date.now() + minutes * 60 * 1000);
		}

		#setTimestampToOpenAt(timestampMs)
		{
			this.storage.set({ timestampToOpenAt: timestampMs, userId: env.userId });
		}

		#isReadyToOpenByTime()
		{
			const { timestampToOpenAt, userId } = this.storage.get();
			// The stored timer belongs to another account (storage is not per-user on all platforms),
			// so treat it as ready and let a fresh getData decide.
			if (String(userId) !== String(env.userId))
			{
				return true;
			}

			return timestampToOpenAt <= Date.now();
		}

		#getWorkdayIntentBoxData()
		{
			return new Promise((resolve) => {
				void new RunActionExecutor('timemanmobile.WorkdayIntent.getWorkdayIntentBoxData')
					.setHandler((response) => (response?.status === 'success' ? resolve(response.data) : resolve(null)))
					.call()
					.catch(console.error)
				;
			});
		}

		#registerShowApi(periodKey)
		{
			return new Promise((resolve) => {
				void new RunActionExecutor('timemanmobile.WorkdayIntent.registerShow', { periodKey })
					.setHandler((response) => {
						if (!response)
						{
							resolve(null);

							return;
						}

						resolve({
							data: response.data,
							errors: response.data?.errors ?? response.errors ?? [],
						});
					})
					.call()
				;
			});
		}

		#registerOutcomeApi(periodKey, outcome)
		{
			return new Promise((resolve) => {
				void new RunActionExecutor('timemanmobile.WorkdayIntent.registerOutcome', { periodKey, outcome })
					.setHandler((response) => {
						if (!response)
						{
							resolve(null);

							return;
						}

						resolve({
							data: response.data,
							errors: response.data?.errors ?? response.errors ?? [],
						});
					})
					.call()
				;
			});
		}
	}

	module.exports = { WorkdayIntent };
});
