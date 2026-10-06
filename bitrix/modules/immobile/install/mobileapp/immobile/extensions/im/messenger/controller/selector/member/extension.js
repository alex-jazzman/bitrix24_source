/**
 * @module im/messenger/controller/selector/member
 */
jn.define('im/messenger/controller/selector/member', (require, exports, module) => {
	const { openDialogSelector } = require('im/messenger/controller/selector/dialog/opener');

	const { Loc } = require('im/messenger/loc');

	class MemberSelector
	{
		/**
		 * @param {Object} props
		 * @param {String} props.title
		 * @param {Array<Number>} props.initSelectedIds
		 * @param {Function} props.onSelectMembers
		 * @param {Function} props.onSelectItem
		 * @param {Function} [props.onWidgetClosed] called after the underlying widget close animation finishes
		 * @param {Boolean} props.integrateSelectorToParentLayout
		 * @param {Boolean} props.allowMultipleSelection
		 * @param {Boolean} props.withCurrentUser
		 * @param {Boolean} [props.excludeGuests=false] — exclude im-guest users from server search results
		 */
		constructor(props)
		{
			this.title = props?.title || Loc.getMessage('IMMOBILE_MESSENGER_MEMBER_SELECTOR_TITLE');
			this.initSelectedIds = props?.initSelectedIds || [];
			this.onSelectMembers = props?.onSelectMembers;
			this.onSelectItem = props?.onSelectItem;
			this.onWidgetClosedCallback = props?.onWidgetClosed;
			this.integrateSelectorToParentLayout = props?.integrateSelectorToParentLayout ?? false;
			this.allowMultipleSelection = props?.allowMultipleSelection ?? true;
			this.withCurrentUser = props?.withCurrentUser ?? false;
			this.excludeGuests = props?.excludeGuests ?? false;
			this.widget = null;
		}

		open(parentWidget = null)
		{
			openDialogSelector({
				title: this.title,
				providerOptions: {
					allowMultipleSelection: this.allowMultipleSelection,
					onlyUsers: true,
					withCurrentUser: this.withCurrentUser,
					excludeGuests: this.excludeGuests,
				},
				allowMultipleSelection: this.allowMultipleSelection,
				onClose: this.#onSelectMembers,
				onItemSelected: this.#onItemSelected,
				onWidgetClosed: this.#onWidgetClosed,
				onWidgetReady: this.#onWidgetReady,
				closeOnSelect: true,
				integrateSelectorToParentLayout: this.integrateSelectorToParentLayout,
				initSelectedIds: this.initSelectedIds,
			}, parentWidget);
		}

		/**
		 * @desc Closes the underlying selector widget and releases listeners.
		 * @return {Promise<void>}
		 */
		close()
		{
			const widget = this.widget;
			this.widget = null;
			if (widget?.close)
			{
				return widget.close();
			}

			return Promise.resolve();
		}

		#onWidgetReady = (widget) => {
			this.widget = widget;
		};

		#onWidgetClosed = (...args) => {
			this.widget = null;
			if (this.onWidgetClosedCallback)
			{
				this.onWidgetClosedCallback(...args);
			}
		};

		#onSelectMembers = (members) => {
			if (this.allowMultipleSelection)
			{
				const membersIds = members.map((member) => Number(member.id));

				if (this.onSelectMembers)
				{
					this.onSelectMembers(membersIds, members);
				}
			}
		};

		#onItemSelected = ({ item }) => {
			if (!this.allowMultipleSelection && this.onSelectItem)
			{
				this.onSelectItem(item.params);
			}
		};
	}

	module.exports = { MemberSelector };
});
