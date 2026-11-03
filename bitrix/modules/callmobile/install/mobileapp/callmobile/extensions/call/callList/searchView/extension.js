/**
 * @module call/callList/searchView
 */
jn.define('call/callList/searchView', (require, exports, module) => {
	const { OptimizedListView } = require('layout/ui/optimized-list-view');
	const { Text2 } = require('ui-system/typography/text');
	const { CallListItem } = require('call/callList/item');
	const { SearchUserItem } = require('call/callList/searchUserItem');
	const { formatTime } = require('call/callList/utils');
	const { EmptyView } = require('call/callList/emptyView');
	const { Color, Indent } = require('tokens');
	const { CallLogType } = require('call/const');

	function SearchLoader()
	{
		return View(
			{
				testId: 'call-list-search-loader',
				style: {
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
				},
			},
			Loader({
				style: { height: 24 },
				tintColor: Color.base3.toHex(),
				animating: true,
				size: 'small',
			}),
			Text2({
				text: BX.message('MOBILEAPP_CALL_LIST_SEARCH_LOADING'),
				color: Color.base3,
				style: {
					marginLeft: Indent.XS.toNumber(),
				},
			}),
		);
	}

	const IS_IOS_PLATFORM = Application.getPlatform() === 'ios';

	const NOT_FOUND_PADDING_TOP = IS_IOS_PLATFORM ? '30%' : 108;

	function SearchLoaderCentered()
	{
		return View(
			{
				style: {
					flex: 1,
					alignItems: 'center',
					justifyContent: 'flex-start',
					paddingTop: NOT_FOUND_PADDING_TOP,
				},
			},
			SearchLoader(),
		);
	}

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
			const nextLoading = Boolean(loading);
			if (this.state.loading === nextLoading)
			{
				return;
			}

			this.setState({ loading: nextLoading });
		}

		render()
		{
			const { items, loading } = this.state;

			if (!items)
			{
				return loading ? SearchLoaderCentered() : null;
			}

			if (items.length === 0)
			{
				return loading
					? SearchLoaderCentered()
					: EmptyView({
						testId: 'call-list-search-empty-state',
						text: {
							title: BX.message('MOBILEAPP_CALL_LIST_EMPTY_NOT_FOUND'),
						},
					});
			}

			const rows = items.map((item) => ({
				id: String(item.id),
				key: String(item.id),
				type: 'callListItem',
				item,
			}));

			if (loading)
			{
				rows.push({
					id: '__search_loading__',
					key: '__search_loading__',
					type: 'searchLoader',
				});
			}

			const data = [{ items: rows }];

			return View(
				{
					style: {
						flex: 1,
					},
				},
				OptimizedListView({
					style: { flex: 1 },
					data,
					renderItem: (row) => (row.type === 'searchLoader'
						? View({ style: { paddingTop: 10, paddingBottom: 10 } }, SearchLoader())
						: this.renderRow(row.item)),
				}),
				IS_IOS_PLATFORM && View(
					{
						style: {
							height: 250,
						},
					},
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
