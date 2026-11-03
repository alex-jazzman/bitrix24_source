import { defineComponent, type PropType } from 'ui.vue3';

import { CrmSettingsHubSettingField } from '../setting-field/setting-field';
import {
	CrmSettingsHubSettingRow,
	type MatrixSettingAction,
} from '../setting-row/setting-row';
import {
	type RuntimeSettingState,
	type RuntimeSettingsStateContext,
	useSettingsStateContext,
} from '../../context/settings-state';
import { type SettingId } from '../../model/types';

export const CrmSettingsHubMatrixSettingView = defineComponent({
	name: 'CrmSettingsHubMatrixSettingView',
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
	},
	emits: ['activate'],
	setup(): { settingsStateContext: RuntimeSettingsStateContext }
	{
		return { settingsStateContext: useSettingsStateContext() };
	},
	computed: {
		state(): RuntimeSettingState
		{
			return this.settingsStateContext.get(this.settingId);
		},
		displayTitle(): string
		{
			return this.title === '' ? (this.state.title ?? '') : this.title;
		},
		displayDescription(): string
		{
			return this.description === '' ? (this.state.hint ?? '') : this.description;
		},
		titleId(): string
		{
			return `crm-settings-hub-application-setting-${this.settingId}-title`;
		},
		matrixAction(): MatrixSettingAction | null
		{
			const { matrix } = this.state;
			if (matrix === undefined || matrix === null)
			{
				return null;
			}

			return { type: 'matrix', settingId: this.settingId };
		},
		isDisabled(): boolean
		{
			return (
				this.matrixAction === null
				|| this.state.canEdit !== true
				|| this.settingsStateContext.isPending(this.settingId)
			);
		},
	},
	methods: {
		handleActivate(action: MatrixSettingAction): void
		{
			if (!this.isDisabled)
			{
				this.$emit('activate', action);
			}
		},
	},
	template: `
		<CrmSettingsHubSettingRow
			:action="matrixAction"
			:disabled="isDisabled"
			@activate="handleActivate"
		>
			<CrmSettingsHubSettingField
				:title="displayTitle"
				:title-id="titleId"
				:description="displayDescription"
				:show-chevron="true"
				:unavailable="state.canEdit === false"
			>
			</CrmSettingsHubSettingField>
		</CrmSettingsHubSettingRow>
	`,
});
