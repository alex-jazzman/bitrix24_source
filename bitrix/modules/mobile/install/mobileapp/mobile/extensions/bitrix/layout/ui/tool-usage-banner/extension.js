/**
 * @module layout/ui/tool-usage-banner
 */
jn.define('layout/ui/tool-usage-banner', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { Loc } = require('loc');
	const { NAVIGATION_EVENTS } = require('navigator/more-tab/meta');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { Color, Indent, Corner } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Card } = require('ui-system/layout/card');
	const { H3 } = require('ui-system/typography/heading');
	const { Text3 } = require('ui-system/typography/text');
	const {
		Button,
		ButtonSize,
		ButtonDesign,
	} = require('ui-system/form/buttons/button');
	const { ToolUsage } = require('tool-usage');
	const { makeLibraryImagePath } = require('asset-manager');

	const DEFAULT_HEIGHT = 350;
	const TEST_ID_PREFIX = 'tool-usage-banner';

	class ToolUsageBanner extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				prefix: TEST_ID_PREFIX,
				context: this,
			});
		}

		onButtonClick = () => {
			this.props.parentWidget.close();

			setTimeout(() => {
				BX.postComponentEvent(
					NAVIGATION_EVENTS.SCROLL_TO_MENU_ITEM,
					[{
						menuItemId: 'bottom_menu',
						highlightItem: true,
					}],
				);
			}, 100);
		};

		componentDidMount()
		{
			if (this.props.wasOpenedFromMoreMenu)
			{
				ToolUsage.onMenuBannerShown();
			}
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId('box'),
					backgroundColor: Color.bgContentPrimary,
					style: {
						alignItems: 'center',
						justifyContent: 'center',
					},
					footer: this.renderFooter(),
					safeArea: {
						bottom: true,
					},
				},
				Card(
					{
						testId: this.getTestId('card'),
						style: {
							alignSelf: 'center',
							width: '100%',
							maxWidth: 344,
							maxHeight: 160,
							marginHorizontal: Indent.XL3.toNumber(),
							marginTop: Indent.XL3.toNumber(),
							justifyContent: 'center',
							alignItems: 'center',
						},
						excludePaddingSide: {
							top: true,
							bottom: true,
							left: true,
							right: true,
						},
					},
					Video({
						testId: this.getTestId('card-video'),
						style: {
							alignSelf: 'center',
							maxWidth: 344,
							maxHeight: 160,
							width: '100%',
							height: '100%',
							borderRadius: Corner.XL.toNumber(),
						},
						scaleMode: 'fill',
						uri: makeLibraryImagePath('tool-usage-banner.mp4', 'more-menu'),
						enableControls: false,
						loop: true,
					}),
				),
				View(
					{
						testId: this.getTestId('content'),
						style: {
							marginTop: Indent.XL3.toNumber(),
							alignItems: 'center',
						},
					},
					H3({
						testId: this.getTestId('title'),
						text: Loc.getMessage('TOOL_USAGE_BANNER_TITLE'),
						style: {
							textAlign: 'center',
						},
					}),
					Text3({
						testId: this.getTestId('description'),
						text: Loc.getMessage('TOOL_USAGE_BANNER_DESCRIPTION'),
						style: {
							marginTop: Indent.L.toNumber(),
							textAlign: 'center',
						},
					}),
				),
			);
		}

		renderFooter()
		{
			return BoxFooter(
				{
					testId: this.getTestId('footer'),
					safeArea: true,
				},
				Button({
					testId: this.getTestId('button'),
					size: ButtonSize.L,
					text: Loc.getMessage('TOOL_USAGE_BANNER_BUTTON'),
					design: ButtonDesign.FILLED,
					stretched: true,
					onClick: this.onButtonClick,
				}),
			);
		}

		static async open(parentWidget = PageManager, wasOpenedFromMoreMenu = false)
		{
			const bottomSheet = new BottomSheet({
				component: (widget) => {
					return new ToolUsageBanner({
						parentWidget: widget,
						wasOpenedFromMoreMenu,
					});
				},
			});

			return bottomSheet
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				.setNavigationBarColor(Color.bgContentPrimary.toHex())
				.setMediumPositionHeight(DEFAULT_HEIGHT, true)
				.open()
				.catch(console.error);
		}
	}

	ToolUsageBanner.propTypes = {
		parentWidget: PropTypes.object,
		wasOpenedFromMoreMenu: PropTypes.bool,
	};

	module.exports = { ToolUsageBanner };
});
