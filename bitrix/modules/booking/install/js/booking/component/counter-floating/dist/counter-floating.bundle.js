/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, ui_vue3_vuex, ui_iconSet_api_vue, booking_const, booking_lib_ahaMoments, booking_lib_filterResultNavigator, booking_component_popup) {
	'use strict';

	// @vue/component
	const CounterFloatingHintPopup = {
		name: 'CounterFloatingHintPopup',
		components: {
			Popup: booking_component_popup.Popup
		},
		props: {
			count: {
				type: Number,
				required: true
			},
			bindElement: {
				type: HTMLElement,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			popupId() {
				return 'booking-counter-floating-hint-popup';
			},
			config() {
				return {
					bindElement: this.bindElement,
					minWidth: 200,
					offsetTop: this.bindElement.offsetHeight * -1.1,
					offsetLeft: this.bindElement.offsetWidth * -1 - 90,
					background: '#2878ca',
					padding: 13,
					angle: {
						offset: 20,
						position: 'right'
					},
					angleBorderRadius: '4px 0'
				};
			},
			title() {
				return main_core.Loc.getMessagePlural('BOOKING_BOOKING_FILTER_COUNTER_FLOATING_AHA_MOMENT_TITLE', this.count, {
					'#COUNT#': this.count
				});
			}
		},
		methods: {
			closePopup() {
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.SearchNavigation);
				this.$emit('close');
			}
		},
		template: `
		<Popup
			:id="popupId"
			:config
			ref="popup"
			@close="closePopup"
		>
			<div class="booking--booking--counter-floating-hint-popup-content">
				<div class="booking--booking--counter-floating-hint-popup-content__title">{{ title }}</div>
				<div class="booking--booking--counter-floating-hint-popup-content__subtitle">
					{{ loc('BOOKING_BOOKING_FILTER_COUNTER_FLOATING_AHA_MOMENT_SUBTITLE') }}
				</div>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const CounterFloatingLimitPopup = {
		name: 'CounterFloatingLimitPopup',
		components: {
			Popup: booking_component_popup.Popup
		},
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			popupId() {
				return 'booking-counter-floating-limit-popup';
			},
			config() {
				return {
					bindElement: this.bindElement,
					minWidth: 200,
					offsetTop: this.bindElement.offsetHeight * -1.1,
					offsetLeft: this.bindElement.offsetWidth * -1 - 85,
					background: '#2878ca',
					padding: 13,
					angle: {
						offset: 20,
						position: 'right'
					},
					angleBorderRadius: '4px 0'
				};
			}
		},
		template: `
		<Popup
			:id="popupId"
			:config
			ref="popup"
			@close="$emit('close')"
		>
			<div class="booking--booking--counter-floating-limit-popup-content">
				<div class="booking--booking--counter-floating-limit-popup-content__title">
					{{ loc('BOOKING_BOOKING_FILTER_COUNTER_FLOATING_LIMIT_POPUP_TITLE') }}
				</div>
				<div class="booking--booking--counter-floating-limit-popup-content__subtitle">
					{{ loc('BOOKING_BOOKING_FILTER_COUNTER_FLOATING_LIMIT_POPUP_SUBTITLE') }}
				</div>
			</div>
		</Popup>
	`
	};

	const ANIMATION_TIME_MS = 500;
	const LIMIT_POPUP_TIME_MS = 5000;

	// @vue/component
	const CounterFloating = {
		name: 'UiCounterFloating',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			CounterFloatingHintPopup,
			CounterFloatingLimitPopup
		},
		props: {
			count: {
				type: [String, Number],
				default: ''
			}
		},
		emits: ['previous', 'next'],
		setup() {
			const iconColor = 'var(--ui-color-base-8)';
			const iconSize = 16;
			return {
				Outline: ui_iconSet_api_vue.Outline,
				iconColor,
				iconSize
			};
		},
		data() {
			return {
				shownAha: false,
				shownLimitPopup: false,
				shownLimitAnimation: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				isMaxFilterDate: `${booking_const.Model.Filter}/isMaxFilterDate`,
				isMinFilterDate: `${booking_const.Model.Filter}/isMinFilterDate`,
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`
			}),
			filterCount() {
				return main_core.Loc.getMessagePlural('BOOKING_BOOKING_FILTER_COUNTER_FLOATING_COUNT', this.count, {
					'#COUNT#': this.count
				});
			}
		},
		created() {
			this.limitPopupTimeoutId = null;
		},
		mounted() {
			if (this.count > 0 && this.$refs.container && booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.SearchNavigation)) {
				setTimeout(() => {
					this.shownAha = true;
				}, 300);
			}
		},
		methods: {
			async setSelectedPeriodStartTs(nextSelectedPeriodStartTs) {
				if (!nextSelectedPeriodStartTs) {
					return;
				}
				await this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedDateTs`, nextSelectedPeriodStartTs);
				if (this.isWeekMode) {
					await this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedFirstDayPeriodTs`, nextSelectedPeriodStartTs);
				}
			},
			async previous() {
				if (this.isMinFilterDate) {
					this.startLimitAnimation();
					this.showLimitPopup();
					return;
				}
				const previousDateTs = await booking_lib_filterResultNavigator.filterResultNavigator.getPreviousFilterDateTs();
				if (previousDateTs) {
					await this.setSelectedPeriodStartTs(previousDateTs);
				}
			},
			async next() {
				if (this.isMaxFilterDate) {
					this.startLimitAnimation();
					this.showLimitPopup();
					return;
				}
				const nextFilterDateTs = await booking_lib_filterResultNavigator.filterResultNavigator.getNextFilterDateTs();
				if (nextFilterDateTs) {
					await this.setSelectedPeriodStartTs(nextFilterDateTs);
				}
			},
			showLimitPopup() {
				if (this.shownLimitPopup) {
					clearTimeout(this.limitPopupTimeoutId);
					this.shownLimitPopup = false;
				}
				this.$nextTick(() => {
					this.shownLimitPopup = true;
					this.limitPopupTimeoutId = setTimeout(() => {
						this.shownLimitPopup = false;
					}, LIMIT_POPUP_TIME_MS);
				});
			},
			startLimitAnimation() {
				this.shownLimitAnimation = true;
				setTimeout(() => {
					this.shownLimitAnimation = false;
				}, ANIMATION_TIME_MS);
			}
		},
		template: `
		<div ref="container" class="booking-booking-counter-floating">
			<div :class="['booking--booking--counter-floating_row', {
				'--twitching': shownLimitAnimation,
			}]">
				<div class="booking-booking-counter-floating-text">
					{{ filterCount }}
				</div>
				<div class="booking-booking-counter-floating-buttons">
					<div
						:class="{
							'booking-booking-counter-floating-action-button': true,
							'--disabled': isMinFilterDate,
						}"
						@click="previous"
					>
						<BIcon :name="Outline.CHEVRON_LEFT_L" :size="iconSize" :color="iconColor"/>
					</div>
					<div
						:class="{
							'booking-booking-counter-floating-action-button': true,
							'--disabled': isMaxFilterDate
						}"
						@click="next"
					>
						<BIcon :name="Outline.CHEVRON_RIGHT_L" :size="iconSize" :color="iconColor"/>
					</div>
				</div>
			</div>
			<template v-if="shownAha">
				<CounterFloatingHintPopup :count="count" :bindElement="$refs.container" @close="shownAha = false"/>
			</template>
			<template v-if="shownLimitPopup">
				<CounterFloatingLimitPopup :bindElement="$refs.container"/>
			</template>
		</div>
	`
	};

	exports.CounterFloating = CounterFloating;

})(this.BX.Booking.Component = this.BX.Booking.Component || {}, BX, BX.Vue3.Vuex, BX.UI.IconSet, BX.Booking.Const, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Component);
//# sourceMappingURL=counter-floating.bundle.js.map
