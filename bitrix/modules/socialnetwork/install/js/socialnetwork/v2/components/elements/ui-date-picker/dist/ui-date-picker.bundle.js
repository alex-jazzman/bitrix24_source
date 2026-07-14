/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, main_core, ui_datePicker, ui_iconSet_api_vue, ui_iconSet_outline, ui_system_input_vue, socialnetwork_v2_lib_calendar, socialnetwork_v2_lib_timezone) {
	'use strict';

	// @vue/component
	const UiDatePicker = {
		name: 'UiDatePicker',
		components: {
			BInput: ui_system_input_vue.BInput
		},
		props: {
			modelValue: {
				type: [Number, Date],
				default: null
			},
			label: {
				type: String,
				default: ''
			},
			hideClear: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			targetContainer: {
				type: [HTMLElement, null],
				default: null
			}
		},
		emits: ['update:modelValue'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				InputDesign: ui_system_input_vue.InputDesign
			};
		},
		data() {
			return {
				isPickerShown: false
			};
		},
		computed: {
			formattedDate() {
				if (!this.modelValue) {
					return '';
				}
				const ts = this.modelValue instanceof Date ? this.modelValue.getTime() : this.modelValue;
				return this.formatDate(ts);
			},
			design() {
				return this.disabled ? ui_system_input_vue.InputDesign.Disabled : ui_system_input_vue.InputDesign.Grey;
			}
		},
		unmounted() {
			this.datePicker?.destroy();
		},
		methods: {
			formatDate(ts) {
				return socialnetwork_v2_lib_calendar.Calendar.formatDate(ts, {
					forceYear: true
				});
			},
			preparePickerTimestamp(date) {
				if (!date) {
					return null;
				}
				const dateTs = socialnetwork_v2_lib_calendar.Calendar.createDateFromUtc(date).getTime();
				return dateTs - socialnetwork_v2_lib_timezone.Timezone.getOffset(dateTs);
			},
			clearValue() {
				this.$emit('update:modelValue', null);
			},
			getDatePicker() {
				this.handlePickerChangedDebounced ??= main_core.Runtime.debounce(this.handlePickerChanged, 10, this);
				this.datePicker ??= new ui_datePicker.DatePicker({
					enableTime: false,
					selectionMode: 'single',
					defaultTime: socialnetwork_v2_lib_calendar.Calendar.dayEndTime,
					popupOptions: {
						animation: 'fading',
						targetContainer: this.targetContainer || document.body
					},
					events: {
						[ui_datePicker.DatePickerEvent.SELECT]: this.handlePickerChangedDebounced,
						[ui_datePicker.DatePickerEvent.DESELECT]: this.handlePickerChangedDebounced,
						onShow: () => {
							this.isPickerShown = true;
						},
						onHide: () => {
							this.isPickerShown = false;
						}
					}
				});
				return this.datePicker;
			},
			handlePickerChanged() {
				const ts = this.preparePickerTimestamp(this.datePicker.getSelectedDate());
				this.$emit('update:modelValue', ts);
			},
			handleDateClick({
				currentTarget
			}) {
				const datePicker = this.getDatePicker();
				datePicker.setTargetNode(currentTarget);
				if (this.modelValue) {
					const ts = this.modelValue instanceof Date ? this.modelValue.getTime() : this.modelValue;
					datePicker.setFocusDate(ts + socialnetwork_v2_lib_timezone.Timezone.getOffset(ts));
				}
				datePicker.show();
			}
		},
		template: `
		<BInput
			:modelValue="formattedDate"
			:label
			:icon="Outline.CALENDAR_WITH_SLOTS"
			:design
			:active="isPickerShown"
			:withClear="!hideClear && Boolean(modelValue)"
			class="socialnetwork--project-wizard--field-shadow"
			clickable
			@clear="clearValue"
			@click="handleDateClick"
		/>
	`
	};

	exports.UiDatePicker = UiDatePicker;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX, BX.UI.DatePicker, BX.UI.IconSet, window, BX.UI.System.Input.Vue, BX.Socialnetwork.V2.Lib, BX.Socialnetwork.V2.Lib);
//# sourceMappingURL=ui-date-picker.bundle.js.map
