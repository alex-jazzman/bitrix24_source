/**
 * @module onboarding/testing-tool
 */
jn.define('onboarding/testing-tool', (require, exports, module) => {
	const { BaseManualTestingTool, FieldType } = require('manual-testing-tools');
	const { CacheKey, ServerKey, VisitPeriod } = require('onboarding/const');
	const { CacheStorage } = require('onboarding/cache');
	const { CaseHistory } = require('onboarding');
	const { CaseLimiter } = require('onboarding/limiter');
	const { createTestIdGenerator } = require('utils/test');
	const { RegisteredCaseId, TestRequestKey } = require('onboarding/testing-tool/src/const');
	const { Tourist } = require('tourist');

	const TAB_CASES_MAP = {
		tasks: [
			RegisteredCaseId.ON_EMPTY_TASK_LIST,
			RegisteredCaseId.MORE_THAN_THREE_TASKS,
			RegisteredCaseId.MORE_THAN_SIX_TASKS,
			RegisteredCaseId.SUPPOSEDLY_COMPLETED_TASKS,
			RegisteredCaseId.UNREAD_TASKS_COUNTERS,
		],
		calendar: [
			RegisteredCaseId.ON_MORE_THAN_THREE_CALENDAR_EVENTS,
		],
		menu: [
			RegisteredCaseId.ON_PROFILE_SHOULD_BE_FILLED,
		],
		chat: [
			RegisteredCaseId.ON_ONE_TO_ONE_CHAT_VIEW,
			RegisteredCaseId.ON_GROUP_CHAT_VIEW,
			RegisteredCaseId.ON_FILES_APPEARS_IN_CHAT,
		],
	};

	class OnboardingTestingTool extends BaseManualTestingTool
	{
		constructor(props)
		{
			super(props);

			this.state = {
				sessionsCount: this.#getSessionsCount(),
				hintsPerDay: 0,
				cases: Object.fromEntries(
					this.#cases.map((onboardingCase) => [onboardingCase.id, Boolean(onboardingCase.isShown)]),
				),
				tabs: [
					{
						id: 'tasks',
						isShown: false,
					},
					{
						id: 'chats',
						isShown: false,
					},
					{
						id: 'calendar',
						isShown: false,
					},
					{
						id: 'menu',
						isShown: false,
					},
				],
				shouldUseTabSync: false,
			};

			this.getTestId = createTestIdGenerator({
				prefix: 'onboarding-manual-testing-tool',
				context: this,
			});

			this.touristInited = false;
		}

		#ensureTouristReady = async () => {
			if (!this.touristInited)
			{
				try
				{
					await Tourist.ready();
				}
				catch (err)
				{
					console.warn('Tourist initialization failed:', err);
				}
				this.touristInited = true;
			}
		};

		async componentDidMount()
		{
			const { shouldUseTabSync } = this.state;

			await this.#ensureTouristReady();

			const hints = await this.#getHintsPerDay();

			const history = new CaseHistory();
			const entries = await Promise.all(
				this.#cases.map(async (onboardingCase) => {
					const shown = await history.isAlreadyShown(onboardingCase.id);

					return [onboardingCase.id, Boolean(shown)];
				}),
			);

			const casesFromHistory = Object.fromEntries(entries);
			const shownTabs = await this.#getShownTabs();
			const storedShouldSync = await this.#getShouldUseTabSync();

			this.setState((prev) => ({
				hintsPerDay: hints,
				cases: { ...prev.cases, ...casesFromHistory },
				tabs: prev.tabs.map((tab) => ({
					...tab,
					isShown: shownTabs?.includes(tab.id),
				})),
				shouldUseTabSync: storedShouldSync,
			}));

			if (shouldUseTabSync)
			{
				this.#syncTabsWithCases();
			}
		}

		async #getShouldUseTabSync()
		{
			const cache = CacheStorage.get(TestRequestKey.SHOULD_USE_TAB_SYNC);
			if (cache)
			{
				return cache.shouldUseTabSync;
			}

			await this.#ensureTouristReady();
			const server = Tourist.getContext(TestRequestKey.SHOULD_USE_TAB_SYNC);
			if (server)
			{
				return server.shouldUseTabSync;
			}

			return false;
		}

		async #saveShouldUseTabSync(next)
		{
			await this.#ensureTouristReady();

			const result = {
				shouldUseTabSync: Boolean(next),
			};

			await Tourist.remember(TestRequestKey.SHOULD_USE_TAB_SYNC, { context: result });
			CacheStorage.set(TestRequestKey.SHOULD_USE_TAB_SYNC, result);

			return result.shouldUseTabSync;
		}

		#syncTabsWithCases = () => {
			this.setState((prev) => {
				const { cases, tabs } = prev;

				const shownTabIds = new Set();

				const nextTabs = tabs.map((tab) => {
					const relatedCases = TAB_CASES_MAP[tab.id] || [];
					const isShown = relatedCases.some((caseId) => cases?.[caseId]);
					if (isShown)
					{
						shownTabIds.add(tab.id);
					}

					return { ...tab, isShown };
				});

				const changed = nextTabs.some((tab, i) => tab.isShown !== tabs[i].isShown);
				if (changed)
				{
					this.#saveShownTabs([...shownTabIds]).catch((e) => console.warn('saveShownTabs failed:', e));
				}

				return { tabs: nextTabs };
			});
		};

		get #cases()
		{
			return [
				{
					id: RegisteredCaseId.ON_EMPTY_TASK_LIST,
					title: `[Задачи]: ${RegisteredCaseId.ON_EMPTY_TASK_LIST}`,
				},
				{
					id: RegisteredCaseId.MORE_THAN_THREE_TASKS,
					title: `[Задачи]: ${RegisteredCaseId.MORE_THAN_THREE_TASKS}`,
				},
				{
					id: RegisteredCaseId.MORE_THAN_SIX_TASKS,
					title: `[Задачи]: ${RegisteredCaseId.MORE_THAN_SIX_TASKS}`,
				},
				{
					id: RegisteredCaseId.SUPPOSEDLY_COMPLETED_TASKS,
					title: `[Задачи]: ${RegisteredCaseId.SUPPOSEDLY_COMPLETED_TASKS}`,
				},
				{
					id: RegisteredCaseId.UNREAD_TASKS_COUNTERS,
					title: `[Задачи]: ${RegisteredCaseId.UNREAD_TASKS_COUNTERS}`,
				},
				{
					id: RegisteredCaseId.IS_USER_ALONE,
					title: `[Любой]: ${RegisteredCaseId.IS_USER_ALONE}`,
				},
				{
					id: RegisteredCaseId.ON_PROFILE_SHOULD_BE_FILLED,
					title: `[Профиль/Меню еще]: ${RegisteredCaseId.ON_PROFILE_SHOULD_BE_FILLED}`,
				},
				{
					id: RegisteredCaseId.ON_MORE_THAN_THREE_CALENDAR_EVENTS,
					title: `[Календарь]: ${RegisteredCaseId.ON_MORE_THAN_THREE_CALENDAR_EVENTS}`,
				},
				{
					id: RegisteredCaseId.ON_ONE_TO_ONE_CHAT_VIEW,
					title: `[Чат]: ${RegisteredCaseId.ON_ONE_TO_ONE_CHAT_VIEW}`,
				},
				{
					id: RegisteredCaseId.ON_GROUP_CHAT_VIEW,
					title: `[Чат]: ${RegisteredCaseId.ON_GROUP_CHAT_VIEW}`,
				},
				{
					id: RegisteredCaseId.ON_FILES_APPEARS_IN_CHAT,
					title: `[Чат]: ${RegisteredCaseId.ON_FILES_APPEARS_IN_CHAT}`,
				},
			];
		}

		getSettings()
		{
			const { sessionsCount = 0, hintsPerDay = 0, cases, tabs, shouldUseTabSync } = this.state;

			return [
				{
					label: 'Количество входов в приложение',
					value: sessionsCount,
					onChange: this.handleSessionsCountChange,
					testId: this.getTestId('sessions-count'),
					type: FieldType.NUMBER,
				},
				{
					label: 'Количество показанных подсказок за день',
					value: hintsPerDay,
					onChange: this.handleHintsPerDayChange,
					testId: this.getTestId('hints-per-day-count'),
					type: FieldType.NUMBER,
				},
				{
					label: 'Нужна ли синхронизация табов с показанными кейсами',
					value: shouldUseTabSync,
					onChange: this.handleShouldUseTabSyncChange,
					testId: this.getTestId('sync-tabs-with-cases'),
					type: FieldType.BOOLEAN,
				},
				{
					type: FieldType.GROUP,
					title: 'Табы, в которых был показан онбординг',
					fields: tabs.map((tab) => ({
						id: tab.id,
						testId: this.getTestId(`tab-is-shown-${tab.id}`),
						value: tab.isShown,
						label: tab.id,
						onChange: this.handleTabShownChange,
						type: FieldType.BOOLEAN,
					})),
				},
				{
					type: FieldType.GROUP,
					title: 'Список показанных кейсов',
					fields: Object.values(this.#cases).map((onboardingCase) => ({
						id: onboardingCase.id,
						testId: this.getTestId(`case-is-shown-${onboardingCase.id}`),
						value: cases?.[onboardingCase.id] ?? onboardingCase.isShown,
						label: onboardingCase.title,
						onChange: this.handleCaseIsShownChange,
						type: FieldType.BOOLEAN,
					})),
				},
			];
		}

		handleTabShownChange = async ({ value, id }) => {
			if (!id)
			{
				return;
			}

			const nextValue = (value && typeof value === 'object' && 'value' in value)
				? Boolean(value.value)
				: Boolean(value);

			let shownTabs = [];
			try
			{
				shownTabs = await this.#getShownTabs();
			}
			catch (e)
			{
				console.warn('Failed to load shown tabs:', e);
			}

			const already = shownTabs.includes(id);
			if (nextValue && !already)
			{
				shownTabs.push(id);
			}
			else if (!nextValue && already)
			{
				shownTabs = shownTabs.filter((t) => t !== id);
			}

			await this.#saveShownTabs(shownTabs);

			this.setState((prev) => ({
				tabs: prev.tabs.map((t) => (t.id === id ? { ...t, isShown: nextValue } : t)),
			}));
		};

		async #getShownTabs()
		{
			const limit = await OnboardingTestingTool.#getLimitState();

			return Array.isArray(limit.tabs) ? limit.tabs : [];
		}

		async #saveShownTabs(nextTabsIds = [])
		{
			const limit = await OnboardingTestingTool.#getLimitState();
			limit.tabs = nextTabsIds;

			await this.#ensureTouristReady();

			await Tourist.remember(ServerKey.HINTS_COUNT, { context: limit });
			CacheStorage.set(CacheKey.HINTS_COUNT, limit);
		}

		handleSessionsCountChange = async ({ value }) => {
			const MAX = 1000;
			const count = Math.max(0, Math.min(parseInt(value, 10) || 0, MAX));

			CacheStorage.set(VisitPeriod.ONE_DAY, Number(count));

			await this.#ensureTouristReady();

			await Tourist.forget(VisitPeriod.ONE_DAY);

			for (let i = 0; i < count; i += 1)
			{
				// eslint-disable-next-line no-await-in-loop
				await Tourist.remember(VisitPeriod.ONE_DAY);
			}

			this.setState({ sessionsCount: Number(value) });
		};

		handleHintsPerDayChange = async ({ value }) => {
			const MAX = 1000;
			const count = Math.max(0, Math.min(parseInt(value, 10) || 0, MAX));
			const now = Date.now();

			let tabs = [];
			const cache = CacheStorage.get(CacheKey.HINTS_COUNT);
			if (cache && Array.isArray(cache.tabs))
			{
				tabs = cache.tabs;
			}
			else
			{
				await this.#ensureTouristReady();
				const server = Tourist.getContext(ServerKey.HINTS_COUNT) ?? null;
				if (server && Array.isArray(server.tabs))
				{
					tabs = server.tabs;
				}
			}

			const result = { count, timestamp: now, tabs };

			await this.#ensureTouristReady();
			await Tourist.remember(ServerKey.HINTS_COUNT, { context: result });
			CacheStorage.set(CacheKey.HINTS_COUNT, result);

			this.setState({ hintsPerDay: count });

			return result;
		};

		handleCaseIsShownChange = async ({ value, id }) => {
			if (!id)
			{
				return;
			}

			const next = (value && typeof value === 'object' && 'value' in value)
				? Boolean(value.value)
				: Boolean(value);

			const history = new CaseHistory();
			if (next)
			{
				await history.markAsShown(id);
			}
			else
			{
				await this.#markAsNotShown(id);
			}

			this.setState((prev) => ({
				cases: { ...prev.cases, [id]: next },
			}), () => {
				if (this.state.shouldUseTabSync)
				{
					this.#syncTabsWithCases();
				}
			});
		};

		handleShouldUseTabSyncChange = async ({ value }) => {
			await this.#saveShouldUseTabSync(value);

			this.setState({ shouldUseTabSync: value }, () => {
				if (value)
				{
					this.#syncTabsWithCases();
				}
			});
		};

		#getSessionsCount()
		{
			let localCounter = CacheStorage.get(VisitPeriod.ONE_DAY);

			if (!localCounter)
			{
				localCounter = Tourist.numberOfTimes(VisitPeriod.ONE_DAY) || 0;
			}

			return localCounter;
		}

		static async #getLimitState()
		{
			const cache = CaseLimiter.getCache();

			if (cache)
			{
				cache.tabs = Array.isArray(cache.tabs) ? cache.tabs : [];

				return cache;
			}

			const server = await CaseLimiter.getFromServer();
			server.tabs = Array.isArray(server.tabs) ? server.tabs : [];

			return server;
		}

		async #getHintsPerDay()
		{
			const cache = CacheStorage.get(CacheKey.HINTS_COUNT);

			if (cache)
			{
				return cache.count;
			}

			await this.#ensureTouristReady();

			const server = Tourist.getContext(ServerKey.HINTS_COUNT) ?? {
				count: 0,
				timestamp: null,
				tabs: [],
			};

			return server.count;
		}

		async #markAsNotShown(id)
		{
			if (id === null)
			{
				return;
			}

			try
			{
				await this.#ensureTouristReady();
				const currentCases = Tourist.getContext(ServerKey.CASES) || {};
				const { [id]: _removed, ...nextCases } = currentCases;
				await Tourist.remember(ServerKey.CASES, { context: nextCases });

				const history = new CaseHistory();
				const shownIds = await history.getIdsFromStorage();
				const nextShownIds = Array.isArray(shownIds) ? shownIds.filter((shownId) => shownId !== id) : [];
				CacheStorage.set(CacheKey.SHOWN_IDS, nextShownIds);
			}
			catch (err)
			{
				console.warn('OnboardingTestingTool.#markAsNotShown failed:', err);
			}
		}
	}

	module.exports = {
		OnboardingTestingTool: (props) => new OnboardingTestingTool(props),
	};
});
