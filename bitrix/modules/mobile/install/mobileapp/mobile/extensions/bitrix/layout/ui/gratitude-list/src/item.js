/**
 * @module layout/ui/gratitude-list/src/item
 */

jn.define('layout/ui/gratitude-list/src/item', (require, exports, module) => {
	const { Base } = require('layout/ui/simple-list/items/base');
	const { GratitudeView } = require('layout/ui/gratitude-list/src/gratitude');

	class GratitudeListItem extends Base
	{
		renderItemContent()
		{
			return GratitudeView({
				postId: this.props.item.relatedPostId,
				title: this.props.item.title,
				authorId: this.props.item.authorId,
				author: {
					id: this.props.item.authorId,
					fullName: this.props.item.authorName,
					avatarSize100: this.props.item.authorImage,
				},
				name: this.props.item.name,
				createdAt: this.props.item.createdAt,
				showBorder: this.props.item.showBorder,
				testId: this.props.testId,
				itemDetailOpenHandler: this.props.itemDetailOpenHandler,
			});
		}
	}

	module.exports = {
		GratitudeListItem,
	};
});
