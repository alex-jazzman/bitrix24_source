/**
 * @module im/messenger/controller/dialog/lib/source/src/viewer
 */
jn.define('im/messenger/controller/dialog/lib/source/src/viewer', (require, exports, module) => {
	const { Color, Typography } = require('tokens');
	const { inAppUrl } = require('in-app-url');
	const { Loc } = require('im/messenger/loc');

	/**
	 * @class SourceViewer
	 * @typedef {LayoutComponent<SourceViewerProps, SourceViewerState>} SourceViewer
	 */
	class SourceViewer extends LayoutComponent
	{
		/**
		 * @param {Array<SourceItem>} sources
		 * @return {Promise<void>}
		 */
		static async show(sources)
		{
			const widget = await PageManager.openWidget('layout', {
				backdrop: {
					mediumPositionPercent: 70,
					horizontalSwipeAllowed: false,
					onlyMediumPosition: true,
					hideNavigationBar: true,
					swipeAllowed: true,
					swipeContentAllowed: true,
				},
			});

			widget.showComponent(new SourceViewer({ sources }));
		}

		/**
		 * @return {object}
		 */
		render()
		{
			return View(
				{
					style: {
						flex: 1,
						backgroundColor: Color.bgSecondary.toHex(),
					},
				},
				this.renderHeader(),
				this.renderList(),
			);
		}

		/**
		 * @return {object}
		 */
		renderHeader()
		{
			return View(
				{
					style: {
						height: 44,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				Text({
					style: {
						...Typography.h4Style.getStyle(),
						color: Color.base1.toHex(),
					},
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SOURCE_VIEWER_TITLE'),
				}),
			);
		}

		/**
		 * @return {object}
		 */
		renderList()
		{
			const sources = this.props.sources || [];

			return ScrollView(
				{
					style: {
						flex: 1,
					},
				},
				View(
					{
						style: {
							paddingHorizontal: 16,
						},
					},
					...sources.map((source, index) => {
						return this.renderItem(source, index < sources.length - 1);
					}),
				),
			);
		}

		/**
		 * @param {SourceItem} source
		 * @param {boolean} showDivider
		 * @return {object}
		 */
		renderItem(source, showDivider)
		{
			return View(
				{
					style: {
						paddingVertical: 12,
						borderBottomWidth: showDivider ? 1 : 0,
						borderBottomColor: Color.base7.toHex(),
					},
					onClick: () => {
						inAppUrl.open(source.url);
					},
				},
				source.title ? Text({
					style: {
						...Typography.body2Style.getStyle(),
						color: Color.base1.toHex(),
						marginBottom: 2,
					},
					text: source.title,
					numberOfLines: 2,
					ellipsize: 'end',
				}) : null,
				source.description ? Text({
					style: {
						...Typography.body5Style.getStyle(),
						color: Color.base3.toHex(),
						marginBottom: 2,
					},
					text: source.description,
					numberOfLines: 3,
					ellipsize: 'end',
				}) : null,
				Text({
					style: {
						...Typography.body6Style.getStyle(),
						color: Color.base4.toHex(),
					},
					text: source.url,
					numberOfLines: 1,
					ellipsize: 'end',
				}),
			);
		}
	}

	module.exports = { SourceViewer };
});
