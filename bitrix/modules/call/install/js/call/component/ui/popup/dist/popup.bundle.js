/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, ui_vue3_components_popup) {
	'use strict';

	const resolveElement = target => {
		if (!target) {
			return null;
		}
		if (Array.isArray(target)) {
			return target.length > 0 ? resolveElement(target[0]) : null;
		}
		if (target instanceof Event) {
			const node = target.currentTarget ?? target.target;
			return node instanceof HTMLElement ? node : null;
		}
		if (target instanceof HTMLElement) {
			return target;
		}
		const candidate = target.$el;
		return candidate instanceof HTMLElement ? candidate : null;
	};
	const CallPopup = ui_vue3.defineComponent({
		name: 'CallPopup',
		components: {
			UiPopup: ui_vue3_components_popup.Popup
		},
		props: {
			open: {
				type: Boolean,
				default: false
			},
			bindElement: {
				type: HTMLElement,
				default: null
			},
			bindOptions: {
				type: Object,
				default: () => ({
					position: 'top',
					forceBindPosition: true
				})
			},
			offsetTop: {
				type: Number,
				default: 0
			},
			offsetLeft: {
				type: Number,
				default: 20
			},
			angle: {
				type: [Object, Boolean],
				default: () => ({
					position: 'bottom'
				})
			},
			background: {
				type: String,
				default: null
			},
			className: {
				type: String,
				default: null
			},
			options: {
				type: Object,
				default: null
			}
		},
		emits: ['update:open', 'hidden'],
		data() {
			return {
				internalOpen: this.open,
				internalBindElement: this.bindElement
			};
		},
		computed: {
			isOpen() {
				return this.internalOpen && this.internalBindElement !== null;
			},
			popupOptions() {
				const base = {
					bindElement: this.internalBindElement,
					bindOptions: this.bindOptions,
					offsetTop: this.offsetTop,
					offsetLeft: this.offsetLeft,
					angle: this.angle
				};
				if (this.className !== null) {
					base.className = this.className;
				}
				if (this.background !== null) {
					base.background = this.background;
				}
				return this.options === null ? base : {
					...base,
					...this.options
				};
			}
		},
		watch: {
			open(value) {
				if (value === this.internalOpen) {
					return;
				}
				this.internalOpen = value;
				if (!value) {
					this.internalBindElement = null;
				}
			},
			bindElement(value) {
				this.internalBindElement = value;
			}
		},
		methods: {
			show(target) {
				const element = resolveElement(target) ?? this.internalBindElement;
				if (element === null) {
					return;
				}
				this.internalBindElement = element;
				this.setOpen(true);
				this.$nextTick(() => {
					this.$refs.popup?.adjustPosition();
				});
			},
			hide() {
				if (!this.internalOpen) {
					return;
				}
				this.setOpen(false);
				this.internalBindElement = null;
				this.$emit('hidden');
			},
			toggle(target) {
				if (this.internalOpen) {
					this.hide();
					return;
				}
				this.show(target);
			},
			setOpen(value) {
				this.internalOpen = value;
				this.$emit('update:open', value);
			}
		},
		template: `
		<UiPopup ref="popup" v-if="isOpen" :options="popupOptions" @close="hide">
			<template #default="{ freeze, unfreeze }">
				<slot :freeze="freeze" :unfreeze="unfreeze" />
			</template>
		</UiPopup>
	`
	});

	exports.CallPopup = CallPopup;

})(this.BX.Call.Component.UI = this.BX.Call.Component.UI || {}, BX.Vue3, BX.UI.Vue3.Components);
//# sourceMappingURL=popup.bundle.js.map
