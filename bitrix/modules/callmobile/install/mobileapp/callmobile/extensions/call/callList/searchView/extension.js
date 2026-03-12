/**
 * @module call/callList/searchView
 */
jn.define('call/callList/searchView', (require, exports, module) => {
	const { OptimizedListView } = require('layout/ui/optimized-list-view');
	const { LoaderItem } = require('im/messenger/lib/ui/base/loader');
	const { CallListItem } = require('call/callList/item');
	const { SearchUserItem } = require('call/callList/searchUserItem');
	const { formatTime } = require('call/callList/utils');
	const { EmptyView } = require('call/callList/emptyView');
	const { Color } = require('tokens');
	const { CallLogType } = require('call/const');

	const IS_IOS_PLATFORM = Application.getPlatform() === 'ios';

	class CallListSearchViewComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = { items: null, loading: false };
		}

		setItems(items)
		{
			this.setState({ items });
		}

		setLoading(loading)
		{
			this.setState({ loading: Boolean(loading) });
		}

		render()
		{
			const { items, loading } = this.state;

			if (!items)
			{
				return loading
					? View({
						style: {
							flex: 1,
							alignItems: 'center',
							justifyContent: 'center',
						},
					}, new LoaderItem({ enable: true, text: '' }))
					: null;
			}

			if (items.length === 0 && !loading)
			{
				return EmptyView({
					text: {
						title: BX.message('MOBILEAPP_CALL_LIST_EMPTY_NOT_FOUND'),
					},
				});
			}

			const data = [{
				items: items.map((item) => ({
					id: String(item.id),
					key: String(item.id),
					type: 'callListItem',
					item,
				})),
			}];

			return View(
				{
					style: {
						flex: 1,
					},
				},
				OptimizedListView({
					style: { flex: 1 },
					data,
					renderItem: (row) => this.renderRow(row.item),
				}),
				IS_IOS_PLATFORM && View(
					{
						style: {
							height: 250,
						},
					},
				),
				(loading
					? View({
						style: {
							position: 'absolute',
							left: 0,
							right: 0,
							top: 0,
							bottom: 0,
							alignItems: 'center',
							justifyContent: 'center',
						},
					}, new LoaderItem({ enable: true, text: '' }))
					: null
				),
			);
		}

		renderRow(item)
		{
			if (item && item.sourceType === 'user')
			{
				return SearchUserItem({
					item: {
						...item,
						workPosition: item.workPosition || item.position || item.work_position || '',
						userColor: item.userColor || item.color || undefined,
					},
					onClick: () => this.props.onItemClick?.(item),
				});
			}

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
				onClick: () => this.props.onItemClick?.(item),
			});
		}
	}

	function CallListSearchView(props)
	{
		return new CallListSearchViewComponent(props);
	}

	module.exports = { CallListSearchView };
});
