/**
 * @module call/callList/listView
 */
jn.define('call/callList/listView', (require, exports, module) => {
	const { OptimizedListView } = require('layout/ui/optimized-list-view');
	const { LoaderItem } = require('im/messenger/lib/ui/base/loader');
	const { CallListItem } = require('call/callList/item');
	const { formatTime } = require('call/callList/utils');
	const { Color } = require('tokens');
	const { CallLogType } = require('call/const');
	const { feature } = require('native/feature');

	const isAndroid = Application.getPlatform() === 'android';

	class ListViewComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = {
				isLongTapMenuOpened: false,
			};
		}

		render()
		{
			const items = Array.isArray(this.props.items) ? this.props.items : [];
			const data = [{ items: items.map((item) => ({ id: String(item.id), key: String(item.id), type: 'callListItem', item })) }];

			return OptimizedListView({
				testId: this.props.testId,
				style: this.props.style || { flex: 1 },
				data,
				renderItem: (row) => this.renderRow(row.item),
				onRefresh: this.props.onRefresh,
				isRefreshing: Boolean(this.props.isRefreshing),
				isScrollable: isAndroid ? !this.state.isLongTapMenuOpened : true,
				onLoadMore: (this.props.hasMore && typeof this.props.onLoadMore === 'function') ? this.props.onLoadMore : null,
				renderLoadMore: () => {
					if (!this.props.hasMore)
					{
						return null;
					}

					return View(
						{
							style: {
								alignItems: 'center',
								justifyContent: 'center',
								width: '100%',
							},
						},
						new LoaderItem({ enable: true, text: '' }),
					);
				},
				actionsForItem: (_section, index) => {
					const adjustedIndex = isAndroid ? index - 1 : index;

					if (isAndroid)
					{
						this.handleLongTapMenuOpen();
					}

					return this.generateActions(adjustedIndex);
				},
				onActionClick: (_section, index, key) => {
					const adjustedIndex = isAndroid ? index - 1 : index;

					if (isAndroid)
					{
						this.handleLongTapMenuClose();
					}

					this.onAction(adjustedIndex, key);
				},
				onScrollBeginDrag: () => {
					if (isAndroid)
					{
						this.handleLongTapMenuClose();
					}
				},
			});
		}

		handleLongTapMenuOpen()
		{
			if (!this.state.isLongTapMenuOpened)
			{
				this.setState({ isLongTapMenuOpened: true });
			}
		}

		handleLongTapMenuClose()
		{
			if (this.state.isLongTapMenuOpened)
			{
				this.setState({ isLongTapMenuOpened: false });
			}
		}

		renderRow(item)
		{
			const titleColor = (item.status === CallLogType.Status.MISSED)
				? Color.accentMainAlert.toHex()
				: Color.base1.toHex();
			const showMissedBadge = Boolean(item.isUnseen);
			const avatarBg = item.color || '';
			const timeLabel = (item.ts ? formatTime(item.ts) : (item.time || ''));

			return CallListItem({
				item,
				timeLabel,
				avatarBg,
				titleColor,
				showMissedBadge,
				onClick: () => {
					if (this.state.isLongTapMenuOpened)
					{
						return;
					}

					this.props.onItemClick?.(item);
				},
			});
		}

		generateActions(index)
		{
			const items = Array.isArray(this.props.items) ? this.props.items : [];
			const item = items[index];
			if (!item || item.isDeleting)
			{
				return { left: [], right: [] };
			}

			const isNewIconsEnabled = feature.isFeatureEnabled('listview_icons_v1');

			return {
				left: [],
				right: [
					{
						color: Color.accentMainAlert.toHex(),
						title: BX.message('MOBILEAPP_CALL_LIST_SWIPE_DELETE'),
						icon: isNewIconsEnabled ? 'trashcan' : 'action_delete',
						key: 'delete',
					},
					{
						color: Color.base4.toHex(),
						title: BX.message('MOBILEAPP_CALL_LIST_SWIPE_CHAT'),
						icon: isNewIconsEnabled ? 'chats' : 'action_unread',
						key: 'open_chat',
					},
				],
			};
		}

		onAction(index, key)
		{
			const items = Array.isArray(this.props.items) ? this.props.items : [];
			const item = items[index];

			if (!item)
			{
				return;
			}

			if (key === 'open_chat')
			{
				this.props.onOpenChat?.(item);

				return;
			}

			if (key === 'delete')
			{
				this.props.onDelete?.(item);
			}
		}
	}

	function ListView(props)
	{
		return new ListViewComponent(props);
	}

	module.exports = { ListView };
});
