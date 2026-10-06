/** @module tasks/checklist/widget */
jn.define('tasks/checklist/widget', (require, exports, module) => {
	const { PropTypes } = require('utils/validation');
	const { Checklist } = require('tasks/layout/checklist/list');
	const { checklistWidgetFactoryLayout, BOTTOM_SHEET, PAGE_LAYOUT } = require(
		'tasks/checklist/widget/src/manager/factory-layout',
	);
	const { ChecklistMoreMenu } = require('tasks/checklist/widget/src/more-menu');

	class ChecklistWidget
	{
		/**
		 * @param {ChecklistWidgetProps} props
		 * @return {Promise<ChecklistBaseLayout>}
		 */
		static async open(props)
		{
			const checklistWidget = new ChecklistWidget(props);

			return checklistWidget.initialOpenPageManager();
		}

		/** @param {ChecklistWidgetProps} props */
		constructor(props)
		{
			/** @type {ChecklistWidgetProps} */
			this.props = props;
			/** @type {ChecklistBaseLayout} */
			this.openManager = null;

			/** @type {Checklist} */
			this.checklistComponent = null;
			this.parentWidget = props.parentWidget;
			this.menuMore = this.createMoreMenu();
		}

		/**
		 * @private
		 * @return {ChecklistMoreMenu}
		 */
		createMoreMenu()
		{
			const {
				hideCompleted,
				menuMore: {
					actions,
					accessRestrictions,
				},
			} = this.props;

			return new ChecklistMoreMenu(/** @type {ChecklistMoreMenuProps} */ ({
				...actions,
				accessRestrictions,
				hideCompleted,
				onShowOnlyMine: this.onChangeFilter,
				onHideCompleted: this.onHideCompleted,
			}));
		}

		/**
		 * @private
		 * @return {Promise<ChecklistBaseLayout>}
		 */
		async initialOpenPageManager()
		{
			const { parentWidget, inLayout, hideCompleted, hideMoreMenu } = this.props;

			const checklistComponent = this.getChecklistComponent();
			const layoutType = inLayout ? PAGE_LAYOUT : BOTTOM_SHEET;

			/** @type ChecklistBaseLayout */
			const openManager = await checklistWidgetFactoryLayout({
				layoutType,
				parentWidget,
				checklist: Checklist,
				onSave: this.handleOnSave,
				onClose: this.handleOnClose,
				component: checklistComponent,
				onShowMoreMenu: hideMoreMenu ? null : this.handleOnShowMoreMenu,
				highlightMoreButton: hideCompleted,
			});

			const layoutWidget = await openManager.open();

			this.setParentWidget(layoutWidget);
			this.setOpenManager(openManager);
			this.setChecklistComponent(checklistComponent);
			checklistComponent.setParentWidget(layoutWidget);

			return openManager;
		}

		/**
		 * @private
		 * @param {ChecklistFilterParams} [params]
		 */
		onHideCompleted = (params = {}) => {
			const { menuMore: menuMoreParams } = this.props;
			const { onToggleCompletedItems } = menuMoreParams;

			if (onToggleCompletedItems)
			{
				onToggleCompletedItems(params.hideCompleted);
			}

			void this.onChangeFilter(params);
		};

		/**
		 * @private
		 * @param {ChecklistFilterParams} params
		 * @return {Promise<void>}
		 */
		onChangeFilter = async (params) => {
			this.checklistComponent.reload(params);
			const moreMenuParams = await this.menuMore.reload(params);

			this.openManager.update({
				highlightMoreButton: Object.values(moreMenuParams).some((value) => value),
			});
		};

		/**
		 * @private
		 * @return {Checklist}
		 */
		getChecklistComponent()
		{
			const checklistProps = this.getChecklistProps();

			return new Checklist(checklistProps);
		}

		/**
		 * @private
		 * @return {Object}
		 */
		getChecklistProps()
		{
			const { menuMore = {}, ...restProps } = this.props;
			const { onMoveToCheckList } = menuMore.actions;

			return {
				...restProps,
				onMoveToCheckList,
				onChange: this.handleOnChange,
				onChangeFilter: this.onChangeFilter,
			};
		}

		/**
		 * @private
		 * @return {number | string}
		 */
		getChecklistId()
		{
			const { checklist } = this.props;

			return checklist.getId();
		}

		/**
		 * @private
		 * @param {Object} layoutWidget
		 */
		setParentWidget(layoutWidget)
		{
			this.parentWidget = layoutWidget;
		}

		/**
		 * @private
		 * @param {ChecklistBaseLayout} openManager
		 */
		setOpenManager(openManager)
		{
			this.openManager = openManager;
		}

		/**
		 * @private
		 * @param {Checklist} checklistComponent
		 */
		setChecklistComponent(checklistComponent)
		{
			this.checklistComponent = checklistComponent;
		}

		/** @private */
		handleOnShowMoreMenu = () => {
			Keyboard.dismiss();
			this.menuMore.show(this.parentWidget);
		};

		/** @private */
		handleOnChange = () => {
			const { onCompletedChanged } = this.props;

			if (onCompletedChanged)
			{
				onCompletedChanged();
			}

			this.openManager.onChange();
		};

		/** @private */
		handleOnSave = () => {
			const { onSave } = this.props;

			if (onSave)
			{
				return onSave(this.getChecklistId());
			}

			return true;
		};

		/** @private */
		handleOnClose = async () => {
			const { onClose } = this.props;

			this.checklistComponent?.syncFocusedItemText?.(false, true);

			if (onClose)
			{
				return onClose(this.getChecklistId());
			}

			return true;
		};
	}

	ChecklistWidget.propTypes = {
		checklist: PropTypes.object,
		onSave: PropTypes.func,
		onClose: PropTypes.func,
		menuMore: PropTypes.object,
	};

	module.exports = { ChecklistWidget };
});
