import { Dom, Event, Text } from 'main.core';
import { BInput, InputSize, InputDesign } from 'ui.system.input.vue';
import { BMenu, MenuItemDesign } from 'ui.system.menu.vue';
import type { MenuOptions, MenuItemOptions } from 'ui.system.menu.vue';
import { defineComponent } from 'ui.vue3';

import './select.css';

export type Item = Pick<MenuItemOptions, 'id' | 'title'> & { disabled: ?boolean };
export type { MenuOptions };

const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];

// @vue/component
export const UiSelect = defineComponent({
	name: 'UiSelect',
	components: {
		BInput,
		BMenu,
	},
	props: {
		/** @type{Item} */
		item: {
			type: Object,
			required: true,
		},
		/** @type{Item[]} */
		items: {
			type: Array,
			default: () => [],
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		ariaLabel: {
			type: String,
			default: '',
		},
		size: {
			type: String,
			default: InputSize.Sm,
		},
		targetContainer: {
			type: [HTMLElement, null],
			default: null,
		},
		menuOptions: {
			type: Object,
			default: null,
		},
	},
	emits: ['update:item'],
	setup(): { InputDesign: typeof InputDesign, menuId: string }
	{
		return {
			InputDesign,
			menuId: `tasks-select-menu-${Text.getRandom()}`,
		};
	},
	data(): { isShown: boolean }
	{
		return {
			isShown: false,
		};
	},
	computed: {
		options(): MenuOptions
		{
			return {
				bindElement: this.$refs.input.$el,
				closeOnItemClick: false,
				targetContainer: this.targetContainer || document.body,
				items: this.items.map((item) => {
					return {
						title: item.title,
						isSelected: item.id === this.item.id,
						design: item.disabled ? MenuItemDesign.Disabled : MenuItemDesign.Default,
						onClick: () => {
							if (item.disabled)
							{
								return;
							}

							this.$emit('update:item', item);
							this.isShown = false;
						},
					};
				}),
				...this.menuOptions,
			};
		},
		isTrigger(): boolean
		{
			return this.ariaLabel !== '';
		},
		expectedExpanded(): ?string
		{
			return this.isTrigger ? (this.isShown ? 'true' : 'false') : null;
		},
	},
	watch: {
		isShown(): void
		{
			// Only the collapsed state is written here. BMenu snapshots aria-expanded of its
			// bind element when it mounts and puts that snapshot back when it is destroyed,
			// so a "true" written before the menu exists comes back onto the closed trigger
			// and sticks. The expanded state is written from the menu's own mount instead.
			if (!this.isShown)
			{
				this.syncAria();
			}
		},
		disabled(): void
		{
			this.syncAria();
		},
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
		inputClick(): void
		{
			if (this.disabled)
			{
				return;
			}

			this.isShown = true;
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (!this.isTrigger || this.disabled || !OPEN_KEYS.includes(event.key))
			{
				return;
			}

			// The menu takes the focus and moves it by arrows itself, so ArrowDown reaches
			// the trigger only where a consumer turned the menu focus trap off. There the
			// key still belongs to the page: cancelling the default would do nothing.
			if (this.isShown && event.key === 'ArrowDown')
			{
				return;
			}

			event.preventDefault();
			this.isShown = !this.isShown;
		},
		handleWindowKeyUp(event: KeyboardEvent): void
		{
			if (event.key !== 'Escape' || !this.isShown)
			{
				return;
			}

			event.stopImmediatePropagation();
			this.isShown = false;
		},
		/**
		 * A closed menu hands the aria-expanded it snapshotted on open back to the trigger
		 * once its popup is destroyed, past the closing animation. By then the trigger may
		 * already own a newer menu, so what it reports is whatever the gone menu remembered:
		 * the state is written again here, whoever overwrote it and whenever.
		 */
		observeTriggerAria(): void
		{
			const trigger = this.$refs.input?.$el;
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
			const trigger = this.$refs.input?.$el;
			const input = trigger?.querySelector('input');
			if (!input)
			{
				return;
			}

			const isInteractive = this.isTrigger && !this.disabled;

			Dom.attr(trigger, 'role', this.isTrigger ? 'combobox' : null);
			Dom.attr(trigger, 'aria-label', this.isTrigger ? this.ariaLabel : null);
			Dom.attr(trigger, 'aria-haspopup', this.isTrigger ? 'menu' : null);
			Dom.attr(trigger, 'aria-expanded', this.expectedExpanded);
			Dom.attr(trigger, 'aria-controls', this.isTrigger && this.isShown ? this.menuId : null);
			Dom.attr(trigger, 'aria-disabled', this.isTrigger && this.disabled ? 'true' : null);
			Dom.attr(trigger, 'tabindex', isInteractive ? '0' : null);
			Dom.attr(input, 'tabindex', isInteractive ? '-1' : null);
		},
	},
	template: `
		<div class="tasks-select">
			<BInput
				:modelValue="item.title"
				:ariaLabel="ariaLabel"
				dropdown
				clickable
				:active="isShown"
				:size
				:design="disabled ? InputDesign.Disabled : InputDesign.Default"
				ref="input"
				@click="inputClick"
				@keydown="handleKeydown"
			/>
			<BMenu
				v-if="isShown"
				:id="menuId"
				:options
				@vue:mounted="syncAria"
				@close="isShown = false"
			/>
		</div>
	`,
});
