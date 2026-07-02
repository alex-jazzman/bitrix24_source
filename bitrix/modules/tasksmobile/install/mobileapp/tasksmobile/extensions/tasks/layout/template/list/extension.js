/**
 * @module tasks/layout/template/list
 */
jn.define('tasks/layout/template/list', (require, exports, module) => {
	const { Loc } = require('loc');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { StatefulList } = require('layout/ui/stateful-list');
	const { TypeGenerator } = require('layout/ui/stateful-list/type-generator');
	const { SearchLayout } = require('layout/ui/search-bar');
	const { qrauth } = require('qrauth/utils');
	const { TemplateListItemsFactory, ListItemType } = require('tasks/template-list/simple-list/items');
	const { batchActions } = require('statemanager/redux/batched-actions');
	const store = require('statemanager/redux/store');
	const { usersUpserted } = require('statemanager/redux/slices/users');
	const { createTestIdGenerator } = require('utils/test');
	const { makeLibraryImagePath } = require('asset-manager');
	const { TemplatesListMoreMenu } = require('tasks/layout/template/list/more-menu');
	const { TemplateView } = require('tasks/layout/template/view');
	const {
		upsertTemplates,
		selectSorting,
		setTemplatesSorting,
		toggleTemplatesSorting,
	} = require('tasks/statemanager/redux/slices/templates');

	class TasksTemplateList extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'templates',
			});
			this.getItemTestId = createTestIdGenerator({
				prefix: 'template',
			});
			this.state = this.createInitialState();
			this.search = this.createSearchLayout();
			this.listRef = null;
			this.moreMenu = this.createMoreMenu();
		}

		createInitialState()
		{
			return {
				search: '',
			};
		}

		createSearchLayout()
		{
			return new SearchLayout({
				layout: this.layout,
				id: 'my_tasks_templates',
				cacheId: `my_tasks_templates_${env.userId}`,
				disablePresets: true,
				useCache: {
					onSearch: false,
					onCancel: true,
				},
				onSearch: this.onSearch,
				onCancel: this.onSearch,
			});
		}

		createMoreMenu()
		{
			const sorting = this.getSorting();

			return new TemplatesListMoreMenu({
				selectedSorting: sorting.type,
				isASC: sorting.isASC,
				onSortingClick: this.onSortingClick,
			});
		}

		get layout()
		{
			return this.props.layout ?? layout;
		}

		getEmptyListComponent = ({ isFiltered }) => {
			return StatusBlock({
				testId: this.getTestId('empty'),
				onRefresh: this.onEmptyScreenPullToRefresh,
				emptyScreen: true,
				image: Image({
					resizeMode: 'contain',
					style: {
						width: 339,
						height: 162,
					},
					uri: makeLibraryImagePath('zefir-empty-search.png', 'empty-states'),
				}),
				title: isFiltered
					? Loc.getMessage('TASKSMOBILE_TEMPLATE_LIST_EMPTY_SEARCH_TITLE')
					: Loc.getMessage('TASKSMOBILE_TEMPLATE_LIST_EMPTY_TITLE'),
				description: isFiltered
					? Loc.getMessage('TASKSMOBILE_TEMPLATE_LIST_EMPTY_SEARCH_DESCRIPTION')
					: Loc.getMessage('TASKSMOBILE_TEMPLATE_LIST_EMPTY_DESCRIPTION'),
			});
		};

		onEmptyScreenPullToRefresh = () => {
			this.listRef?.reload?.({ useCache: false });
		};

		getItemProps = (item) => {
			return {
				type: ListItemType.TEMPLATE,
				layout: this.layout,
				testId: this.getItemTestId(item.id),
				itemLayoutOptions: {
					canBePinned: false,
				},
			};
		};

		onItemsLoaded = (responseData) => {
			const { items = [], users = [] } = responseData || {};
			const actions = [];

			if (items.length > 0)
			{
				actions.push(upsertTemplates({
					templates: items,
				}));
			}

			if (users.length > 0)
			{
				actions.push(usersUpserted(users));
			}

			if (actions.length > 0)
			{
				store.dispatch(batchActions(actions));
			}
		};

		onFloatingButtonClick = () => {
			qrauth.open({
				layout: this.layout,
				redirectUrl: `/company/personal/user/${env.userId}/tasks/templates/`,
				showHint: true,
				title: Loc.getMessage('TASKSMOBILE_TEMPLATE_LIST_WEB_TITLE'),
				analyticsSection: 'tasks',
			});
		};

		onItemClick = (templateId) => {
			TemplateView.open({
				layoutWidget: this.layout,
				templateId,
			});
		};

		getSorting()
		{
			return selectSorting(store.getState());
		}

		onSortingClick = (sortingType) => {
			const currentSorting = this.getSorting();

			if (currentSorting.type === sortingType)
			{
				store.dispatch(toggleTemplatesSorting());
			}
			else
			{
				store.dispatch(setTemplatesSorting({ type: sortingType }));
			}

			const nextSorting = this.getSorting();
			this.moreMenu.setSelectedSorting(nextSorting.type);
			this.moreMenu.setIsASC(nextSorting.isASC);

			this.reload({ currentSorting: nextSorting });
		};

		onSearch = ({ text }) => {
			this.reload({ search: text });
		};

		onPanList = () => {
			this.search?.close?.();
		};

		bindRef = (ref) => {
			this.listRef = ref;
		};

		reload(state)
		{
			this.setState(state, () => {
				this.listRef?.reload?.({ useCache: false });
			});
		}

		onBeforeItemsRender = (items, { allItemsLoaded }) => {
			return items.map((item, index) => ({
				...item,
				showBorder: !allItemsLoaded || index !== items.length - 1,
				isLastPinned: false,
			}));
		};

		render()
		{
			const search = this.state.search.trim();
			const sorting = this.getSorting();

			return new StatefulList({
				layout: this.layout,
				testId: this.getTestId('list'),
				showAirStyle: true,
				itemsLoadLimit: 20,
				itemType: this.getItemProps,
				itemFactory: TemplateListItemsFactory,
				typeGenerator: {
					generator: TypeGenerator.generators.bySelectedProperties,
					properties: [
						'id',
						'name',
						'priority',
						'responsibleId',
						'deadlineAfter',
						'checklist',
						'activityDate',
						'allowTimeTracking',
						'timeEstimate',
					],
				},
				needInitMenu: true,
				menuButtons: [
					this.search.getSearchButton(),
					this.moreMenu.getMenuButton(),
				],
				actionParams: {
					loadItems: {
						filter: {
							search,
						},
						order: sorting.type,
						isASC: sorting.isASC ? 1 : 0,
					},
				},
				actions: {
					loadItems: 'tasksmobile.Template.loadItems',
				},
				actionCallbacks: {
					loadItems: this.onItemsLoaded,
				},
				isShowFloatingButton: true,
				onFloatingButtonClick: this.onFloatingButtonClick,
				getEmptyListComponent: () => this.getEmptyListComponent({ isFiltered: search.length > 0 }),
				itemDetailOpenHandler: this.onItemClick,
				onBeforeItemsRender: this.onBeforeItemsRender,
				onPanListHandler: this.onPanList,
				ref: this.bindRef,
				requestTimeoutInMilliseconds: 30000,
			});
		}
	}

	module.exports = { TasksTemplateList };
});
