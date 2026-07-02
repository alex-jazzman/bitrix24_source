/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/one-level/view
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/one-level/view', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { SeparatorAction, ActionViewType } = require('im/messenger/controller/dialog/lib/message-menu/src/action');

	const baseColor = AppTheme.colors.base1;

	/**
	 * @class MessageMenuView
	 * @implements IMessageMenuView
	 */
	class MessageMenuView
	{
		constructor()
		{
			this.showMoreReactions = false;
			this.reactionVersion = false;
			this.reactionList = [];
			this.actionList = [];
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
			return this.actionList;
		}

		/**
		 * @return {DialogWidgetMessageMenu}
		 */
		toDialogWidgetMessageMenu()
		{
			return {
				showMoreReactions: this.showMoreReactions,
				reactionVersion: this.reactionVersion,
				reactionList: this.reactionList,
				actionList: this.actionList,
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

		addSeparator()
		{
			/** @type {MessageContextMenuSeparator} */
			this.actionList.push(SeparatorAction);

			return this;
		}

		/**
		 * @param {MessageContextMultiLevelMenuActionItem} action
		 * @param {object} options
		 */
		addAction(action, options)
		{
			this.actionList.push(this.#convertToLegacyItem(action));

			return this;
		}

		/**
		 * @param {MessageContextMultiLevelMenuActionItem} action
		 * @return {MessageContextMenuActionItem}
		 */
		#convertToLegacyItem(action)
		{
			const legacyItem = {
				...action,
				type: action.type === ActionViewType.base ? ActionViewType.button : action.type,
				text: action.text || action.title,
				iconFallbackUrl: action.iconFallbackUrl || action.iconUrl,
			};

			if (action.styles)
			{
				legacyItem.style = {};
				if (action.styles.title?.font?.color)
				{
					legacyItem.style.fontColor = action.styles.title.font.color;
				}

				if (action.styles.icon?.color)
				{
					legacyItem.style.iconColor = action.styles.icon.color;
				}
			}
			else if (!legacyItem.style)
			{
				legacyItem.style = {
					fontColor: baseColor,
				};
			}

			return legacyItem;
		}

		/**
		 * @param {MessageContextMenuActionItem | MessageContextMenuSeparator} action
		 * @returns {boolean}
		 */
		isSeparator(action)
		{
			return action?.type === ActionViewType.separator;
		}

		clearUnnecessarySeparators()
		{
			this.actionList = this.actionList.filter((action, index) => {
				const prevAction = this.actionList[index - 1];

				return !(this.isSeparator(action) && this.isSeparator(prevAction));
			});

			const firstAction = this.actionList[0];
			if (this.isSeparator(firstAction))
			{
				this.actionList.shift();
			}

			const lastAction = this.actionList[this.actionList.length - 1];
			if (this.isSeparator(lastAction))
			{
				this.actionList.pop();
			}
		}

		/**
		 * @param {boolean} value
		 */
		setMoreReactionsSetting(value)
		{
			this.showMoreReactions = value;

			return this;
		}

		/**
		 * @param {number} value
		 */
		setReactionVersion(value)
		{
			this.reactionVersion = value;

			return this;
		}
	}

	module.exports = { MessageMenuView };
});
