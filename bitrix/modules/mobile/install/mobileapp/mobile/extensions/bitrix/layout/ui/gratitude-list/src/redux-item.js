/**
 * @module layout/ui/gratitude-list/src/redux-item
 */
jn.define('layout/ui/gratitude-list/src/redux-item', (require, exports, module) => {
	const { Base } = require('layout/ui/simple-list/items/base');
	const { ReduxGratitudeView } = require('layout/ui/gratitude-list/src/gratitude');

	class ReduxGratitudeListItem extends Base
	{
		renderItemContent()
		{
			return ReduxGratitudeView({
				id: this.props.item.id,
				authorId: this.props.item.authorId,
				showBorder: this.props.item.showBorder,
				testId: this.props.testId,
				itemDetailOpenHandler: this.props.itemDetailOpenHandler,
			});
		}
	}

	module.exports = {
		ReduxGratitudeListItem,
	};
});
