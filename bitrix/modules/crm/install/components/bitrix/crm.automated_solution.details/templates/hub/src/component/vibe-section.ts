import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { Loc } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { BLine } from 'ui.system.skeleton.vue';
import { CrmHubFeatureCard, type NavigationRecord } from 'crm.settings-hub';

import { VibeWidgetStatus, type VibeWidgetStatusValue } from '../const/vibe-widget-status';
import { VibeSettings } from '../feature/vibe-settings';
import {
	buildVibeSwitch,
	readVibeSection,
	resolveVibeToggle,
	resolveWidgetAnnouncement,
	resolveWidgetView,
	VibeMessage,
	type VibeSectionState,
	type VibeSwitch,
	type VibeWidgetView,
} from '../lib/vibe-section-view/vibe-section-view';

// The home page section: the switch of the page and its settings embedded under it. The switch edits the draft of
// the form (the update event), the settings load by the rules of VibeSettings. The widget takes the width of the
// card column: the slider is not widened for it, unlike the .default template.
export const CrmHubCrmVibeSection = defineComponent({
	name: 'CrmHubCrmVibeSection',
	components: { CrmHubFeatureCard, BLine },
	props: {
		descriptor: {
			type: Object as PropType<NavigationRecord>,
			required: true,
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		reason: {
			type: String,
			default: '',
		},
	},
	emits: ['update', 'action'],
	setup()
	{
		return { VibeMessage };
	},
	data()
	{
		return {
			widgetStatus: VibeWidgetStatus.Hidden as VibeWidgetStatusValue,
			// Lives outside the Vue reactivity: it only receives the section state and reports its status back.
			settings: null as VibeSettings | null,
		};
	},
	computed: {
		section(): VibeSectionState
		{
			return readVibeSection(this.snapshot, this.readOnly);
		},
		vibeSwitch(): VibeSwitch
		{
			return buildVibeSwitch(this.section, this.disabled);
		},
		widget(): VibeWidgetView
		{
			return resolveWidgetView(this.widgetStatus);
		},
	},
	watch: {
		section(section: VibeSectionState): void
		{
			this.settings?.update(section);
		},
	},
	created(): void
	{
		this.settings = markRaw(new VibeSettings({
			onStatus: (status: VibeWidgetStatusValue) => this.handleWidgetStatus(status),
			getContainer: () => this.$nextTick().then(() => {
				const container = this.$refs.settingsWrapper;

				return container instanceof HTMLElement ? container : null;
			}),
		}));
	},
	mounted(): void
	{
		this.settings?.update(this.section);
	},
	beforeUnmount(): void
	{
		this.settings?.dispose();
		this.settings = null;
	},
	methods: {
		handleToggle(checked: boolean): void
		{
			this.settings?.update(resolveVibeToggle(this.section, checked));
			this.$emit('update', checked);
		},
		handleWidgetStatus(status: VibeWidgetStatusValue): void
		{
			this.widgetStatus = status;

			const announcement = resolveWidgetAnnouncement(status);
			if (announcement)
			{
				LiveAnnouncer.announce(Loc.getMessage(announcement.code) ?? '', announcement.politeness);
			}
		},
	},
	template: `
		<div v-if="section.visible" class="crm-automated-solution-hub-vibe">
			<CrmHubFeatureCard
				:feature-id="vibeSwitch.featureId"
				:title="vibeSwitch.title"
				:checked="vibeSwitch.checked"
				:disabled="vibeSwitch.disabled"
				:reason="reason"
				@update="handleToggle"
			/>
			<div
				v-if="widget.isShown"
				class="crm-automated-solution-hub-vibe__settings"
				:aria-busy="widget.isBusy ? 'true' : null"
				data-testid="crm-automated-solution-hub-vibe-settings"
			>
				<BLine v-if="widget.showSkeleton" :height="430" :radius="8"/>
				<div
					v-else-if="widget.showEmpty"
					class="ui-alert ui-alert-warning crm-automated-solution-hub-vibe__alert"
					data-testid="crm-automated-solution-hub-vibe-settings-empty"
				>
					<span class="ui-alert-message">{{ loc(VibeMessage.Empty) }}</span>
				</div>
				<div
					v-else-if="widget.showError"
					class="ui-alert ui-alert-danger crm-automated-solution-hub-vibe__alert"
					data-testid="crm-automated-solution-hub-vibe-settings-error"
				>
					<span class="ui-alert-message">{{ loc(VibeMessage.LoadError) }}</span>
				</div>
				<div
					v-else-if="widget.showSettings"
					ref="settingsWrapper"
					class="crm-automated-solution-hub-vibe__content"
					data-testid="crm-automated-solution-hub-vibe-settings-content"
				></div>
			</div>
		</div>
	`,
});
