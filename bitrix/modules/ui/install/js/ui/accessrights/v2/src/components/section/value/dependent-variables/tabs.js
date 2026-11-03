import { Outline } from 'ui.icon-set.api.core';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import '../../../../css/value/dependent-variables/tabs.css';

export const CUSTOM_TAB_ID: string = 'custom';

export const Tabs = {
	name: 'DependentVariablesTabs',
	emits: ['selectTab'],
	components: { UiButton },
	props: {
		tabs: {
			type: Array,
			required: true,
		},
		hasCustomTab: {
			type: Boolean,
			required: true,
		},
		activeTab: {
			type: String,
			required: true,
		},
	},
	watch: {
		activeTab(tabId: string): void {
			void this.$nextTick(() => {
				this.scrollTabIntoCenter(tabId);
			});
		},
	},
	mounted(): void {
		// Center the initially active tab once the container and buttons exist in the DOM.
		void this.$nextTick(() => {
			this.scrollTabIntoCenter(this.activeTab);
		});
	},
	computed: {
		customTabTitle(): string {
			return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_CUSTOM_TAB_TITLE');
		},
		customTabIcon(): string {
			return Outline.FILTER_2_LINES;
		},
		buttonSize(): string {
			return ButtonSize.MEDIUM;
		},
		customTabId(): string {
			return CUSTOM_TAB_ID;
		},
	},
	methods: {
		styleFor(tabId: string): string {
			return this.activeTab === tabId
				? AirButtonStyle.OUTLINE_ACCENT_2
				: AirButtonStyle.OUTLINE_NO_ACCENT;
		},
		onClick(tabId: string): void {
			if (this.activeTab === tabId)
			{
				return;
			}

			this.$emit('selectTab', tabId);
		},
		scrollTabIntoCenter(tabId: string): void {
			const container: ?HTMLElement = this.$refs.container;
			const tabElement: ?HTMLElement = container?.querySelector(`[data-tab-id="${tabId}"]`) ?? null;
			if (!container || !tabElement)
			{
				return;
			}

			if (container.scrollWidth <= container.clientWidth)
			{
				return;
			}

			const tabOffset = tabElement.offsetLeft + tabElement.offsetWidth / 2;
			const targetScrollLeft = tabOffset - container.clientWidth / 2;

			container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
		},
		onWheel(event: WheelEvent): void {
			const container: HTMLElement = event.currentTarget;
			if (container.scrollWidth <= container.clientWidth)
			{
				return;
			}

			const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
			if (delta === 0)
			{
				return;
			}

			event.preventDefault();
			container.scrollLeft += delta;
		},
	},
	template: `
		<div ref="container" class="ui-access-rights-v2-dv-tabs" @wheel="onWheel">
			<UiButton
				v-for="tab in tabs"
				:key="tab.id"
				:dataset="{ tabId: tab.id }"
				class="ui-access-rights-v2-dv-tabs-button"
				:text="tab.title"
				:left-icon="tab.icon"
				:size="buttonSize"
				:style="styleFor(tab.id)"
				@click="onClick(tab.id)"
			/>
			<UiButton
				v-if="hasCustomTab"
				:dataset="{ tabId: customTabId }"
				class="ui-access-rights-v2-dv-tabs-button"
				:text="customTabTitle"
				:left-icon="customTabIcon"
				:size="buttonSize"
				:style="styleFor(customTabId)"
				@click="onClick(customTabId)"
			/>
		</div>
	`,
};
