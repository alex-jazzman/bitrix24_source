/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core) {
	'use strict';

	const ViewDocumentVisibilityState = {
		hidden: 'hidden'};
	class DocumentVisibilityAdapter {
		#onHide;
		#onShow;
		#boundHandleVisibilityChange;
		constructor(config) {
			this.#onHide = config.onHide;
			this.#onShow = config.onShow;
			this.#boundHandleVisibilityChange = this.#handleVisibilityChange.bind(this);
		}
		isHidden() {
			return document.visibilityState === ViewDocumentVisibilityState.hidden;
		}
		#handleVisibilityChange() {
			if (document.visibilityState === ViewDocumentVisibilityState.hidden) {
				this.#onHide();
			} else {
				this.#onShow();
			}
		}
		start() {
			main_core.Event.bind(document, 'visibilitychange', this.#boundHandleVisibilityChange, {
				capture: true
			});
		}
		stop() {
			main_core.Event.unbind(document, 'visibilitychange', this.#boundHandleVisibilityChange, {
				capture: true
			});
		}
	}

	class WindowFocusVisibilityAdapter {
		#onHide;
		#onShow;
		#boundHandleOnBlur;
		#boundHandleOnShowOnce;
		#isHidden = false;
		#listenerTimer;
		constructor(config) {
			this.#onHide = config.onHide;
			this.#onShow = config.onShow;
			this.#boundHandleOnBlur = this.#handleOnBlur.bind(this);
			this.#boundHandleOnShowOnce = this.#onShowOnce.bind(this);
		}
		isHidden() {
			return this.#isHidden;
		}
		#onShowOnce() {
			main_core.Event.unbind(window, 'focus', this.#boundHandleOnShowOnce);
			main_core.Event.unbind(window, 'click', this.#boundHandleOnShowOnce);
			this.#isHidden = false;
			this.#onShow();
		}
		#handleOnBlur() {
			this.#isHidden = true;
			this.#onHide();
			this.#listenerTimer = setTimeout(() => {
				this.#listenerTimer = undefined;
				main_core.Event.bind(window, 'focus', this.#boundHandleOnShowOnce);
				main_core.Event.bind(window, 'click', this.#boundHandleOnShowOnce);
			}, 0);
		}
		start() {
			this.#isHidden = false;
			main_core.Event.bind(window, 'blur', this.#boundHandleOnBlur);
		}
		stop() {
			main_core.Event.unbind(window, 'blur', this.#boundHandleOnBlur);
			main_core.Event.unbind(window, 'focus', this.#boundHandleOnShowOnce);
			main_core.Event.unbind(window, 'click', this.#boundHandleOnShowOnce);
			clearTimeout(this.#listenerTimer);
			this.#listenerTimer = undefined;
		}
	}

	class AutoPipPolicy {
		#togglePip;
		#isScreenSharing;
		#isFolded;
		#isVideoconf;
		#updateButtons;
		#isConnected;
		#isShown;
		#enableAutoPip = false;
		constructor(config) {
			this.#togglePip = config.togglePip;
			this.#isScreenSharing = config.isScreenSharing;
			this.#isFolded = config.isFolded;
			this.#isVideoconf = config.isVideoconf;
			this.#updateButtons = config.updateButtons;
			this.#isConnected = config.isConnected;
			this.#isShown = config.isShown;
		}
		get enableAutoPip() {
			return this.#enableAutoPip;
		}
		onDocumentHide() {
			this.#updateButtons();
			if (this.#isVideoconf() && (!this.#isConnected() || !this.#isShown())) {
				return;
			}
			this.#togglePip(true);
			this.#enableAutoPip = true;
		}
		onDocumentShow() {
			this.#updateButtons();
			this.#enableAutoPip = false;
			if (this.#isScreenSharing()) {
				return;
			}
			if (this.#isFolded()) {
				return;
			}
			this.#togglePip(false);
		}
		onFocusHide() {
			this.#enableAutoPip = true;
			this.#togglePip(true);
		}
		onFocusShow() {
			this.#enableAutoPip = false;
			if (this.#isScreenSharing()) {
				return;
			}
			if (this.#isFolded()) {
				return;
			}
			this.#togglePip(false);
		}
		deactivate() {
			this.#enableAutoPip = false;
		}
	}

	class PipCoordinator {
		#policy;
		#docAdapter;
		#focusAdapter;
		constructor(config) {
			this.#policy = new AutoPipPolicy(config);
			this.#docAdapter = new DocumentVisibilityAdapter({
				onHide: () => this.#policy.onDocumentHide(),
				onShow: () => this.#policy.onDocumentShow()
			});
			this.#focusAdapter = config.isMacDesktop ? new WindowFocusVisibilityAdapter({
				onHide: () => this.#policy.onFocusHide(),
				onShow: () => this.#policy.onFocusShow()
			}) : null;
		}
		get enableAutoPip() {
			return this.#policy.enableAutoPip;
		}
		isHidden() {
			return this.#docAdapter.isHidden();
		}
		deactivate() {
			this.#policy.deactivate();
		}
		start() {
			this.#docAdapter.start();
			this.#focusAdapter?.start();
		}
		stop() {
			this.#docAdapter.stop();
			this.#focusAdapter?.stop();
		}
	}

	exports.AutoPipPolicy = AutoPipPolicy;
	exports.DocumentVisibilityAdapter = DocumentVisibilityAdapter;
	exports.PipCoordinator = PipCoordinator;
	exports.WindowFocusVisibilityAdapter = WindowFocusVisibilityAdapter;

})(this.BX.Call.Feature = this.BX.Call.Feature || {}, BX);
//# sourceMappingURL=call-pip.bundle.js.map
