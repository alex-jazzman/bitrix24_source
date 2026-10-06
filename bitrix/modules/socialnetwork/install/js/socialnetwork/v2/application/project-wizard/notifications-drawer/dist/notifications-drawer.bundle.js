/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Application = this.BX.Socialnetwork.V2.Application || {};
(function (exports, ui_vue3, main_core, ui_system_typography_vue, ui_vue3_components_button, ui_vue3_components_switcher, ui_switcher) {
	'use strict';

	const NotificationsPanel = ui_vue3.defineComponent({
		name: 'ProjectWizardNotificationsPanel',
		components: {
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			HeadlineXs: ui_system_typography_vue.HeadlineXs,
			TextLg: ui_system_typography_vue.TextLg,
			TextSm: ui_system_typography_vue.TextSm,
			UiButton: ui_vue3_components_button.Button,
			UiSwitcher: ui_vue3_components_switcher.Switcher
		},
		props: {
			catalog: {
				type: Object,
				default: null
			}
		},
		emits: ['save', 'cancel'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				draft: null
			};
		},
		computed: {
			groups() {
				return this.draft?.groups ?? [];
			},
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.large,
					style: ui_switcher.AirSwitcherStyle.SOLID,
					showStateTitle: false,
					useAirDesign: true
				};
			}
		},
		created() {
			this.draft = this.catalog ? JSON.parse(JSON.stringify(this.catalog)) : null;
		},
		methods: {
			getMessage(code) {
				return main_core.Loc.getMessage(code);
			},
			setDraftCounter(typeId, counterEnabled) {
				if (!this.draft) {
					return;
				}
				for (const group of this.draft.groups) {
					const type = group.types.find(item => item.id === typeId);
					if (type) {
						type.counterEnabled = counterEnabled;
						return;
					}
				}
			},
			onSave() {
				this.$emit('save', this.draft ? JSON.parse(JSON.stringify(this.draft)) : null);
			},
			onCancel() {
				this.$emit('cancel');
			}
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
	`
	});

	exports.NotificationsPanel = NotificationsPanel;

})(this.BX.Socialnetwork.V2.Application.NotificationsDrawer = this.BX.Socialnetwork.V2.Application.NotificationsDrawer || {}, BX.Vue3, BX, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.UI.Vue3.Components, BX.UI);
//# sourceMappingURL=notifications-drawer.bundle.js.map
