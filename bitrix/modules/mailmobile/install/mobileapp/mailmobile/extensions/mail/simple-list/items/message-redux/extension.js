/**
 * @module mail/simple-list/items/message-redux
 */
jn.define('mail/simple-list/items/message-redux', (require, exports, module) => {
	const { Base } = require('layout/ui/simple-list/items/base');
	const { MessageContentView } = require('mail/simple-list/items/message-redux/src/message-content');

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
			return MessageContentView({
				id: this.props.item.id,
				itemDetailOpenHandler: this.props.itemDetailOpenHandler,
			});
		}
	}

	module.exports = { Message };
});
