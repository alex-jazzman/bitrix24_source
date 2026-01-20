import { DurationFormat } from 'main.date';
import { BInput } from 'ui.system.input.vue';
import { BMenu, type MenuOptions } from 'ui.system.menu.vue';

import { DurationUnit } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';

import './duration.css';

type UnitParams = {
	duration: number,
	title: string,
};

const unitDurations = DurationFormat.getUnitDurations();

export const Duration = {
	components: {
		BInput,
		BMenu,
	},
	props: {
		modelValue: {
			type: [Number, null],
			required: true,
		},
		matchesWorkTime: {
			type: Boolean,
			default: false,
		},
		label: {
			type: String,
			default: null,
		},
		design: {
			type: String,
			default: null,
		},
		error: {
			type: String,
			default: null,
		},
		maxValue: {
			type: Number,
			default: 20000,
		},
	},
	emits: ['update:modelValue', 'focus', 'blur', 'menuShown', 'menuHidden'],
	data(): Object
	{
		return {
			isMenuShown: false,
			durationValue: '',
			unitId: DurationUnit.Days,
		};
	},
	computed: {
		menuOptions(): Function
		{
			return (): MenuOptions => ({
				bindElement: this.$refs.unit.$el,
				items: Object.entries(this.units).map(([unitId, { title }]) => ({
					title,
					isSelected: unitId === this.unitId,
					onClick: (): void => {
						this.unitId = unitId;

						this.update();
					},
				})),
				targetContainer: document.body,
			});
		},
		units(): { [unitId: string]: UnitParams }
		{
			return {
				[DurationUnit.Days]: {
					duration: this.matchesWorkTime ? calendar.workdayDuration : unitDurations.d,
					title: this.formatUnit('d'),
				},
				[DurationUnit.Hours]: {
					duration: unitDurations.H,
					title: this.formatUnit('H'),
				},
				[DurationUnit.Minutes]: {
					duration: unitDurations.i,
					title: this.formatUnit('i'),
				},
			};
		},
	},
	watch: {
		modelValue(): void
		{
			this.setDuration(this.modelValue);
		},
	},
	created(): void
	{
		this.setDuration(this.modelValue);
	},
	methods: {
		setDuration(duration: number): void
		{
			if (!duration)
			{
				this.durationValue = '';

				return;
			}

			const minutes = duration / this.units[DurationUnit.Minutes].duration;
			const hours = duration / this.units[DurationUnit.Hours].duration;
			const days = duration / this.units[DurationUnit.Days].duration;

			const [durationValue, unitId] = {
				[true]: [Math.floor(minutes), DurationUnit.Minutes],
				[Number.isInteger(hours)]: [hours, DurationUnit.Hours],
				[Number.isInteger(days)]: [days, DurationUnit.Days],
			}.true;

			this.unitId = unitId;
			this.durationValue = String(durationValue);
		},
		showMenu(): void
		{
			this.$emit('menuShown');

			this.isMenuShown = true;
		},
		hideMenu(): void
		{
			this.$emit('menuHidden');

			this.isMenuShown = false;
		},
		handleInput(): void
		{
			const durationValue = this.durationValue.replaceAll(/\D/g, '');
			if (Number(durationValue) < 0 || Number(durationValue) > this.maxValue)
			{
				this.durationValue = this.previousValue ?? '';

				return;
			}

			this.durationValue = durationValue;
			this.previousValue = durationValue;

			this.update();
		},
		update(): void
		{
			this.$emit('update:modelValue', this.durationValue * this.units[this.unitId].duration);
		},
		formatUnit(format: string): string
		{
			const value = Number(this.durationValue) % 1000;

			return new DurationFormat(value * unitDurations[format]).format({ format }).replace(value, '').trim();
		},
	},
	template: `
		<div class="b24-duration">
			<BInput
				v-model="durationValue"
				:label
				:design
				:error
				stretched
				@input="handleInput"
				@focus="$emit('focus')"
				@blur="$emit('blur')"
			/>
			<BInput
				:modelValue="units[unitId].title"
				:design
				dropdown
				clickable
				stretched
				:active="isMenuShown"
				ref="unit"
				@click="showMenu"
			/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="hideMenu"/>
	`,
};
