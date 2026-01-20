/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports) {
	'use strict';

	// @vue/component
	const UiErrorMessage = {
	  name: 'UiErrorMessage',
	  props: {
	    message: {
	      type: String,
	      default: ''
	    }
	  },
	  template: `
		<div class="booking__ui-error-message_container">
			<div class="booking__ui-error-message">
				<span class="booking__ui-error-message_icon ui-icon-set --warning"></span>
				<span>{{ message }}</span>
			</div>
		</div>
	`
	};

	exports.UiErrorMessage = UiErrorMessage;

}((this.BX.Booking.Component = this.BX.Booking.Component || {})));
//# sourceMappingURL=ui-error-message.bundle.js.map
