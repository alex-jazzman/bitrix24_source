import { Set as IconSet } from 'ui.icon-set.api.vue';
import type { SlotRange } from 'booking.model.resources';
import { TextLayout } from '../text-layout/text-layout';
import { TitleLayout } from '../title-layout/title-layout';
import { WorkTimeSelector } from './work-time-selector';

export const WorkTime = {
	name: 'ResourceSettingsCardWorkTime',
	emits: [
		'update',
		'updateGlobalSchedule',
		'getGlobalSchedule',
	],
	props: {
		initialSlotRanges: {
			type: Array,
			required: true,
		},
		isGlobalSchedule: {
			type: Boolean,
			required: true,
		},
		defaultSlotRange: {
			type: Object,
			required: true,
		},
		initialTimezone: {
			type: String,
			required: true,
		},
		currentTimezone: {
			type: String,
			required: true,
		},
		isCompanyScheduleAccess: {
			type: Boolean,
			required: true,
		},
		companyScheduleUrl: {
			type: String,
			required: true,
		},
	},
	components: {
		TitleLayout,
		TextLayout,
		WorkTimeSelector,
	},
	methods: {
		update(slotRanges: SlotRange[]): void
		{
			this.$emit('update', slotRanges);
		},
		updateGlobalSchedule(checked: boolean): void
		{
			this.$emit('updateGlobalSchedule', checked);
		},
		getGlobalSchedule(): void
		{
			this.$emit('getGlobalSchedule');
		},
	},
	computed: {
		title(): string
		{
			return this.loc('BRCW_SETTINGS_CARD_WORK_TIME_TITLE_MSGVER_1');
		},
		titleIconType(): string
		{
			return IconSet.CLOCK_2;
		},
	},
	template: `
		<div class="ui-form resource-creation-wizard__form-settings">
			<TitleLayout
				:title="title"
				:iconType="titleIconType"
			/>
			<TextLayout
				type="WorkTime"
				:text="loc('BRCW_SETTINGS_CARD_WORK_TIME_TEXT_MSGVER_2')"
			/>
			<WorkTimeSelector
				:initialSlotRanges="initialSlotRanges"
				:defaultSlotRange="defaultSlotRange"
				:isGlobalSchedule="isGlobalSchedule"
				:initialTimezone="initialTimezone"
				:currentTimezone="currentTimezone"
				:isCompanyScheduleAccess="isCompanyScheduleAccess"
				:companyScheduleUrl="companyScheduleUrl"
				@update="update"
				@updateGlobalSchedule="updateGlobalSchedule"
				@getGlobalSchedule="getGlobalSchedule"
			/>
		</div>
	`,
};
