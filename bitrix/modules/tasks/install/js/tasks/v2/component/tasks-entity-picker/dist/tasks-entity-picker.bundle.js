/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, tasks_v2_component_tasksPopup, tasks_v2_lib_entitySelectorDialog) {
	'use strict';

	const idPopupEntityPicker = 'entityDemonstratorPopup';

	// @vue/component
	const TasksEntityPicker = {
		name: 'TasksEntityPicker',
		components: {
			TasksPopup: tasks_v2_component_tasksPopup.TasksPopup
		},
		props: {
			isOpened: {
				type: Boolean,
				default: false
			},
			optionsPopup: {
				type: Object,
				default: null
			},
			optionsEntityPicker: {
				type: Object,
				default: null
			}
		},
		emits: ['select', 'close'],
		data() {
			return {
				isOpenedPopup: false,
				intervalRefreshPopupLegacyWorkaround: null
			};
		},
		computed: {
			optionsPopupDefault() {
				return {
					id: idPopupEntityPicker
				};
			},
			optionsPopupFilled() {
				return {
					...this.optionsPopupDefault,
					...this.optionsPopup
				};
			}
		},
		watch: {
			async isOpened(value) {
				if (value) {
					this.isOpenedPopup = true;
					this.buildEntityPicker();
					await this.$nextTick();
					// cant use $ref.<popup>.$el because of teleport in popup
					const popup = document.getElementById(idPopupEntityPicker);
					const popupContent = popup.querySelector('.tasks-popup__content');
					const popupLegacy = this.dialog.getPopup();
					popupLegacy.setTargetContainer(popupContent);
					popupLegacy.show();
					this.freezePopupLegacy();
					const popupRef = this.$refs.entityDemonstratorPopup;
					popupRef.setCoordsForPopup();
				} else {
					this.closeEntityPickerDialog();
				}
			}
		},
		async mounted() {
			this.buildEntityPicker();
			// TODO: "BOTTOMSHEET REMOVING BINDINGS BUG"
			this.intervalRefreshPopupLegacyWorkaround = setInterval(() => {
				this.freezePopupLegacy();
			}, 100);
		},
		async beforeUnmount() {
			// TODO: "BOTTOMSHEET REMOVING BINDINGS BUG"
			if (this.intervalRefreshPopupLegacyWorkaround) {
				clearInterval(this.intervalRefreshPopupLegacyWorkaround);
			}
		},
		methods: {
			closePopup() {
				this.$emit('close');
			},
			freezePopupLegacy() {
				const popupLegacy = this.dialog.getPopup();
				popupLegacy.setAutoHide(false);
				popupLegacy.setClosingByEsc(false);
			},
			handleAfterCloseEntityPickerDialog() {
				setTimeout(() => {
					if (this.isOpened) {
						this.closePopup();
					}
					this.isOpenedPopup = false;
				}, 100);
			},
			buildEntityPicker() {
				this.dialog ??= new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
					offsetTop: 0,
					events: {
						'Item:onSelect': event => {
							this.$emit('select', this.dialog);
						}
					},
					...this.optionsEntityPicker,
					popupOptions: {
						events: {
							onAfterClose: this.handleAfterCloseEntityPickerDialog
						},
						...this.optionsEntityPicker.popupOptions
					}
				});
				this.freezePopupLegacy();
				this.dialog.load();
			},
			closeEntityPickerDialog() {
				if (this.intervalRefreshPopupLegacyWorkaround) {
					clearInterval(this.intervalRefreshPopupLegacyWorkaround);
				}
				const popupLegacy = this.dialog.getPopup();
				popupLegacy.close();
			},
			handleCloseDemonstratorPopup() {
				this.closePopup();
			}
		},
		template: `
		<TasksPopup
			v-if="isOpenedPopup"
			ref="entityDemonstratorPopup"
			:options="optionsPopupFilled"
			@close="handleCloseDemonstratorPopup"
		>
		</TasksPopup>
	`
	};

	exports.TasksEntityPicker = TasksEntityPicker;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX.Tasks.V2.Component, BX.Tasks.V2.Lib);
//# sourceMappingURL=tasks-entity-picker.bundle.js.map
