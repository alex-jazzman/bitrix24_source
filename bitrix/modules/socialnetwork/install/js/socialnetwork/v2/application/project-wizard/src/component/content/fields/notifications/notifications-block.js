import { defineComponent, BitrixVue, markRaw } from 'ui.vue3';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Runtime } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextMd } from 'ui.system.typography.vue';
import 'ui.icon-set.outline';

import { useProjectStore, isValidNotificationCatalog } from 'socialnetwork.v2.model.project';

import './notifications.css';

const SLIDER_ID = 'socialnetwork:project-notifications';
const SLIDER_WIDTH = 600;

export const NotificationsBlock = defineComponent({
	name: 'ProjectWizardNotificationsBlock',
	components: {
		BIcon,
		TextMd,
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	data(): { panelApp: ?Object, slider: ?Object }
	{
		return {
			panelApp: null,
			slider: null,
		};
	},
	created(): void
	{
		this._panelDepsPromise = null;
	},
	computed: {
		...mapState(useProjectStore, ['notifications']),
		isVisible(): boolean
		{
			return isValidNotificationCatalog(this.notifications);
		},
	},
	beforeUnmount(): void
	{
		this.unmountPanel();
	},
	methods: {
		...mapActions(useProjectStore, ['setNotificationCounter']),
		async openPanel(): Promise<void>
		{
			if (this._panelDepsPromise === null)
			{
				this._panelDepsPromise = Promise.all([
					Runtime.loadExtension('main.sidepanel'),
					Runtime.loadExtension('intranet.sidepanel.air'),
					Runtime.loadExtension(
						'socialnetwork.v2.application.project-wizard.notifications-drawer',
					),
				]).catch((error) => {
					this._panelDepsPromise = null;

					throw error;
				});
			}

			const [{ SidePanel }, , { NotificationsPanel }] = await this._panelDepsPromise;

			if (!SidePanel || !SidePanel.Instance)
			{
				return;
			}

			const snapshot = this.notifications
				? JSON.parse(JSON.stringify(this.notifications))
				: null;

			SidePanel.Instance.open(SLIDER_ID, {
				cacheable: false,
				width: SLIDER_WIDTH,
				contentCallback: (slider) => {
					this.slider = markRaw(slider);
					const container = slider.getContentContainer();
					this.panelApp = markRaw(BitrixVue.createApp(NotificationsPanel, {
						catalog: snapshot,
						onSave: (updatedCatalog) => this.applyAndClose(updatedCatalog),
						onCancel: () => this.closeSlider(),
					}));
					this.panelApp.mixin(locMixin);
					this.panelApp.mount(container);
				},
				events: {
					onCloseComplete: () => {
						this.unmountPanel();
						this.slider = null;
						this.$nextTick(() => {
							this.$refs.trigger?.focus();
						});
					},
				},
			});
		},
		applyAndClose(updatedCatalog: ?Object): void
		{
			this.applyToStore(updatedCatalog);
			this.closeSlider();
		},
		applyToStore(updatedCatalog: ?Object): void
		{
			if (!updatedCatalog || !this.notifications)
			{
				return;
			}

			for (const group of updatedCatalog.groups)
			{
				for (const type of group.types)
				{
					const stored = this.findStoredType(type.id);
					if (stored && stored.counterEnabled !== type.counterEnabled)
					{
						this.setNotificationCounter(type.id, type.counterEnabled);
					}
				}
			}
		},
		findStoredType(typeId: string): ?Object
		{
			if (!this.notifications)
			{
				return null;
			}

			for (const group of this.notifications.groups)
			{
				const type = group.types.find((item) => item.id === typeId);
				if (type)
				{
					return type;
				}
			}

			return null;
		},
		closeSlider(): void
		{
			this.slider?.close();
		},
		unmountPanel(): void
		{
			if (this.panelApp)
			{
				this.panelApp.unmount();
				this.panelApp = null;
			}
		},
	},
	template: `
		<div v-if="isVisible">
			<div
				ref="trigger"
				class="sonet--project-wizard--notifications-trigger"
				role="button"
				tabindex="0"
				data-testid="project-notifications-block"
				@click="openPanel"
				@keydown.enter.prevent="openPanel"
				@keydown.space.prevent="openPanel"
			>
				<span class="sonet--project-wizard--notifications-trigger-content">
					<BIcon :size="24" :name="Outline.NOTIFICATION" color="var(--ui-color-base-4)"/>
					<TextMd>{{ loc('SONET_EXT_PROJECT_WIZARD_NOTIFICATIONS_LABEL') }}</TextMd>
				</span>
				<span class="sonet--project-wizard--notifications-trigger-chevron">
					<BIcon :size="26" :name="Outline.CHEVRON_RIGHT_L" color="var(--ui-color-base-4)"/>
				</span>
			</div>
		</div>
	`,
});
