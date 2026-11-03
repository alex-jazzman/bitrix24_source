/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
this.BX.UI.System.WhatsNew = this.BX.UI.System.WhatsNew || {};
(function (exports, ui_vue3, ui_system_popups_whatsNew) {
	'use strict';

	const SLIDE_SLOT = /^slide-(\d+)$/;
	const isOneOf = (dictionary, value) => {
		return Object.values(dictionary).includes(value);
	};
	const BWhatsNew = ui_vue3.defineComponent({
		name: 'BWhatsNew',
		props: {
			size: {
				type: String,
				default: ui_system_popups_whatsNew.WhatsNewSize.Md,
				validator: value => isOneOf(ui_system_popups_whatsNew.WhatsNewSize, value)
			},
			mediaPosition: {
				type: String,
				default: ui_system_popups_whatsNew.WhatsNewMediaPosition.Top,
				validator: value => isOneOf(ui_system_popups_whatsNew.WhatsNewMediaPosition, value)
			},
			actionsAlign: {
				type: String,
				default: ui_system_popups_whatsNew.WhatsNewActionsAlign.Right,
				validator: value => isOneOf(ui_system_popups_whatsNew.WhatsNewActionsAlign, value)
			},
			stepCount: {
				type: Number,
				default: 1
			},
			currentStep: {
				type: Number,
				default: 0
			},
			label: {
				type: String,
				default: ''
			},
			title: {
				type: String,
				default: ''
			},
			titleBrand: {
				type: String,
				default: ''
			},
			subtitle: {
				type: String,
				default: ''
			},
			items: {
				type: Array,
				default: () => []
			},
			scene: {
				type: [Array, Object],
				default: null
			},
			video: {
				type: Object,
				default: null
			},
			gallery: {
				type: Array,
				default: () => []
			},
			galleryNav: {
				type: String,
				default: ui_system_popups_whatsNew.WhatsNewGalleryNav.Sides,
				validator: value => isOneOf(ui_system_popups_whatsNew.WhatsNewGalleryNav, value)
			},
			currentSlide: {
				type: Number,
				default: null
			},
			parallax: {
				type: Boolean,
				default: true
			},
			backdrop: {
				type: String,
				default: ui_system_popups_whatsNew.WhatsNewBackdrop.None,
				validator: value => isOneOf(ui_system_popups_whatsNew.WhatsNewBackdrop, value)
			},
			backdropColor: {
				type: String,
				default: ui_system_popups_whatsNew.WhatsNewColor.DarkBlue,
				validator: value => isOneOf(ui_system_popups_whatsNew.WhatsNewColor, value)
			},
			actions: {
				type: Array,
				default: () => []
			},
			hasOverlay: {
				type: Boolean,
				default: true
			},
			disableScrolling: {
				type: Boolean,
				default: true
			},
			closeByEsc: {
				type: Boolean,
				default: true
			},
			closeByClickOutside: {
				type: Boolean,
				default: true
			},
			hasCloseButton: {
				type: Boolean,
				default: true
			},
			closable: {
				type: Boolean,
				default: true
			}
		},
		emits: ['show', 'afterShow', 'close', 'hide', 'afterHide', 'itemClick', 'stepChange', 'slideChange', 'backdropColorChange'],
		watch: {
			currentStep(value) {
				this.dialog?.setCurrentStep(value);
			},
			currentSlide(value) {
				this.dialog?.setCurrentSlide(value);
			},
			backdropColor(value) {
				this.dialog?.setBackdropColor(value);
			},
			items(value) {
				this.dialog?.setItems(value);
			},
			actions(value) {
				this.dialog?.setActions(value);
			},
			closable(value) {
				this.dialog?.setClosable(value);
			}
		},
		data() {
			return {
				dialog: null,
				slideNodes: {}
			};
		},
		created() {
			this.slideNodes = ui_vue3.markRaw(this.buildSlideNodes());
			const dialog = ui_vue3.markRaw(new ui_system_popups_whatsNew.WhatsNew(this.buildOptions()));
			if (!this.closable) {
				dialog.setClosable(false);
			}
			this.dialog = dialog;
		},
		unmounted() {
			this.dialog?.destroy();
			this.dialog = null;
		},
		methods: {
			buildSlideNodes() {
				const nodes = {};
				Object.keys(this.$slots).filter(name => SLIDE_SLOT.test(name)).sort((one, two) => {
					return Number(SLIDE_SLOT.exec(one)[1]) - Number(SLIDE_SLOT.exec(two)[1]);
				}).forEach(name => {
					nodes[name] = document.createElement('div');
				});
				return nodes;
			},
			buildOptions() {
				const slides = Object.values(this.slideNodes);
				return {
					size: this.size,
					mediaPosition: this.mediaPosition,
					actionsAlign: this.actionsAlign,
					stepCount: this.stepCount,
					currentStep: this.currentStep,
					label: this.label,
					title: this.title,
					titleBrand: this.titleBrand,
					subtitle: this.subtitle,
					items: this.items,
					scene: this.scene,
					video: this.video,
					gallery: slides.length > 0 ? slides : this.gallery,
					galleryNav: this.galleryNav,
					currentSlide: this.currentSlide ?? undefined,
					parallax: this.parallax,
					backdrop: this.backdrop,
					backdropColor: this.backdropColor,
					actions: this.actions,
					hasOverlay: this.hasOverlay,
					disableScrolling: this.disableScrolling,
					closeByEsc: this.closeByEsc,
					closeByClickOutside: this.closeByClickOutside,
					hasCloseButton: this.hasCloseButton,
					events: {
						onShow: event => this.$emit('show', event),
						onAfterShow: event => this.$emit('afterShow', event),
						onClose: event => this.$emit('close', event),
						onHide: event => this.$emit('hide', event),
						onAfterHide: event => this.$emit('afterHide', event),
						onItemClick: event => this.$emit('itemClick', event),
						onStepChange: event => this.$emit('stepChange', event),
						onSlideChange: event => this.$emit('slideChange', event),
						onBackdropColorChange: event => this.$emit('backdropColorChange', event)
					}
				};
			},
			show() {
				this.dialog?.show();
			},
			hide() {
				this.dialog?.hide();
			}
		},
		template: `
		<Teleport v-for="(node, name) in slideNodes" :key="name" :to="node">
			<slot :name="name"></slot>
		</Teleport>
	`
	});

	exports.BWhatsNew = BWhatsNew;

})(this.BX.UI.System.WhatsNew.Vue = this.BX.UI.System.WhatsNew.Vue || {}, BX.Vue3, BX.UI.System.WhatsNew);
//# sourceMappingURL=vue.bundle.js.map
