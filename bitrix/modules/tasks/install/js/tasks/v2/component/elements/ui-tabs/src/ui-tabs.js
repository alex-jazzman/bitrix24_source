import { Type } from 'main.core';
import { TextMd } from 'ui.system.typography.vue';

import type { Tab } from './types';
import './ui-tabs.css';

// @vue/component
export const UiTabs = {
	name: 'UiTabs',
	components: {
		TextMd,
	},
	props: {
		modelValue: {
			type: [String, Number],
			required: true,
		},
		/** @type{Tab[]} */
		tabs: {
			type: Array,
			required: true,
		},
	},
	emits: ['update:modelValue'],
	computed: {
		activeTab(): Tab
		{
			return this.tabs.find(({ id }) => id === this.modelValue);
		},
	},
	beforeMount(): void
	{
		if (Type.isNil(this.activeTab))
		{
			this.$emit('update:modelValue', this.tabs?.[0]?.id ?? null);
		}
	},
	methods: {
		getTabPanelId(id: number | string | mixed = ''): string
		{
			return `tasks-ui-tabs-tabpanel-${id}`;
		},
		isActiveTab(tab: Tab): boolean
		{
			return this.activeTab?.id === tab.id;
		},
	},
	template: `
		<div class="tasks--ui-tabs">
			<div class="tasks--ui-tabs--tab-list" role="tablist">
				<button
					v-for="tab in tabs"
					:key="tab.id"
					type="button"
					role="tab"
					:tabindex="activeTab?.id === tab.id ? 0 : -1"
					:aria-controls="getTabPanelId(tab.id)"
					:data-tab-id="tab.id"
					:class="[
						'tasks--ui-tabs--tab',
						{
							'--active': isActiveTab(tab),
						}
					]"
					:title="tab.title"
					@click="$emit('update:modelValue', tab.id)"
				>
					<TextMd
						:className="isActiveTab(tab) ? 'tasks--ui-tabs--tab-text-active' : 'tasks--ui-tabs--tab-text'">
						{{ tab.title }}
					</TextMd>
				</button>
			</div>
			<div :id="getTabPanelId(activeTab?.id)" class="tasks--ui-tabs--tab-content" role="tabpanel">
				<Transition name="tab-content" mode="out-in">
					<slot :id="modelValue" :activeTab="activeTab" :tabs="tabs">
						<Component :is="activeTab?.component"/>
					</slot>
				</Transition>
			</div>
		</div>
	`,
};
