/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, main_popup) {
	'use strict';

	let popup = null;
	class NonDraggableBookingPopup {
		#bindElement;
		constructor(options) {
			this.popupId = options.id;
			this.#bindElement = options.bindElement;
		}
		show() {
			if (!popup) {
				this.#initPopup();
			}
			popup.show();
			this.setBindElement(this.#bindElement);
			this.adjustPosition();
			main_core.Event.bind(document, 'scroll', this.adjustPosition, true);
		}
		destroy(popupId) {
			if (popupId && popupId !== popup?.getId()) {
				return;
			}
			popup?.destroy();
			popup = null;
			main_core.Event.unbind(document, 'scroll', this.adjustPosition, true);
		}
		hasPopup() {
			return popup !== null;
		}
		setBindElement(bindElement) {
			popup?.setBindElement(bindElement);
		}
		adjustPosition() {
			popup?.adjustPosition();
		}
		#initPopup() {
			if (popup) {
				return;
			}
			popup = new main_popup.Popup({
				id: this.popupId,
				bindElement: this.#bindElement,
				content: this.#getPopupContent(),
				offsetLeft: this.#bindElement.offsetWidth / 2,
				maxWidth: 250,
				minWidth: 200,
				minHeight: 42,
				background: '#2878ca',
				angle: {
					offset: 20,
					position: 'top'
				},
				angleBorderRadius: '4px 0',
				onPopupClose: () => {
					popup?.destroy();
				}
			});
		}
		#getPopupContent() {
			return main_core.Tag.render`
			<div class="booking--booking--non-draggable-booking-popup-content">
				<div class="booking--booking--non-draggable-booking-popup-content__text">
					${this.message}
				</div>
			</div>
		`;
		}
		get message() {
			return main_core.Loc.getMessage('BOOKING_NON_DRAGGING_BOOKING_FROM_DELETED_RESOURCE');
		}
	}

	exports.NonDraggableBookingPopup = NonDraggableBookingPopup;

})(this.BX.Booking.Component = this.BX.Booking.Component || {}, BX, BX.Main);
//# sourceMappingURL=non-draggable-booking-popup.bundle.js.map
