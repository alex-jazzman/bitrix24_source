/**
 * @module layout/ui/feedback-router
 */
jn.define('layout/ui/feedback-router', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Component, Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { AnalyticsEvent } = require('analytics');
	const { BottomSheet } = require('bottom-sheet');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { H3 } = require('ui-system/typography/heading');
	const { Text4 } = require('ui-system/typography/text');
	const { EntityCell, EntityCellMode } = require('ui-system/blocks/entity-cell');
	const { Icon } = require('ui-system/blocks/icon');
	const { FeedbackForm } = require('layout/ui/feedback-form-opener');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');

	// Extension-local assets (mirrors app-rating/src/rating-constants.js).
	const PathToExtension = `${currentDomain}/bitrix/mobileapp/mobile/extensions/bitrix/layout/ui/feedback-router`;
	const HERO_IMAGE_URI = `${PathToExtension}/images/feedback-router.png`;
	// Keep the source ratio 394×350 (≈1.126:1); do not force a square.
	const HERO_IMAGE_HEIGHT = 166;
	const HERO_IMAGE_WIDTH = 187;
	const HERO_TITLE_HEIGHT = 22; // h3 line height
	const HERO_SUBTITLE_HEIGHT = 18; // text4 line height
	const CHOICE_CELL_HEIGHT = 74; // EntityCell with an icon and a two-line subtitle
	// Content-driven height; overflow scrolls in AreaList.
	const DRAWER_HEIGHT = Component.areaPaddingTFirst.toNumber() // hero area top padding
		+ (Indent.XL4.toNumber() * 2) // hero vertical paddings
		+ HERO_IMAGE_HEIGHT
		+ Indent.XL3.toNumber() // image → title
		+ HERO_TITLE_HEIGHT
		+ Indent.XS.toNumber() // title → subtitle
		+ HERO_SUBTITLE_HEIGHT
		+ Component.areaPaddingT.toNumber() // choices area top padding
		+ (CHOICE_CELL_HEIGHT * 2)
		+ Component.areaPaddingB.toNumber(); // choices area bottom padding

	const AnalyticsTool = 'settings';
	const AnalyticsCategory = 'feedback';
	const AnalyticsEventName = {
		SUGGEST: 'tap_feedback',
		REPORT: 'tap_bug',
	};

	/**
	 * Routing bottom-drawer "How can we help?": product feedback (form) or a problem (support chat).
	 *
	 * @extends {PureComponent<FeedbackRouterProps>}
	 */
	class FeedbackRouter extends PureComponent
	{
		/**
		 * @param {FeedbackRouterProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'feedback-router',
				context: this,
			});
		}

		/**
		 * @param {FeedbackRouterProps} props
		 * @returns {void}
		 */
		static open(props = {})
		{
			const parentWidget = props.parentWidget ?? PageManager;

			new BottomSheet({
				component: (layoutWidget) => new FeedbackRouter({
					...props,
					layoutWidget,
				}),
			})
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgPrimary)
				.setNavigationBarColor(Color.bgPrimary)
				.setMediumPositionHeight(DRAWER_HEIGHT, true)
				.open()
				.catch(console.error)
			;
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
				},
				AreaList(
					{
						testId: this.getTestId('list'),
					},
					this.#renderHero(),
					this.#renderChoices(),
				),
			);
		}

		#renderHero()
		{
			return Area(
				{
					isFirst: true,
					excludePaddingSide: { bottom: true },
				},
				View(
					{
						testId: this.getTestId('hero'),
						style: {
							flexDirection: 'column',
							alignItems: 'center',
							paddingTop: Indent.XL4.toNumber(),
							paddingBottom: Indent.XL4.toNumber(),
						},
					},
					Image({
						testId: this.getTestId('hero-image'),
						uri: HERO_IMAGE_URI,
						style: {
							width: HERO_IMAGE_WIDTH,
							height: HERO_IMAGE_HEIGHT,
							marginBottom: Indent.XL3.toNumber(),
						},
					}),
					H3({
						testId: this.getTestId('title'),
						text: Loc.getMessage('M_UI_FEEDBACK_ROUTER_TITLE'),
						color: Color.base1,
						style: {
							textAlign: 'center',
						},
					}),
					Text4({
						testId: this.getTestId('subtitle'),
						text: Loc.getMessage('M_UI_FEEDBACK_ROUTER_SUBTITLE'),
						color: Color.base2,
						style: {
							marginTop: Indent.XS.toNumber(),
							textAlign: 'center',
						},
					}),
				),
			);
		}

		#renderChoices()
		{
			return Area(
				{
					excludePaddingSide: { horizontal: true },
				},
				EntityCell({
					testId: this.getTestId('suggest'),
					mode: EntityCellMode.GROUP,
					nextLevel: true,
					icon: Icon.CLIENT_CHAT,
					title: Loc.getMessage('M_UI_FEEDBACK_ROUTER_SUGGEST_TITLE'),
					subtitle: Loc.getMessage('M_UI_FEEDBACK_ROUTER_SUGGEST_SUBTITLE'),
					subtitleNumberOfLines: 2,
					divider: true,
					onClick: this.#onSuggestClick,
				}),
				EntityCell({
					testId: this.getTestId('report'),
					mode: EntityCellMode.GROUP,
					nextLevel: true,
					icon: Icon.ALERT_ACCENT,
					iconColor: Color.accentMainWarning,
					title: Loc.getMessage('M_UI_FEEDBACK_ROUTER_REPORT_TITLE'),
					subtitle: Loc.getMessage('M_UI_FEEDBACK_ROUTER_REPORT_SUBTITLE'),
					subtitleNumberOfLines: 2,
					divider: false,
					onClick: this.#onReportClick,
				}),
			);
		}

		/**
		 * "Share an idea": close the drawer first, then open the feedback form (over settings).
		 */
		#onSuggestClick = () => {
			this.#sendAnalytics(AnalyticsEventName.SUGGEST);

			this.#runAfterClose(() => {
				(new FeedbackForm({ senderPage: this.props.senderPage })).open({ title: this.props.formTitle });
			});
		};

		/**
		 * "Report a problem": close the drawer first, then open the support chat.
		 */
		#onReportClick = () => {
			const { botId } = this.props;

			this.#sendAnalytics(AnalyticsEventName.REPORT);

			this.#runAfterClose(() => {
				DialogOpener.open({ dialogId: botId }).catch(console.error);
			});
		};

		/**
		 * Closes the drawer, then runs the target scenario in the close callback.
		 * @param {Function} action
		 */
		#runAfterClose(action)
		{
			const { layoutWidget } = this.props;

			if (layoutWidget)
			{
				layoutWidget.close(action);
			}
			else
			{
				action();
			}
		}

		#sendAnalytics(event)
		{
			new AnalyticsEvent()
				.setTool(AnalyticsTool)
				.setCategory(AnalyticsCategory)
				.setEvent(event)
				.send()
			;
		}
	}

	FeedbackRouter.defaultProps = {
		parentWidget: PageManager,
		senderPage: 'settings_v2',
	};

	FeedbackRouter.propTypes = {
		botId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
		formTitle: PropTypes.string,
		senderPage: PropTypes.string,
		parentWidget: PropTypes.object,
		layoutWidget: PropTypes.object,
		testId: PropTypes.string,
	};

	module.exports = { FeedbackRouter };
});
