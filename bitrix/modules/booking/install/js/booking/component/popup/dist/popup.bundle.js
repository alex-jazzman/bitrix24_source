/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, main_popup) {
	'use strict';

	class SliderIntegration {
		popup = null;
		sliders = new Set();
		constructor(popup) {
			this.popup = popup;
			this.getPopup().subscribe('onShow', this.onPopupShow.bind(this));
			this.getPopup().subscribe('onClose', this.onPopupClose.bind(this));
			this.getPopup().subscribe('onDestroy', this.onPopupClose.bind(this));
			this.handleSliderOpen = this.handleSliderOpen.bind(this);
			this.handleSliderClose = this.handleSliderClose.bind(this);
			this.handleSliderDestroy = this.handleSliderDestroy.bind(this);
		}
		bindEvents() {
			this.unbindEvents();
			if (top.BX) {
				top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onOpen', this.handleSliderOpen);
				top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', this.handleSliderClose);
				top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
			}
		}
		unbindEvents() {
			if (top.BX) {
				top.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onOpen', this.handleSliderOpen);
				top.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onCloseComplete', this.handleSliderClose);
				top.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
			}
		}
		onPopupShow() {
			this.bindEvents();
		}
		onPopupClose() {
			this.unbindEvents();
			this.sliders.clear();
			this.popup.unfreeze();
		}
		handleSliderOpen(event) {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider();
			if (!this.isPopupInSlider(slider)) {
				this.sliders.add(slider);
				this.popup.freeze();
			}
		}
		handleSliderClose(event) {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider();
			this.sliders.delete(slider);
			if (this.sliders.size === 0) {
				this.popup.unfreeze();
			}
		}
		handleSliderDestroy(event) {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider();
			if (this.isPopupInSlider(slider)) {
				this.unbindEvents();
				this.getPopup().destroy();
			} else {
				this.sliders.delete(slider);
				if (this.sliders.size === 0) {
					this.popup.unfreeze();
				}
			}
		}
		isPopupInSlider(slider) {
			if (slider.getFrameWindow()) {
				return slider.getFrameWindow().document.contains(this.getPopup().getPopupContainer());
			}
			return slider.getContainer().contains(this.getPopup().getPopupContainer());
		}
		getPopup() {
			return this.popup.getPopupInstance();
		}
	}

	const Popup = {
		emits: ['close'],
		props: {
			id: {
				type: String,
				required: true
			},
			config: {
				type: Object,
				default: {}
			}
		},
		created() {
			new SliderIntegration(this);
		},
		beforeMount() {
			this.getPopupInstance().show();
		},
		mounted() {
			this.adjustPosition();
			this.getPopupInstance().getContentContainer().remove();
			const {
				angleBorderRadius
			} = this.config;
			main_core.Dom.style(this.container, '--booking-popup-angle-border-radius', angleBorderRadius);
		},
		beforeUnmount() {
			this.closePopup();
		},
		computed: {
			popupContainer() {
				return `#${this.id}`;
			},
			container() {
				return this.getPopupInstance().getPopupContainer();
			},
			options() {
				return {
					...this.defaultOptions,
					...this.config
				};
			},
			defaultOptions() {
				return {
					id: this.id,
					cacheable: false,
					autoHide: true,
					autoHideHandler: ({
						target
					}) => {
						const parentAutoHide = target !== this.container && !this.container.contains(target);
						const isAhaMoment = target.closest('.popup-window-ui-tour');
						return parentAutoHide && !isAhaMoment;
					},
					closeByEsc: true,
					animation: 'fading',
					events: {
						onPopupClose: this.closePopup,
						onPopupDestroy: this.closePopup
					}
				};
			}
		},
		methods: {
			contains(element) {
				return this.container.contains(element) ?? false;
			},
			adjustPosition() {
				this.getPopupInstance().adjustPosition(this.options.bindOptions);
			},
			freeze() {
				this.getPopupInstance().setAutoHide(false);
			},
			unfreeze() {
				this.getPopupInstance().setAutoHide(this.options.autoHide);
			},
			getPopupInstance() {
				if (!this.instance) {
					main_popup.PopupManager.getPopupById(this.id)?.destroy();
					this.instance = new main_popup.Popup(this.options);
				}
				return this.instance;
			},
			closePopup() {
				this.instance?.destroy();
				this.instance = null;
				this.$emit('close');
			}
		},
		template: `
		<Teleport :to="popupContainer">
			<slot :adjustPosition="adjustPosition" :freeze="freeze" :unfreeze="unfreeze"></slot>
		</Teleport>
	`
	};

	const StickyPopup = {
		emits: ['close', 'adjustPosition'],
		props: {
			id: {
				type: String,
				required: true
			},
			config: {
				type: Object,
				default: () => ({})
			}
		},
		mounted() {
			this.adjustPosition();
			main_core.Event.bind(document, 'scroll', this.handleScroll, true);
		},
		beforeUnmount() {
			main_core.Event.unbind(document, 'scroll', this.handleScroll, true);
		},
		computed: {
			options() {
				return {
					padding: 0,
					background: 'transparent',
					bindOptions: {
						forceBindPosition: true,
						forceLeft: true
					},
					...this.config,
					className: `booking-booking-sticky-popup ${this.config.className ?? ''}`
				};
			}
		},
		methods: {
			handleScroll(event) {
				if (main_core.Type.isDomNode(event.target) && this.$refs.stickyContent.contains(event.target)) {
					return;
				}
				this.adjustPosition();
			},
			contains(element) {
				return this.$refs.popup.contains(element);
			},
			freeze() {
				this.$refs.popup.freeze();
			},
			unfreeze() {
				this.$refs.popup.unfreeze();
			},
			adjustPosition() {
				this.$refs.popup.adjustPosition();
				const top = this.config.bindElement.getBoundingClientRect().top + this.config.offsetTop;
				main_core.Dom.style(this.$refs.stickyContent, 'top', `${top}px`);
				main_core.Dom.style(this.$refs.stickyContent, 'width', `${this.config.width}px`);
				main_core.Dom.style(this.$refs.popup.container, 'top', 0);
				this.$emit('adjustPosition');
			}
		},
		components: {
			Popup
		},
		template: `
		<Popup
			v-slot="{freeze, unfreeze}"
			:id="id"
			:config="options"
			ref="popup"
			@close="$emit('close')"
		>
			<div class="booking-booking-sticky-popup-content popup-window" ref="stickyContent">
				<slot :freeze="freeze" :unfreeze="unfreeze" :adjustPosition="adjustPosition"></slot>
			</div>
		</Popup>
	`
	};

	exports.Popup = Popup;
	exports.StickyPopup = StickyPopup;

})(this.BX.Booking.Component = this.BX.Booking.Component || {}, BX, BX.Main);
//# sourceMappingURL=popup.bundle.js.map
