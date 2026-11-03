/**
 * @module more-menu/block/company/bitrix-answers/screen/src/screen
 */
jn.define('more-menu/block/company/bitrix-answers/screen/src/screen', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { PureComponent } = require('layout/pure-component');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');
	const { createTestIdGenerator } = require('utils/test');
	const { openSupport, requestSupport } = require('more-menu/block/company/support');
	const { AnswersScreenEvent } = require('more-menu/block/company/bitrix-answers/screen/src/const');
	const { parseIncoming } = require('more-menu/block/company/bitrix-answers/screen/src/bridge');
	const { BitrixAnswersNavState } = require('more-menu/block/company/bitrix-answers/screen/src/nav-state');

	const TEST_ID_PREFIX = 'bitrix-answers-screen';
	const SEARCH_BUTTON_ID = 'bitrix_answers_search';
	// A request per letter would spend the answer to the previous one: the text travels once typing stops.
	const SEARCH_CHANGE_DELAY = 300;
	// The page reports itself ready a moment before it has actually drawn, and a placeholder lifted on the
	// report alone shows that seam as a blink. The pause covers it: the page gets the frames it still needs.
	const PAGE_READY_DELAY = 500;
	const PAGE_LOAD_POINT = 'Page Load';
	const LOADER_SPINNER_SIZE = 32;

	// What these reports of the page move is the navigation bar and nothing else, so a screen that does
	// not own the bar has nowhere to put them.
	const NAVIGATION_BAR_EVENTS = new Set([
		AnswersScreenEvent.TITLE_SET,
		AnswersScreenEvent.TITLE_RESET,
		AnswersScreenEvent.SEARCH_SHOW,
		AnswersScreenEvent.SEARCH_HIDE,
		AnswersScreenEvent.SEARCH_COLLAPSE,
		AnswersScreenEvent.NAV_STATE,
	]);

	/**
	 * @extends {PureComponent<BitrixAnswersScreenProps, BitrixAnswersScreenState>}
	 */
	class BitrixAnswersScreen extends PureComponent
	{
		/**
		 * @param {BitrixAnswersScreenProps} props
		 */
		constructor(props)
		{
			super(props);

			// The page has not shown itself yet, and until it does the placeholder stands in for it.
			this.state = { pageReady: false };

			this.webViewRef = null;
			this.searchBound = false;
			this.searchChangeTimer = null;
			this.pageReadyTimer = null;
			/** @type {?PerfPoint} */
			this.pageLoadPoint = null;
			this.navState = new BitrixAnswersNavState({ title: props.title });
			this.getTestId = createTestIdGenerator({ prefix: TEST_ID_PREFIX });
		}

		componentDidMount()
		{
			// The wait the placeholder stands over, measured as the user sees it: from the screen going up
			// with the page already on its way to the view under it, to the placeholder lifted.
			this.pageLoadPoint = new PerfPoint('Bitrix Answers Page Load', 'screen').start();
			this.pageLoadPoint.startPoint(PAGE_LOAD_POINT);

			this.updateNavigationBar();

			// The vertical gesture of a modal widget arrives as `swipeDown`: on iOS the native side
			// reports it and leaves the way out of the screen to us. Android may act on it itself with
			// `swipeToClose` on, so the two platforms can diverge here. A screen that does not own the
			// bar is not in a modal widget at all, so there is nothing to subscribe to.
			if (this.#ownsNavigationBar())
			{
				this.getWidget()?.on?.('swipeDown', this.handleSwipeDown);
				// The system back of Android - the button of the navigation panel and the gesture from the
				// left edge - reaches the app only while a handler is set. Without one a `LayoutPage` hands
				// the event to the system (`Page.backHandlingState`), and the system removes the whole
				// section without asking the screen anything.
				this.getWidget()?.setBackButtonHandler?.(this.handleBackButton);
			}
		}

		componentWillUnmount()
		{
			this.getWidget()?.off?.('swipeDown', this.handleSwipeDown);
			if (this.#ownsNavigationBar())
			{
				// the native side keeps the js function of the handler until it is handed a `null`
				this.getWidget()?.setBackButtonHandler?.(null);
			}
			this.cancelSearchChange();
			this.cancelPageReady();
			// A screen closed before the page ever reported itself would leave the measurement open for the
			// rest of the session, and a wait that ended in nothing has to be told from one that ended in content.
			this.endPageLoadPoint({ status: 'unmounted' });
			this.unbindSearch();
		}

		getWidget()
		{
			return this.props.layout ?? null;
		}

		/**
		 * The bar above the screen is the screen's own only while a modal widget draws it. A native
		 * container draws its own title, chevron and cross over anything put there and leaves JS no way
		 * to take them off, so there the screen neither draws the bar nor keeps a state for it.
		 *
		 * @return {boolean}
		 */
		#ownsNavigationBar()
		{
			return this.props.ownsNavigationBar !== false;
		}

		updateNavigationBar()
		{
			if (!this.#ownsNavigationBar())
			{
				return;
			}

			// The bar belongs to the screen, but the widget drawing it is native and its types lag behind
			// it, so the bar is built through optional calls. It is rebuilt whole: title, left button and
			// right buttons come from one state and cannot disagree with each other.
			const widget = this.getWidget();

			widget?.setTitle?.({
				text: this.navState.getTitle(),
				type: 'section',
			}, true);
			widget?.setLeftButtons?.([this.buildLeftButton()]);
			widget?.setRightButtons?.(this.buildRightButtons());
		}

		// One value from the page rules three things at once: the icon of the left button, what that
		// button does and what the vertical gesture does. All three answer the same question - is there
		// content behind this view to step back to - and answering it in three places would let them
		// disagree. Until the page says otherwise the answer is no: a page that stays silent must not
		// take the way out of the screen away from the user.
		buildLeftButton()
		{
			if (this.navState.canGoBack())
			{
				return {
					type: 'back',
					testId: this.getTestId('left-button-back'),
					callback: this.handleLeftButtonClick,
				};
			}

			return {
				type: Icon.CHEVRON_DOWN.getIconName(),
				color: Color.base4.toHex(),
				testId: this.getTestId('left-button-close'),
				callback: this.handleLeftButtonClick,
			};
		}

		buildRightButtons()
		{
			if (!this.navState.shouldShowSearchButton())
			{
				return [];
			}

			return [
				{
					id: SEARCH_BUTTON_ID,
					type: 'search',
					// A folded line keeps its request, and the accent is how the search bar of the core marks one.
					accent: this.navState.hasSearchValue(),
					testId: this.getTestId('search-button'),
					callback: this.handleSearchClick,
				},
			];
		}

		getSearchObject(asBar = false)
		{
			if (!this.#ownsNavigationBar())
			{
				return null;
			}

			const search = this.getWidget()?.search ?? null;
			if (search && asBar)
			{
				// a modal widget opens its search as an overlay, and the screen needs the line inside the
				// navigation bar, so the mode is asked for explicitly
				search.mode = 'bar';
			}

			return search;
		}

		bindSearch()
		{
			const search = this.getSearchObject(true);
			if (!search || this.searchBound)
			{
				return search;
			}

			search.on?.('textChanged', this.handleSearchTextChanged);
			search.on?.('clickEnter', this.handleSearchApply);
			search.on?.('cancel', this.handleSearchCancel);
			this.searchBound = true;

			return search;
		}

		unbindSearch()
		{
			if (!this.searchBound)
			{
				return;
			}

			// The line subscribes through `on` and unsubscribes through `removeEventListener`: the API is
			// asymmetric, and `layout/ui/stateful-list` is the shipped proof of both halves. An `off` here
			// would be skipped by the optional call and leave the handlers on a line reported as unbound.
			const search = this.getSearchObject();
			search?.removeEventListener?.('textChanged', this.handleSearchTextChanged);
			search?.removeEventListener?.('clickEnter', this.handleSearchApply);
			search?.removeEventListener?.('cancel', this.handleSearchCancel);
			this.searchBound = false;
		}

		scheduleSearchChange(text)
		{
			this.cancelSearchChange();
			this.searchChangeTimer = setTimeout(() => {
				this.searchChangeTimer = null;
				this.sendWebViewEvent(AnswersScreenEvent.SEARCH_CHANGE, { text });
			}, SEARCH_CHANGE_DELAY);
		}

		// A text of a line that is already closed is a request nobody made.
		cancelSearchChange()
		{
			if (this.searchChangeTimer === null)
			{
				return;
			}

			clearTimeout(this.searchChangeTimer);
			this.searchChangeTimer = null;
		}

		/**
		 * The subscriptions go before the close: the native line is free to answer a close with a `cancel` of
		 * its own, and a screen still subscribed would pass it on as a cancellation nobody asked for.
		 * The page sends `collapse` on every touch of its content and cannot know whether the line is open,
		 * so the bar stays with the caller: a fold that did not happen must not cost three native calls.
		 *
		 * @return {boolean} whether an open line was really folded
		 */
		collapseSearchLine()
		{
			this.cancelSearchChange();

			if (!this.searchBound)
			{
				return false;
			}

			this.unbindSearch();
			this.getSearchObject()?.close?.();
			Keyboard.dismiss();

			return true;
		}

		/**
		 * @return {boolean} whether the event really reached the page
		 */
		sendWebViewEvent(eventType, data = {})
		{
			if (!this.webViewRef || !Type.isFunction(this.webViewRef.sendEvent))
			{
				return false;
			}

			this.webViewRef.sendEvent(eventType, Type.isPlainObject(data) ? data : {});

			return true;
		}

		/**
		 * @param {{ name: string, payload: object }} command as the bridge parsed it
		 */
		routeCommand({ name, payload })
		{
			// Before the state and not after it: a state kept for a bar nobody draws would answer the
			// page with a title and a search the user never saw.
			if (NAVIGATION_BAR_EVENTS.has(name) && !this.#ownsNavigationBar())
			{
				return;
			}

			switch (name)
			{
				case AnswersScreenEvent.PAGE_READY:
					// Only the placeholder waits out the pause; the bar is rebuilt on the report itself.
					// The pause is always the same length, so it is written down beside the loading instead
					// of being measured into it.
					this.pageLoadPoint?.endPoint(PAGE_LOAD_POINT, { delay: PAGE_READY_DELAY });
					this.schedulePageReady();
					this.updateNavigationBar();
					break;

				case AnswersScreenEvent.TITLE_SET:
					this.navState.update({ title: payload.text });
					this.updateNavigationBar();
					break;

				case AnswersScreenEvent.TITLE_RESET:
					this.navState.update({ title: '' });
					this.updateNavigationBar();
					break;

				case AnswersScreenEvent.SEARCH_SHOW:
					this.navState.update({ searchVisible: true, searchValue: payload.value });
					this.updateNavigationBar();
					break;

				case AnswersScreenEvent.SEARCH_HIDE:
					// the flag drops first, so the rebuilt bar loses the magnifier and the open line goes with it
					this.navState.update({ searchVisible: false });
					this.collapseSearchLine();
					this.updateNavigationBar();
					break;

				case AnswersScreenEvent.SEARCH_COLLAPSE:
					// the page took a touch in its content: the line and the keyboard go, the magnifier stays
					// with the accent of what was typed into the line that has just folded
					if (this.collapseSearchLine())
					{
						this.updateNavigationBar();
					}
					break;

				case AnswersScreenEvent.NAV_STATE:
					this.navState.update({ canGoBack: payload.canGoBack });
					this.updateNavigationBar();
					break;

				case AnswersScreenEvent.SUPPORT_OPEN:
					this.openSupport();
					break;

				case AnswersScreenEvent.CHAT_OPEN:
					// Taken and left without an action on purpose: the chat of the page is opened by the
					// messenger, and the screen owes it nothing of its own here.
					break;

				default:
					break;
			}
		}

		/**
		 * The pause runs from the FIRST report and is never restarted: the page is free to report itself
		 * ready again while walking the sections of the knowledge base, and a placeholder that came back
		 * over a section the user is already reading would be a loading that is not happening. The handle
		 * of the timer is what says the pause is already running, so there is nothing else to keep in step
		 * with it.
		 */
		schedulePageReady()
		{
			if (this.state.pageReady || this.pageReadyTimer !== null)
			{
				return;
			}

			this.pageReadyTimer = setTimeout(() => {
				this.pageReadyTimer = null;
				this.setState({ pageReady: true }, () => this.endPageLoadPoint());
			}, PAGE_READY_DELAY);
		}

		// A screen that is already gone must not be written into when the pause runs out.
		cancelPageReady()
		{
			if (this.pageReadyTimer === null)
			{
				return;
			}

			clearTimeout(this.pageReadyTimer);
			this.pageReadyTimer = null;
		}

		/**
		 * The wait is over: the placeholder is gone and the page stands in its place, or the screen was
		 * closed before the page ever showed itself. Closed once and never reopened - a report that comes
		 * later belongs to a section the user is already reading and not to the opening.
		 *
		 * @param {{ status?: string }} [extra] what ended the wait when no page reported itself
		 */
		endPageLoadPoint(extra = {})
		{
			this.pageLoadPoint?.endPoint(PAGE_LOAD_POINT, extra);
			this.pageLoadPoint?.end();
			this.pageLoadPoint = null;
		}

		// The page asks for support and says nothing else: the destination is the one the server sent to
		// the card. A screen that owns its bar opens support itself, by the very same call the card makes.
		openSupport()
		{
			const { canUseSupport, helpdeskUrl, supportBotId, analyticsSection } = this.props;
			const options = { canUseSupport, helpdeskUrl, supportBotId, analyticsSection };

			if (this.#ownsNavigationBar())
			{
				openSupport(options);

				return;
			}

			// Inside the container the screen has no stack to open a chat in, and one opened there is a
			// dead end. The panel goes down first and stays alive as a collapsed strip, and the request
			// travels to whoever owns a stack to open the chat over the screen the user came back to.
			if (typeof PersistentScreen !== 'undefined')
			{
				// eslint-disable-next-line no-undef
				PersistentScreen.minimize();
			}

			requestSupport(options);
		}

		render()
		{
			return View(
				{
					testId: this.getTestId(),
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				WebView({
					testId: this.getTestId('web-view'),
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
					data: {
						url: this.props.url,
					},
					ref: this.handleWebViewRef,
					onReceiveEvent: this.handleWebViewEvent,
				}),
				this.renderLoader(),
			);
		}

		/**
		 * The web view shows its own white ground until the document is drawn, and no colour given to it
		 * or to the wrapper changes that, so a layer put behind it would stay behind the white. The
		 * placeholder goes over the view as the last child of the wrapper, and the view stays mounted and
		 * goes on loading under it: the address is asked for from the first draw, not from the report of
		 * the page.
		 *
		 * @return {?object} nothing once the page has shown itself
		 */
		renderLoader()
		{
			if (this.state.pageReady)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('loader'),
					style: {
						position: 'absolute',
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				SpinnerLoader({
					testId: this.getTestId('loader-spinner'),
					size: LOADER_SPINNER_SIZE,
				}),
			);
		}

		handleWebViewRef = (ref) => {
			this.webViewRef = ref;
		};

		// Two halves of one bridge: the page reaches the app through the event, the app answers through
		// the ref. Reading an incoming event and routing it belong to the bridge of the screen.
		handleWebViewEvent = (event) => {
			const command = parseIncoming(event);
			if (!command)
			{
				return;
			}

			this.routeCommand(command);
		};

		// A step back nobody took is not a step back: a page the screen cannot reach leaves the section
		// with the very same way out it has at the root, and the system back is consumed either way.
		handleLeftButtonClick = () => {
			if (this.navState.canGoBack() && this.sendWebViewEvent(AnswersScreenEvent.NAVIGATION_BACK))
			{
				return;
			}

			this.getWidget()?.close?.();
		};

		handleSwipeDown = () => {
			if (this.navState.canGoBack())
			{
				return;
			}

			this.getWidget()?.close?.();
		};

		// The system back answers the very question the left button answers, so it is the same command.
		// Always `true`: the screen has just acted on the event itself, and a `false` would let the native
		// side act on it a second time.
		handleBackButton = () => {
			this.handleLeftButtonClick();

			return true;
		};

		handleSearchClick = () => {
			const search = this.bindSearch();
			if (!search)
			{
				return;
			}

			search.text = this.navState.getSearchValue();
			search.show?.();
		};

		handleSearchTextChanged = (params = {}) => {
			const text = Type.isString(params?.text) ? params.text : '';

			// The state takes the text at once: a line folded away mid-word must open with what was typed in.
			this.navState.update({ searchValue: text });
			this.scheduleSearchChange(text);
		};

		handleSearchApply = (params = {}) => {
			const text = Type.isString(params?.text) ? params.text : '';

			this.navState.update({ searchValue: text });
			this.sendWebViewEvent(AnswersScreenEvent.SEARCH_APPLY, { text });
			this.collapseSearchLine();
			this.updateNavigationBar();
		};

		handleSearchCancel = () => {
			this.cancelSearchChange();
			this.navState.update({ searchValue: '' });
			this.sendWebViewEvent(AnswersScreenEvent.SEARCH_CANCEL);
			// The line closes itself here, so the subscriptions go too: a `textChanged` after it is nobody's request.
			this.unbindSearch();
			this.updateNavigationBar();
		};
	}

	module.exports = { BitrixAnswersScreen };
});
