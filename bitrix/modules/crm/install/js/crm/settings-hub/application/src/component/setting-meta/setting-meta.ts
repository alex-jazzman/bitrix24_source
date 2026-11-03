import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { LabelSize, LabelStyle } from 'ui.system.label';
import { UiLabel } from 'ui.system.label.vue';

export type BadgeDesign =
	| 'filled'
	| 'outline-na'
	| 'filled-warning'
	| 'filled-success'
	| 'filled-alert';

export type SettingBadge = Readonly<{
	text: string,
	design: BadgeDesign,
}>;

const BADGE_STYLES: Record<string, string> = {
	filled: LabelStyle.FILLED,
	'outline-na': LabelStyle.OUTLINE_NO_ACCENT,
	'filled-warning': LabelStyle.FILLED_WARNING,
	'filled-success': LabelStyle.FILLED_SUCCESS,
	'filled-alert': LabelStyle.FILLED_ALERT,
};

export const CrmSettingsHubSettingMeta = defineComponent({
	name: 'CrmSettingsHubSettingMeta',
	components: { UiLabel },
	mixins: [locMixin],
	props: {
		text: {
			type: String,
			default: '',
		},
		badge: {
			type: Object as PropType<SettingBadge | null>,
			default: null,
		},
		unknownValue: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return { LabelSize };
	},
	computed: {
		displayText(): string
		{
			const parts: string[] = [];
			if (this.unknownValue)
			{
				parts.push(this.loc('CRM_SETTINGS_HUB_VALUE_UNKNOWN'));
			}

			if (this.text !== '')
			{
				parts.push(this.text);
			}

			return parts.join(' - ');
		},
		mappedStyle(): string
		{
			return BADGE_STYLES[this.badge?.design ?? ''] ?? LabelStyle.OUTLINE_NO_ACCENT;
		},
	},
	template: `
		<div v-if="displayText || badge" class="crm-settings-hub-application__meta">
			<span v-if="displayText" class="crm-settings-hub-application__meta-text">{{ displayText }}</span>
			<UiLabel v-if="badge" :size="LabelSize.SM" :style="mappedStyle" :value="badge.text"/>
		</div>
	`,
});
