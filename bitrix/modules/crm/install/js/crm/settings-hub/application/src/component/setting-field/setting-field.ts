import { defineComponent } from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { LabelSize, LabelStyle } from 'ui.system.label';
import { Label as UiLabel } from 'ui.system.label.vue';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import 'ui.icon-set.outline';

import './setting-field.css';

export const CrmSettingsHubSettingField = defineComponent({
	name: 'CrmSettingsHubSettingField',
	components: { BIcon, UiLabel },
	mixins: [locMixin],
	props: {
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: '',
		},
		titleId: {
			type: String,
			default: '',
		},
		showChevron: {
			type: Boolean,
			default: false,
		},
		unavailable: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return { LabelSize, LabelStyle, Outline };
	},
	computed: {
		hasControl(): boolean
		{
			return Boolean(this.$slots.control);
		},
		unavailableTestId(): string | null
		{
			const titleSuffix = '-title';
			if (this.titleId === '')
			{
				return null;
			}

			return this.titleId.endsWith(titleSuffix)
				? `${this.titleId.slice(0, -titleSuffix.length)}-unavailable`
				: `${this.titleId}-unavailable`
			;
		},
	},
	template: `
		<div class="crm-settings-hub-application__setting-field" :class="{ '--no-toggle': !hasControl }">
			<div class="crm-settings-hub-application__setting-field-header">
				<slot name="control"/>
				<div :id="titleId || null" class="crm-settings-hub-application__setting-field-title">
					{{ title }}
					<UiLabel
						v-if="unavailable"
						:size="LabelSize.SM"
						:style="LabelStyle.FILLED_NO_ACCENT"
						:value="loc('CRM_SETTINGS_HUB_SETTING_UNAVAILABLE_BADGE')"
						:data-testid="unavailableTestId"
					/>
				</div>
				<BIcon
					v-if="showChevron"
					:name="Outline.CHEVRON_RIGHT_M"
					class="crm-settings-hub-application__setting-field-chevron"
				/>
			</div>
			<div class="crm-settings-hub-application__setting-field-body">
				<div class="crm-settings-hub-application__setting-field-main">
					<div class="crm-settings-hub-application__setting-field-desc">{{ description }}</div>
					<slot name="value"/><slot name="dependents"/>
				</div>
			</div>
		</div>
	`,
});
