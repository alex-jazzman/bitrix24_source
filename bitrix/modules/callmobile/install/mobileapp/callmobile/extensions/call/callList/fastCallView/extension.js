/**
 * @module call/callList/fastCallView
 */
jn.define('call/callList/fastCallView', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BottomSheet } = require('bottom-sheet');
	const { LoaderItem } = require('im/messenger/lib/ui/base/loader');
	const { RecentItem } = require('call/callList/recentItem');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { OptimizedListView } = require('layout/ui/optimized-list-view');
	const { openCreateConferenceView } = require('call/callList/createConferenceView');
	const { withPressed } = require('utils/color');
	const { restCall } = require('call/callList/utils');

	const RECENT_PAGE_SIZE = 20;
	const SMALL_BACKDROP_HEIGHT_PERCENT = 20;
	const MEDIUM_BACKDROP_HEIGHT_PERCENT = 85;
	class FastCallViewComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.layoutWidget = null;

			this.state = {
				isLoading: true,
				allItems: [],
				items: [],
				hasMore: false,
			};
		}

		componentDidMount()
		{
			this.loadRecentUsers();
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

				const initialItems = mapped.slice(0, RECENT_PAGE_SIZE);
				const hasMore = mapped.length > initialItems.length;

				this.setState({
					isLoading: false,
					allItems: mapped,
					items: initialItems,
					hasMore,
				}, () => {
					this.resizeBottomSheet();
				});
			}
			catch (error)
			{
				console.error('[CallList][FastCallView][getRecentUserListToCall][error]', error);

				this.setState({
					isLoading: false,
					allItems: [],
					items: [],
					hasMore: false,
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

		loadMore()
		{
			this.setState((prev) => {
				if (!prev.hasMore)
				{
					return prev;
				}

				const nextLength = prev.items.length + RECENT_PAGE_SIZE;
				const items = prev.allItems.slice(0, nextLength);
				const hasMore = prev.allItems.length > items.length;

				return { ...prev, items, hasMore };
			});
		}

		async onUserClick(item)
		{
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
				this.props.layout.close(() => {
					BX.postComponentEvent('onCallInvite', [eventData], 'calls');
				});
			}
			else
			{
				BX.postComponentEvent('onCallInvite', [eventData], 'calls');
			}
		}

		async onConferenceClick()
		{
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

		renderHeader()
		{
			return View(
				{
					style: {
						paddingHorizontal: 16,
						paddingTop: 16,
						paddingBottom: 16,
					},
				},
				Text({
					text: BX.message('MOBILEAPP_CALL_LIST_CREATE_MENU_TITLE'),
					style: {
						fontSize: 20,
						fontWeight: '600',
						color: Color.base1.toHex(),
					},
				}),
			);
		}

		renderConferenceSection()
		{
			return View(
				{
					style: {
						paddingHorizontal: 16,
						backgroundColor: withPressed(Color.bgContentPrimary.toHex()),
					},
				},
				View(
					{
						style: {
							borderRadius: 16,
							paddingVertical: 14,
							flexDirection: 'row',
							alignItems: 'center',
						},
						onClick: () => this.onConferenceClick(),
					},
					View(
						{
							style: {
								width: 40,
								height: 40,
								marginRight: 12,
								borderRadius: 8,
								borderWidth: 1,
								borderColor: Color.baseWhiteFixed.toHex(0.18),
								backgroundColor: Color.accentMainPrimary.toHex(0.78),
								alignItems: 'center',
								justifyContent: 'center',
							},
						},
						IconView({
							icon: Icon.SOLID_RECORD_VIDEO,
							color: Color.baseWhiteFixed,
							size: 24,
						}),
					),
					View(
						{ style: { flex: 1 } },
						Text({
							text: BX.message('MOBILEAPP_CALL_LIST_CREATE_MENU_CONFERENCE_TITLE'),
							style: {
								fontSize: 16,
								fontWeight: '600',
								color: Color.base1.toHex(),
								marginBottom: 2,
							},
						}),
						Text({
							text: BX.message('MOBILEAPP_CALL_LIST_CREATE_MENU_CONFERENCE_SUBTITLE'),
							style: {
								fontSize: 14,
								color: Color.base4.toHex(),
							},
						}),
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
						paddingHorizontal: 16,
						marginTop: 20,
						paddingBottom: 8,
					},
				},
				Text({
					text: BX.message('MOBILEAPP_CALL_LIST_CREATE_MENU_RECENT_TITLE'),
					style: {
						fontSize: 15,
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
				onLoadMore: this.state.hasMore ? () => this.loadMore() : null,
				renderLoadMore: () => {
					if (!this.state.hasMore)
					{
						return null;
					}

					return View(
						{
							style: {
								alignItems: 'center',
								justifyContent: 'center',
								width: '100%',
								paddingVertical: 16,
							},
						},
						new LoaderItem({ enable: true, text: '' }),
					);
				},
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
						},
					},
					this.renderHeader(),
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
			.hideNavigationBar()
			.setMediumPositionPercent(MEDIUM_BACKDROP_HEIGHT_PERCENT)
			.enableOnlyMediumPosition()
			.enableContentSwipe();

		bottomSheet.open()
			.then((widget) => {
				if (componentInstance)
				{
					componentInstance.layoutWidget = widget;
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
