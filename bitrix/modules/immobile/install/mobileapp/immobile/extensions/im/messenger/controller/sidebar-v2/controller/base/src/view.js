/**
 * @module im/messenger/controller/sidebar-v2/controller/base/src/view
 */
jn.define('im/messenger/controller/sidebar-v2/controller/base/src/view', (require, exports, module) => {
	const { Type } = require('type');
	const { isEmpty } = require('utils/object');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { PrimaryButton } = require('im/messenger/controller/sidebar-v2/ui/primary-button');
	const { ChatDescription } = require('im/messenger/controller/sidebar-v2/ui/chat-description');
	const { SidebarAvatar, PositionEnum } = require('im/messenger/controller/sidebar-v2/ui/sidebar-avatar');
	const { SidebarTopContainer } = require('im/messenger/controller/sidebar-v2/ui/top-container');
	const { SidebarPlanLimitBanner } = require('im/messenger/controller/sidebar-v2/ui/plan-limit-banner');
	const { Area } = require('ui-system/layout/area');
	const { Indent, Color } = require('tokens');
	const { CardList } = require('ui-system/layout/card-list');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { SharingLinkSection } = require('im/messenger/controller/sidebar-v2/ui/sharing-link');
	const { H4, BBCodeText, Text4 } = require('ui-system/typography');
	const { Avatar, AvatarShape } = require('ui-system/blocks/avatar');

	const isIos = Application.getPlatform() === 'ios';

	// Height of the tab switcher (TabView) rendered above the tab slider. The visible
	// frame available to a tab's list is the working area minus this switcher, so it is
	// the reference used to decide whether the selected tab content overflows.
	const TAB_SWITCHER_HEIGHT = 51;

	class SidebarBaseView extends LayoutComponent
	{
		/**
		 * @param {SidebarViewDefaultProps} props
		 */
		constructor(props)
		{
			super(props);

			this.dialogId = props.dialogId;
			this.dialogHelper = DialogHelper.createByDialogId(this.dialogId);
			this.logger = LoggerManager.getInstance().getLogger(`SidebarV2.View.${this.constructor.name}`);

			this.state = {
				selectedTab: null,
				tabs: Array.isArray(props.tabs) ? props.tabs : [],
				primaryActionButtons: Array.isArray(props.primaryActionButtons) ? props.primaryActionButtons : [],
				chatTitle: props.chatTitle,
				isMessagesAutoDeleteDelayEnabled: props.isMessagesAutoDeleteDelayEnabled,
			};

			this.layoutHeightRecalculated = false;
			this.verticalSliderRef = null;
			/** @type {SidebarTopContainer|null} */
			this.topContainerRef = null;
			this.tabSwitcherRef = null;
			this.tabSliderRef = null;
			this.topContainerCollapsed = false;
			this.topContainerToggleInProgress = false;
			// While search is active the header stays collapsed: the auto-expand on scroll to
			// the top on iOS is suppressed (see getIosScrollHandlers). Otherwise focusing search
			// while the header is already hidden expands it again and squeezes the list under the keyboard.
			this.headerCollapsedBySearch = false;
			this.topContainerCalculatedHeight = null;
			this.workingAreaCalculatedHeight = null;
			// Whether the currently selected tab's content is taller than its visible frame.
			// The tall slider (which reserves a strip below the screen for the collapse
			// animation) is only needed when there is something to reveal - i.e. when the
			// content overflows, the header is collapsed, or search collapsed it. A short
			// non-scrollable list keeps a flat slider so its last rows stay on screen.
			this.selectedTabOverflows = false;

			// Per-tab overflow, keyed by tab index. Each tab is measured independently (media
			// measures tall, participants may measure short), and the value is remembered so that
			// switching tabs applies the target tab's own last-known overflow rather than a stale
			// one left by another tab. Unmeasured tabs default to a flat slider (safe default:
			// nothing hidden below the screen).
			this.tabOverflowMap = {};

			// Forces the tall slider around a collapse animation whose trigger (tab-title click)
			// does not otherwise imply a tall slider. The strip must exist before the animation
			// starts; the flag is cleared once the collapse settles (topContainerCollapsed then
			// keeps the slider tall on its own).
			this.forceTallSlider = false;

			// Whether the slider is currently rendered tall. shouldUseTallSlider() is a predicate
			// over flags that callers mutate ahead of the render, so it tells what the slider
			// SHOULD be, not what is on screen. Collapse coordination needs the latter: it is set
			// from getVerticalSliderStyle to match the height actually returned.
			this.sliderRenderedTall = false;

			/** @type {Object.<string, SidebarBaseTabContent>} */
			this.listViewMap = {};

			this.store = serviceLocator.get('core').getStore();

			/** @type {LayoutWidget} */
			this.widget = props.widget;

			/** @type {SidebarWidgetNavigator} */
			this.widgetNavigator = props.widgetNavigator;

			this.callUserProfile = Type.isFunction(props.callbacks?.callUserProfile)
				? props.callbacks.callUserProfile
				: () => {}
			;

			this.customAvatarProps = props.customAvatarProps;
		}

		get chatTitle()
		{
			return this.state.chatTitle;
		}

		collapseTopContainer()
		{
			if (this.topContainerToggleInProgress || this.topContainerCollapsed || this.topContainerCalculatedHeight === null)
			{
				return;
			}

			this.topContainerToggleInProgress = true;

			const scrolledTitle = this.chatTitle.getTitle({ useNotes: true });
			if (scrolledTitle?.length > 0)
			{
				this.widget.setTitle({ text: scrolledTitle }, true);
			}

			this.verticalSliderRef?.animate({ top: -this.topContainerCalculatedHeight, duration: 300 }, () => {
				this.topContainerCollapsed = true;
				this.topContainerToggleInProgress = false;
				// Collapse finished: topContainerCollapsed now keeps the slider tall, so the
				// temporary force is no longer needed.
				this.forceTallSlider = false;
			});
		}

		expandTopContainer()
		{
			if (this.topContainerToggleInProgress || this.topContainerCollapsed === false)
			{
				return;
			}

			this.topContainerToggleInProgress = true;

			this.widget.setTitle({ text: this.props.widgetTitle }, true);

			this.verticalSliderRef?.animate({ top: 0, duration: 300 }, () => {
				this.topContainerCollapsed = false;
				this.topContainerToggleInProgress = false;

				// After the header is expanded, restore the flat slider unless the selected tab
				// still needs the tall one (iOS scroll-driven collapse relies on the reserved
				// strip when the content overflows). Done only once the animation settles so the
				// height change does not interfere with the in-flight animation.
				this.forceTallSlider = false;
				if (!this.shouldUseTallSlider())
				{
					this.setState({});
				}
			});
		}

		rememberTopContainerHeight = ({ height }) => {
			if (this.topContainerCalculatedHeight === null || this.topContainerCalculatedHeight !== height)
			{
				this.topContainerCalculatedHeight = height;
				this.recalculateLayoutHeight();
			}
		};

		rememberWorkingAreaHeight = ({ height }) => {
			if (this.workingAreaCalculatedHeight === null)
			{
				this.workingAreaCalculatedHeight = height;
				this.recalculateLayoutHeight();
			}
		};

		recalculateLayoutHeight()
		{
			if (this.topContainerCalculatedHeight === null || this.workingAreaCalculatedHeight === null)
			{
				return;
			}

			this.layoutHeightRecalculated = true;

			this.setState({});
		}

		/**
		 * @public
		 * @return {void}
		 */
		scrollToBegin()
		{
			this.scrollSelectedTabToBegin(false)
				.then(() => this.expandTopContainer())
				.catch((err) => this.logger.warn('Selected tab is unscrollable', err));
		}

		/**
		 * @public
		 * @param {boolean} animated
		 * @return {Promise}
		 */
		scrollSelectedTabToBegin(animated = true)
		{
			const selectedTab = this.getSelectedTab();
			if (!selectedTab)
			{
				return Promise.reject(new Error('No tabs found'));
			}

			const selectedTabId = selectedTab.getId();
			const selectedTabViewRef = this.listViewMap[selectedTabId];

			if (selectedTabViewRef?.scrollToBegin)
			{
				return selectedTabViewRef?.scrollToBegin(animated);
			}

			return Promise.reject(new Error('Scrollable ref not found'));
		}

		/**
		 * @protected
		 * @return {number}
		 */
		getSelectedTabIndex()
		{
			return this.state.selectedTab?.id
				? this.state.tabs.findIndex((t) => t.getId() === this.state.selectedTab.id)
				: 0;
		}

		/**
		 * @protected
		 * @return SidebarBaseTab|undefined
		 */
		getSelectedTab()
		{
			return this.state.selectedTab?.id
				? this.state.tabs.find((t) => t.getId() === this.state.selectedTab.id)
				: this.state.tabs[0];
		}

		/**
		 * Works similar as componentWillReceiveProps. Triggered by sidebar controller.
		 * Update state here if needed.
		 * @public
		 * @param {SidebarViewDefaultProps} nextProps
		 */
		refresh(nextProps = {})
		{
			if (!this.topContainerRef)
			{
				return;
			}

			this.dialogHelper = DialogHelper.createByDialogId(this.dialogId);

			const { primaryActionButtons, chatTitle, isMessagesAutoDeleteDelayEnabled } = nextProps;

			this.state = {
				...this.state,
				chatTitle,
				primaryActionButtons,
				isMessagesAutoDeleteDelayEnabled,
			};

			this.topContainerRef.refresh();
		}

		/**
		 * @protected
		 * @return {SidebarViewTheme}
		 */
		getTheme()
		{
			return {};
		}

		render()
		{
			return View(
				{
					onLayout: this.rememberWorkingAreaHeight,
					style: {
						flex: 1,
					},
				},
				View(
					{
						ref: (ref) => {
							this.verticalSliderRef = ref;
						},
						style: this.getVerticalSliderStyle(),
					},
					new SidebarTopContainer({
						ref: (ref) => {
							this.topContainerRef = ref;
						},
						onLayout: this.rememberTopContainerHeight,
						renderHeader: () => this.renderHeader(),
						renderDescription: () => this.renderDescription(),
						renderSharingLink: () => this.renderSharingLink(),
						renderPrimaryActionButtons: () => this.renderPrimaryActionButtons(),
						renderPlanLimitBanner: () => this.renderPlanLimitBanner(),
					}),
					this.renderTabSwitcher(),
					this.renderTabSlider(),
				),
			);
		}

		getVerticalSliderStyle()
		{
			// The slider height is gated by actual need, not fixed "tall" unconditionally.
			// A tall slider (working area + header height) reserves a strip below the screen
			// so the top animation of collapseTopContainer can reveal it. That strip is only
			// wanted when there is a collapse to perform; otherwise it hides the last rows of a
			// short non-scrollable list below the screen edge with nothing to scroll them up.
			//
			// Until the layout is measured, keep the previous device.screen.height fallback as a
			// safe first-frame default (the header is on screen and nothing is clipped yet).
			if (!this.layoutHeightRecalculated)
			{
				// The pre-measure fallback is at least as tall as the working area, so a collapse
				// against it leaves no below-screen strip - treat it as rendered tall.
				this.sliderRenderedTall = true;

				return {
					height: device.screen.height,
					width: '100%',
				};
			}

			const tallHeight = this.workingAreaCalculatedHeight + this.topContainerCalculatedHeight;
			const useTall = this.shouldUseTallSlider();
			this.sliderRenderedTall = useTall;

			return {
				height: useTall
					? tallHeight
					: this.workingAreaCalculatedHeight,
				width: '100%',
			};
		}

		/**
		 * @desc Whether the slider must reserve the below-screen strip (tall) rather than fit
		 * the visible working area (flat).
		 *
		 * - iOS collapses the header on scroll, so the strip is needed whenever the selected tab
		 *   overflows (there is enough content to scroll and trigger the collapse), or the header
		 *   is already collapsed (by scroll or by search focus).
		 * - Android has no scroll-driven collapse, so overflow alone does not require the strip -
		 *   a long list simply scrolls inside the visible frame with the header shown. The strip is
		 *   only needed for the search-focus collapse (headerCollapsedBySearch) or an in-progress /
		 *   done collapse (topContainerCollapsed).
		 *
		 * @protected
		 * @return {boolean}
		 */
		shouldUseTallSlider()
		{
			if (this.topContainerCollapsed || this.headerCollapsedBySearch || this.forceTallSlider)
			{
				return true;
			}

			return isIos && this.selectedTabOverflows;
		}

		renderHeader()
		{
			return Area(
				{
					isFirst: true,
					excludePaddingSide: {
						bottom: true,
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							justifyContent: 'flex-start',
							alignItems: 'center',
							paddingRight: Indent.M.toNumber(),
							paddingLeft: Indent.XL.toNumber(),
						},
					},
					this.renderAvatar(),
					View(
						{
							style: {
								flex: 1,
								flexDirection: 'column',
								justifyContent: 'center',
							},
							onClick: () => this.callUserProfile(),
						},
						this.renderTitle(),
						this.renderChatInfo(),
					),
				),
			);
		}

		getAvatarStatusIcons()
		{
			if (this.dialogHelper.isNotes)
			{
				return null;
			}

			const hasVacation = this.store.getters['usersModel/hasVacation'](this.dialogId);
			if (hasVacation)
			{
				return [{
					statusIcon: Image({
						style: {
							width: 26,
							height: 26,
							backgroundColor: Color.bgContentPrimary.toHex(),
							borderRadius: 13,
							overflow: 'hidden',
						},
						tintColor: Color.accentSoftElementGreen.toHex(),
						named: Icon.SMALL_VACATION.getIconName(),
					}),
					position: PositionEnum.BOTTOM_RIGHT,
				}];
			}

			const hasBirthday = this.store.getters['usersModel/hasBirthday'](this.dialogId);
			if (hasBirthday)
			{
				return [{
					statusIcon: Image({
						style: {
							width: 26,
							height: 26,
							backgroundColor: Color.bgContentPrimary.toHex(),
							borderRadius: 13,
							overflow: 'hidden',
						},
						tintColor: Color.accentSoftElementGreen.toHex(),
						named: Icon.SMALL_GIFT.getIconName(),
					}),
					position: PositionEnum.BOTTOM_RIGHT,
				}];
			}

			return null;
		}

		renderAvatar()
		{
			const isCustomAvatar = !isEmpty(this.customAvatarProps);
			const testId = 'avatar';
			const marginRight = Indent.XL3.toNumber();
			let avatar = null;

			if (isCustomAvatar)
			{
				avatar = Avatar({
					testId,
					...this.customAvatarProps,
					shape: AvatarShape[this.customAvatarProps.shape] ?? AvatarShape.CIRCLE,
					style: {
						marginRight,
						...this.customAvatarProps.style,
					},
				});
			}
			else
			{
				avatar = SidebarAvatar({
					testId,
					dialogId: this.dialogId,
					size: 72,
					statusIcons: this.getAvatarStatusIcons(),
				});
			}

			return View(
				{
					onClick: () => this.callUserProfile(),
					style: {
						marginRight,
					},
				},
				avatar,
			);
		}

		renderTitle()
		{
			const { isMessagesAutoDeleteDelayEnabled } = this.state;

			return View(
				{
					testId: 'chat-title-container',
					style: {
						flexDirection: 'row',
						marginBottom: this.getTheme().titleGap ?? Indent.M.toNumber(),
					},
				},
				H4({
					testId: 'chat-title-value',
					text: this.chatTitle.getTitle({ useNotes: true }),
					numberOfLines: 2,
					ellipsize: 'end',
					style: {
						color: this.chatTitle.getTitleColor({ useNotes: true }),
						flexShrink: 1,
					},
				}),
				isMessagesAutoDeleteDelayEnabled && IconView({
					icon: Icon.SMALL_TIMER_DOT,
					size: 20,
					color: Color.base3,
					style: {
						marginLeft: Indent.XS2.toNumber(),
						top: 1,
					},
				}),
			);
		}

		renderChatInfo()
		{
			const titleParams = this.chatTitle.getTitleParams();
			const descriptionText = this.chatTitle.getDescription({ useNotes: true });
			const detailText = titleParams.detailText;

			return View(
				{
					testId: 'chat-info-container',
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					Text4({
						text: descriptionText,
						testId: 'chat-info-description-value',
						color: Color.base1,
					}),
				),
				(detailText !== descriptionText) && BBCodeText({
					style: {
						marginTop: Indent.XS.toNumber(),
					},
					value: detailText,
					testId: 'chat-info-detail-text-value',
					size: 5,
					color: Color.base4,
				}),
			);
		}

		renderDescription()
		{
			const dialogModel = this.dialogHelper.dialogModel;
			if (!dialogModel.description?.length || dialogModel.description?.length === 0)
			{
				return null;
			}

			return ChatDescription({
				testId: 'chat-description',
				text: dialogModel.description,
				parentWidget: this.widget,
			});
		}

		renderPrimaryActionButtons()
		{
			const { primaryActionButtons } = this.state;

			if (primaryActionButtons.length === 0)
			{
				return null;
			}

			const items = [];

			primaryActionButtons.forEach((button, index) => {
				items.push(PrimaryButton({
					...button,
					testId: button.id,
					style: {
						marginLeft: index === 0 ? Indent.M.toNumber() : 0,
						marginRight: primaryActionButtons.length - 1 === index ? Indent.M.toNumber() : 0,
						...button.style,
					},
				}));

				if (button.separatorAfter)
				{
					items.push(this.renderPrimaryActionSeparator());
				}
			});

			return Area(
				{
					excludePaddingSide: {
						horizontal: true,
					},
				},
				CardList(
					{
						testId: 'primary-action-buttons',
						horizontal: true,
						showsVerticalScrollIndicator: false,
						showsHorizontalScrollIndicator: false,
						style: {
							height: 78,
						},
					},
					...items,
				),
			);
		}

		renderPrimaryActionSeparator()
		{
			return View(
				{
					testId: 'separator',
					style: {
						height: '100%',
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				View({
					style: {
						width: 1,
						height: 32,
						backgroundColor: Color.bgSeparatorPrimary.toHex(),
					},
				}),
			);
		}

		renderPlanLimitBanner()
		{
			return new SidebarPlanLimitBanner({
				testId: 'plan-limit-banner',
				dialogId: this.dialogId,
			});
		}

		renderSharingLink()
		{
			if (!SharingLinkSection.shouldShow(this.dialogId))
			{
				return null;
			}

			return new SharingLinkSection({
				dialogId: this.dialogId,
			});
		}

		renderTabSwitcher()
		{
			if (this.state.tabs.length === 0)
			{
				return null;
			}

			return TabView({
				testId: 'tab-switcher',
				ref: (ref) => {
					this.tabSwitcherRef = ref;
				},
				style: {
					height: TAB_SWITCHER_HEIGHT,
				},
				params: {
					items: this.state.tabs.map((tab) => ({
						id: tab.getId(),
						title: tab.getTitle(),
					})),
				},
				onTabSelected: (tab, changed, options) => {
					if (options?.action === 'click')
					{
						if (changed)
						{
							// clicked on title of another tab
							this.state.selectedTab = tab;
							void this.tabSliderRef?.scrollToPage(this.getSelectedTabIndex());
							// Follow the target tab's own overflow before collapsing, then collapse
							// with a guaranteed tall slider so the header hides without clipping.
							this.syncOverflowWithSelectedTab();
							this.collapseHeaderWithTallSlider();
						}
						else
						{
							// clicked on title of current tab
							this.scrollSelectedTabToBegin()
								.catch((err) => this.logger.warn('Selected tab is unscrollable', err));
						}
					}

					if (options?.action === 'code' && changed)
					{
						// swiped to another tab
						this.state.selectedTab = tab;
						this.syncOverflowWithSelectedTab();
					}
				},
			});
		}

		renderTabSlider()
		{
			const { tabs } = this.state;

			if (tabs.length === 0)
			{
				return null;
			}

			return Slider(
				{
					testId: 'tab-slider',
					style: {
						flex: 1,
					},
					ref: (ref) => {
						this.tabSliderRef = ref;
					},
					onPageChange: (nextPage) => {
						const tabId = tabs[nextPage]?.getId();
						if (tabId && this.tabSwitcherRef)
						{
							this.tabSwitcherRef.setActiveItem(tabId);
						}
					},
				},
				...(tabs.map((tab, tabIndex) => {
					const tabId = tab.getId();
					const TabContent = tab.getView();

					// All tabs are mounted at once inside the Slider, so each gets its own
					// scroll handlers bound to its index: overflow measurement must be
					// attributed to the tab it came from and only applied when that tab is
					// the selected one (media measures tall, participants may measure short).
					// in ios vertical scroll offset can be less than zero,
					// that's why we need separate onScroll handlers for ios and android.
					const listViewScrollProps = isIos
						? this.getIosScrollHandlers(tabIndex)
						: this.getAndroidScrollHandlers(tabIndex);

					return View(
						{
							testId: 'tab-slider-slide',
							style: {
								flex: 1,
							},
						},
						TabContent({
							...listViewScrollProps,
							testId: `tab-content-${tabId}`,
							dialogId: this.dialogId,
							widget: this.widget,
							widgetNavigator: this.widgetNavigator,
							topOffset: this.topContainerCalculatedHeight,
							workingAreaHeight: this.workingAreaCalculatedHeight,
							onRequestCollapseHeader: () => this.onRequestCollapseHeader(),
							onRequestExpandHeader: () => this.onRequestExpandHeader(),
							ref: (ref) => {
								this.listViewMap[tabId] = ref;
							},
						}),
					);
				})),
			);
		}

		/**
		 * @desc The visible frame available to a tab's list: the working area minus the tab
		 * switcher above the slider. Content taller than this frame overflows.
		 * @protected
		 * @return {number|null}
		 */
		getTabVisibleFrameHeight()
		{
			if (this.workingAreaCalculatedHeight === null)
			{
				return null;
			}

			return this.workingAreaCalculatedHeight - TAB_SWITCHER_HEIGHT;
		}

		/**
		 * @desc Records whether a tab's content overflows its visible frame and, when this
		 * changes for the currently selected tab, re-applies the slider height via setState.
		 * The measurement is attributed to its tab by index and ignored for non-selected tabs,
		 * so a tall media tab does not flip the flag while participants is on screen.
		 * @protected
		 * @param {number} tabIndex
		 * @param {number} contentHeight
		 * @return {void}
		 */
		handleTabContentMeasured(tabIndex, contentHeight)
		{
			const frameHeight = this.getTabVisibleFrameHeight();
			if (frameHeight === null || !Type.isNumber(contentHeight))
			{
				return;
			}

			// Enable the tall slider (and scroll-collapse) only when the content is tall enough to
			// actually reach the collapse: it must exceed the visible frame by at least the header
			// height, otherwise y can never pass collapseThreshold and the header never collapses -
			// a "dead zone" where the tall slider is reserved but useless, and where a list sitting
			// right at the plain threshold flips overflow true/false on every scroll frame (iOS
			// reports slightly different contentSize), churning setState and drifting the layout.
			const collapseReachableThreshold = frameHeight + (this.topContainerCalculatedHeight ?? 0);
			const overflows = contentHeight > collapseReachableThreshold;
			this.tabOverflowMap[tabIndex] = overflows;

			// Measurements from non-selected tabs are remembered but do not change the current
			// slider height - only the selected tab drives it.
			if (tabIndex !== this.getSelectedTabIndex())
			{
				return;
			}

			this.applySelectedTabOverflow(overflows);
		}

		/**
		 * @desc Applies the given overflow flag as the selected tab's current one and re-applies
		 * the slider height when it changed. Overflow only affects the height on iOS (Android
		 * keeps the header shown for a long list).
		 * @protected
		 * @param {boolean} overflows
		 * @return {void}
		 */
		applySelectedTabOverflow(overflows)
		{
			if (overflows === this.selectedTabOverflows)
			{
				return;
			}

			this.selectedTabOverflows = overflows;

			if (isIos)
			{
				this.setState({});
			}
		}

		/**
		 * @desc Re-applies the overflow of the now-selected tab from its remembered measurement
		 * (default: not overflowing = flat slider). Called on tab change so the slider height
		 * follows the target tab instead of the previously selected one.
		 * @protected
		 * @return {void}
		 */
		syncOverflowWithSelectedTab()
		{
			const overflows = this.tabOverflowMap[this.getSelectedTabIndex()] ?? false;
			this.applySelectedTabOverflow(overflows);
		}

		/**
		 * @desc Search-focus collapse (both platforms). Marks the header as collapsed by search
		 * (which keeps the slider tall and suppresses the scroll-to-top auto-expand), then
		 * collapses with a guaranteed tall slider.
		 * @protected
		 * @return {void}
		 */
		onRequestCollapseHeader()
		{
			this.headerCollapsedBySearch = true;
			this.collapseHeaderWithTallSlider();
		}

		/**
		 * @desc Collapses the header ensuring the below-screen strip exists first. The collapse
		 * animation shifts the slider up by the header height, so a flat slider (short
		 * non-overflowing list) would clip its bottom. The decision uses sliderRenderedTall - what
		 * is ACTUALLY on screen - not shouldUseTallSlider(), because callers mutate its flags ahead
		 * of the render (headerCollapsedBySearch / selectedTabOverflows), which would falsely report
		 * the slider as already tall and collapse against a still-flat one. If the slider is
		 * rendered flat, grow it via a forced flag and animate only after the re-render applies the
		 * new height; otherwise collapse right away. The force flag is cleared once the collapse
		 * settles, by which point topContainerCollapsed keeps the slider tall on its own.
		 * @protected
		 * @return {void}
		 */
		collapseHeaderWithTallSlider()
		{
			if (this.sliderRenderedTall)
			{
				this.collapseTopContainer();

				return;
			}

			this.forceTallSlider = true;
			this.setState({}, () => this.collapseTopContainer());
		}

		/**
		 * @desc Search-blur expand (both platforms). Animate the expand first; the flat slider
		 * is only restored after the animation completes and only when the selected tab does not
		 * overflow - otherwise the tall slider must stay for the scroll-driven collapse (iOS).
		 * @protected
		 * @return {void}
		 */
		onRequestExpandHeader()
		{
			this.headerCollapsedBySearch = false;
			this.expandTopContainer();
		}

		getIosScrollHandlers(tabIndex)
		{
			return {
				onScroll: ({ contentOffset, contentSize }) => {
					this.measureOverflowFromScroll(tabIndex, contentSize);

					const { y } = contentOffset;
					// Hysteresis against "flapping": collapse only when the list is
					// scrolled down past the header height, expand - only at the
					// very top. A dead zone lies between the thresholds: without it the collapse
					// animation shifts the list, the sign of y jitters around zero and the header
					// bounces back and forth endlessly throughout the whole scroll.
					const collapseThreshold = this.topContainerCalculatedHeight ?? 0;

					// Only collapse on scroll when the tab actually overflows. With a flat slider
					// (short list) there is no reserved strip to reveal, so collapsing would just
					// shift the header off screen with nothing gained.
					if (this.selectedTabOverflows && y > collapseThreshold)
					{
						this.collapseTopContainer();
					}
					else if (y <= 0 && !this.headerCollapsedBySearch)
					{
						// In search mode we do not expand the header: a list shift to the top on
						// keyboard appearance or filter re-render must not bring the header
						// back - the user is already looking at the list and has started searching.
						this.expandTopContainer();
					}
				},
			};
		}

		getAndroidScrollHandlers(tabIndex)
		{
			return {
				onScroll: ({ contentSize }) => {
					// Android has no scroll-driven collapse; the only reason to observe scroll
					// here is to measure content overflow (which on Android does not change the
					// slider height, but keeps selectedTabOverflows consistent across platforms).
					this.measureOverflowFromScroll(tabIndex, contentSize);
				},
			};
		}

		/**
		 * @desc Extracts the content height from an onScroll payload and forwards it to the
		 * overflow measurement. onScroll delivers contentSize as { width, height } (see
		 * onScrollType), and is the reliable measurement channel confirmed in the codebase.
		 * @protected
		 * @param {number} tabIndex
		 * @param {{ width: number, height: number }} [contentSize]
		 * @return {void}
		 */
		measureOverflowFromScroll(tabIndex, contentSize)
		{
			if (contentSize && Type.isNumber(contentSize.height))
			{
				this.handleTabContentMeasured(tabIndex, contentSize.height);
			}
		}
	}

	module.exports = { SidebarBaseView };
});
