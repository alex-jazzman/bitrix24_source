 /**
 * @module im/messenger/controller/dialog/lib/message-menu/src/multi-level/view
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/multi-level/view', (require, exports, module) => {
	const { ActionViewType } = require('im/messenger/controller/dialog/lib/message-menu/src/action');

	/**
	 * @class MessageMultiMenuView
	 * @implements IMessageMultiMenuView
	 */
	class MessageMultiMenuView
	{
		constructor()
		{
			this.showMoreReactions = false;
			this.reactionList = [];
			this.actionListItems = [];
			this.actionListSections = [];
			this.sectionSet = new Set();
		}

		static create()
		{
			return new this();
		}

		/**
		 * @return {Array<Object>}
		 */
		get actions()
		{
			return this.actionListItems;
		}

		/**
		 * @return {DialogWidgetMessageMultiLevelMenu}
		 */
		toDialogWidgetMessageMenu()
		{
			return {
				showMoreReactions: this.showMoreReactions,
				reactionList: this.reactionList,
				actionListItems: this.actionListItems,
				actionListSections: this.actionListSections,
			};
		}

		/**
		 * @return {MessageContextMultiLevelNextMenuActionItem}
		 */
		toDialogWidgetMessageNextMenu()
		{
			return {
				items: this.actionListItems,
				sections: this.actionListSections,
			};
		}

		/**
		 * @param {MessageContextMenuReactionItem} reaction
		 */
		addReaction(reaction)
		{
			this.reactionList.push(reaction);

			return this;
		}

		/**
		 * @param {MessageContextMultiLevelMenuActionItem} action
		 * @param {object} options
		 */
		addAction(action, options = {})
		{
			this.actionListItems.push({
				...action,
				sectionCode: options.sectionCode || action.sectionCode || '',
				nextMenu: options.nextMenu,
			});

			return this;
		}

		addSeparator()
		{
			return this;
		}

		/**
		 * @param {MessageContextMenuSectionItem} section
		 */
		addSection(section)
		{
			if (section && section.id && !this.sectionSet.has(section.id))
			{
				this.actionListSections.push({
					id: section.id,
					title: section.title || '',
					iconName: section.iconName || '',
					iconUrl: section.iconUrl || '',
				});
				this.sectionSet.add(section.id);
			}

			return this;
		}

		isSeparator(action)
		{
			return action?.type === ActionViewType.separator;
		}

		setMoreReactionsSetting(value)
		{
			this.showMoreReactions = value;

			return this;
		}
	}

	module.exports = { MessageMultiMenuView };
});
