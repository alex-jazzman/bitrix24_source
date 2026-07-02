/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core) {
	'use strict';

	const horizontalScroll = {
		mounted(el, binding) {
			if (binding.value === false) {
				return;
			}
			main_core.Event.bind(el, 'wheel', handleWheelEvent, {
				passive: false
			});
		},
		beforeUnmount(el) {
			main_core.Event.unbind(el, 'wheel', handleWheelEvent);
		}
	};
	const handleWheelEvent = event => {
		const {
			deltaX,
			deltaY,
			shiftKey
		} = event;
		const currentTarget = event.currentTarget;
		const hasHorizontalDelta = Math.abs(deltaX) > Math.abs(deltaY);
		const isHorizontalScroll = hasHorizontalDelta || shiftKey;
		if (isHorizontalScroll) {
			return;
		}
		event.preventDefault();
		currentTarget.scrollLeft += Math.round(deltaY);
	};

	exports.horizontalScroll = horizontalScroll;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX);
//# sourceMappingURL=registry.bundle.js.map
