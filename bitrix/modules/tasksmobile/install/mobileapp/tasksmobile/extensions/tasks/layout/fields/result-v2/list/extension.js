/**
 * @module tasks/layout/fields/result-v2/list
 */
jn.define('tasks/layout/fields/result-v2/list', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { BottomSheet } = require('bottom-sheet');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { StatefulList } = require('layout/ui/stateful-list');
	const { TypeGenerator } = require('layout/ui/stateful-list/type-generator');
	const { ButtonSize, ButtonDesign, Button } = require('ui-system/form/buttons/button');
	const { Icon } = require('ui-system/blocks/icon');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { PropTypes } = require('utils/validation');
	const {
		ListItemsFactory,
		LIST_ITEM_TYPE,
	} = require('tasks/layout/fields/result-v2/list/src/list-item-factory');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { upsertResults } = require('tasks/statemanager/redux/slices/tasks-results-v2');
	const { observeListChange } = require('tasks/statemanager/redux/slices/tasks-results-v2/observers/stateful-list-observer');

	class TaskResultList extends PureComponent
	{
		/**
		 * @public
		 * @param {Object} params
		 * @param {number} params.taskId
		 * @param {PageManager} [params.parentWidget=PageManager]
		 * @param {function} params.onResultClick
		 * @param {function} params.onCreateClick
		 */
		static open(params)
		{
			void new BottomSheet({
				titleParams: {
					text: Loc.getMessage('TASKS_FIELDS_RESULT_V2_LIST_WIDGET_TITLE'),
					type: 'dialog',
				},
				component: (widget) => {
					return new TaskResultList({
						taskId: params.taskId,
						layoutWidget: widget,
						onResultClick: params.onResultClick,
						onCreateClick: params.onCreateClick,
					});
				},
			})
				.setParentWidget(params.parentWidget || PageManager)
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setNavigationBarColor(Color.bgSecondary.toHex())
				.alwaysOnTop()
				.open()
			;
		}

		constructor(props)
		{
			super(props);

			this.bindRef = this.#bindRef.bind(this);
			this.onItemsLoaded = this.#onItemsLoaded.bind(this);
			this.onBeforeItemsRender = this.#onBeforeItemsRender.bind(this);
			this.itemDetailOpenHandler = this.#itemDetailOpenHandler.bind(this);
			this.onVisibleResultsChange = this.#onVisibleResultsChange.bind(this);
		}

		componentDidMount()
		{
			this.#subscribe();
		}

		#subscribe()
		{
			this.unsubscribeResultsObserver = observeListChange(
				store,
				this.onVisibleResultsChange,
				{ taskId: this.props.taskId },
			);
		}

		componentWillUnmount()
		{
			this.unsubscribeResultsObserver?.();
		}

		render()
		{
			const { taskId, layoutWidget, onCreateClick } = this.props;

			return Box(
				{
					footer: BoxFooter(
						{},
						Button({
							text: Loc.getMessage('TASKS_FIELDS_RESULT_V2_LIST_ADD_RESULT'),
							size: ButtonSize.L,
							design: ButtonDesign.FILLED,
							leftIcon: Icon.PLUS,
							stretched: true,
							testId: 'TASK_RESULT_LIST_CREATE_RESULT',
							onClick: () => onCreateClick?.(layoutWidget),
						}),
					),
					safeArea: {
						bottom: true,
					},
				},
				new StatefulList({
					testId: 'task-result-list',
					showAirStyle: true,
					typeGenerator: {
						generator: TypeGenerator.generators.bySelectedProperties,
						properties: [
							'files',
						],
						callbacks: {
							files: (files) => Type.isArrayFilled(files),
						},
					},
					useCache: true,
					shouldReloadDynamically: true,
					layout: layoutWidget,
					jsonEnabled: true,
					actions: {
						loadItems: 'tasksmobile.v2.Task.Result.tail',
					},
					actionParams: {
						loadItems: {
							taskId,
						},
					},
					actionCallbacks: {
						loadItems: this.onItemsLoaded,
					},
					itemType: LIST_ITEM_TYPE,
					itemFactory: ListItemsFactory,
					itemsLoadLimit: 20,
					isShowFloatingButton: false,
					ref: this.bindRef,
					onBeforeItemsRender: this.onBeforeItemsRender,
					itemDetailOpenHandler: this.itemDetailOpenHandler,
					animationTypes: {
						insertRows: 'fade',
						updateRows: 'none',
						deleteRow: 'fade',
						moveRow: true,
					},
				}),
			);
		}

		#bindRef(ref)
		{
			if (ref)
			{
				/** @type {StatefulList} */
				this.statefulList = ref;
			}
		}

		async #onItemsLoaded(responseData, context)
		{
			const { items = [], map = [] } = responseData || {};

			if (items.length === 0 || context === 'cache')
			{
				return;
			}

			void dispatch(
				upsertResults({
					items,
					map,
					taskId: this.props.taskId,
				}),
			);
		}

		#onBeforeItemsRender(items)
		{
			return items.map((item, index) => ({ ...item, showBorder: index !== items.length - 1 }));
		}

		#itemDetailOpenHandler(resultId)
		{
			this.props.onResultClick?.(resultId, this.props.layoutWidget);
		}

		#onVisibleResultsChange({ removed, added })
		{
			if (!this.statefulList || this.statefulList.isLoading())
			{
				// delay until list is loaded to prevent race-condition with addItems loading.
				setTimeout(() => this.#onVisibleResultsChange({ added, removed }), 30);

				return;
			}

			if (removed.length > 0)
			{
				void this.#removeItems(removed);
			}

			if (added.length > 0)
			{
				void this.#addItemsWithoutServerRequest(added);
			}
		}

		#hasItem(id)
		{
			return this.statefulList?.hasItem(id) ?? false;
		}

		#removeItems(items)
		{
			if (!this.statefulList)
			{
				return Promise.resolve();
			}

			const existingItems = items.filter((item) => this.#hasItem(item.id));
			if (existingItems.length === 0)
			{
				return Promise.resolve();
			}

			return Promise.allSettled(items.map(({ id }) => this.statefulList.removeItem(id)));
		}

		#addItemsWithoutServerRequest(items)
		{
			if (!this.statefulList)
			{
				return Promise.resolve();
			}

			const nonExistingItems = items.filter((item) => !this.#hasItem(item.id));
			if (nonExistingItems.length === 0)
			{
				return Promise.resolve();
			}

			return this.statefulList.updateItemsData(nonExistingItems);
		}
	}

	TaskResultList.propTypes = {
		taskId: PropTypes.number.isRequired,
		layoutWidget: PropTypes.object.isRequired,
		onResultClick: PropTypes.func.isRequired,
		onCreateClick: PropTypes.func.isRequired,
	};

	module.exports = { TaskResultList };
});
