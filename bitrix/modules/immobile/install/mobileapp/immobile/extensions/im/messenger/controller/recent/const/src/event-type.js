/**
 * @module im/messenger/controller/recent/const/src/event-type
 */
jn.define('im/messenger/controller/recent/const/src/event-type', (require, exports, module) => {
	const RecentEventType = {
		ui: {
			onScroll: 'onScroll',
			itemWillDisplay: 'itemWillDisplay',
			onItemSelected: 'onItemSelected',
		},
		onInit: 'onInit',
		pagination: {},
		render: {
			itemCollectionSizeChanged: 'itemCollectionSizeChanged',
		},
	};

	module.exports = { RecentEventType };
});
