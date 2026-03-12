/**
 * @module call/callList/tabs
 */
jn.define('call/callList/tabs', (require, exports, module) => {
	const { UIScrollView } = require('layout/ui/scroll-view');
	const { ChipInnerTab, BadgeCounterDesign } = require('ui-system/blocks/chips/chip-inner-tab');
	const { BadgeCounter, BadgeCounterSize } = require('ui-system/blocks/badges/counter');
	const { CallLogType } = require('call/const');

	class TabsComponent extends LayoutComponent
	{
		render()
		{
			const { selectedScopeId, missedTotal = 0, onChange } = this.props;
			const items = [
				{
					id: 'all',
					title: BX.message('MOBILEAPP_CALL_LIST_TAB_ALL'),
				},
				{
					id: CallLogType.Status.MISSED,
					title: BX.message('MOBILEAPP_CALL_LIST_TAB_MISSED'),
					count: Number(missedTotal) || 0,
					design: BadgeCounterDesign.ALERT,
				},
				{
					id: CallLogType.Type.INCOMING,
					title: BX.message('MOBILEAPP_CALL_LIST_TAB_INCOMING'),
				},
				{
					id: CallLogType.Type.OUTGOING,
					title: BX.message('MOBILEAPP_CALL_LIST_TAB_OUTGOING'),
				},
			];

			return UIScrollView(
				{
					ref: (ref) => {
						const { onScrollRef } = this.props;

						if (onScrollRef)
						{
							onScrollRef(ref);
						}
					},
					horizontal: true,
					showsHorizontalScrollIndicator: false,
					style: {
						height: 52,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'flex-start',
						width: '100%',
					},
				},
				View({
					style: {
						display: 'flex',
						flexDirection: 'row',
						marginLeft: 18,
						overflow: 'visible',
					},
				}),
				...items.map((tab) => View(
					{
						style: {
							position: 'relative',
							paddingRight: 3,
							marginRight: 7,
							paddingTop: BadgeCounterSize.S.getHeight() / 2,
							display: 'flex',
							overflow: 'visible',
						},
					},
					ChipInnerTab({
						testId: `call-tab-${tab.id}`,
						text: tab.title,
						selected: tab.id === selectedScopeId,
						onClick: () => onChange?.(tab.id),
					}),
					(tab.count > 0
						? View(
							{
								style: {
									position: 'absolute',
									right: 0,
									top: 0,
									zIndex: 1000,
									overflow: 'visible',
								},
							},
							BadgeCounter({
								testId: `call-tab-${tab.id}-badge`,
								value: String(tab.count > 99 ? '99+' : tab.count),
								size: BadgeCounterSize.S,
								design: tab.design || null,
							}),
						)
						: null
					),
				)),
			);
		}
	}

	function Tabs(props)
	{
		return new TabsComponent(props);
	}

	module.exports = { Tabs };
});
