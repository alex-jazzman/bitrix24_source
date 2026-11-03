/**
 * @module layout/ui/banners/universal-promo
 */
jn.define('layout/ui/banners/universal-promo', (require, exports, module) => {
	const { Animated } = require('animation/animated');
	const { FloatingPromo, getFloatingPromoReserve } = require('layout/ui/floating-promo');
	const { SafeImage } = require('layout/ui/safe-image');
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Card, CardDesign, CardCorner } = require('ui-system/layout/card');
	const { Text3 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');

	const {
		normalizeCampaign,
		normalizeTargetUrl,
	} = require('layout/ui/banners/universal-promo/src/campaign-normalizer');
	const {
		DismissalStorage,
	} = require('layout/ui/banners/universal-promo/src/dismissal-storage');
	const {
		UniversalPromoBannerAnalytics,
	} = require('layout/ui/banners/universal-promo/src/analytics');

	const BannerMode = {
		CAMPAIGN: 'campaign',
		TO_CONFIRMATION: 'toConfirmation',
		CONFIRMATION: 'confirmation',
		TO_CAMPAIGN: 'toCampaign',
		SAVING: 'saving',
		HIDDEN: 'hidden',
	};
	const BANNER_HEIGHT = 96;
	// The layer works its frame out of the height the banner names, so the height is stated here rather
	// than measured on the device: every change of the content below has this number counted by hand anew.
	const FLOATING_PROMO_PARAMS = { expandedHeight: BANNER_HEIGHT };
	const CLOSE_BUTTON_SIZE = 48;
	const TRANSITION_DURATION = 0.25;
	const TRANSITION_EASING = 'easeInOutQuad';
	const TRANSITION_WATCHDOG_SLACK = 0.5;
	const TRANSITION_WATCHDOG_DELAY = (TRANSITION_DURATION + TRANSITION_WATCHDOG_SLACK) * 1000;

	/**
	 * @extends {PureComponent<UniversalPromoBannerProps>}
	 */
	class UniversalPromoBannerComponent extends PureComponent
	{
		/**
		 * @param {UniversalPromoBannerProps} props
		 */
		constructor(props)
		{
			super(props);

			this.isHidden = false;
			this.isUnmounted = false;
			this.lastViewedVisibilitySessionId = null;
			this.actionLocked = false;
			this.pendingMode = null;
			this.contentWidth = Math.max(1, Number(device?.screen?.width) || 1);
			this.contentOffset = Animated.newCalculatedValue(0);
			this.transitionAnimation = null;
			this.transitionWatchdog = null;
			this.dismissalStorage = new DismissalStorage();
			this.getTestId = createTestIdGenerator({ context: this });
			this.state = { mode: BannerMode.CAMPAIGN, imageReady: false };

			this.openTarget = this.openTarget.bind(this);
			this.showConfirmation = this.showConfirmation.bind(this);
			this.showCampaign = this.showCampaign.bind(this);
			this.confirmDismissal = this.confirmDismissal.bind(this);
			this.handleImageSuccess = this.handleImageSuccess.bind(this);
			this.handleImageFailure = this.handleImageFailure.bind(this);
		}

		render()
		{
			const { testId } = this.props;

			return FloatingPromo({
				testId,
				expandedOnly: true,
				expandedHeight: BANNER_HEIGHT,
				expanded: () => this.#renderContent(),
			});
		}

		/**
		 * The room the banner takes of the content is stated, not measured, so the consumer hears it once
		 * and holds it from the very first frame - the layer reports no layout of its own.
		 */
		componentDidMount()
		{
			this.props.onLayout({ height: getFloatingPromoReserve(FLOATING_PROMO_PARAMS).expanded });
		}

		componentWillUnmount()
		{
			this.isUnmounted = true;
			this.#clearTransitionWatchdog();
			this.transitionAnimation?.stop();
			this.transitionAnimation = null;
		}

		componentWillReceiveProps(props)
		{
			const campaignChanged = props.campaign.id !== this.props.campaign.id;
			const imageChanged = props.campaign.imageUrl !== this.props.campaign.imageUrl;

			if (campaignChanged || imageChanged)
			{
				// Another campaign is another impression: the session the previous one was seen in
				// must not suppress the view of the campaign replacing it.
				this.lastViewedVisibilitySessionId = null;
			}

			if (imageChanged)
			{
				// Another picture loads anew and reports the impression itself once it arrives. The
				// readiness of a picture that stays on the screen outlives the swap on purpose:
				// SafeImage resets on a new uri only and never repeats onSuccess for the one it holds.
				this.setState({ imageReady: false });

				return;
			}

			if (campaignChanged || props.visibilitySessionId !== this.props.visibilitySessionId)
			{
				this.#sendViewIfVisible(props.campaign, props.visibilitySessionId);
			}
		}

		/**
		 * Hiding empties the content and never the root: the runtime keeps the native views of the last
		 * frame when a component replaces the root element it returns - by null as well - and the consumer
		 * removing the banner is then left with nothing to remove. The layer stays, both panes go.
		 * @returns {object|null}
		 */
		#renderContent()
		{
			if (this.state.mode === BannerMode.HIDDEN)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('content'),
					style: {
						height: BANNER_HEIGHT,
						overflow: 'hidden',
					},
					onLayout: ({ width }) => this.#handleContentLayout(width),
				},
				View(
					{
						testId: this.getTestId('track'),
						style: {
							position: 'absolute',
							left: this.contentOffset,
							width: this.contentWidth * 2,
							height: BANNER_HEIGHT,
							flexDirection: 'row',
						},
					},
					View(
						{ style: { width: this.contentWidth, height: BANNER_HEIGHT } },
						this.#shouldRenderCampaign() ? this.#renderCampaign() : null,
					),
					View(
						{ style: { width: this.contentWidth, height: BANNER_HEIGHT } },
						this.#shouldRenderConfirmation() ? this.#renderConfirmation() : null,
					),
				),
			);
		}

		#renderCampaign()
		{
			const { campaign, texts } = this.props;
			// The card holds the place from the first frame, but until the picture arrives it stays
			// neutral and deaf to a tap: an accented surface that opens a target is a promise the
			// banner cannot keep while the shimmer is still running. The cross keeps working.
			const { imageReady } = this.state;

			return Card(
				{
					testId: this.getTestId('campaign'),
					design: imageReady ? CardDesign.ACCENT : CardDesign.SECONDARY,
					corner: CardCorner.XL,
					hideCross: false,
					excludePaddingSide: { all: true },
					onClick: imageReady ? this.openTarget : null,
					onClose: this.showConfirmation,
					accessibilityLabel: campaign.accessibilityDescription,
					accessibilityHint: texts.open,
					accessibilityRole: 'button',
					style: {
						width: this.contentWidth,
						height: BANNER_HEIGHT,
						overflow: 'hidden',
					},
				},
				SafeImage({
					testId: this.getTestId('image'),
					uri: campaign.imageUrl,
					resizeMode: 'cover',
					clickable: false,
					// The picture comes from a remote host, so the card holds a shimmer until it arrives.
					// A failure takes the banner off the screen, and the stub of SafeImage would only
					// flash in the frame it is leaving.
					withShimmer: true,
					renderPlaceholder: () => null,
					wrapperStyle: {
						width: '100%',
						height: '100%',
					},
					style: {
						width: '100%',
						height: '100%',
					},
					onSuccess: this.handleImageSuccess,
					onFailure: this.handleImageFailure,
				}),
				View(
					{
						testId: this.getTestId('close'),
						accessibilityLabel: texts.hide,
						accessibilityRole: 'button',
						style: {
							position: 'absolute',
							top: 0,
							right: 0,
							width: CLOSE_BUTTON_SIZE,
							height: CLOSE_BUTTON_SIZE,
							zIndex: 1,
						},
						onClick: this.showConfirmation,
					},
				),
			);
		}

		#renderConfirmation()
		{
			const { texts } = this.props;

			return Card(
				{
					testId: this.getTestId('confirmation'),
					design: CardDesign.ACCENT,
					corner: CardCorner.XL,
					hideCross: true,
					onClick: null,
					style: {
						width: this.contentWidth,
						height: BANNER_HEIGHT,
						justifyContent: 'center',
					},
				},
				Text3({
					testId: this.getTestId('question'),
					text: texts.confirmation,
					color: Color.base1,
				}),
				View(
					{
						style: {
							flexDirection: 'row',
							marginTop: Indent.S.toNumber(),
						},
					},
					Button({
						testId: this.getTestId('yes'),
						text: Loc.getMessage('MOBILE_UNIVERSAL_PROMO_BANNER_YES'),
						design: ButtonDesign.FILLED,
						size: ButtonSize.M,
						loading: this.state.mode === BannerMode.SAVING,
						onClick: this.confirmDismissal,
						style: { marginRight: Indent.S.toNumber() },
					}),
					Button({
						testId: this.getTestId('no'),
						text: Loc.getMessage('MOBILE_UNIVERSAL_PROMO_BANNER_NO'),
						design: ButtonDesign.OUTLINE,
						size: ButtonSize.M,
						disabled: this.state.mode === BannerMode.SAVING,
						onClick: this.showCampaign,
					}),
				),
			);
		}

		/**
		 * The offset the content rests at, counted from the width the layer has now: a layout that lands
		 * during the transition is held back by #handleContentLayout, so the value the transition started
		 * with may belong to a screen of another width.
		 */
		#getSettledOffset(settledMode)
		{
			return settledMode === BannerMode.CONFIRMATION ? -this.contentWidth : 0;
		}

		#handleContentLayout(width)
		{
			if (!Number.isFinite(width) || width <= 0 || width === this.contentWidth)
			{
				return;
			}

			this.contentWidth = width;
			if (this.#isTransitioning())
			{
				return;
			}

			this.contentOffset.setValue(this.#shouldRenderConfirmation() ? -width : 0);
		}

		#isTransitioning()
		{
			return this.state.mode === BannerMode.TO_CONFIRMATION || this.state.mode === BannerMode.TO_CAMPAIGN;
		}

		#shouldRenderCampaign()
		{
			return this.state.mode === BannerMode.CAMPAIGN || this.#isTransitioning();
		}

		#shouldRenderConfirmation()
		{
			return (
				this.state.mode === BannerMode.CONFIRMATION
				|| this.state.mode === BannerMode.SAVING
				|| this.#isTransitioning()
			);
		}

		#canHandleAction(mode)
		{
			return (
				!this.actionLocked
				&& !this.isHidden
				&& !this.isUnmounted
				&& this.state.mode === mode
			);
		}

		showConfirmation()
		{
			if (!this.#canHandleAction(BannerMode.CAMPAIGN))
			{
				return false;
			}

			this.actionLocked = true;
			this.#transition(BannerMode.TO_CONFIRMATION, BannerMode.CONFIRMATION);

			return true;
		}

		showCampaign()
		{
			if (!this.#canHandleAction(BannerMode.CONFIRMATION))
			{
				return false;
			}

			this.actionLocked = true;
			this.#transition(BannerMode.TO_CAMPAIGN, BannerMode.CAMPAIGN);

			return true;
		}

		#transition(transitionMode, settledMode)
		{
			this.pendingMode = transitionMode;
			this.setState({ mode: transitionMode }, () => {
				if (this.isHidden || this.isUnmounted || this.state.mode !== transitionMode)
				{
					return;
				}

				this.transitionAnimation = Animated.timing(this.contentOffset, {
					toValue: this.#getSettledOffset(settledMode),
					duration: TRANSITION_DURATION,
					type: TRANSITION_EASING,
				});
				this.transitionWatchdog = setTimeout(() => {
					this.#completeTransition(transitionMode, settledMode, true);
				}, TRANSITION_WATCHDOG_DELAY);
				this.transitionAnimation.start(() => {
					this.#completeTransition(transitionMode, settledMode, false);
				});
			});
		}

		#completeTransition(transitionMode, settledMode, stopAnimation)
		{
			this.#clearTransitionWatchdog();
			const animation = this.transitionAnimation;
			this.transitionAnimation = null;
			if (stopAnimation)
			{
				animation?.stop();
			}

			if (this.isHidden || this.isUnmounted || this.state.mode !== transitionMode)
			{
				return;
			}

			this.contentOffset.setValue(this.#getSettledOffset(settledMode));
			this.setState({ mode: settledMode }, () => {
				this.pendingMode = null;
				this.actionLocked = false;
				if (settledMode === BannerMode.CONFIRMATION)
				{
					UniversalPromoBannerAnalytics.sendOpenHideConfirmation(this.props.campaign);
				}
				else if (settledMode === BannerMode.CAMPAIGN)
				{
					UniversalPromoBannerAnalytics.sendCancelHide(this.props.campaign);
					this.#sendViewIfVisible();
				}
			});
		}

		#clearTransitionWatchdog()
		{
			if (this.transitionWatchdog === null)
			{
				return;
			}

			clearTimeout(this.transitionWatchdog);
			this.transitionWatchdog = null;
		}

		openTarget()
		{
			if (!this.#canHandleAction(BannerMode.CAMPAIGN))
			{
				return false;
			}

			const { campaign, layout } = this.props;
			// One gate for a valid target: the same normalizer the campaign itself went through.
			const targetUrl = normalizeTargetUrl(campaign.targetUrl);
			if (targetUrl === null)
			{
				return false;
			}

			try
			{
				UniversalPromoBannerAnalytics.sendClick(campaign);
				const navigation = PageManager.openPage({
					bx24ModernStyle: true,
					parentWidget: layout,
					url: targetUrl,
				});
				navigation?.catch?.(() => {
					UniversalPromoBannerAnalytics.sendError('navigation', campaign);
				});

				return true;
			}
			catch
			{
				UniversalPromoBannerAnalytics.sendError('navigation', campaign);

				return false;
			}
		}

		async confirmDismissal()
		{
			if (!this.#canHandleAction(BannerMode.CONFIRMATION))
			{
				return false;
			}

			this.actionLocked = true;
			const campaign = this.props.campaign;
			const campaignId = campaign.id;
			this.pendingMode = BannerMode.SAVING;

			try
			{
				await new Promise((resolve) => {
					this.setState({ mode: BannerMode.SAVING }, resolve);
				});
				const dismissed = await Promise.resolve(this.dismissalStorage.dismiss(campaignId));
				if (dismissed !== true)
				{
					throw new Error('Dismissal storage verification failed');
				}

				// The refusal is already stored for good, so the event must not be lost to a
				// surface that closed meanwhile.
				UniversalPromoBannerAnalytics.sendHide(campaign);

				if (this.isUnmounted)
				{
					return true;
				}

				this.hide();

				return true;
			}
			catch
			{
				UniversalPromoBannerAnalytics.sendError('storage', campaign);
				if (!this.isHidden && !this.isUnmounted)
				{
					this.setState({ mode: BannerMode.CONFIRMATION }, () => {
						this.pendingMode = null;
						this.actionLocked = false;
					});
				}

				return false;
			}
		}

		handleImageSuccess()
		{
			this.setState({ imageReady: true }, () => this.#sendViewIfVisible());
		}

		#sendViewIfVisible(campaign = this.props.campaign, visibilitySessionId = this.props.visibilitySessionId)
		{
			if (
				!this.state.imageReady
				|| this.isHidden
				|| this.isUnmounted
				|| this.state.mode !== BannerMode.CAMPAIGN
				|| this.lastViewedVisibilitySessionId === visibilitySessionId
			)
			{
				return false;
			}

			this.lastViewedVisibilitySessionId = visibilitySessionId;
			UniversalPromoBannerAnalytics.sendView(campaign);

			return true;
		}

		handleImageFailure()
		{
			const mode = this.pendingMode ?? this.state.mode;

			if (
				this.isHidden
				|| this.isUnmounted
				|| ![
					BannerMode.CAMPAIGN,
					BannerMode.TO_CONFIRMATION,
					BannerMode.CONFIRMATION,
					BannerMode.TO_CAMPAIGN,
				].includes(mode)
			)
			{
				return false;
			}

			this.actionLocked = true;
			UniversalPromoBannerAnalytics.sendError('image', this.props.campaign);
			this.hide();

			return true;
		}

		hide()
		{
			if (this.isHidden)
			{
				return;
			}

			this.isHidden = true;
			this.actionLocked = true;
			this.pendingMode = BannerMode.HIDDEN;
			this.#clearTransitionWatchdog();
			this.transitionAnimation?.stop();
			this.transitionAnimation = null;
			this.setState({ mode: BannerMode.HIDDEN });
			this.props.onHide();
		}
	}

	UniversalPromoBannerComponent.propTypes = {
		testId: PropTypes.string.isRequired,
		campaign: PropTypes.shape({
			id: PropTypes.string.isRequired,
			imageUrl: PropTypes.string.isRequired,
			accessibilityDescription: PropTypes.string.isRequired,
			targetUrl: PropTypes.string.isRequired,
			analytics: PropTypes.shape({
				region: PropTypes.string.isRequired,
				portalType: PropTypes.string.isRequired,
				ageSegment: PropTypes.string.isRequired,
				targetScenario: PropTypes.string.isRequired,
			}).isRequired,
		}).isRequired,
		// The banner owns no wording of a campaign: the consumer knows in which surface the card is shown
		// and brings the phrases of that surface. Its own lang file keeps only the two answers.
		texts: PropTypes.shape({
			open: PropTypes.string.isRequired,
			hide: PropTypes.string.isRequired,
			confirmation: PropTypes.string.isRequired,
		}).isRequired,
		layout: PropTypes.object.isRequired,
		visibilitySessionId: PropTypes.number.isRequired,
		onLayout: PropTypes.func.isRequired,
		onHide: PropTypes.func.isRequired,
	};

	module.exports = {
		/**
		 * @param {UniversalPromoBannerProps} props
		 * @returns {UniversalPromoBannerComponent}
		 */
		UniversalPromoBanner: (props) => new UniversalPromoBannerComponent(props),
		normalizeCampaign,
		DismissalStorage,
		UniversalPromoBannerAnalytics,
	};
});
