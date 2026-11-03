/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_date, ui_system_input_vue, ui_system_menu_vue, ui_vue3, tasks_v2_const, tasks_v2_lib_calendar) {
	'use strict';

	const unitDurations = main_date.DurationFormat.getUnitDurations();
	const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];
	const Duration = ui_vue3.defineComponent({
		components: {
			BInput: ui_system_input_vue.BInput,
			BMenu: ui_system_menu_vue.BMenu
		},
		inheritAttrs: false,
		props: {
			modelValue: {
				type: [Number, null],
				required: true
			},
			matchesWorkTime: {
				type: Boolean,
				default: false
			},
			label: {
				type: String,
				default: null
			},
			unitAriaLabel: {
				type: String,
				default: ''
			},
			design: {
				type: String,
				default: null
			},
			error: {
				type: String,
				default: null
			},
			maxValue: {
				type: Number,
				default: 20000
			}
		},
		emits: ['update:modelValue', 'focus', 'blur', 'menuShown', 'menuHidden'],
		setup() {
			return {
				menuId: `tasks-duration-menu-${main_core.Text.getRandom()}`
			};
		},
		data() {
			return {
				isMenuShown: false,
				durationValue: '',
				unitId: tasks_v2_const.DurationUnit.Days
			};
		},
		computed: {
			menuOptions() {
				return () => ({
					bindElement: this.$refs.unit.$el,
					items: Object.entries(this.units).map(([unitId, {
						title
					}]) => ({
						title,
						isSelected: unitId === this.unitId,
						onClick: () => {
							this.unitId = unitId;
							this.update();
						}
					})),
					targetContainer: document.body
				});
			},
			units() {
				return {
					[tasks_v2_const.DurationUnit.Days]: {
						duration: this.matchesWorkTime ? tasks_v2_lib_calendar.calendar.workdayDuration : unitDurations.d,
						title: this.formatUnit('d')
					},
					[tasks_v2_const.DurationUnit.Hours]: {
						duration: unitDurations.H,
						title: this.formatUnit('H')
					},
					[tasks_v2_const.DurationUnit.Minutes]: {
						duration: unitDurations.i,
						title: this.formatUnit('i')
					}
				};
			},
			isTrigger() {
				return this.unitAriaLabel !== '';
			},
			isDisabled() {
				return this.design === ui_system_input_vue.InputDesign.Disabled;
			},
			expectedExpanded() {
				return this.isTrigger ? this.isMenuShown ? 'true' : 'false' : null;
			}
		},
		watch: {
			modelValue() {
				this.setDuration(this.modelValue);
			},
			isMenuShown() {
				// Only the collapsed state is written here. BMenu snapshots aria-expanded of its
				// bind element when it mounts and puts that snapshot back when it is destroyed,
				// so a "true" written before the menu exists comes back onto the closed trigger
				// and sticks. The expanded state is written from the menu's own mount instead.
				if (!this.isMenuShown) {
					this.syncAria();
				}
			},
			isDisabled() {
				this.syncAria();
			}
		},
		created() {
			this.setDuration(this.modelValue);
		},
		mounted() {
			this.syncAria();
			this.observeTriggerAria();

			// main.popup closes the sheet from a capture-phase keyup listener on the document,
			// so an Escape that only dismisses the menu has to be claimed earlier: capture at
			// the window always runs before capture at the document, whatever the bind order.
			main_core.Event.bind(window, 'keyup', this.handleWindowKeyUp, true);
		},
		beforeUnmount() {
			this.triggerAriaObserver?.disconnect();
			main_core.Event.unbind(window, 'keyup', this.handleWindowKeyUp, true);
		},
		methods: {
			setDuration(duration) {
				if (!duration) {
					this.durationValue = '';
					return;
				}
				const minutes = duration / this.units[tasks_v2_const.DurationUnit.Minutes].duration;
				const hours = duration / this.units[tasks_v2_const.DurationUnit.Hours].duration;
				const days = duration / this.units[tasks_v2_const.DurationUnit.Days].duration;
				const [durationValue, unitId] = {
					[true]: [Math.floor(minutes), tasks_v2_const.DurationUnit.Minutes],
					[Number.isInteger(hours)]: [hours, tasks_v2_const.DurationUnit.Hours],
					[Number.isInteger(days)]: [days, tasks_v2_const.DurationUnit.Days]
				}.true;
				this.unitId = unitId;
				this.durationValue = String(durationValue);
			},
			handleUnitClick() {
				if (this.isDisabled) {
					return;
				}
				this.showMenu();
			},
			showMenu() {
				this.$emit('menuShown');
				this.isMenuShown = true;
			},
			hideMenu() {
				if (!this.isMenuShown) {
					return;
				}
				this.$emit('menuHidden');
				this.isMenuShown = false;
			},
			handleUnitKeydown(event) {
				if (!this.isTrigger || this.isDisabled || !OPEN_KEYS.includes(event.key)) {
					return;
				}

				// The menu takes the focus and moves it by arrows itself, so ArrowDown reaches
				// the trigger only where a consumer turned the menu focus trap off. There the
				// key still belongs to the page: cancelling the default would do nothing.
				if (this.isMenuShown && event.key === 'ArrowDown') {
					return;
				}
				event.preventDefault();
				if (this.isMenuShown) {
					this.hideMenu();
					return;
				}
				this.showMenu();
			},
			handleWindowKeyUp(event) {
				if (event.key !== 'Escape' || !this.isMenuShown) {
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
			observeTriggerAria() {
				const trigger = this.$refs.unit?.$el;
				if (!trigger) {
					return;
				}
				this.triggerAriaObserver = new MutationObserver(() => {
					if (this.isTrigger && trigger.getAttribute('aria-expanded') !== this.expectedExpanded) {
						this.syncAria();
					}
				});
				this.triggerAriaObserver.observe(trigger, {
					attributeFilter: ['aria-expanded']
				});
			},
			/**
			 * The trigger is the input wrapper, not the inner input: BInput blurs the input
			 * on focus in the clickable mode, so a tab stop on it swallows the focus.
			 */
			syncAria() {
				const trigger = this.$refs.unit?.$el;
				const input = trigger?.querySelector('input');
				if (!input) {
					return;
				}
				const isInteractive = this.isTrigger && !this.isDisabled;
				main_core.Dom.attr(trigger, 'role', this.isTrigger ? 'combobox' : null);
				main_core.Dom.attr(trigger, 'aria-label', this.isTrigger ? this.unitAriaLabel : null);
				main_core.Dom.attr(trigger, 'aria-haspopup', this.isTrigger ? 'menu' : null);
				main_core.Dom.attr(trigger, 'aria-expanded', this.expectedExpanded);
				main_core.Dom.attr(trigger, 'aria-controls', this.isTrigger && this.isMenuShown ? this.menuId : null);
				main_core.Dom.attr(trigger, 'aria-disabled', this.isTrigger && this.isDisabled ? 'true' : null);
				main_core.Dom.attr(trigger, 'tabindex', isInteractive ? '0' : null);
				main_core.Dom.attr(input, 'tabindex', isInteractive ? '-1' : null);
			},
			handleInput() {
				const durationValue = this.durationValue.replaceAll(/\D/g, '');
				if (Number(durationValue) < 0 || Number(durationValue) > this.maxValue) {
					this.durationValue = this.previousValue ?? '';
					return;
				}
				this.durationValue = durationValue;
				this.previousValue = durationValue;
				this.update();
			},
			update() {
				this.$emit('update:modelValue', this.durationValue * this.units[this.unitId].duration);
			},
			formatUnit(format) {
				const value = Number(this.durationValue) % 1000;
				return new main_date.DurationFormat(value * unitDurations[format]).format({
					format
				}).replace(value, '').trim();
			}
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
	`
	});

	exports.Duration = Duration;

})(this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}, BX, BX.Main, BX.UI.System.Input.Vue, BX.UI.System.Menu, BX.Vue3, BX.Tasks.V2.Const, BX.Tasks.V2.Lib);
//# sourceMappingURL=duration.bundle.js.map
