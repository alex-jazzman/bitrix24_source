/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, booking_component_popup) {
	'use strict';

	const FILTER_ELEMENT_ID = 'BOOKING_FILTER_ID_search_container';

	// @vue/component
	const EmptyFilterResultsPopup = {
		name: 'EmptyFilterResultsPopup',
		components: {
			Popup: booking_component_popup.Popup
		},
		date() {
			return {
				bindElement: null
			};
		},
		computed: {
			popupId() {
				return 'booking-empty-filter-result-popup';
			},
			config() {
				return {
					bindElement: this.bindElement,
					minWidth: 200,
					offsetTop: 10,
					background: '#2878ca',
					padding: 13,
					angle: {
						offset: this.bindElement.offsetWidth / 2,
						position: 'top'
					},
					angleBorderRadius: '4px 0'
				};
			}
		},
		beforeMount() {
			this.bindElement = document.querySelector(`#${FILTER_ELEMENT_ID}`);
		},
		template: `
		<Popup
			:id="popupId"
			:config
			ref="popup"
		>
			<div class="booking--booking--empty-filter-results-popup-content">
				<div class="booking--booking--empty-filter-results-popup-content__title">{{ loc('BOOKING_BOOKING_FILTER_EMPTY_RESULT_TITLE') }}</div>
				<div class="booking--booking--empty-filter-results-popup-content__subtitle">{{ loc('BOOKING_BOOKING_FILTER_EMPTY_RESULT_SUBTITLE') }}</div>
			</div>
		</Popup>
	`
	};

	exports.EmptyFilterResultsPopup = EmptyFilterResultsPopup;

})(this.BX.Booking.Component = this.BX.Booking.Component || {}, BX.Booking.Component);
//# sourceMappingURL=empty-filter-results-popup.bundle.js.map
