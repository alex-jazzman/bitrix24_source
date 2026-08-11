// @vue/component

import 'ui.buttons';
import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';

import { LimitFeatureId, Model } from 'booking.const';
import { Duration } from 'booking.lib.duration';
import { limit } from 'booking.lib.limit';
import { type SlotLengthId } from 'booking.model.resource-creation-wizard';

import { SlotLengthPrecisionSelection } from './slot-length-precision-selection';
import './slot-length-selector.css';

const unitDurations = Duration.getUnitDurations();
const units = Object.fromEntries(
	Object.entries(unitDurations).map(([unit, value]) => [unit, value / unitDurations.i]),
);
const multidayOnlyLengths = new Set([units.H * 24, units.d * 7]);

export const SlotLengthSelector = {
	name: 'ResourceSettingsCardSlotLengthSelector',
	emits: ['select'],
	components: {
		Icon,
		SlotLengthPrecisionSelection,
	},
	props: {
		initialSelectedValue: {
			type: Number,
			required: true,
		},
	},
	data(): Object
	{
		return {
			IconSet,
			selectedPrecisionValue: this.initialSelectedValue,
			precisionMode: false,
		};
	},
	computed: {
		selectedValue: {
			get(): SlotLengthId
			{
				return this.$store.state[Model.ResourceCreationWizard].slotLengthId;
			},
			set(slotLengthId: SlotLengthId): void
			{
				this.$store.dispatch(`${Model.ResourceCreationWizard}/setSlotLengthId`, { slotLengthId });
			},
		},
		isMultidayFeatureEnabled(): boolean
		{
			return this.$store.state[Model.Interface].enabledFeature.bookingLong;
		},
		durations(): { label: string, value: number }[]
		{
			return [
				{
					label: new Duration(unitDurations.H).format('H'),
					value: units.H,
				},
				{
					label: new Duration(unitDurations.H * 2).format('H'),
					value: units.H * 2,
				},
				{
					label: new Duration(unitDurations.H * 24).format('H'),
					value: units.H * 24,
				},
				{
					label: new Duration(unitDurations.d * 7).format('d'),
					value: units.d * 7,
				},
				{
					label: this.loc('BRCW_SETTINGS_CARD_SLOT_LENGTH_SELECTOR_CUSTOM'),
					value: 0,
				},
			];
		},
	},
	created(): void
	{
		const templateValues = new Set([
			units.H,
			units.H * 2,
			units.H * 24,
			units.d * 7,
		]);

		this.selectedValue = this.initialSelectedValue;
		if (!templateValues.has(this.selectedValue))
		{
			this.selectedValue = 0;
			this.precisionMode = true;
		}
	},
	methods: {
		select(value: number): void
		{
			if (this.isDurationDisabled(value))
			{
				void limit.show(LimitFeatureId.MultidayBooking);

				return;
			}

			this.selectedValue = parseInt(value, 10);

			if (value === 0)
			{
				this.precisionMode = true;
			}
			else
			{
				this.precisionMode = false;

				this.$emit('select', this.selectedValue);
			}
		},
		selectPrecision(value: number): void
		{
			this.selectedPrecisionValue = value === 0 ? units.H : parseInt(value, 10);

			if (value === 0)
			{
				this.selectedValue = units.H;
				this.precisionMode = false;
			}

			this.$emit('select', this.selectedPrecisionValue);
		},
		isDurationDisabled(value: number): boolean
		{
			return !this.isMultidayFeatureEnabled && multidayOnlyLengths.has(value);
		},
		getClass(value): Object
		{
			return {
				'ui-btn-primary': this.selectedValue === value,
				'ui-btn-light': this.selectedValue !== value,
			};
		},
	},
	template: `
		<div class="resource-creation-wizard__form-slot-length-selector">
			<div
				v-for="(duration, index) in durations"
				:key="index"
				class="resource-creation-wizard__form-slot-length-selector-item"
				:class="{'--locked': isDurationDisabled(duration.value)}"
			>
				<div
					:data-id="'brcw-resource-slot-length-selector-size-' + index"
					class="ui-btn ui-btn-xs"
					:class="getClass(duration.value)"
					@click="select(duration.value)"
				>
					{{ duration.label }}
					<Icon v-if="isDurationDisabled(duration.value)" :name="IconSet.LOCK"/>
				</div>
			</div>
		</div>
		<transition name="fade">
			<div
				v-if="precisionMode"
				class="resource-creation-wizard__form-slot-length-precision"
			>
				<SlotLengthPrecisionSelection
					:initialValue="selectedPrecisionValue"
					@input="selectPrecision"
				/>
			</div>
		</transition>
	`,
};
