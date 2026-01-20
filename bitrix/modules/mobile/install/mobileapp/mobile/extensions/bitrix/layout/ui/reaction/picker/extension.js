/**
 * @module layout/ui/reaction/picker
 */
jn.define('layout/ui/reaction/picker', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Indent } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { downloadLottieAnimations } = require('asset-manager');
	const { OrderType } = require('layout/ui/reaction/const');
	const { PropTypes } = require('utils/validation');
	const { ReactionStorageManager } = require('layout/ui/reaction/service/storage');
	const { ReactionPack } = require('layout/ui/reaction/pack');
	const { ScrollView } = require('layout/ui/scroll-view');
	const { Type } = require('type');

	const BACKDROP_HEIGHT = 430;
	const ITEM_IN_COLUMN = 6;
	const ITEM_SIZE = 52;

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
			};

			this.getTestId = createTestIdGenerator({
				prefix: 'reaction-picker',
			});
		}

		componentDidMount()
		{
			const { reactions } = this.state;

			this.#preloadLottie(reactions);
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
			const { customPack, order } = this.props;

			return ReactionPack.getPackByReactionIds(customPack, order);
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
		 * @param {Object} [options.analyticsLabel={}]
		 * @param {Boolean} [options.disableCloseAfterPick=false]
		 * @returns {void}
		 */
		static async open(options = {})
		{
			const parentWidget = options.parentWidget ?? PageManager;
			const reactions = await ReactionPack.getPackByReactionIds(options.customPack, options.order);
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
		analyticsLabel: PropTypes.object,
		disableCloseAfterPick: PropTypes.bool,
	};

	module.exports = {
		OrderType,
		ReactionPack,
		ReactionPicker,
	};
});
