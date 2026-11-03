/**
 * @module layout/ui/reaction/picker
 */
jn.define('layout/ui/reaction/picker', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Component, Indent } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { downloadLottieAnimations } = require('asset-manager');
	const { H4, Text4 } = require('ui-system/typography');
	const { Icon } = require('assets/icons');
	const { IconView } = require('ui-system/blocks/icon');
	const { Loc } = require('loc');
	const { OrderType } = require('layout/ui/reaction/const');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { PropTypes } = require('utils/validation');
	const { ReactionStorageManager } = require('layout/ui/reaction/service/storage');
	const { ReactionPack } = require('layout/ui/reaction/pack');
	const { ScrollView } = require('layout/ui/scroll-view');
	const { Type } = require('type');

	const BACKDROP_HEIGHT = 430;
	const ITEM_IN_COLUMN = 6;
	const ITEM_SIZE = 52;
	const ONBOARDING_CLOSE_ICON_SIZE = 24;
	// Padding around the close icon so its touch target reaches ~44px (24 + 2 * 10).
	const ONBOARDING_CLOSE_TAP_PADDING = 10;
	const SET_PRIMARY_MENU_CACHE_ID = 'reaction-picker-set-primary-menu';

	/**
	 * @class ReactionPicker
	 */
	class ReactionPicker extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			const reactions = props.reactions;

			this.state = {
				currentReaction: null,
				reactions,
				showPrimaryOnboarding: Boolean(props.primaryOnboarding),
			};

			this.reactionRefs = new Map();
			this.setPrimaryMenu = null;

			this.getTestId = createTestIdGenerator({
				prefix: 'reaction-picker',
			});
		}

		componentDidMount()
		{
			const { reactions } = this.state;

			this.#preloadLottie(reactions);
			this.notifyPrimaryOnboardingShown();
		}

		/**
		 * @desc Reports the one-time onboarding hint as shown so the consumer can flip its
		 * once-per-user guard (Tourist). Runs once on mount and only when the consumer passes a
		 * primaryOnboarding prop (the messenger set-primary flow); other consumers are unaffected
		 * (backward compatible). The hint itself is drawn in the picker layer by
		 * #renderPrimaryOnboardingHint(): a native spotlight overlay lives in the app layer and is
		 * hidden behind the picker bottom sheet, so the hint must be a regular element of the picker.
		 * @protected overridable in tests
		 */
		notifyPrimaryOnboardingShown()
		{
			if (!this.props.primaryOnboarding)
			{
				return;
			}

			this.props.onPrimaryOnboardingShown?.();
		}

		/**
		 * @desc Closes the onboarding hint (close cross handler); invoked from
		 * #renderPrimaryOnboardingHint. Public for test access.
		 * @protected callable in tests
		 */
		hidePrimaryOnboarding()
		{
			this.setState({ showPrimaryOnboarding: false });
		}

		async componentDidUpdate(prevProps, prevState)
		{
			if (prevProps.customPack !== this.props.customPack)
			{
				const reactions = await this.#buildReactions();
				this.#preloadLottie(reactions);
				this.setState({ reactions });
			}
		}

		componentWillUnmount()
		{
			this.setPrimaryMenu?.hide();
		}

		static #sendAnalytics(base, params, ctx = {})
		{
			if (!base)
			{
				console.warn('analyticsLabel.base is not provided: { tool, category, c_section, c_sub_section }');

				return;
			}

			const finalParams = Type.isFunction(params) ? params(ctx) : (params || {});
			new AnalyticsEvent({ ...base, ...finalParams }).send();
		}

		async #buildReactions()
		{
			const { customPack, order, primaryReactionId } = this.props;

			return ReactionPack.getPackByReactionIds(customPack, order, false, primaryReactionId);
		}

		#preloadLottie(reactions)
		{
			const urls = reactions
				.map((reaction) => reaction?.lottieUrl)
				.filter(Boolean);

			void downloadLottieAnimations(urls);
		}

		/**
		 * @param options
		 * @param {LayoutComponent} [options.parentWidget=PageManager]
		 * @param {Array<string>} [options.customPack]
		 * @param {Function} [options.onReactionPick]
		 * @param {String} [options.order=OrderType.DEFAULT]
		 * @param {String} [options.primaryReactionId]
		 * @param {Function} [options.onSetPrimary] enables the "make quick reaction" long-press
		 *   action; called with the reaction id. Omit to disable the action (backward compatible).
		 * @param {Object} [options.analyticsLabel={}]
		 * @param {Boolean} [options.disableCloseAfterPick=false]
		 * @param {Object} [options.primaryOnboarding] one-time hint drawn above the reaction grid
		 *   ({ title, description, testId }); shown when the picker mounts. Omit to disable.
		 * @param {Function} [options.onPrimaryOnboardingShown] called once when the hint is shown.
		 * @returns {void}
		 */
		static async open(options = {})
		{
			const parentWidget = options.parentWidget ?? PageManager;
			const reactions = await ReactionPack.getPackByReactionIds(
				options.customPack,
				options.order,
				false,
				options.primaryReactionId,
			);
			const component = (layoutWidget) => new this({ layoutWidget, parentWidget, reactions, ...options });

			void new BottomSheet({ component })
				.setParentWidget(parentWidget)
				.setNavigationBarColor(Color.bgSecondary.toHex())
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setMediumPositionHeight(BACKDROP_HEIGHT)
				.disableOnlyMediumPosition()
				.open()
			;

			const { analyticsLabel = {} } = options;
			if (analyticsLabel?.base && analyticsLabel?.onOpen)
			{
				ReactionPicker.#sendAnalytics(
					analyticsLabel.base,
					analyticsLabel.onOpen,
					{ props: options },
				);
			}
		}

		render()
		{
			return View(
				{
					testId: this.getTestId('drawer'),
					style: {
						alignItems: 'center',
						justifyContent: 'flex-start',
						paddingHorizontal: Indent.XL2.toNumber(),
						paddingTop: Indent.XL2.toNumber(),
					},
				},
				this.#renderContainer(),
				this.#renderPrimaryOnboardingHint(),
			);
		}

		/**
		 * @desc Draws the one-time onboarding hint above the reaction grid, inside the picker layer.
		 * A native spotlight overlay would sit in the app layer and be covered by the picker bottom
		 * sheet, so the hint is a plain picker element instead. Styled as a DS dark hint bubble
		 * (title, description and a close cross). Returns null unless the consumer passes
		 * primaryOnboarding and the hint has not been dismissed (backward compatible).
		 * @returns {View|null}
		 */
		#renderPrimaryOnboardingHint()
		{
			const { primaryOnboarding } = this.props;
			if (!primaryOnboarding || !this.state.showPrimaryOnboarding)
			{
				return null;
			}

			const testId = primaryOnboarding.testId ?? 'reaction-picker-primary-onboarding';

			return View(
				{
					testId,
					style: {
						position: 'absolute',
						bottom: Indent.XL2.toNumber(),
						left: Indent.XL2.toNumber(),
						right: Indent.XL2.toNumber(),
						padding: Indent.XL.toNumber(),
						borderRadius: Component.popupCorner.toNumber(),
						backgroundColor: Color.bgContentInapp.toHex(),
					},
				},
				View(
					{
						style: {
							flex: 1,
							alignItems: 'flex-start',
							paddingRight: Indent.XL2.toNumber(),
						},
					},
					H4({
						testId: `${testId}-title`,
						text: primaryOnboarding.title,
						color: Color.baseWhiteFixed,
					}),
					Text4({
						testId: `${testId}-description`,
						text: primaryOnboarding.description,
						color: Color.baseWhiteFixed,
						style: {
							marginTop: Indent.S.toNumber(),
						},
					}),
				),
				View(
					{
						testId: `${testId}-close`,
						// The position offset by the padding keeps the icon at the same visual spot,
						// while the padded View provides a larger (~44px) touch target.
						style: {
							position: 'absolute',
							top: Indent.S.toNumber() - ONBOARDING_CLOSE_TAP_PADDING,
							right: Indent.S.toNumber() - ONBOARDING_CLOSE_TAP_PADDING,
							padding: ONBOARDING_CLOSE_TAP_PADDING,
							opacity: 0.3,
						},
						onClick: () => this.hidePrimaryOnboarding(),
					},
					IconView({
						icon: Icon.CROSS,
						color: Color.baseWhiteFixed,
						size: ONBOARDING_CLOSE_ICON_SIZE,
					}),
				),
			);
		}

		#renderContainer()
		{
			const { reactions } = this.state;
			const lines = this.#splitIntoLines(reactions);

			return ScrollView(
				{
					horizontal: false,
					style: {
						flex: 1,
						width: '100%',
					},
					bounces: true,
					showsVerticalScrollIndicator: false,
				},
				View(
					{
						testId: this.getTestId('container'),
						style: {
							flexDirection: 'row',
							flexWrap: 'wrap',
							alignItems: 'stretch',
							justifyContent: 'flex-start',
						},
					},
					...lines.map((line, lineIndex) => this.#renderLine(line, lineIndex)),
				),
			);
		}

		#splitIntoLines(reactions = [], perLine = ITEM_IN_COLUMN)
		{
			const lines = [];
			for (let i = 0; i < reactions.length; i += perLine)
			{
				lines.push(reactions.slice(i, i + perLine));
			}

			return lines;
		}

		#renderLine(line)
		{
			const isFullLine = line.length === ITEM_IN_COLUMN;

			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						width: '100%',
					},
				},
				...line.map((reaction) => this.#renderReaction(reaction)),
				...(isFullLine ? [] : this.#renderPlaceholders(line.length)),
			);
		}

		#renderPlaceholders(countInLine)
		{
			const placeholders = Array.from({ length: ITEM_IN_COLUMN - countInLine }).fill(null);

			return placeholders.map((_, i) => View({
				style: {
					width: ITEM_SIZE,
					height: ITEM_SIZE,
				},
			}));
		}

		#renderReaction(reaction)
		{
			if (!reaction)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId(`${reaction.id}-tap-container`),
					ref: (ref) => {
						this.reactionRefs.set(reaction.id, ref);
					},
					style: {
						height: ITEM_SIZE,
						width: ITEM_SIZE,
						alignItems: 'center',
						justifyContent: 'center',
					},
					onClick: () => {
						this.setState({ currentReaction: reaction.id }, async () => {
							await this.#onReactionPick();
						});
					},
					onLongClick: () => {
						this.onReactionLongTap(reaction);
					},
				},
				LottieView(
					{
						testId: this.getTestId(`${reaction.id}-animation`),
						style: {
							height: '100%',
							width: '100%',
						},
						data: {
							uri: reaction.lottieUrl,
						},
						params: {
							loopMode: 'loop',
						},
						autoPlay: true,
					},
				),
			);
		}

		/**
		 * @desc Long-press on an emoji offers making it the main (quick) reaction, without
		 * setting the reaction on the message. Available only when the consumer passes
		 * an onSetPrimary callback, otherwise long-press is a no-op (backward compatible: the
		 * settings picker and external consumers are not affected). The regular onClick keeps
		 * setting the reaction.
		 * @protected callable in tests
		 * @param {Object} reaction
		 */
		onReactionLongTap(reaction)
		{
			const { onSetPrimary } = this.props;
			if (!Type.isFunction(onSetPrimary) || !reaction)
			{
				return;
			}

			this.setPrimaryMenu = this.createSetPrimaryMenu(reaction);
			const target = this.reactionRefs.get(reaction.id);

			void this.setPrimaryMenu.show({ target });
		}

		/**
		 * @desc Builds the native popup menu with the single "make quick reaction" action.
		 * @protected overridable in tests
		 * @param {Object} reaction
		 * @returns {PopupMenu}
		 */
		createSetPrimaryMenu(reaction)
		{
			return PopupMenu.create({ cacheId: SET_PRIMARY_MENU_CACHE_ID })
				.setActions([
					{
						id: 'set-primary-reaction',
						testId: 'reaction-picker-set-primary',
						title: Loc.getMessage('LAYOUT_UI_REACTION_PICKER_SET_PRIMARY'),
						iconName: Icon.CIRCLE_CHECK,
						onItemSelected: () => this.selectPrimaryReaction(reaction),
					},
				]);
		}

		/**
		 * @desc Reports the chosen main (quick) reaction to the consumer. Never sets the reaction
		 * on the message; that stays with onClick/onReactionPick.
		 * @protected callable in tests
		 * @param {Object} reaction
		 */
		selectPrimaryReaction(reaction)
		{
			const { onSetPrimary } = this.props;
			if (Type.isFunction(onSetPrimary) && reaction)
			{
				onSetPrimary(reaction.id);
			}
		}

		async #onReactionPick()
		{
			const { onReactionPick, layoutWidget, analyticsLabel, disableCloseAfterPick } = this.props;
			const { currentReaction } = this.state;

			const pick = async () => {
				await this.#updateReactionStats(currentReaction);

				if (Type.isFunction(onReactionPick))
				{
					onReactionPick(currentReaction);
				}

				if (analyticsLabel?.base && analyticsLabel?.onPick)
				{
					ReactionPicker.#sendAnalytics(
						analyticsLabel?.base,
						analyticsLabel?.onPick,
						{ reactionId: currentReaction, props: this.props, state: this.state },
					);
				}
			};

			if (disableCloseAfterPick)
			{
				await pick();
			}
			else
			{
				layoutWidget.close(pick);

				if (analyticsLabel?.base && analyticsLabel?.onClose)
				{
					ReactionPicker.#sendAnalytics(
						analyticsLabel.base,
						analyticsLabel.onClose,
						{ reactionId: currentReaction, props: this.props, state: this.state },
					);
				}
			}
		}

		async #updateReactionStats(reactionId)
		{
			let userStats = await ReactionStorageManager.get();

			if (!userStats)
			{
				userStats = {};
			}

			userStats[reactionId] = (userStats[reactionId] ?? 0) + 1;

			void ReactionStorageManager.set(userStats);
		}
	}

	ReactionPicker.propTypes = {
		parentWidget: PropTypes.object,
		customPack: PropTypes.oneOfType([
			PropTypes.instanceOf(ReactionPack),
			PropTypes.array,
		]),
		onReactionPick: PropTypes.func,
		order: PropTypes.oneOf(Object.values(OrderType)),
		primaryReactionId: PropTypes.string,
		onSetPrimary: PropTypes.func,
		analyticsLabel: PropTypes.object,
		disableCloseAfterPick: PropTypes.bool,
		primaryOnboarding: PropTypes.object,
		onPrimaryOnboardingShown: PropTypes.func,
	};

	module.exports = {
		OrderType,
		ReactionPack,
		ReactionPicker,
	};
});
