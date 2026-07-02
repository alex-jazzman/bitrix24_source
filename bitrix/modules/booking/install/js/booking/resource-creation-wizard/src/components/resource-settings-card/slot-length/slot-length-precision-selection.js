import { Type } from 'main.core';
import 'ui.layout-form';
import { hint } from 'ui.vue3.directives.hint';

import { Model } from 'booking.const';
import { normalizeSlotLength } from '../../../lib/slot-length';

import './slot-length-precision-selection.css';

export const SlotLengthPrecisionSelection = {
	name: 'ResourceSettingsCardSlotLengthSlotLengthPrecisionSelection',
	directives: { hint },
	emits: ['input'],
	components: {},
	props: {
		initialValue: {
			type: Number,
			default: 0,
		},
	},
	data(): Object
	{
		return {
			days: 0,
			hours: 0,
			minutes: 0,
			minutesFocused: false,
		};
	},
	created()
	{
		this.distributeInitialValue();
	},
	methods: {
		distributeInitialValue(): void
		{
			let remainingMinutes = normalizeSlotLength(this.initialValue, this.isMultidayFeatureAvailable);

			this.days = Math.floor(remainingMinutes / (24 * 60));
			remainingMinutes %= 24 * 60;

			this.hours = Math.floor(remainingMinutes / 60);
			remainingMinutes %= 60;

			this.minutes = remainingMinutes;
		},
		calculateTotalMinutes()
		{
			const totalMinutes = normalizeSlotLength(
				this.days * 24 * 60 + this.hours * 60 + this.minutes,
				this.isMultidayFeatureAvailable,
			);

			this.applyTotalMinutes(totalMinutes);
			this.$emit('input', totalMinutes);
		},
		applyTotalMinutes(totalMinutes: number): void
		{
			let remainingMinutes = totalMinutes;

			this.days = Math.floor(remainingMinutes / (24 * 60));
			remainingMinutes %= 24 * 60;

			this.hours = Math.floor(remainingMinutes / 60);
			remainingMinutes %= 60;

			this.minutes = remainingMinutes;
		},
		validateDays()
		{
			this.days = parseInt(this.days, 10);

			if (!Type.isNumber(this.days) || this.days < 0)
			{
				this.days = 0;
			}

			this.calculateTotalMinutes();
		},
		validateHours()
		{
			this.hours = parseInt(this.hours, 10);

			if (!Type.isNumber(this.hours) || this.hours < 0)
			{
				this.hours = 0;
			}

			if (this.hours > 23)
			{
				this.hours = 23;
			}

			if (this.hours === 0)
			{
				// delay calculation to let time to determine if minutes focused before
				setTimeout((): void => {
					if (!this.minutesFocused)
					{
						this.calculateTotalMinutes();
					}
				}, 0);
			}
			else
			{
				this.calculateTotalMinutes();
			}
		},
		validateMinutes()
		{
			this.minutesFocused = false;
			this.minutes = parseInt(this.minutes, 10);

			if (!Type.isNumber(this.minutes) || this.minutes < 0)
			{
				this.minutes = 0;
			}

			if (this.minutes > 59)
			{
				this.minutes = 59;
			}

			this.calculateTotalMinutes();
		},
		handleEnterKey(event)
		{
			if (event.key === 'Enter')
			{
				event.target.blur();
			}
		},
	},
	computed: {
		isMultidayFeatureAvailable(): boolean
		{
			return this.$store.getters[`${Model.Interface}/isMultidayFeatureAvailable`];
		},
		hourHint(): Object | null
		{
			if (this.isMultidayFeatureAvailable)
			{
				return null;
			}

			return {
				text: this.loc('BRCW_SETTINGS_CARD_SLOT_LENGTH_PRECISION_LIMIT_HOUR'),
				popupOptions: {
					targetContainer: this.$root.$el.querySelector('.resource-creation-wizard__wrapper'),
				},
			};
		},
		minutesHint(): Object
		{
			return {
				text: this.loc('BRCW_SETTINGS_CARD_SLOT_LENGTH_PRECISION_LIMIT_MINUTES'),
				popupOptions: {
					targetContainer: this.$root.$el.querySelector('.resource-creation-wizard__wrapper'),
				},
			};
		},
	},
	template: `
		<div class="ui-form resource-creation-wizard__form-slot-length-precision-selection">
			<div class="ui-form-row-inline">
				<div
					class="ui-form-row"
					:class="{ '--disabled': !isMultidayFeatureAvailable }"
				>
					<div class="ui-form-content">
						<div class="ui-form-row">
							<div class="ui-ctl ui-ctl-time ui-ctl-sm ui-ctl-round">
								<input
									:data-id="'brcw-resource-slot-length-precision-days'"
									v-model="days"
									type="text"
									class="ui-ctl-element"
									:disabled="!isMultidayFeatureAvailable"
									@blur="validateDays"
									@keydown="handleEnterKey"
								>
							</div>
						</div>
						<div class="ui-form-row">
							<div>
								{{ loc('BRCW_SETTINGS_CARD_SLOT_LENGTH_PRECISION_1') }}
							</div>
						</div>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-content">
						<div class="ui-form-row">
							<div 
								class="ui-ctl ui-ctl-time ui-ctl-sm ui-ctl-round"
								v-hint="hourHint"
							>
								<input
									:data-id="'brcw-resource-slot-length-precision-hours'"
									v-model="hours"
									type="text"
									class="ui-ctl-element"
									@blur="validateHours"
									@keydown="handleEnterKey"
								>
							</div>
						</div>
						<div class="ui-form-row">
							<div>
								{{ loc('BRCW_SETTINGS_CARD_SLOT_LENGTH_PRECISION_2') }}
							</div>
						</div>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-content">
						<div class="ui-form-row">
							<div 
								class="ui-ctl ui-ctl-time ui-ctl-sm ui-ctl-round"
								v-hint="minutesHint"
							>
								<input
									:data-id="'brcw-resource-slot-length-precision-minutes'"
									v-model="minutes"
									type="text"
									class="ui-ctl-element"
									@focus="minutesFocused = true"
									@blur="validateMinutes"
									@keydown="handleEnterKey"
								>
							</div>
						</div>
						<div class="ui-form-row">
							<div>
								{{ loc('BRCW_SETTINGS_CARD_SLOT_LENGTH_PRECISION_3') }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
