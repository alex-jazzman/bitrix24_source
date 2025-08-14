/**
 * @module layout/ui/gratitude-list
 */
jn.define('layout/ui/gratitude-list', (require, exports, module) => {
	const { GratitudeList } = require('layout/ui/gratitude-list/src/list');
	const { Loc } = require('loc');

	/**
	 * @class GratitudeListManager
	 * @extends LayoutComponent
	 */
	class GratitudeListManager extends LayoutComponent
	{
		/**
		 * @param {Object} props
		 * @param {Object} props.parentWidget
		 * @param {string} props.title
		 * @param {number} props.ownerId
		 * @returns {Promise<void>}
		 */
		static openInComponentWithRedux(props)
		{
			const parentWidget = props.parentWidget ?? PageManager;

			const config = {
				enableNavigationBarBorder: false,
				titleParams: {
					text: props?.title ?? Loc.getMessage('M_UI_GRATITUDE_LIST_TITLE'),
					type: 'dialog',
				},
				onReady: (readyLayout) => {
					readyLayout.showComponent(new GratitudeList({
						withRedux: true,
						layout: readyLayout,
						ownerId: props.ownerId ?? null,
					}));
				},
			};

			parentWidget.openWidget('layout', config);
		}
	}

	module.exports = {
		GratitudeListManager,
	};
});
