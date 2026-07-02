/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, booking_core, booking_const) {
	'use strict';

	class MousePosition {
		#isMousePressed = false;
		init() {
			this.#bindMouseMove();
			this.#bindMousePressed();
		}
		destroy() {
			main_core.Event.unbind(window, 'mousemove', this.onMouseMove);
			main_core.Event.unbind(window, 'mousedown', this.onMouseDown);
			main_core.Event.unbind(window, 'mouseup', this.onMouseUp);
		}
		isMousePressed() {
			return this.#isMousePressed;
		}
		#bindMousePressed() {
			if (this.onMouseDown) {
				return;
			}
			this.onMouseDown = this.#onMouseDown.bind(this);
			this.onMouseUp = this.#onMouseUp.bind(this);
			main_core.Event.bind(window, 'mousedown', this.onMouseDown);
			main_core.Event.bind(window, 'mouseup', this.onMouseUp);
		}
		#bindMouseMove() {
			if (this.onMouseMove) {
				return;
			}
			this.onMouseMove = this.#update.bind(this);
			main_core.Event.bind(window, 'mousemove', this.onMouseMove);
		}
		#update(event) {
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setMousePosition`, {
				top: event.clientY + window.scrollY,
				left: event.clientX + window.scrollX
			});
		}
		#onMouseDown() {
			this.#isMousePressed = true;
		}
		#onMouseUp() {
			this.#isMousePressed = false;
		}
	}
	const mousePosition = new MousePosition();

	exports.mousePosition = mousePosition;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX, BX.Booking, BX.Booking.Const);
//# sourceMappingURL=mouse-position.bundle.js.map
