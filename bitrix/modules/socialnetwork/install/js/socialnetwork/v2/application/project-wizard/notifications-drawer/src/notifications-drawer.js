import { defineComponent } from 'ui.vue3';
import { Loc } from 'main.core';
import { HeadlineMd, HeadlineXs, TextLg, TextSm } from 'ui.system.typography.vue';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import { Switcher as UiSwitcher } from 'ui.vue3.components.switcher';
import { SwitcherSize, AirSwitcherStyle, type SwitcherOptions } from 'ui.switcher';
import 'ui.icon-set.outline';

import './notifications-drawer.css';

export const NotificationsPanel = defineComponent({
	name: 'ProjectWizardNotificationsPanel',
	components: {
		HeadlineMd,
		HeadlineXs,
		TextLg,
		TextSm,
		UiButton,
		UiSwitcher,
	},
	props: {
		catalog: {
			type: Object,
			default: null,
		},
	},
	emits: ['save', 'cancel'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): { draft: ?Object }
	{
		return {
			draft: null,
		};
	},
	computed: {
		groups(): Array
		{
			return this.draft?.groups ?? [];
		},
		switcherOptions(): SwitcherOptions
		{
			return {
				size: SwitcherSize.large,
				style: AirSwitcherStyle.SOLID,
				showStateTitle: false,
				useAirDesign: true,
			};
		},
	},
	created(): void
	{
		this.draft = this.catalog ? JSON.parse(JSON.stringify(this.catalog)) : null;
	},
	methods: {
		getMessage(code: string): string
		{
			return Loc.getMessage(code);
		},
		setDraftCounter(typeId: string, counterEnabled: boolean): void
		{
			if (!this.draft)
			{
				return;
			}

			for (const group of this.draft.groups)
			{
				const type = group.types.find((item) => item.id === typeId);
				if (type)
				{
					type.counterEnabled = counterEnabled;

					return;
				}
			}
		},
		onSave(): void
		{
			this.$emit('save', this.draft ? JSON.parse(JSON.stringify(this.draft)) : null);
		},
		onCancel(): void
		{
			this.$emit('cancel');
		},
	},
	template: `
		<div
			class="sonet--project-wizard--notifications-panel"
			role="dialog"
			aria-modal="true"
			:aria-label="getMessage('SONET_EXT_PROJECT_WIZARD_NOTIFICATIONS_LABEL')"
			data-testid="project-notifications-drawer"
		>
			<div class="sonet--project-wizard--notifications-panel-body">
				<div class="sonet--project-wizard--notifications-panel-header">
					<HeadlineMd
						accent
						class="sonet--project-wizard--notifications-panel-title"
					>{{ getMessage('SONET_EXT_PROJECT_WIZARD_NOTIFICATIONS_LABEL') }}</HeadlineMd>
				</div>
				<div class="sonet--project-wizard--notifications-banner">
					<div class="sonet--project-wizard--notifications-banner-text">
						<TextLg
							class="sonet--project-wizard--notifications-banner-title"
						>{{ getMessage('SONET_EXT_PROJECT_WIZARD_NOTIFICATIONS_BANNER_TITLE') }}</TextLg>
						<TextSm
							class="sonet--project-wizard--notifications-banner-body"
						>{{ getMessage('SONET_EXT_PROJECT_WIZARD_NOTIFICATIONS_BANNER_BODY') }}</TextSm>
					</div>
					<div class="sonet--project-wizard--notifications-banner-image"></div>
				</div>
				<div
					v-for="group in groups"
					:key="group.id"
					class="sonet--project-wizard--notifications-group"
				>
					<HeadlineXs
						class="sonet--project-wizard--notifications-group-title"
					>{{ group.label }}</HeadlineXs>
					<div class="sonet--project-wizard--notifications-group-list">
						<div
							v-for="type in group.types"
							:key="type.id"
							class="sonet--project-wizard--notifications-row"
						>
							<TextLg class="sonet--project-wizard--notifications-row-label">{{ type.label }}</TextLg>
							<UiSwitcher
								:isChecked="type.counterEnabled"
								:options="switcherOptions"
								:data-testid="'project-notifications-toggle-' + type.id"
								@check="setDraftCounter(type.id, true)"
								@uncheck="setDraftCounter(type.id, false)"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="sonet--project-wizard--notifications-panel-footer">
				<UiButton
					:text="getMessage('SONET_EXT_PROJECT_WIZARD_NOTIFICATIONS_DRAWER_SAVE')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					data-testid="project-notifications-drawer-save"
					@click="onSave"
				/>
				<UiButton
					:text="getMessage('SONET_EXT_PROJECT_WIZARD_NOTIFICATIONS_DRAWER_CANCEL')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.PLAIN"
					data-testid="project-notifications-drawer-cancel"
					@click="onCancel"
				/>
			</div>
		</div>
	`,
});
