/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_escManager) {
	'use strict';

	class BulkActionsManager {
		static #instance;
		#emitter;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		constructor() {
			this.keyPressHandler = this.#onKeyPressCloseBulkActions.bind(this);
		}
		bindEvents(context) {
			const {
				emitter
			} = context;
			this.#emitter = emitter;
			this.#emitter.subscribe(im_v2_const.EventType.dialog.openBulkActionsMode, this.enableBulkMode.bind(this));
			this.#emitter.subscribe(im_v2_const.EventType.dialog.closeBulkActionsMode, this.disableBulkMode.bind(this));
		}
		enableBulkMode(event) {
			const {
				messageId,
				dialogId
			} = event.getData();
			void im_v2_application_core.Core.getStore().dispatch('messages/select/enableBulkMode', {
				messageId,
				dialogId
			});
			this.#bindEscHandler();
		}
		disableBulkMode(event) {
			const {
				dialogId
			} = event.getData();
			void im_v2_application_core.Core.getStore().dispatch('messages/select/disableBulkMode', {
				dialogId
			});
			this.#unbindEscHandler();
		}
		clearCollection() {
			void im_v2_application_core.Core.getStore().dispatch('messages/select/clearCollection');
			this.#unbindEscHandler();
		}
		#bindEscHandler() {
			this.#emitter.subscribe(im_v2_const.EventType.key.onBeforeEscape, this.keyPressHandler);
		}
		#unbindEscHandler() {
			this.#emitter.unsubscribe(im_v2_const.EventType.key.onBeforeEscape, this.keyPressHandler);
		}
		#onKeyPressCloseBulkActions() {
			this.clearCollection();
			return im_v2_lib_escManager.EscEventAction.handled;
		}
	}

	exports.BulkActionsManager = BulkActionsManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=bulk-actions.bundle.js.map
