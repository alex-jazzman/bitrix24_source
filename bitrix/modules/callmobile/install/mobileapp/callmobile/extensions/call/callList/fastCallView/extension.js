/**
 * @module call/callList/fastCallView
 */
jn.define('call/callList/fastCallView', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BottomSheet } = require('bottom-sheet');
	const { LoaderItem } = require('im/messenger/lib/ui/base/loader');
	const { RecentItem } = require('call/callList/recentItem');
	const { FastCallButton } = require('call/callList/fastCallButton');
	const { OptimizedListView } = require('layout/ui/optimized-list-view');
	const { openCreateConferenceView } = require('call/callList/createConferenceView');
	const { openCreateGroupCallView } = require('call/callList/createGroupCallView');
	const { restCall } = require('call/callList/utils');
	const { RecentSearchController } = require('call/callList/recentSearchController');
	const { CallListAnalyticsController } = require('call/callList/analyticsController');

	const isAndroid = Application.getPlatform() === 'android';

	const Icons = {
		dialer: `
			<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M8.56201 16.9976C9.46397 16.9977 10.1957 17.7285 10.1958 18.6304V20.772C10.1958 21.6741 9.46405 22.4058 8.56201 22.4058H6.42041C5.51845 22.4057 4.7876 21.674 4.7876 20.772V18.6304C4.78772 17.7285 5.51853 16.9977 6.42041 16.9976H8.56201ZM15.6304 16.9976C16.5323 16.9977 17.264 17.7285 17.2642 18.6304V20.772C17.2642 21.6741 16.5324 22.4058 15.6304 22.4058H13.4888C12.5868 22.4057 11.856 21.674 11.856 20.772V18.6304C11.8561 17.7285 12.5869 16.9977 13.4888 16.9976H15.6304ZM6.42041 18.397C6.29172 18.3972 6.18616 18.5017 6.18604 18.6304V20.772C6.18604 20.9008 6.29165 21.0053 6.42041 21.0054H8.56201C8.69085 21.0054 8.79541 20.9009 8.79541 20.772V18.6304C8.79529 18.5017 8.69077 18.3971 8.56201 18.397H6.42041ZM13.4888 18.397C13.3601 18.3972 13.2545 18.5017 13.2544 18.6304V20.772C13.2544 20.9008 13.36 21.0053 13.4888 21.0054H15.6304C15.7592 21.0054 15.8638 20.9009 15.8638 20.772V18.6304C15.8636 18.5017 15.7591 18.3971 15.6304 18.397H13.4888ZM8.56201 9.93414C9.46383 9.93418 10.1955 10.6642 10.1958 11.566V13.7086C10.1957 14.6105 9.46397 15.3423 8.56201 15.3423H6.42041C5.51853 15.3422 4.78773 14.6104 4.7876 13.7086V11.566C4.78795 10.6643 5.51866 9.93427 6.42041 9.93414H8.56201ZM20.6323 5.11481C21.1984 5.11488 21.6996 5.27959 22.1157 5.59723C22.5225 5.90793 22.8104 6.33513 23.0142 6.80133C23.4147 7.71841 23.5454 8.91765 23.5454 10.1422C23.5454 11.3677 23.4128 12.5661 23.0112 13.483C22.807 13.9491 22.519 14.3755 22.1128 14.6861C21.6974 15.0036 21.1973 15.1704 20.6323 15.1705C20.0671 15.1705 19.5664 15.0037 19.1509 14.6861C18.7448 14.3756 18.4576 13.949 18.2534 13.483C17.8518 12.5661 17.7183 11.3677 17.7183 10.1422C17.7183 8.91765 17.849 7.71841 18.2495 6.80133C18.4533 6.33506 18.7421 5.90796 19.1489 5.59723C19.565 5.2797 20.0662 5.11481 20.6323 5.11481ZM14.5171 5.25348C14.729 5.09486 15.0127 5.06894 15.2495 5.18707C15.4867 5.30565 15.6372 5.54889 15.6372 5.81403V14.1588C15.637 14.5452 15.3225 14.858 14.936 14.858C14.5499 14.8575 14.237 14.5449 14.2368 14.1588V7.21442L12.5757 8.46051C12.2666 8.69234 11.8273 8.62975 11.5952 8.32086C11.3633 8.01159 11.4256 7.57138 11.7349 7.33942L14.5171 5.25348ZM6.42041 11.3326C6.29186 11.3327 6.18638 11.4375 6.18604 11.566V13.7086C6.18616 13.8372 6.29173 13.9418 6.42041 13.942H8.56201C8.69077 13.9419 8.79528 13.8373 8.79541 13.7086V11.566C8.79506 11.4374 8.69063 11.3326 8.56201 11.3326H6.42041ZM20.6323 6.51324C20.3538 6.51324 20.1548 6.59049 19.9976 6.71051C19.8312 6.83768 19.6709 7.04561 19.5327 7.36188C19.2493 8.01107 19.1177 8.97703 19.1177 10.1422C19.1177 11.3063 19.2503 12.2721 19.5347 12.9214C19.6734 13.2381 19.834 13.4464 20.0005 13.5738C20.1578 13.6941 20.3562 13.7701 20.6323 13.7701C20.9082 13.77 21.106 13.694 21.2632 13.5738C21.4297 13.4464 21.5902 13.2382 21.729 12.9214C22.0134 12.2721 22.146 11.3063 22.146 10.1422C22.146 8.97703 22.0144 8.01107 21.731 7.36188C21.5927 7.04565 21.4324 6.83767 21.2661 6.71051C21.109 6.5906 20.9106 6.51332 20.6323 6.51324Z" fill="#A7A7A7"/>
			</svg>
		`,
	};

	const SMALL_BACKDROP_HEIGHT_PERCENT = 20;
	const MEDIUM_BACKDROP_HEIGHT_PERCENT = 85;
	class FastCallViewComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.layoutWidget = null;
			this.searchController = new RecentSearchController(this);

			this.state = {
				isLoading: true,
				items: [],
			};
		}

		componentDidMount()
		{
			this.loadRecentUsers();
		}

		componentWillUnmount()
		{
			if (this.searchController)
			{
				this.searchController.cleanup();
			}
		}

		resizeBottomSheet()
		{
			if (!this.layoutWidget || !this.layoutWidget.setBottomSheetHeight)
			{
				return;
			}

			const hasItems = this.state.items.length > 0;
			const percent = hasItems ? MEDIUM_BACKDROP_HEIGHT_PERCENT : SMALL_BACKDROP_HEIGHT_PERCENT;
			const screenHeight = device.screen.height;
			const height = Math.floor((screenHeight * percent) / 100);

			this.layoutWidget.setBottomSheetHeight(height);
		}

		async loadRecentUsers()
		{
			try
			{
				const { getRecentUserListToCall } = await requireLazy('im:messenger/api/recent-list', false);
				const userList = await getRecentUserListToCall();
				const mapped = this.mapUsers(userList);

				this.setState({
					isLoading: false,
					items: mapped,
				}, () => {
					this.resizeBottomSheet();
				});
			}
			catch (error)
			{
				console.error('[CallList][FastCallView][getRecentUserListToCall][error]', error);

				this.setState({
					isLoading: false,
					items: [],
				}, () => {
					this.resizeBottomSheet();
				});
			}
		}

		mapUsers(userList)
		{
			if (!Array.isArray(userList))
			{
				return [];
			}

			return userList.map((user) => {
				const id = String(user.userId || user.dialogId || '');

				return {
					id,
					key: id,
					title: String(user.userName || ''),
					workPosition: String(user.description || BX.message('MOBILEAPP_CALL_LIST_DEFAULT_POSITION')),
					avatar: String(user.avatarUrl || ''),
					userColor: String(user.color || ''),
					...user,
				};
			});
		}

		async onUserClick(item)
		{
			CallListAnalyticsController.sendClickRecentFromCreation(item);

			const userId = item.userId;

			if (!userId)
			{
				return;
			}

			let chatId = item.chatId;

			if (!chatId)
			{
				try
				{
					const result = await restCall('call.CallLog.getChat', {
						userId,
					});

					chatId = result.chatId;
				}
				catch (error)
				{
					console.error('[FastCallView][onUserClick] Failed to get chatId:', error);

					return;
				}
			}

			const eventData = {
				userId,
				video: false,
				chatData: {
					dialogId: item.dialogId,
					chatId,
					name: item.title,
					avatar: item.avatar,
				},
				userData: {
					[userId]: {
						id: userId,
						name: item.title,
						avatar: item.avatar,
					},
				},
			};

			if (this.props.layout)
			{
				this.props.layout.close(isAndroid ? undefined : () => {
					BX.postComponentEvent('onCallInvite', [eventData], 'calls');
				});
			}

			if (isAndroid || !this.props.layout)
			{
				BX.postComponentEvent('onCallInvite', [eventData], 'calls');
			}
		}

		async onConferenceClick()
		{
			CallListAnalyticsController.sendClickConference();

			const parentWidget = this.props.layout?.parentWidget || PageManager;

			if (this.props.layout)
			{
				this.props.layout.close(() => {
					openCreateConferenceView(parentWidget);
				});
			}
			else
			{
				openCreateConferenceView(parentWidget);
			}
		}

		onGroupCallClick()
		{
			if (this.props.layout)
			{
				openCreateGroupCallView(this.props.layout);
			}
			else
			{
				openCreateGroupCallView(PageManager);
			}
		}

		onDialerClick()
		{
			if (this.props.layout)
			{
				this.props.layout.close(() => {
					BX.postComponentEvent('onNumpadRequestShow', [], 'calls');
				});
			}
			else
			{
				BX.postComponentEvent('onNumpadRequestShow', [], 'calls');
			}
		}

		openSearch()
		{
			if (this.layoutWidget && this.searchController)
			{
				this.searchController.openSearch(this.layoutWidget);
			}
		}

		renderConferenceSection()
		{
			const pathToImg = '/bitrix/mobileapp/callmobile/extensions/call/callList/fastCallView/img/';
			const conferenceIcon = `${currentDomain}${pathToImg}conference.png`;
			const groupIcon = `${currentDomain}${pathToImg}group.png`;

			return View(
				{
					style: {
						backgroundColor: Color.bgContentPrimary.toHex(),
						marginBottom: 10,
					},
				},
				View(
					{
						style: {
							overflow: 'hidden',
							marginTop: 6,
						},
					},
					FastCallButton({
						icon: conferenceIcon,
						title: BX.message('MOBILEAPP_CALL_LIST_CREATE_MENU_CONFERENCE_TITLE'),
						subtitle: BX.message('MOBILEAPP_CALL_LIST_CREATE_MENU_CONFERENCE_SUBTITLE'),
						onClick: () => this.onConferenceClick(),
						style: {
							paddingHorizontal: 15,
							paddingVertical: 10,
						},
					}),
					View(
						{
							style: {
								height: 1,
								backgroundColor: Color.bgSeparatorPrimary.toHex(),
								marginLeft: 52,
							},
						},
					),
					FastCallButton({
						icon: groupIcon,
						title: BX.message('MOBILEAPP_CALL_LIST_CREATE_MENU_GROUP_CALL_TITLE'),
						subtitle: BX.message('MOBILEAPP_CALL_LIST_CREATE_MENU_GROUP_CALL_SUBTITLE'),
						onClick: () => this.onGroupCallClick(),
						style: {
							paddingVertical: 10,
							paddingHorizontal: 15,
						},
					}),
					View(
						{
							style: {
								height: 1,
								backgroundColor: Color.bgSeparatorPrimary.toHex(),
								marginLeft: 52,
							},
						},
					),
				),
			);
		}

		renderRecentTitle()
		{
			if (this.state.items.length === 0)
			{
				return null;
			}

			return View(
				{
					style: {
						paddingHorizontal: 15,
						marginTop: 20,
						marginBottom: 3,
						height: 36,
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Text({
					text: BX.message('MOBILEAPP_CALL_LIST_CREATE_MENU_RECENT_TITLE'),
					style: {
						fontSize: 15,
						lineHeight: 18,
						fontWeight: '400',
						color: Color.base4.toHex(),
					},
				}),
			);
		}

		renderRecentListContent()
		{
			const items = this.state.items || [];

			if (this.state.isLoading && items.length === 0)
			{
				return View(
					{
						style: {
							paddingTop: 16,
							paddingBottom: 24,
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					new LoaderItem({ enable: true, text: '' }),
				);
			}

			if (items.length === 0)
			{
				return null;
			}

			return OptimizedListView({
				style: {
					flex: 1,
					backgroundColor: Color.bgContentPrimary.toHex(),
				},
				data: [{ items }],
				renderItem: (item, index) => RecentItem({
					item,
					onClick: () => this.onUserClick(item),
					withSeparator: index < items.length - 1,
				}),
			});
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						backgroundColor: Color.bgSecondary.toHex(),
						flexDirection: 'column',
					},
				},
				View(
					{
						style: {
							flexDirection: 'column',
							marginTop: 8,
						},
					},
					this.renderConferenceSection(),
					this.renderRecentTitle(),
				),
				this.renderRecentListContent(),
			);
		}
	}

	function openFastCallView(parentWidget = PageManager)
	{
		let componentInstance = null;
		const component = (layout) => {
			componentInstance = new FastCallViewComponent({ layout });

			return componentInstance;
		};

		const bottomSheet = new BottomSheet({ component })
			.setParentWidget(parentWidget)
			.setBackgroundColor(Color.bgSecondary.toHex())
			.setTitleParams({
				text: BX.message('MOBILEAPP_CALL_LIST_CREATE_MENU_TITLE'),
				useLargeTitleMode: true,
			})
			.setMediumPositionPercent(MEDIUM_BACKDROP_HEIGHT_PERCENT)
			.enableOnlyMediumPosition()
			.enableContentSwipe();

		bottomSheet.open()
			.then((widget) => {
				if (componentInstance)
				{
					componentInstance.layoutWidget = widget;
				}

				if (widget && widget.setRightButtons)
				{
					widget.setRightButtons([
						{
							svg: {
								content: Icons.dialer,
							},
							callback: () => {
								if (componentInstance && componentInstance.onDialerClick)
								{
									componentInstance.onDialerClick();
								}
							},
						},
						{
							type: 'search',
							callback: () => {
								if (componentInstance && componentInstance.openSearch)
								{
									componentInstance.openSearch();
								}
							},
						},
					]);
				}
			})
			.catch((error) => {
				console.error('[FastCallView][openFastCallView] Error opening bottom sheet:', error);
			});
	}

	module.exports = {
		FastCallViewComponent,
		openFastCallView,
	};
});
