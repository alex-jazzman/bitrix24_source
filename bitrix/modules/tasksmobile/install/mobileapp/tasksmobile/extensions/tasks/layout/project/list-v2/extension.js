/**
 * @module tasks/layout/project/list-v2
 */
jn.define('tasks/layout/project/list-v2', (require, exports, module) => {
	const { StatefulList } = require('layout/ui/stateful-list');
	const { TypeGenerator } = require('layout/ui/stateful-list/type-generator');
	const { Icon } = require('assets/icons');
	const { Loc } = require('loc');
	const { showToast } = require('toast');
	const { ProjectCreateManager } = require('layout/socialnetwork/project-v2/create');
	const { RequestExecutor } = require('rest');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { batchActions } = require('statemanager/redux/batched-actions');
	const store = require('statemanager/redux/store');
	const { usersAdded, usersUpserted } = require('statemanager/redux/slices/users');
	const {
		ListItemType,
		ProjectListItemsFactory,
	} = require('tasks/project-list/simple-list/items');
	const { groupsAdded, groupsUpserted, selectGroupById } = require('tasks/statemanager/redux/slices/groups');
	const {
		addProjectListItems,
		upsertProjectListItems,
		clearProjectList,
		selectIds,
	} = require('tasks/statemanager/redux/slices/project-list');
	const { TasksProjectListMoreMenu } = require('tasks/layout/project/list-v2/src/more-menu');
	const { ProjectListSearch } = require('tasks/layout/project/list-v2/src/search');
	const { ProjectListEmptyState } = require('tasks/layout/project/list-v2/src/empty-state');
	const { ProjectListProjectOpener } = require('tasks/layout/project/list-v2/src/project-opener');
	const { ProjectListPull } = require('tasks/layout/project/list-v2/src/pull');
	const {
		PROJECT_LIST_MODE,
		COUNTER_FILTER,
		COUNTER_TYPES_TO_LOAD,
	} = require('tasks/layout/project/list-v2/src/constants');

	const DEFAULT_ITEMS_LOAD_LIMIT = 20;
	const DEFAULT_PAGE = 1;

	class TasksProjectListV2 extends LayoutComponent
	{
		/**
		 * @param {TasksProjectListV2Props} props
		 */
		constructor(props)
		{
			super(props);

			this.listRef = null;
			this.isPortalProjectsEmpty = false;
			this.counters = {};
			this.totalCounterValue = 0;
			this.selectedCounterFilterId = COUNTER_FILTER.none;
			this.projectOpener = new ProjectListProjectOpener({
				getPreloadedChatId: this.getPreloadedProjectChatId,
			});
			this.search = new ProjectListSearch({
				layout: this.layout,
				mode: PROJECT_LIST_MODE,
				onChange: this.onSearchChange,
			});
			this.moreMenu = new TasksProjectListMoreMenu(
				this.counters,
				this.selectedCounterFilterId,
				null,
				{
					onCounterClick: this.onCounterClick,
					onReadAllClick: this.onReadAllClick,
				},
			);
			this.pull = new ProjectListPull({
				onProjectCounter: this.onProjectCounter,
				onUserCounter: this.onUserCounter,
				userId: env.userId,
			});

			this.reloadCountersAndMenu()
				.catch(console.error)
			;
		}

		get layout()
		{
			return this.props.layout ?? layout;
		}

		get cacheName()
		{
			return `tasks-project-list-v2-${env.userId}`;
		}

		componentDidMount()
		{
			this.pull.subscribe();
		}

		componentWillUnmount()
		{
			this.pull.unsubscribe();
		}

		loadCounters()
		{
			return new RunActionExecutor('tasksmobile.Task.Counter.getByType', {
				counterTypes: COUNTER_TYPES_TO_LOAD,
			})
				.setHandler((response) => {
					this.counters = response.data ?? {};
					this.totalCounterValue = this.getTotalCounterValue(this.counters);
				})
				.call(false)
			;
		}

		getTotalCounterValue(counters)
		{
			if (Number.isInteger(counters.projectsTotal))
			{
				return counters.projectsTotal;
			}

			return (
				Number(counters[COUNTER_FILTER.sonetTotalExpired] ?? 0)
				+ Number(counters[COUNTER_FILTER.sonetTotalComments] ?? 0)
			);
		}

		render()
		{
			return View(
				{
					resizableByKeyboard: true,
					style: {
						flex: 1,
					},
				},
				new StatefulList({
					layout: this.layout,
					testId: 'tasks-project-list-v2',
					cacheName: this.cacheName,
					showAirStyle: true,
					itemsLoadLimit: DEFAULT_ITEMS_LOAD_LIMIT,
					itemType: ListItemType.PROJECT,
					itemFactory: ProjectListItemsFactory,
					typeGenerator: {
						generator: TypeGenerator.generators.bySelectedProperties,
						properties: [
							'id',
							'activityDate',
							'isPinned',
							'ownerId',
							'moderatorIds',
							'memberIds',
							'counter',
						],
					},
					actionParams: {
						loadItems: {
							projectSearchParams: this.getSearchParams(),
							mode: PROJECT_LIST_MODE,
						},
					},
					actions: {
						loadItems: 'tasksmobile.ProjectV2.loadItems',
					},
					actionCallbacks: {
						loadItems: this.onItemsLoaded,
					},
					pull: this.pull.getPullConfig(),
					isShowFloatingButton: true,
					onFloatingButtonClick: this.onFloatingButtonClick,
					itemDetailOpenHandler: this.onProjectClick,
					getEmptyListComponent: this.getEmptyListComponent,
					needInitMenu: true,
					menuButtons: this.getLayoutMenuButtons(),
					onPanListHandler: this.onPanList,
					ref: this.bindRef,
				}),
			);
		}

		bindRef = (ref) => {
			if (ref)
			{
				this.listRef = ref;
				this.updateMoreMenuButton();
			}
		};

		onSearchChange = ({ isPresetChanged } = {}) => {
			if (isPresetChanged)
			{
				this.selectedCounterFilterId = COUNTER_FILTER.none;
				this.moreMenu.setSelectedCounter(this.selectedCounterFilterId);
			}

			this.reload();
		};

		onPanList = () => {
			this.search?.close?.();
		};

		onCounterClick = (counterFilterId) => {
			const nextCounterFilterId = this.selectedCounterFilterId === counterFilterId
				? COUNTER_FILTER.none
				: counterFilterId
			;

			this.selectedCounterFilterId = nextCounterFilterId;
			this.moreMenu.setSelectedCounter(nextCounterFilterId);

			this.reload();
		};

		onReadAllClick = async () => {
			try
			{
				const response = await new RequestExecutor('tasks.viewedGroup.project.markAsRead', {
					fields: {
						groupId: 0,
					},
				}).call();

				if (response.result !== true)
				{
					return;
				}

				await this.reloadCountersAndMenu();
				this.reload();

				showToast({
					icon: Icon.CHATS_WITH_CHECK,
					message: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_MORE_MENU_READ_ALL_NOTIFICATION'),
				});
			}
			catch (error)
			{
				console.error(error);
			}
		};

		onProjectClick = (projectId) => {
			void this.projectOpener.open(projectId);
		};

		getPreloadedProjectChatId = (projectId) => {
			const group = selectGroupById(store.getState(), projectId);

			return Number(group?.additionalData?.CHAT_ID ?? 0);
		};

		onFloatingButtonClick = () => {
			void ProjectCreateManager.open({
				userId: env.userId,
				onCreate: this.onProjectCreated,
			});
		};

		onProjectCreated = () => {
			this.reloadCountersAndMenu()
				.catch(console.error)
			;
			this.reload();
		};

		getEmptyListComponent = () => {
			return (new ProjectListEmptyState({
				testId: 'tasks-project-list-v2-empty',
				isSearchActive: this.isSearchParamsActive(),
				isPortalProjectsEmpty: this.isPortalProjectsEmpty,
				onRefresh: this.onEmptyScreenPullToRefresh,
			})).render();
		};

		onEmptyScreenPullToRefresh = () => {
			this.reload();
		};

		onProjectCounter = () => {
			this.reloadCountersAndMenu()
				.catch(console.error)
			;
		};

		onUserCounter = (counterData) => {
			this.reloadCountersAndMenu()
				.catch(console.error)
			;

			const projectIds = selectIds(store.getState())
				.filter((projectId) => counterData?.[projectId])
			;

			if (projectIds.length === 0)
			{
				return;
			}

			this.listRef?.updateItems(projectIds, false, true, false)?.catch(console.error)
			;
		};

		reload()
		{
			this.listRef?.reload(
				{
					actionParams: {
						loadItems: {
							projectSearchParams: this.getSearchParams(),
							mode: PROJECT_LIST_MODE,
						},
					},
					menuButtons: this.getLayoutMenuButtons(),
				},
				{
					useCache: false,
				},
			);
		}

		updateMoreMenuButton({ updateVisualCounter = true } = {})
		{
			this.moreMenu.setCounters(this.counters);
			this.listRef?.initMenu(null, this.getLayoutMenuButtons());

			if (updateVisualCounter)
			{
				this.setVisualCounter();
			}
		}

		async reloadCountersAndMenu({ updateVisualCounter = true } = {})
		{
			await this.loadCounters();
			this.updateMoreMenuButton({ updateVisualCounter });
		}

		setVisualCounter()
		{
			BX.postComponentEvent('tasks.project.list:setVisualCounter', [
				{
					value: this.totalCounterValue,
				},
			], 'tasks.tabs');
		}

		/**
		 * @returns {ProjectListSearchParams}
		 */
		getSearchParams()
		{
			return {
				...this.search.getParams(),
				counterFilterId: this.selectedCounterFilterId,
			};
		}

		isSearchParamsActive()
		{
			return this.search.isActive()
				|| this.selectedCounterFilterId !== COUNTER_FILTER.none;
		}

		getLayoutMenuButtons()
		{
			return [
				this.search.getButton(),
				this.moreMenu.getMenuButton(),
			];
		}

		/**
		 * @param {ProjectListLoadItemsResponse} responseData
		 * @param {string} context
		 * @param {object} config
		 */
		onItemsLoaded = (responseData, context, config = {}) => {
			const { items = [], groups = [], users = [], meta = {} } = responseData || {};
			const isCache = context === 'cache';
			const isFirstAjaxPage = !isCache && config.navigation?.page === DEFAULT_PAGE;
			const actions = [];

			if (!isCache)
			{
				this.isPortalProjectsEmpty = meta.isPortalProjectsEmpty === true;
			}

			if (isFirstAjaxPage)
			{
				actions.push(clearProjectList());
				this.reloadCountersAndMenu()
					.catch(console.error)
				;
			}

			if (groups.length > 0)
			{
				actions.push(isCache ? groupsAdded(groups) : groupsUpserted(groups));
			}

			if (users.length > 0)
			{
				actions.push(isCache ? usersAdded(users) : usersUpserted(users));
			}

			if (items.length > 0)
			{
				actions.push(isCache ? addProjectListItems(items) : upsertProjectListItems(items));
			}

			if (actions.length > 0)
			{
				store.dispatch(batchActions(actions));
			}
		};
	}

	module.exports = {
		TasksProjectListV2,
	};
});
