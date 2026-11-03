/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_popup) {
	'use strict';

	class Hint {
		#delay = 2000;
		async showHint(options) {
			this.#destroy(options.id);
			const {
				trackAnchor,
				resolveOffsetLeft,
				...popupOptions
			} = options;
			const callerEvents = popupOptions.events || {};
			const callerDestroyHandler = callerEvents.onPopupDestroy;
			let frameId = null;
			let observer = null;
			let lastLeft = null;
			let lastTop = null;
			const shouldTrack = trackAnchor === true && popupOptions.bindElement instanceof HTMLElement;
			const follow = () => {
				if (popup.isDestroyed()) {
					return;
				}
				const bindElement = popup.bindElement;
				if (!bindElement || bindElement instanceof HTMLElement && !bindElement.isConnected) {
					popup.close();
					return;
				}
				if (bindElement instanceof HTMLElement) {
					const rect = bindElement.getBoundingClientRect();
					const positionChanged = rect.left !== lastLeft || rect.top !== lastTop;
					const sizeChanged = rect.width !== popup.bindElementPos?.width || rect.height !== popup.bindElementPos?.height;
					if (positionChanged || sizeChanged) {
						lastLeft = rect.left;
						lastTop = rect.top;
						if (typeof resolveOffsetLeft === 'function') {
							popup.setOffset({
								offsetLeft: resolveOffsetLeft(rect)
							});
						}
						popup.adjustPosition({
							forceBindPosition: true
						});
					}
				}
				frameId = requestAnimationFrame(follow);
			};
			const baseOptions = {
				className: 'tasks-hint',
				background: 'var(--ui-color-bg-content-inapp)',
				angle: true,
				autoHide: true,
				autoHideHandler: () => true,
				cacheable: false,
				animation: 'fading',
				...popupOptions,
				events: {
					...callerEvents,
					onPopupDestroy: event => {
						if (frameId !== null) {
							cancelAnimationFrame(frameId);
							frameId = null;
						}
						observer?.disconnect();
						observer = null;
						if (typeof callerDestroyHandler === 'function') {
							callerDestroyHandler(event);
						}
					}
				}
			};
			const popup = new main_popup.Popup(baseOptions);
			popup.show();
			if (shouldTrack) {
				frameId = requestAnimationFrame(follow);
				observer = new IntersectionObserver(entries => {
					if (entries.some(entry => !entry.isIntersecting)) {
						popup.close();
					}
				});
				observer.observe(popupOptions.bindElement);
			}
			setTimeout(() => popup.close(), this.#delay);
		}
		#destroy(popupId) {
			main_popup.PopupManager.getPopupById(popupId)?.destroy();
		}
	}

	exports.Hint = Hint;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX.Main);
//# sourceMappingURL=hint.bundle.js.map
