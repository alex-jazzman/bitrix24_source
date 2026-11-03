/**
 * @module mail/simple-list/items/message-redux
 */
jn.define('mail/simple-list/items/message-redux', (require, exports, module) => {
	const { Base } = require('layout/ui/simple-list/items/base');
	const {
		MessageContent,
		MessageContentView,
	} = require('mail/simple-list/items/message-redux/src/message-content');

	class Message extends Base
	{
		getStyles()
		{
			const styles = super.getStyles();

			styles.wrapper.paddingBottom = 0;

			return styles;
		}

		renderItemContent()
		{
			if (this.props.item.isDraft === true)
			{
				return new MessageContent({
					item: this.props.item,
					itemDetailOpenHandler: this.props.itemDetailOpenHandler,
					isMultiSelectMode: this.params.isMultiSelectMode,
					isSelected: (this.params.selectedIds ?? []).includes(this.props.item.id),
					onToggleDraftSelection: this.params.onToggleDraftSelection,
					onEnterDraftMultiSelectMode: this.params.onEnterDraftMultiSelectMode,
				});
			}

			return MessageContentView({
				id: this.props.item.id,
				itemDetailOpenHandler: this.props.itemDetailOpenHandler,
			});
		}
	}

	module.exports = { Message };
});
