import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { RichLoc } from 'ui.vue3.components.rich-loc';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { TextMd, TextSm, TextXs } from 'ui.system.typography.vue';

import { ReplicationRepeatTill } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { UiRadio } from 'tasks.v2.component.elements.radio';
import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import { ReplicationDatepicker } from '../replication-datepicker/replication-datepicker';
import './replication-finish.css';

type RepeatTill = $Values<typeof ReplicationRepeatTill>;

// @vue/component
export const ReplicationFinish = {
	name: 'ReplicationFinish',
	components: {
		HoverPill,
		ReplicationDatepicker,
		TextMd,
		TextSm,
		TextXs,
		UiButton,
		BInput,
		UiRadio,
		RichLoc,
	},
	inject: {
		replicateParams: {},
	},
	emits: ['update'],
	setup(): {
		AirButtonStyle: typeof AirButtonStyle,
		ButtonSize: typeof ButtonSize,
		InputDesign: typeof InputDesign,
		InputSize: typeof InputSize,
		ReplicationRepeatTill: typeof ReplicationRepeatTill,
	}
	{
		return {
			AirButtonStyle,
			ButtonSize,
			InputDesign,
			InputSize,
			ReplicationRepeatTill,
		};
	},
	data(): { prevTimes: number, isDatepickerOpened: boolean }
	{
		return {
			isDatepickerOpened: false,
			prevTimes: this.replicateParams.times || 1,
		};
	},
	computed: {
		repeatTill: {
			get(): RepeatTill
			{
				return this.replicateParams.repeatTill;
			},
			set(value: RepeatTill): void
			{
				const prevValue = this.repeatTill;

				this.update({ repeatTill: value });

				if (prevValue !== value)
				{
					this.updateFieldsByRepeatTill(value);
				}
			},
		},
		endDateTs(): number
		{
			return Type.isNil(this.replicateParams.endTs)
				? (Date.now() + 5 * 24 * 60 * 60 * 1000)
				: this.replicateParams.endTs;
		},
		endDateLabel(): string
		{
			return this.endDateTs
				? calendar.formatDate(this.endDateTs)
				: this.loc('TASKS_V2_REPLICATION_FINISH_DATE_UNSET');
		},
	},
	methods: {
		update(params: Partial<TaskReplicateParams>): void
		{
			this.$emit('update', params);
		},
		updateTimes(value: string): void
		{
			let times = parseInt(value.replaceAll(/\D/g, ''), 10) ?? 0;

			if (!Type.isInteger(times) || times < 1)
			{
				times = this.prevTimes;
			}

			this.prevTimes = times;
			this.update({ times });
		},
		updateEndDate(endTs: number): void
		{
			this.update({ endTs });
		},
		updateFieldsByRepeatTill(repeatTill: RepeatTill): void
		{
			if (repeatTill === ReplicationRepeatTill.Endless)
			{
				this.update({
					times: null,
					endless: null,
				});
			}

			if (repeatTill === ReplicationRepeatTill.Times)
			{
				this.prevTimes = 1;
				this.update({
					times: 1,
					endDate: null,
				});
			}

			if (repeatTill === ReplicationRepeatTill.Date)
			{
				this.update({
					times: null,
					endDate: DateTimeFormat.format('m-d-Y', (Date.now() + 5 * 24 * 60 * 60 * 1000) / 1000),
				});
			}
		},
		togglePopup(): void
		{
			this.isDatepickerOpened = !this.isDatepickerOpened;
		},
		isRowActive(repeatTill: RepeatTill): boolean
		{
			return repeatTill === this.repeatTill;
		},
		handleClickDatepickerFinishOpener(event): void
		{
			if (!this.isRowActive(ReplicationRepeatTill.Date))
			{
				return;
			}

			const target = event.currentTarget;
			const disabled = target.getAttribute('disabled');
			if (!(disabled === 'true'))
			{
				this.togglePopup();
			}
		},
	},
	template: `
		<div class="tasks-field-replication-section">
			<TextMd tag="div" className="tasks-field-replication-row">
				<span class="tasks-field-replication-secondary">
					{{ loc('TASKS_V2_REPLICATION_FINISH') }}
				</span>
			</TextMd>
			<div>
				<div class="tasks-field-replication-sheet__stack">
					<div
						class="tasks-replication-sheet-action-row --selectable"
						:class="{'--active': isRowActive(ReplicationRepeatTill.Endless)}"
						@click.self="repeatTill = ReplicationRepeatTill.Endless"
					>
						<UiRadio
							tag="label"
							v-model="repeatTill"
							:value="ReplicationRepeatTill.Endless"
							inputName="tasks-replication-sheet-finish-type"
						/>
						<TextXs className="tasks-replication-sheet-action-row__text">
							{{ loc('TASKS_V2_REPLICATION_FINISH_HAND') }}
						</TextXs>
					</div>
					<div
						class="tasks-replication-sheet-action-row --selectable"
						:class="{'--active': isRowActive(ReplicationRepeatTill.Times)}"
						@click.self="repeatTill = ReplicationRepeatTill.Times"
					>
						<UiRadio
							tag="label"
							v-model="repeatTill"
							:value="ReplicationRepeatTill.Times"
							inputName="tasks-replication-sheet-finish-type"
						/>
						<RichLoc
							class="tasks-field-replication-row"
							:text="loc('TASKS_V2_REPLICATION_AFTER_COUNT_REPETITIONS')"
							placeholder="[count/]"
						>
							<template #count>
								<BInput
									:modelValue="String(replicateParams.times ?? '')"
									:size="InputSize.Sm"
									:design="isRowActive(ReplicationRepeatTill.Times) ? InputDesign.Grey : InputDesign.Disabled"
									:disabled="!isRowActive(ReplicationRepeatTill.Times)"
									style="max-width: 4em; padding-bottom: 0;"
									@blur="updateTimes($event.target.value)"
								/>
							</template>
						</RichLoc>
					</div>
					<div
						class="tasks-replication-sheet-action-row --selectable"
						:class="{'--active': isRowActive(ReplicationRepeatTill.Date)}"
						@click.self="repeatTill = ReplicationRepeatTill.Date"
					>
						<UiRadio
							tag="label"
							v-model="repeatTill"
							:value="ReplicationRepeatTill.Date"
							inputName="tasks-replication-sheet-finish-type"
						/>
						<TextXs className="tasks-replication-sheet-action-row__text">
							{{ loc('TASKS_V2_REPLICATION_FINISH_DATE') }}
						</TextXs>
						<HoverPill
							:readonly="!isRowActive(ReplicationRepeatTill.Date)"
							textOnly
							noOffset
							ref="datepickerFinishOpener"
							@click="handleClickDatepickerFinishOpener"
						>
							<span class="tasks-field-replication-link">{{ endDateLabel }}</span>
						</HoverPill>
						<ReplicationDatepicker
							v-if="isDatepickerOpened"
							:dateTs="endDateTs"
							:bindElement="$refs.datepickerFinishOpener.$el"
							@update:dateTs="updateEndDate"
							@close="isDatepickerOpened = false"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};
