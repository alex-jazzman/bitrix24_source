import { LocMixin } from 'sign.v2.b2e.vue-util';
import { TabType } from '../types';

// @vue/component
export const PlaceholderTabs = {
	name: 'PlaceholderTabs',
	mixins: [LocMixin],
	props: {
		currentTab: {
			type: String,
			required: true,
		},
	},
	data(): Object
	{
		return {
			TabType,
			tabs: [
				{
					type: TabType.BITRIX24,
					locKey: 'PLACEHOLDER_LIST_TAB_BITRIX24',
				},
				{
					type: TabType.HCM_LINK,
					locKey: 'PLACEHOLDER_LIST_TAB_1C',
				},
			],
		};
	},
	methods: {
		switchTab(tab: Object)
		{
			this.$emit('switch-tab', tab);
		},
		getTabDataTestId(type: string): string
		{
			return `sign-placeholder-tab-${type}`;
		},
	},
	template: `
		<div class="sign-placeholders-tabs">
			<div
				v-for="tab in tabs"
				:key="tab.type"
				class="sign-placeholders-tab"
				:class="{ 'sign-placeholders-tab--active': currentTab === tab.type }"
				@click="switchTab(tab.type)"
				:data-test-id="getTabDataTestId(tab.type)"
			>
				{{ loc(tab.locKey) }}
			</div>
		</div>
	`,
};
