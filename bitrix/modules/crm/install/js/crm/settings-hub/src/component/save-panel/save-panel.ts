import { defineComponent } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { isSavePanelVisible } from '../../lib/save-panel-visibility/save-panel-visibility';

import './save-panel.css';

export const CrmHubSavePanel = defineComponent({
	name: 'CrmHubSavePanel',
	components: { UiButton },
	mixins: [locMixin],
	props: {
		isDirty: {
			type: Boolean,
			default: false,
		},
		isWaiting: {
			type: Boolean,
			default: false,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['save', 'cancel'],
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize };
	},
	computed: {
		isVisible(): boolean
		{
			return isSavePanelVisible(this.isDirty, this.readOnly);
		},
	},
	methods: {
		handleSave(): void
		{
			this.$emit('save');
		},
		handleCancel(): void
		{
			this.$emit('cancel');
		},
	},
	template: `
		<div v-if="isVisible" class="crm-settings-hub-save-panel">
			<UiButton
				:text="loc('CRM_SETTINGS_HUB_SAVE')"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.FILLED"
				:loading="isWaiting"
				:disabled="isWaiting"
				:dataset="{ testid: 'crm-settings-hub-save-panel-save-btn' }"
				@click="handleSave"
			/>
			<UiButton
				:text="loc('CRM_SETTINGS_HUB_CANCEL')"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.PLAIN"
				:disabled="isWaiting"
				:dataset="{ testid: 'crm-settings-hub-save-panel-cancel-btn' }"
				@click="handleCancel"
			/>
		</div>
	`,
});
