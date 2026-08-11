import './tabs.css';

// @vue/component
export const EditorChartTabs = {
	name: 'EditorChartTabs',
	props:
	{
		tabs:
		{
			type: Object,
			required: true,
		},
		modelValue:
		{
			type: String,
			required: true,
		},
	},
	emits: ['select', 'update:modelValue'],
	computed:
	{
		activeTabId:
		{
			get(): string
			{
				return this.modelValue;
			},
			set(tabId: string): void
			{
				this.$emit('update:modelValue', tabId);
			},
		},
	},
	template: `
		<ul class="editor-chart-tabs">
			<li
				v-for="[id, tab] in tabs"
				class="editor-chart-tabs_tab"
				:class="{ '--selected': activeTabId === tab.id }"
				:id="tab.id"
				:data-test-id="$testId(tab.id)"
				@click="activeTabId = tab.id"
			>
				{{ tab.title }}
			</li>
		</ul>
	`,
};
