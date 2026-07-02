/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, im_application_core, ui_vue, im_component_notifications, im_provider_pull) {
	'use strict';

	/**
	 * Bitrix Im
	 * Core application
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */
	class NotificationsApplication {
		/* region 01. Initialize */

		constructor(params = {}) {
			this.inited = false;
			this.initPromise = new BX.Promise();
			this.params = params;
			this.template = null;
			this.rootNode = this.params.node || document.createElement('div');
			this.legacyMode = this.params.mode === 'legacy';
			this.initCounter = this.params.initCounter || null;
			this.templateTemp = null;
			this.eventBus = new ui_vue.VueVendorV2(); // TODO remove this! change to Bitrix EventEmitter

			this.initCore().then(() => this.initParams()).then(() => this.initComponent(this.legacyMode)).then(() => this.initPullClient()).then(() => this.initPullHandlers()).then(() => this.initComplete());
		}
		initPullClient() {
			this.pullClient = BX.PULL;
			return new Promise((resolve, reject) => resolve());
		}
		initPullHandlers() {
			this.pullClient.subscribe(new im_provider_pull.ImNotificationsPullHandler({
				store: this.controller.getStore(),
				application: this,
				controller: this.controller
			}));
			return new Promise((resolve, reject) => resolve());
		}
		initCore() {
			return new Promise((resolve, reject) => {
				im_application_core.Core.ready().then(controller => {
					this.controller = controller;
					resolve();
				});
			});
		}
		initParams() {
			if (this.initCounter) {
				this.controller.getStore().dispatch('notifications/setCounter', {
					unreadTotal: this.initCounter
				});
			}
			this.controller.getStore().subscribe(mutation => this.eventStoreInteraction(mutation));
			return new Promise((resolve, reject) => resolve());
		}
		initComponent(legacy) {
			if (legacy) {
				return new Promise((resolve, reject) => resolve());
			}
			let template;
			if (this.legacyMode) {
				template = '<bx-im-component-notifications/>';
			} else {
				template = `<div style="height: 400px; border: 1px solid #ccc;">
				<bx-im-component-notifications/>
			</div>`;
			}
			return this.controller.createVue(this, {
				el: this.rootNode,
				template
			}).then(vue => {
				this.template = vue;
				this.template.$el.id = this.rootNode.substr(1);
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

		hasVueInstance() {
			return this.template !== null;
		}
		destroyVueInstance() {
			this.template.$destroy();
			this.template = null;
		}
		eventStoreInteraction(data) {
			if (data.type === 'notifications/setCounter') {
				if (parseInt(data.payload) >= 0) {
					BXIM.notify.updateNotifyNextCount(parseInt(data.payload), true);
				}
			}
		}
	}

	exports.NotificationsApplication = NotificationsApplication;

})(this.BX.Messenger.Application = this.BX.Messenger.Application || {}, BX.Messenger.Application, BX, BX.Messenger, BX.Messenger.Provider.Pull);
//# sourceMappingURL=notifications.bundle.js.map
