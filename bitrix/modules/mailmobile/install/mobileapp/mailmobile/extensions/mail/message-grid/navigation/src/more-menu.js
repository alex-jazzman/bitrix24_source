/**
 * @module mail/message-grid/navigation/src/more-menu
 */

jn.define('mail/message-grid/navigation/src/more-menu', (require, exports, module) => {
	const { BaseListMoreMenu } = require('layout/ui/list/base-more-menu');
	const { Icon } = require('ui-system/blocks/icon');
	const { Loc } = require('loc');

	const { selectIsMultiSelectMode } = require('mail/statemanager/redux/slices/messages/selector');
	const { setMultiSelectMode } = require('mail/statemanager/redux/slices/messages');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	/**
	 * @class MessageGridMoreMenu
	 */
	class MessageGridMoreMenu extends BaseListMoreMenu
	{
		/**
		 * @param props
		 * @param {String} props.selectedSorting
		 * @param {Boolean} props.isASC
		 * @param {Object} props.callbacks
		 */
		constructor(props = {})
		{
			super([], null, props.selectedSorting, props.callbacks);
		}

		/**
		 * @public
		 * @returns {{type: string, id: string, testId: string, callback: ((function(): void)|*)}}
		 */
		getMenuButton()
		{
			return {
				type: 'more',
				id: 'message-grid-more',
				testId: 'message-grid-more',
				callback: this.openMoreMenu,
			};
		}

		/**
		 * @private
		 * @returns {Array}
		 */
		getMenuItems()
		{
			return [
				this.createMenuItem({
					id: 'checkItems',
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_CHECK'),
					checked: false,
					icon: Icon.CIRCLE_CHECK,
					showCheckedIcon: false,
				}),
			];
		}

		/**
		 * @private
		 * @param event
		 * @param item
		 */
		onMenuItemSelected(event, item)
		{
			const realItemId = String(item.id).split('::')[0];

			if (realItemId === 'checkItems')
			{
				this.checkItems();
			}
		}

		checkItems()
		{
			const currentState = store.getState();
			const isMultiSelectMode = selectIsMultiSelectMode(currentState);

			dispatch(setMultiSelectMode({ isMultiSelectMode: !isMultiSelectMode }));
		}
	}

	module.exports = { MessageGridMoreMenu };
});
