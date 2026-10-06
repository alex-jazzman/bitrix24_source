/**
 * @module tasks/layout/checklist/list/src/menu/checklists-menu
 */
jn.define('tasks/layout/checklist/list/src/menu/checklists-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');
	const { UIMenu } = require('layout/ui/menu');
	const { PropTypes } = require('utils/validation');

	class ChecklistsMenu
	{
		/** @param {ChecklistsMenuProps} props */
		static open(props)
		{
			const menu = new ChecklistsMenu(props);

			menu.show();
		}

		/** @param {ChecklistsMenuProps} props */
		constructor(props)
		{
			/** @type {ChecklistsMenuProps} */
			this.props = props;

			/** @type {Object} */
			this.menu = this.#createMenu();
		}

		show()
		{
			const { targetRef } = this.props;

			this.menu.show({ target: targetRef });
		}

		/**
		 * @private
		 * @return {Object}
		 */
		#createMenu()
		{
			return new UIMenu(this.getMenuActions());
		}

		/**
		 * @private
		 * @return {ChecklistMenuAction[]}
		 */
		getMenuActions()
		{
			const { checklists, sourceChecklistId } = this.props;
			const actions = [];

			[...checklists.values()].sort((a, b) => {
				const itemA = a.getRootItem()?.getSortIndex();
				const itemB = b.getRootItem()?.getSortIndex();

				return itemA - itemB;
			}).forEach((checklist) => {
				const rootItem = checklist.getRootItem();
				const checklistId = rootItem.getId();

				if (sourceChecklistId !== checklistId)
				{
					actions.push({
						id: String(checklistId),
						title: rootItem.getTitle(),
						isCustomIconColor: true,
						iconName: Icon.TASK_LIST,
						onItemSelected: () => {
							this.handleItemSelected(checklistId);
						},
					});
				}
			});

			actions.push(this.getActionToNewChecklistItem());

			return actions;
		}

		/**
		 * @private
		 * @return {ChecklistMenuAction}
		 */
		getActionToNewChecklistItem()
		{
			return {
				id: 'newChecklist',
				title: Loc.getMessage('TASKSMOBILE_LAYOUT_CHECKLIST_MOVE_TO_NEW'),
				isCustomIconColor: true,
				iconName: Icon.PLUS,
				onItemSelected: () => {
					this.handleItemSelected();
				},
			};
		}

		/**
		 * @private
		 * @param {string | number | undefined} checklistId
		 */
		handleItemSelected = (checklistId) => {
			const { moveItemToChecklist } = this.props;

			if (moveItemToChecklist)
			{
				moveItemToChecklist(checklistId);
			}
		};
	}

	ChecklistsMenu.propTypes = {
		parentWidget: PropTypes.object,
		moveItemToChecklist: PropTypes.func,
		checklists: PropTypes.array,
		sourceChecklistId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	};

	module.exports = { ChecklistsMenu };
});
