/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, im_application_core, ui_vue) {
	'use strict';

	/**
	 * Bitrix Im
	 * Core application
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */
	class RecentApplication {
		/* region 01. Initialize */

		constructor(params = {}) {
			this.inited = false;
			this.initPromise = new BX.Promise();
			this.params = params;
			this.template = null;
			this.rootNode = this.params.node || document.createElement('div');
			this.isMessenger = params.hasDialog === true;
			this.templateTemp = null;
			this.rootNodeTemp = this.params.nodeTemp || document.createElement('div');
			this.eventBus = new ui_vue.VueVendorV2();
			this.initCore().then(result => this.initParams(result)).then(() => this.initComponent()).then(() => this.initComplete());
		}
		initCore() {
			return new Promise((resolve, reject) => {
				im_application_core.Core.ready().then(controller => {
					this.controller = controller;
					resolve();
				});
			});
		}
		initParams(controller) {
			return new Promise((resolve, reject) => resolve());
		}
		initComponent() {
			return this.controller.createVue(this, {
				el: this.rootNode,
				template: `<bx-im-component-recent :hasDialog="${this.isMessenger}"/>`
			}).then(vue => {
				this.template = vue;
				return new Promise((resolve, reject) => resolve());
			});
		}
		initComplete() {
			this.inited = true;
			this.initPromise.resolve(this);
		}
		ready() {
			if (this.inited) {
				let promise = new BX.Promise();
				promise.resolve(this);
				return promise;
			}
			return this.initPromise;
		}

		/* endregion 01. Initialize */

		/* region 02. Event Bus */
		emit(eventName, params = {}) {
			this.eventBus.$emit(eventName, params);
			return true;
		}
		listen(eventName, callback) {
			if (typeof callback !== 'function') {
				return false;
			}
			this.eventBus.$on(eventName, callback);
			return true;
		}
		/* endregion 02. Event Bus */
	}

	exports.RecentApplication = RecentApplication;

})(this.BX.Messenger.Application = this.BX.Messenger.Application || {}, BX.Messenger.Application, BX);
//# sourceMappingURL=recent.bundle.js.map
