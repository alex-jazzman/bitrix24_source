import { Loc } from 'main.core';

import { SegmentButton } from 'im.v2.component.elements.button';
import { TabId, LocalStorageKey } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';

import './tabs-wrapper.css';

const Tabs: Tab[] = [
	{
		id: TabId.employees,
		title: Loc.getMessage('IM_ENTITY_SELECTOR_EMPLOYEES_TAB'),
	},
	{
		id: TabId.guests,
		title: Loc.getMessage('IM_ENTITY_SELECTOR_GUESTS_TAB'),
	},
];
export const TabsWrapper = {
	name: 'TabsWrapper',
	components: { SegmentButton },
	props: {
		activeTabId:
			{
				type: String,
				required: true,
			},
	},
	emits: ['onTabSwitch'],
	computed: {
		Tabs: () => Tabs,
	},
	methods: {
		switchTab(tabId: string)
		{
			LocalStorageManager.getInstance().set(LocalStorageKey.invitePopupTab, tabId);
			this.$emit('onTabSwitch', tabId);
		},
	},
	template: `
		<div class="bx-im-tab-wrapper__tabs">
			<SegmentButton
				:tabs="Tabs"
				:activeTabId="activeTabId"
				@segmentSelected="switchTab"
			/>
		</div>
	`,
};
