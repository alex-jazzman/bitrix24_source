import { defineComponent, onBeforeMount, type PropType } from 'ui.vue3';

import { CrmSettingsHubSettingField } from '../setting-field/setting-field';
import { CrmSettingsHubSettingRow } from '../setting-row/setting-row';
import { useSettingsStateContext } from '../../context/settings-state';
import { type ConfigTarget } from '../../lib/config-target';
import { type SettingId } from '../../model/types';

export const CrmSettingsHubConfigSettingView = defineComponent({
	name: 'CrmSettingsHubConfigSettingView',
	components: {
		CrmSettingsHubSettingField,
		CrmSettingsHubSettingRow,
	},
	props: {
		settingId: {
			type: String as PropType<SettingId>,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: '',
		},
		target: {
			type: Object as PropType<ConfigTarget | null>,
			default: null,
		},
	},
	emits: ['activate'],
	setup(props): Object
	{
		const settingsStateContext = useSettingsStateContext();
		onBeforeMount(() => {
			settingsStateContext.get(props.settingId);
		});

		return {};
	},
	computed: {
		titleId(): string
		{
			return `crm-settings-hub-application-setting-${this.settingId}-title`;
		},
	},
	template: `
		<CrmSettingsHubSettingRow :action="target" @activate="$emit('activate', $event)">
			<CrmSettingsHubSettingField
				:title="title"
				:title-id="titleId"
				:description="description"
				:show-chevron="target !== null"
				:unavailable="target?.type === 'unavailable'"
			>
			</CrmSettingsHubSettingField>
		</CrmSettingsHubSettingRow>
	`,
});
