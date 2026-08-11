/**
 * @module call/callList/tabs
 */
jn.define('call/callList/tabs', (require, exports, module) => {
	const { UIScrollView } = require('layout/ui/scroll-view');
	const { ChipInnerTab, BadgeCounterDesign } = require('ui-system/blocks/chips/chip-inner-tab');
	const { CallLogType } = require('call/const');
	const { Color } = require('tokens');

	const TABS_HEIGHT = 44;

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
						height: TABS_HEIGHT,
						marginBottom: 7,
						flexDirection: 'row',
						alignItems: 'flex-start',
						justifyContent: 'flex-start',
						width: '100%',
						overflow: 'visible',
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
							marginRight: 7,
							display: 'flex',
							overflow: 'visible',
						},
					},
					ChipInnerTab({
						testId: `call-tab-${tab.id}`,
						text: tab.title,
						selected: tab.id === selectedScopeId,
						counterValue: tab.count > 0 ? Number(tab.count) : null,
						counterDesign: tab.design || null,
						accentBorderColor: Color.base4,
						onClick: () => onChange?.(tab.id),
					}),
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
