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
		panelId:
		{
			type: String,
			default: null,
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
		tabIds(): Array<string>
		{
			return [...this.tabs.values()].map((tab) => tab.id);
		},
	},
	methods:
	{
		selectAt(index: number): void
		{
			const tabId = this.tabIds[index];
			if (!tabId)
			{
				return;
			}

			this.activeTabId = tabId;
			this.focusTab(tabId);
		},
		selectByOffset(offset: number): void
		{
			const index = this.tabIds.indexOf(this.activeTabId);

			this.selectAt((index + offset + this.tabIds.length) % this.tabIds.length);
		},
		focusTab(tabId: string): void
		{
			this.$nextTick(() => {
				this.$refs.tab?.find((element) => element.id === tabId)?.focus();
			});
		},
	},
	template: `
		<div class="editor-chart-tabs" role="tablist">
			<button
				v-for="[id, tab] in tabs"
				ref="tab"
				type="button"
				class="editor-chart-tabs_tab"
				:class="{ '--selected': activeTabId === tab.id }"
				:id="tab.id"
				role="tab"
				:aria-selected="activeTabId === tab.id"
				:aria-controls="panelId"
				:tabindex="activeTabId === tab.id ? 0 : -1"
				:data-test-id="$testId(tab.id)"
				@click="activeTabId = tab.id"
				@keydown.left.prevent="selectByOffset(-1)"
				@keydown.right.prevent="selectByOffset(1)"
				@keydown.home.prevent="selectAt(0)"
				@keydown.end.prevent="selectAt(tabIds.length - 1)"
			>
				{{ tab.title }}
			</button>
		</div>
	`,
};
