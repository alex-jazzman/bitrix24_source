/**
 * @module more-menu/block/company/whats-new/src/whats-new-button
 */
jn.define('more-menu/block/company/whats-new/src/whats-new-button', (require, exports, module) => {
	const { PerfPoint } = require('debug/prism');

	const HUB_CONTENT_HEIGHT = 72;
	const HUB_IMAGE_SIZE = 72;
	const HUB_CHEVRON_SIZE = 24;
	const createWhatsNewButton = (dependencies) => {
		const {
			PureComponent,
			View,
			helpdesk,
			inAppUrl,
			Loc,
			ShimmerView,
			carouselModel,
			Indent,
			Color,
			Corner,
			MoreMenuAnalytics,
			getCardBorderColor,
			sendHelpdeskAnalytics,
			PropTypes,
			Card,
			CardCorner,
			CardDesign,
			IconView,
			Icon,
			Text2,
			Text3,
			BadgeCounter,
			BadgeCounterSize,
			BadgeCounterDesign,
			ChipStatus,
			ChipStatusDesign,
			ChipStatusMode,
			SwipeSlider,
			SliderNavigationMode,
			SafeImage,
		} = dependencies;
		const {
			createCardActionController,
			isReadConfirmed,
			project,
			reduceSnapshot,
			resolvePageIndex,
			shouldShowLoadingSkeleton,
		} = carouselModel;

		/**
		 * @extends {PureComponent<WhatsNewButtonProps, WhatsNewButtonState>}
		 */
		class WhatsNewButton extends PureComponent
		{
			/**
			 * @param {WhatsNewButtonProps} props
			 */
			constructor(props)
			{
				super(props);

				this.initialResult = null;
				this.initialLoadFailed = false;
				this.initialRequestPending = false;
				this.mounted = false;
				this.pageIndex = 0;
				this.state = {
					snapshot: project(props.articles, props.categories),
					width: null,
				};
				this.cardActionController = createCardActionController({
					openHelpdeskArticle: (articleId) => helpdesk.openHelpArticle(articleId, null),
					sendAnalytics: sendHelpdeskAnalytics,
					markRead: this.markArticleRead,
					openWhatsNew: this.openWhatsNew,
				});
			}

			componentDidMount()
			{
				this.mounted = true;

				if (this.props.hubDesign && this.props.isIdle)
				{
					this.loadInitialData();
				}
			}

			componentWillReceiveProps(props)
			{
				if (this.initialRequestPending && props.isSucceeded)
				{
					return;
				}

				this.updateSnapshot(props);
			}

			componentDidUpdate(prevProps)
			{
				if (prevProps.counter !== this.props.counter && this.props.onCounterChange)
				{
					this.props.onCounterChange(this.props.counter);
				}
			}

			componentWillUnmount()
			{
				this.mounted = false;
				this.cardActionController.clear();
			}

			getStatus(props)
			{
				if (props.isLoading)
				{
					return 'pending';
				}

				if (props.isSucceeded)
				{
					return 'success';
				}

				if (props.isFailed)
				{
					return 'failed';
				}

				return 'idle';
			}

			updateSnapshot(props, initialResult = this.initialResult)
			{
				const snapshot = reduceSnapshot(
					this.state.snapshot,
					this.getStatus(props),
					props.articles,
					props.categories,
					initialResult,
				);
				this.initialResult = null;

				if (snapshot !== this.state.snapshot)
				{
					this.setState({ snapshot });
				}
			}

			async loadInitialData()
			{
				const point = new PerfPoint('Whats New Carousel Load', 'more menu').start();
				this.initialRequestPending = true;

				try
				{
					if (!this.props.urlParams?.url)
					{
						point.startPoint('Fetch URL Params');
						try
						{
							await this.props.fetchUrlParamsThunk().unwrap();
						}
						finally
						{
							point.endPoint('Fetch URL Params');
						}
					}

					point.startPoint('Fetch Articles');
					try
					{
						this.initialResult = await this.props.fetchWhatsNewThunk({ blockPage: 0 }).unwrap();
					}
					finally
					{
						point.endPoint('Fetch Articles');
					}
					this.initialLoadFailed = false;
				}
				catch
				{
					this.initialResult = null;
					this.initialLoadFailed = true;
					// the failed status is shared and persisted, so it would trap the standalone list screen
					this.props.statusReset();
				}
				finally
				{
					try
					{
						this.initialRequestPending = false;
						if (this.mounted)
						{
							this.updateSnapshot(this.props);
						}
					}
					finally
					{
						point.end();
					}
				}
			}

			render()
			{
				if (this.props.hubDesign)
				{
					return this.renderHub();
				}

				return this.renderCompact();
			}

			renderCompact()
			{
				const {
					testId,
					counter,
				} = this.props;

				return View(
					{
						testId: `${testId}-wrapper`,
						style: {
							paddingRight: Indent.XS.toNumber(),
							marginRight: Indent.XS.toNumber(),
							flexGrow: 2,
						},
					},
					Card(
						{
							testId,
							onClick: this.handleCardClick,
							corner: CardCorner.XL,
							style: {
								backgroundColor: Color.bgContentSecondaryInvert.toHex(),
							},
						},
						View(
							{
								style: {
									flexDirection: 'row',
								},
							},
							IconView({
								testId: `${testId}-icon`,
								size: 26,
								icon: Icon.FAVORITE,
								color: Color.accentMainPrimary,
								style: {
									marginRight: Indent.XS.toNumber(),
								},
							}),
							Text3({
								testId: `${testId}-text`,
								color: Color.base1,
								text: Loc.getMessage('MORE_MENU_COMPANY_WHATS_NEW'),
							}),
						),
					),
					counter && BadgeCounter({
						testId: `${testId}-counter`,
						value: counter,
						size: BadgeCounterSize.M,
						showRawValue: true,
						design: BadgeCounterDesign.ALERT,
						style: {
							position: 'absolute',
							top: 0,
							right: 0,
						},
					}),
				);
			}

			renderHub()
			{
				const { testId } = this.props;
				const content = this.renderHubContent();
				const hasPagination = this.state.snapshot.length > 0 && this.state.width !== null;

				return Card(
					{
						testId: `${testId}-hub`,
						onClick: this.handleCardClick,
						design: CardDesign.PRIMARY,
						corner: CardCorner.L,
						border: true,
						borderColor: getCardBorderColor(),
						excludePaddingSide: { bottom: hasPagination },
						style: {
							width: '100%',
							flexDirection: 'column',
						},
					},
					View(
						{
							testId: `${testId}-hub-content`,
							onLayout: this.onLayout,
						},
						this.renderHubHeader(),
						content && View(
							{
								style: {
									marginTop: Indent.XL2.toNumber(),
								},
							},
							content,
						),
					),
				);
			}

			renderHubHeader()
			{
				const { testId, counter } = this.props;

				return View(
					{
						testId: `${testId}-hub-header`,
						clickable: true,
						onClick: this.handleCardClick,
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					Text2({
						testId: `${testId}-hub-title`,
						text: Loc.getMessage('MORE_MENU_COMPANY_WHATS_NEW'),
						color: Color.base1,
						accent: true,
						// the counter takes width off the title, and a title free to wrap spends it on a
						// second line instead of giving it back - the heading of the card would jump the
						// moment the first unread article arrives. The heading keeps its own width for the
						// same reason: given leave to shrink it ends up ellipsized while the row still has
						// room to spare.
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							flexShrink: 0,
						},
					}),
					counter > 0 && BadgeCounter({
						testId: `${testId}-hub-counter`,
						value: counter,
						size: BadgeCounterSize.M,
						showRawValue: true,
						design: BadgeCounterDesign.ALERT,
						style: {
							marginLeft: Indent.M.toNumber(),
						},
					}),
					View({ style: { flexGrow: 1 } }),
					IconView({
						testId: `${testId}-hub-chevron`,
						icon: Icon.CHEVRON_TO_THE_RIGHT,
						size: HUB_CHEVRON_SIZE,
						color: Color.base4,
					}),
				);
			}

			renderHubContent()
			{
				const { snapshot, width } = this.state;

				if (snapshot.length > 0)
				{
					return width ? this.renderSlider() : this.renderSkeleton();
				}

				const { isIdle, isLoading } = this.props;

				if (shouldShowLoadingSkeleton({ isIdle, isLoading, initialLoadFailed: this.initialLoadFailed }))
				{
					return this.renderSkeleton();
				}

				return null;
			}

			renderSlider()
			{
				const { testId } = this.props;
				const { snapshot, width } = this.state;
				const cards = snapshot.map((article) => this.renderArticleCard(article));

				return SwipeSlider({
					testId: `${testId}-carousel`,
					children: cards,
					width,
					pageIndex: this.getCurrentPageIndex(),
					onPageChange: this.onSliderPageChange,
					contentHeight: HUB_CONTENT_HEIGHT,
					navigationMode: SliderNavigationMode.SWIPE,
				});
			}

			renderSkeleton()
			{
				const { testId } = this.props;

				return ShimmerView(
					{
						testId: `${testId}-carousel-skeleton`,
						animating: true,
					},
					View({
						style: {
							width: '100%',
							height: HUB_CONTENT_HEIGHT,
							borderRadius: Corner.L.toNumber(),
							backgroundColor: Color.bgContentSecondary.toHex(),
						},
					}),
				);
			}

			renderArticleCard(article)
			{
				const { testId } = this.props;
				const { width } = this.state;
				const cardTestId = `${testId}-carousel-card-${article.id}`;

				return View(
					{
						testId: cardTestId,
						clickable: true,
						onClick: () => this.handleArticleClick(article),
						style: {
							width,
							height: HUB_CONTENT_HEIGHT,
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'center',
							},
						},
						SafeImage({
							testId: `${cardTestId}-image`,
							uri: article.imageUri ?? '',
							resizeMode: 'cover',
							clickable: false,
							style: {
								width: HUB_IMAGE_SIZE,
								height: HUB_IMAGE_SIZE,
								borderRadius: Corner.M.toNumber(),
							},
							wrapperStyle: {
								width: HUB_IMAGE_SIZE,
								height: HUB_IMAGE_SIZE,
								marginRight: Indent.XL.toNumber(),
							},
						}),
						View(
							{
								style: {
									flex: 1,
									flexDirection: 'column',
								},
							},
							article.category && ChipStatus({
								testId: `${cardTestId}-category`,
								text: article.category,
								mode: ChipStatusMode.TINTED,
								design: ChipStatusDesign.PRIMARY,
								compact: true,
								style: {
									marginBottom: Indent.XS.toNumber(),
								},
							}),
							Text3({
								testId: `${cardTestId}-title`,
								text: article.title,
								color: Color.base1,
								numberOfLines: 2,
								ellipsize: 'end',
							}),
						),
					),
				);
			}

			onLayout = ({ width }) => {
				if (width > 0 && width !== this.state.width)
				{
					this.setState({ width });
				}
			};

			onSliderPageChange = (pageIndex) => {
				this.pageIndex = pageIndex;
			};

			getCurrentPageIndex()
			{
				return resolvePageIndex(this.pageIndex, this.state.snapshot.length);
			}

			/**
			 * A tap on a row of the carousel: it is the very same tap on the card as far as the screen
			 * that drew it is concerned, and where it leads is the business of the controller.
			 *
			 * @param {WhatsNewCarouselArticle} article
			 */
			handleArticleClick(article)
			{
				this.props.onCardClick?.();

				this.cardActionController.onCardTap(article);
			}

			markArticleRead = (articleId) => {
				const action = this.props.updateReadNewsThunk({ newsIds: [articleId] });
				const request = action.unwrap ? action.unwrap() : action;

				return Promise.resolve(request).then((result) => {
					if (isReadConfirmed(result, articleId))
					{
						this.syncLocalParams();
					}

					return result;
				});
			};

			syncLocalParams()
			{
				const action = this.props.updateLocalWhatsNewsParamsThunk({});
				const request = action.unwrap ? action.unwrap() : action;

				Promise.resolve(request).catch(() => {});
			}

			/**
			 * A tap on the card itself, wherever it landed: the screen that drew the card hears of it, and
			 * the list opens. The controller of the carousel opens the list without this: a row of it is a
			 * tap of its own and reports itself.
			 */
			handleCardClick = () => {
				this.props.onCardClick?.();

				this.openWhatsNew();
			};

			openWhatsNew = () => {
				inAppUrl.open('/whats-new/', {
					title: Loc.getMessage('MORE_MENU_COMPANY_WHATS_NEW'),
				});

				MoreMenuAnalytics.sendDrawerOpenEvent(this.props.analyticsSection);
			};
		}

		WhatsNewButton.propTypes = {
			testId: PropTypes.string,
			counter: PropTypes.number,
			onCounterChange: PropTypes.func,
			hubDesign: PropTypes.bool,
			// listened to by the section; nobody else mounting the card hands it over
			onCardClick: PropTypes.func,
			// the screen the card is drawn in; left out, its own events stay with the menu that owns it
			analyticsSection: PropTypes.string,
		};

		WhatsNewButton.defaultProps = {
			hubDesign: false,
		};

		return WhatsNewButton;
	};

	module.exports = {
		createWhatsNewButton,
	};
});
