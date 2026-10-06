/**
 * @module tasks/layout/checklist/preview
 */
jn.define('tasks/layout/checklist/preview', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Loc } = require('loc');
	const { Indent } = require('tokens');
	const { isOnline } = require('device/connection');
	const { PropTypes } = require('utils/validation');
	const { showOfflineToast } = require('toast');
	const { UIMenu } = require('layout/ui/menu');
	const { PureComponent } = require('layout/pure-component');
	const { AddButton } = require('layout/ui/fields/theme/air/elements/add-button');
	const { MoreButton } = require('layout/ui/fields/theme/air/elements/more-button');
	const { Title } = require('tasks/layout/checklist/preview/src/title');
	const { Item, ItemStub } = require('tasks/layout/checklist/preview/src/item');

	const MAX_ELEMENTS = 3;
	const ClickStrategy = {
		CREATE: 'CREATE',
		OPEN: 'OPEN',
	};

	class ChecklistPreview extends PureComponent
	{
		/** @param {ChecklistPreviewProps} props */
		constructor(props)
		{
			super(props);

			this.bindContainerRef = this.bindContainerRef.bind(this);
			this.handleContentClick = this.handleContentClick.bind(this);
			this.createChecklist = this.createChecklist.bind(this);

			const { initialState = [] } = this.getConfig();

			this.state = {
				value: props.value,
				collapsed: initialState.length > MAX_ELEMENTS,
			};
		}

		/** @return {ChecklistPreviewConfig | {}} */
		getConfig()
		{
			return this.props.config || {};
		}

		/** @return {Object} */
		get controller()
		{
			return this.getConfig().checklistController;
		}

		/** @return {string} */
		get testId()
		{
			return this.props.testId;
		}

		/** @return {boolean} */
		isEmpty()
		{
			const { completed = 0, uncompleted = 0 } = this.state.value || {};

			return (completed + uncompleted) === 0;
		}

		/** @return {boolean} */
		isLoading()
		{
			return this.props.loading;
		}

		/** @return {boolean} */
		validate()
		{
			return true;
		}

		/** @return {boolean} */
		isValid()
		{
			return true;
		}

		/** @return {boolean} */
		isRequired()
		{
			return false;
		}

		/** @return {boolean} */
		isReadOnly()
		{
			return this.props.readOnly;
		}

		/** @return {boolean} */
		isDisabled()
		{
			return Boolean(this.props.disabled);
		}

		/** @return {boolean} */
		isMultiple()
		{
			return Boolean(this.props.multiple);
		}

		/** @return {string} */
		getId()
		{
			return this.props.id;
		}

		#getMaxElements()
		{
			const { maxElements } = this.props;

			return maxElements > 0 ? maxElements : MAX_ELEMENTS;
		}

		/** @return {boolean} */
		hasUploadingFiles()
		{
			return false;
		}

		/**
		 * @param {Object} ref
		 * @return {void}
		 */
		bindContainerRef(ref)
		{
			this.fieldContainerRef = ref;
		}

		/**
		 * @param {number | string} taskId
		 * @return {void}
		 */
		setTaskId(taskId)
		{
			this.controller.setTaskId(taskId);
		}

		/**
		 * @param {number} completed
		 * @param {number} uncompleted
		 * @return {void}
		 */
		triggerChange({ completed = 0, uncompleted = 0 })
		{
			this.props.onChange?.({ completed, uncompleted });
		}

		/** @return {(function(): void)|null} */
		getContentClickHandler()
		{
			if (this.isReadOnly() && !this.props.onContentClick)
			{
				return null;
			}

			return this.handleContentClick;
		}

		/** @return {(function(): void)} */
		getCustomContentClickHandler()
		{
			return () => {
				const checklists = [...this.controller.getChecklists().values()];

				if (checklists.length > 1)
				{
					this.#openChecklistSelector(checklists);

					return;
				}

				if (checklists.length === 1)
				{
					this.openPageManager(checklists[0]);

					return;
				}

				if (!this.isReadOnly())
				{
					this.createChecklist();
				}
			};
		}

		/** @return {void} */
		handleContentClick()
		{
			if (!this.isReadOnly() && !this.isDisabled() && !isOnline())
			{
				showOfflineToast({}, this.getParentWidget());

				return;
			}

			if (this.props.onContentClick)
			{
				this.props.onContentClick(this);
			}

			this.getCustomContentClickHandler()();
		}

		#openChecklistSelector(checklists)
		{
			this.menu = this.#createMenu(checklists);
			this.menu.show({ target: this.fieldContainerRef });
		}

		#createMenu(checklists)
		{
			return new UIMenu(this.#getActions(checklists));
		}

		#getActions(checklists)
		{
			const getId = (item) => item.getRootItem()?.getId?.();

			const getTitle = (item) => {
				return item.getRootItem()?.getTitle?.()
					|| Loc.getMessage('TASKS_FIELDS_CHECKLIST_AIR_COMPACT_TITLE');
			};

			const actions = checklists.map((item, index) => ({
				id: `checklist-${getId(item) ?? index}`,
				testId: `checklist-${getId(item) ?? index}`,
				title: getTitle(item),
				onItemSelected: () => this.openPageManager(checklists[index]),
				iconName: Icon.TASK_LIST,
			}));

			if (!this.isReadOnly())
			{
				actions.push({
					id: 'create-checklist',
					testId: 'create-checklist',
					title: Loc.getMessage('TASKS_FIELDS_CHECKLIST_AIR_ADD_CHECKLIST'),
					onItemSelected: this.createChecklist,
					iconName: Icon.PLUS,
				});
			}

			return actions;
		}

		/**
		 * @param {ChecklistPreviewProps} props
		 * @return {void}
		 */
		componentWillReceiveProps(props)
		{
			this.state.value = props.value;

			const elementsLoaded = this.props.loading === true && props.loading === false;

			if (elementsLoaded && this.controller)
			{
				const checklistsCount = this.controller.getChecklists().size;
				this.state.collapsed = checklistsCount > this.#getMaxElements();
			}
		}

		#isCollapsed()
		{
			return this.state.collapsed;
		}

		#expand()
		{
			this.setState({ collapsed: false });
		}

		/**
		 * @param {Object} checklist
		 * @return {void}
		 */
		openPageManager(checklist)
		{
			this.controller.openChecklist({ checklist });
		}

		/** @return {void} */
		createChecklist()
		{
			if (this.isLoading())
			{
				return;
			}

			const { handleOnCreateChecklist } = this.controller;

			const factory = handleOnCreateChecklist();

			factory();
		}

		/** @return {Object} */
		getParentWidget()
		{
			return this.getConfig().parentWidget;
		}

		/** @return {Object[]} */
		getSortedChecklists()
		{
			const checklists = this.controller.getChecklists();

			return [...checklists.values()]
				.filter((checklist) => checklist?.getRootItem()?.hasDescendants())
				.sort((a, b) => {
					const itemA = a.getRootItem()?.getSortIndex();
					const itemB = b.getRootItem()?.getSortIndex();

					return itemA - itemB;
				});
		}

		/** @return {ChecklistPreviewInitialState[]} */
		getChecklistStubs()
		{
			return (this.getConfig().initialState || [{ title: '' }]);
		}

		/** @return {Object[] | ChecklistPreviewInitialState[]} */
		getChecklists()
		{
			return this.isLoading()
				? this.getChecklistStubs()
				: this.getSortedChecklists();
		}

		/** @return {Object} */
		render()
		{
			const { ThemeComponent } = this.props;

			if (ThemeComponent)
			{
				return this.props.ThemeComponent({ field: this });
			}

			const checklists = this.getChecklists();
			const collapsed = this.#isCollapsed();
			const visibleChecklists = collapsed
				? checklists.slice(0, this.#getMaxElements())
				: checklists;
			const restCount = checklists.length - this.#getMaxElements();

			return View(
				{
					testId: `${this.testId}_FIELD`,
					ref: this.bindContainerRef,
					style: {
						paddingTop: Indent.XL.toNumber(),
						paddingBottom: collapsed ? 32 : Indent.XL.toNumber(),
					},
					onLayout: () => {
						const { onLayout } = this.props;

						if (onLayout)
						{
							onLayout(this);
						}
					},
				},
				this.renderTitle(visibleChecklists),
				this.renderStubItems(visibleChecklists),
				this.renderItems(visibleChecklists),
				this.renderAddButtons(),
				this.renderMoreButton(restCount),
			);
		}

		/**
		 * @param {Object[]} checklists
		 * @return {Object | null}
		 */
		renderTitle(checklists)
		{
			const { hideTitle } = this.props;

			if (hideTitle)
			{
				return null;
			}

			return Title({
				loading: this.isLoading(),
				testId: this.testId,
				count: checklists.length,
			});
		}

		/**
		 * @param {Object[]} checklists
		 * @return {Object | null}
		 */
		renderItems(checklists)
		{
			if (this.isEmpty() || this.isLoading())
			{
				return null;
			}

			return View(
				{
					testId: `${this.testId}_CONTENT`,
				},
				...checklists.map((checklist, index) => {
					const rootItem = checklist.getRootItem();

					return Item({
						testId: this.testId,
						totalCount: rootItem.getTotalCount(),
						completedCount: rootItem.getCompletedCount(),
						title: rootItem.getTitle(),
						isComplete: rootItem.getIsComplete(),
						showBorder: index < (checklists.length - 1),
						onClick: () => this.openPageManager(checklist),
					});
				}),
			);
		}

		/**
		 * @param {ChecklistPreviewInitialState[]} checklists
		 * @return {Object | null}
		 */
		renderStubItems(checklists)
		{
			if (!this.isLoading())
			{
				return null;
			}

			return View(
				{
					testId: `${this.testId}_CONTENT`,
				},
				...checklists.map((checklist, index) => ItemStub({
					testId: this.testId,
					title: checklist.title,
					showBorder: index < (checklists.length - 1),
				})),
			);
		}

		/**
		 * @param {number} restCount
		 * @return {Object | null}
		 */
		renderMoreButton(restCount)
		{
			if (!this.#isCollapsed())
			{
				return null;
			}

			return MoreButton({
				testId: `${this.testId}_SHOW_ALL`,
				text: Loc.getMessage(
					'TASKS_FIELDS_CHECKLIST_AIR_SHOW_MORE',
					{
						'#COUNT#': restCount,
					},
				),
				onClick: () => this.#expand(),
			});
		}

		/** @return {Object | null} */
		renderAddButtons()
		{
			const { showAddButton } = this.props;

			if (this.#isCollapsed() || this.isReadOnly() || !showAddButton)
			{
				return null;
			}

			return AddButton({
				testId: this.testId,
				text: Loc.getMessage('TASKS_FIELDS_CHECKLIST_AIR_ADD_CHECKLIST'),
				onClick: this.createChecklist,
				style: {
					paddingHorizontal: Indent.XL2.toNumber(),
				},
			});
		}
	}

	ChecklistPreview.defaultProps = {
		showAddButton: true,
		hideTitle: false,
	};

	ChecklistPreview.propTypes = {
		id: PropTypes.string,
		testId: PropTypes.string,
		value: PropTypes.object,
		readOnly: PropTypes.bool,
		config: PropTypes.shape({
			parentWidget: PropTypes.object,
			checklistController: PropTypes.object,
			initialState: PropTypes.arrayOf(PropTypes.shape({
				title: PropTypes.string,
				completed: PropTypes.number,
				uncompleted: PropTypes.number,
			})),
			taskId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
		}),
		showAddButton: PropTypes.bool,
		maxElements: PropTypes.number,
		loading: PropTypes.bool,
		onLayout: PropTypes.func,
	};

	module.exports = {
		ChecklistPreview,
		ClickStrategy,
		/** @param {ChecklistPreviewProps} props */
		ChecklistField: (props) => new ChecklistPreview(props),
	};
});
