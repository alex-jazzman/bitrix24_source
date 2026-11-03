/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, call_lib_viewContract, ui_a11y) {
	'use strict';

	function resolveCallWindowNameType(entity) {
		if (!entity) {
			return call_lib_viewContract.CallWindowNameType.Private;
		}
		const chatType = entity.advanced?.chatType;
		if (chatType === 'videoconf') {
			return call_lib_viewContract.CallWindowNameType.Conference;
		}
		if (chatType === 'private' || chatType === 'user') {
			return call_lib_viewContract.CallWindowNameType.Private;
		}
		return call_lib_viewContract.CallWindowNameType.Group;
	}
	function resolveCallWindowName(sources) {
		return nameFromCall(sources.entity) ?? nameFromPreparedCall(sources.preparedCall);
	}
	function nameFromCall(entity) {
		if (!entity) {
			return null;
		}
		const name = main_core.Text.decode(entity.name ?? '');
		if (!main_core.Type.isStringFilled(name)) {
			return null;
		}
		return {
			name,
			type: resolveCallWindowNameType(entity)
		};
	}
	function nameFromPreparedCall(preparedCall) {
		const companionId = preparedCall?.user;
		if (!companionId) {
			return null;
		}
		const name = preparedCall?.userData?.[companionId]?.name ?? '';
		if (!main_core.Type.isStringFilled(name)) {
			return null;
		}
		return {
			name,
			type: call_lib_viewContract.CallWindowNameType.Private
		};
	}

	const frameScheduler = {
		schedule: callback => requestAnimationFrame(callback),
		cancel: handle => cancelAnimationFrame(handle)
	};
	class WindowFocusScope {
		#opener = null;
		#handle = null;
		#destroyed = false;
		#scheduler;
		constructor(options = {}) {
			this.#scheduler = options.scheduler ?? frameScheduler;
		}
		captureOpener(candidate) {
			if (this.#destroyed || this.#opener?.isConnected) {
				return;
			}
			this.#opener = WindowFocusScope.#isValidOpener(candidate) ? candidate : null;
		}
		focusWindow(root, options = {}) {
			if (this.#destroyed || !root) {
				return;
			}
			this.#cancelScheduledFocus();
			const force = options.force === true;
			this.#handle = this.#scheduler.schedule(() => {
				this.#handle = null;
				if (this.#destroyed || !root.isConnected) {
					return;
				}
				if (!force && !this.#mayTakeFocus(root)) {
					return;
				}
				root.focus({
					preventScroll: true
				});
			});
		}
		restoreBeforeDetach(root) {
			if (this.#destroyed) {
				return false;
			}
			if (!WindowFocusScope.#focusIsOursToMove(root)) {
				this.#opener = null;
				return false;
			}
			const opener = this.#opener;
			this.#opener = null;
			if (!WindowFocusScope.#isUsableOpener(opener, root)) {
				return true;
			}
			ui_a11y.FocusNavigator.restoreFocus(opener, {
				preventScroll: true
			});
			return document.activeElement !== opener;
		}
		releaseBeforeDetach(root) {
			if (this.#destroyed) {
				return false;
			}
			return WindowFocusScope.#focusIsOursToMove(root);
		}
		restoreAfterDetach() {
			if (this.#destroyed) {
				return;
			}
			ui_a11y.FocusMonitor.Instance.restoreFocus();
		}
		destroy() {
			this.#destroyed = true;
			this.#cancelScheduledFocus();
			this.#opener = null;
		}
		#mayTakeFocus(root) {
			if (WindowFocusScope.#focusIsOursToMove(root)) {
				return true;
			}
			return this.#opener !== null && ui_a11y.FocusNavigator.getActiveElement() === this.#opener;
		}
		#cancelScheduledFocus() {
			if (this.#handle !== null) {
				this.#scheduler.cancel(this.#handle);
				this.#handle = null;
			}
		}
		static #focusIsOursToMove(root) {
			const active = ui_a11y.FocusNavigator.getActiveElement();
			if (active === null || active === document.body) {
				return true;
			}
			return WindowFocusScope.#rootHoldsFocus(root, active);
		}
		static #rootHoldsFocus(root, active) {
			if (root === null) {
				return false;
			}
			const raw = document.activeElement;
			return root.contains(active) || root.contains(raw);
		}
		static #isUsableOpener(opener, root) {
			if (!opener || !opener.isConnected || opener === document.body) {
				return false;
			}
			return root === null || !root.contains(opener);
		}
		static #isValidOpener(candidate) {
			if (!candidate || candidate === document.body || !main_core.Type.isElementNode(candidate)) {
				return false;
			}
			return candidate.isConnected;
		}
	}

	exports.WindowFocusScope = WindowFocusScope;
	exports.resolveCallWindowName = resolveCallWindowName;
	exports.resolveCallWindowNameType = resolveCallWindowNameType;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX, BX.Call.Lib.ViewContract, BX.UI.Accessibility);
//# sourceMappingURL=a11y.bundle.js.map
