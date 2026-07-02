/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, ui_iconSet_api_vue, ui_vue3, main_popup, main_core) {
	'use strict';

	const reminderValues = [{
		value: 0,
		label: main_core.Loc.getMessage('BOOKING_REMINDER_0'),
		shortLabel: main_core.Loc.getMessage('BOOKING_REMINDER_SHORT_0')
	}, {
		value: 5,
		label: main_core.Loc.getMessage('BOOKING_REMINDER_5'),
		shortLabel: main_core.Loc.getMessage('BOOKING_REMINDER_SHORT_5')
	}, {
		value: 10,
		label: main_core.Loc.getMessage('BOOKING_REMINDER_10'),
		shortLabel: main_core.Loc.getMessage('BOOKING_REMINDER_SHORT_10')
	}, {
		value: 15,
		label: main_core.Loc.getMessage('BOOKING_REMINDER_15'),
		shortLabel: main_core.Loc.getMessage('BOOKING_REMINDER_SHORT_15')
	}, {
		value: 20,
		label: main_core.Loc.getMessage('BOOKING_REMINDER_20'),
		shortLabel: main_core.Loc.getMessage('BOOKING_REMINDER_SHORT_20')
	}, {
		value: 30,
		label: main_core.Loc.getMessage('BOOKING_REMINDER_30'),
		shortLabel: main_core.Loc.getMessage('BOOKING_REMINDER_SHORT_30')
	}, {
		value: 60,
		label: main_core.Loc.getMessage('BOOKING_REMINDER_60'),
		shortLabel: main_core.Loc.getMessage('BOOKING_REMINDER_SHORT_60')
	}, {
		value: 120,
		label: main_core.Loc.getMessage('BOOKING_REMINDER_120'),
		shortLabel: main_core.Loc.getMessage('BOOKING_REMINDER_SHORT_120')
	}];

	const ReminderMenu = {
		name: 'ReminderManu',
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			},
			shown: {
				type: Boolean,
				default: false
			}
		},
		emits: ['select'],
		computed: {
			id() {
				return `booking-reminder-${Math.round(Math.random() * 1_000_000)}`;
			},
			menuItems() {
				return reminderValues;
			}
		},
		watch: {
			shown: {
				handler(shown) {
					if (shown) {
						this.reminderMenu.show();
					} else {
						this.reminderMenu.close();
					}
				}
			}
		},
		created() {
			this.reminderMenu = main_popup.MenuManager.create({
				id: this.id,
				bindElement: this.bindElement,
				targetContainer: this.$root.$el.querySelector('.resource-creation-wizard__wrapper'),
				closeByEsc: true,
				autoHide: true,
				zIndex: 3200,
				offsetTop: 0,
				offsetLeft: 9,
				angle: true,
				cacheable: false
			});
			this.menuItems.forEach(menuItem => {
				this.reminderMenu.addMenuItem({
					text: menuItem.label,
					dataset: {
						...menuItem
					},
					onclick: (event, item) => {
						this.$emit('select', item.dataset);
					}
				});
			});
			this.reminderMenu.show();
		},
		unmounted() {
			main_popup.MenuManager.destroy(this.id);
		},
		template: `
		<div></div>
	`
	};

	// @vue/component
	const ReminderAdd = {
		name: 'ReminderAdd',
		components: {
			Icon: ui_iconSet_api_vue.BIcon,
			ReminderMenu
		},
		props: {
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['add'],
		setup() {
			const iconName = ui_iconSet_api_vue.Set.PLUS_30;
			const shown = ui_vue3.ref(false);
			return {
				iconName,
				shown
			};
		},
		methods: {
			select(reminderItem) {
				this.$emit('add', reminderItem.value);
				this.shown = false;
			},
			toggleMenu() {
				if (this.disabled) {
					return;
				}
				this.shown = !this.shown;
			}
		},
		template: `
		<div class="booking--reminder booking--reminder-add" :class="{ '--disabled': disabled }" @click="toggleMenu">
			<span ref="add" class="booking--reminder-add__label">{{ loc('BOOKING_REMINDER_CREATE') }}</span>
			<Icon :name="iconName" :size="18" />
		</div>
		<ReminderMenu v-if="shown" :bindElement="$refs['add']" :shown @select="select" />
	`
	};

	// @vue/component
	const ReminderItem = {
		name: 'ReminderItem',
		components: {
			Icon: ui_iconSet_api_vue.BIcon,
			ReminderMenu
		},
		props: {
			remind: {
				type: Number,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update', 'remove'],
		setup() {
			const iconName = ui_iconSet_api_vue.Set.CROSS_30;
			const shown = ui_vue3.ref(false);
			return {
				iconName,
				shown
			};
		},
		computed: {
			remindItem() {
				return reminderValues.find(({
					value
				}) => value === this.remind);
			}
		},
		methods: {
			select(item) {
				if (item.value !== this.remind) {
					this.$emit('update', {
						remind: this.remind,
						selected: item.value
					});
				}
			},
			toggleMenu() {
				if (this.disabled) {
					return;
				}
				this.shown = !this.shown;
			},
			removeItem() {
				if (this.disabled) {
					return;
				}
				this.$emit('remove', this.remind);
			}
		},
		template: `
		<div
			:class="[
				'booking--reminder',
				'booking--reminder-item',
				{ '--disabled': disabled },
			]"
		>
			<span ref="item" class="booking--reminder-item__title" @click="toggleMenu">
				{{ remindItem.shortLabel }}
			</span>
			<Icon :name="iconName" :size="18" @click="removeItem"/>
			<ReminderMenu v-if="shown" :bindElement="$refs['item']" :shown @select="select"/>
		</div>
	`
	};

	// @vue/component
	const Reminder = {
		name: 'UiReminder',
		components: {
			ReminderAdd,
			ReminderItem
		},
		props: {
			/**
			 * @type {Array<number>}
			 */
			modelValue: {
				type: Array,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		methods: {
			addRemind(remind) {
				if (this.disabled) {
					return;
				}
				const reminds = new Set(this.modelValue);
				reminds.add(remind);
				this.$emit('update:modelValue', [...reminds]);
			},
			removeRemind(remind) {
				if (this.disabled) {
					return;
				}
				this.$emit('update:modelValue', this.modelValue.filter(value => value !== remind));
			},
			updateRemind({
				remind,
				selected
			}) {
				if (this.disabled) {
					return;
				}
				const index = this.modelValue.indexOf(remind);
				if (index >= 0 && !this.modelValue.includes(selected)) {
					const items = [...this.modelValue];
					items[index] = selected;
					this.$emit('update:modelValue', items);
				}
			}
		},
		template: `
		<div class="booking--reminder-row">
			<ReminderItem
				v-for="remind of modelValue"
				:key="remind"
				:remind
				:disabled
				@update="updateRemind"
				@remove="removeRemind"
			/>
			<ReminderAdd :disabled @add="addRemind"/>
		</div>
	`
	};

	exports.Reminder = Reminder;

})(this.BX.Booking.Component = this.BX.Booking.Component || {}, BX.UI.IconSet, BX.Vue3, BX.Main, BX);
//# sourceMappingURL=reminder.bundle.js.map
