import { Dom, Event, Text } from 'main.core';
import { DurationFormat } from 'main.date';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { BMenu, type MenuOptions } from 'ui.system.menu.vue';
import { defineComponent } from 'ui.vue3';

import { DurationUnit } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';

import './duration.css';

type UnitParams = {
	duration: number,
	title: string,
};

const unitDurations = DurationFormat.getUnitDurations();

const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];

export const Duration = defineComponent({
	components: {
		BInput,
		BMenu,
	},
	inheritAttrs: false,
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
		unitAriaLabel: {
			type: String,
			default: '',
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
	setup(): { menuId: string }
	{
		return {
			menuId: `tasks-duration-menu-${Text.getRandom()}`,
		};
	},
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
		isTrigger(): boolean
		{
			return this.unitAriaLabel !== '';
		},
		isDisabled(): boolean
		{
			return this.design === InputDesign.Disabled;
		},
		expectedExpanded(): ?string
		{
			return this.isTrigger ? (this.isMenuShown ? 'true' : 'false') : null;
		},
	},
	watch: {
		modelValue(): void
		{
			this.setDuration(this.modelValue);
		},
		isMenuShown(): void
		{
			// Only the collapsed state is written here. BMenu snapshots aria-expanded of its
			// bind element when it mounts and puts that snapshot back when it is destroyed,
			// so a "true" written before the menu exists comes back onto the closed trigger
			// and sticks. The expanded state is written from the menu's own mount instead.
			if (!this.isMenuShown)
			{
				this.syncAria();
			}
		},
		isDisabled(): void
		{
			this.syncAria();
		},
	},
	created(): void
	{
		this.setDuration(this.modelValue);
	},
	mounted(): void
	{
		this.syncAria();
		this.observeTriggerAria();

		// main.popup closes the sheet from a capture-phase keyup listener on the document,
		// so an Escape that only dismisses the menu has to be claimed earlier: capture at
		// the window always runs before capture at the document, whatever the bind order.
		Event.bind(window, 'keyup', this.handleWindowKeyUp, true);
	},
	beforeUnmount(): void
	{
		this.triggerAriaObserver?.disconnect();
		Event.unbind(window, 'keyup', this.handleWindowKeyUp, true);
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
		handleUnitClick(): void
		{
			if (this.isDisabled)
			{
				return;
			}

			this.showMenu();
		},
		showMenu(): void
		{
			this.$emit('menuShown');

			this.isMenuShown = true;
		},
		hideMenu(): void
		{
			if (!this.isMenuShown)
			{
				return;
			}

			this.$emit('menuHidden');

			this.isMenuShown = false;
		},
		handleUnitKeydown(event: KeyboardEvent): void
		{
			if (!this.isTrigger || this.isDisabled || !OPEN_KEYS.includes(event.key))
			{
				return;
			}

			// The menu takes the focus and moves it by arrows itself, so ArrowDown reaches
			// the trigger only where a consumer turned the menu focus trap off. There the
			// key still belongs to the page: cancelling the default would do nothing.
			if (this.isMenuShown && event.key === 'ArrowDown')
			{
				return;
			}

			event.preventDefault();

			if (this.isMenuShown)
			{
				this.hideMenu();

				return;
			}

			this.showMenu();
		},
		handleWindowKeyUp(event: KeyboardEvent): void
		{
			if (event.key !== 'Escape' || !this.isMenuShown)
			{
				return;
			}

			event.stopImmediatePropagation();
			this.hideMenu();
		},
		/**
		 * A closed menu hands the aria-expanded it snapshotted on open back to the trigger
		 * once its popup is destroyed, past the closing animation. By then the trigger may
		 * already own a newer menu, so what it reports is whatever the gone menu remembered:
		 * the state is written again here, whoever overwrote it and whenever.
		 */
		observeTriggerAria(): void
		{
			const trigger = this.$refs.unit?.$el;
			if (!trigger)
			{
				return;
			}

			this.triggerAriaObserver = new MutationObserver(() => {
				if (this.isTrigger && trigger.getAttribute('aria-expanded') !== this.expectedExpanded)
				{
					this.syncAria();
				}
			});

			this.triggerAriaObserver.observe(trigger, { attributeFilter: ['aria-expanded'] });
		},
		/**
		 * The trigger is the input wrapper, not the inner input: BInput blurs the input
		 * on focus in the clickable mode, so a tab stop on it swallows the focus.
		 */
		syncAria(): void
		{
			const trigger = this.$refs.unit?.$el;
			const input = trigger?.querySelector('input');
			if (!input)
			{
				return;
			}

			const isInteractive = this.isTrigger && !this.isDisabled;

			Dom.attr(trigger, 'role', this.isTrigger ? 'combobox' : null);
			Dom.attr(trigger, 'aria-label', this.isTrigger ? this.unitAriaLabel : null);
			Dom.attr(trigger, 'aria-haspopup', this.isTrigger ? 'menu' : null);
			Dom.attr(trigger, 'aria-expanded', this.expectedExpanded);
			Dom.attr(trigger, 'aria-controls', this.isTrigger && this.isMenuShown ? this.menuId : null);
			Dom.attr(trigger, 'aria-disabled', this.isTrigger && this.isDisabled ? 'true' : null);
			Dom.attr(trigger, 'tabindex', isInteractive ? '0' : null);
			Dom.attr(input, 'tabindex', isInteractive ? '-1' : null);
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
		<div class="b24-duration" v-bind="$attrs">
			<BInput
				v-model="durationValue"
				:label
				:ariaLabel="label"
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
				:ariaLabel="unitAriaLabel"
				dropdown
				clickable
				stretched
				:active="isMenuShown"
				ref="unit"
				@click="handleUnitClick"
				@keydown="handleUnitKeydown"
			/>
		</div>
		<BMenu v-if="isMenuShown" :id="menuId" :options="menuOptions()" @vue:mounted="syncAria" @close="hideMenu"/>
	`,
});
