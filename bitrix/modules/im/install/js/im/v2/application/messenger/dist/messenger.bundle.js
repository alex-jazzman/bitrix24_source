/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_component_messenger) {
	'use strict';

	class MessengerApplication {
		// assigned externally
		bitrixVue = null;
		#initPromise;
		#params = null;
		#vueInstance = null;
		#applicationName = 'Messenger';
		constructor(params = {}) {
			this.#params = params;
			this.#initPromise = this.#init();
		}
		ready() {
			return this.#initPromise;
		}
		async initComponent(node) {
			this.unmountComponent();
			this.#vueInstance = await im_v2_application_core.Core.createVue(this, {
				name: this.#applicationName,
				el: node,
				components: {
					MessengerComponent: im_v2_component_messenger.Messenger
				},
				template: '<MessengerComponent />'
			});
		}
		unmountComponent() {
			if (!this.#vueInstance) {
				return;
			}
			this.bitrixVue.unmount();
			this.#vueInstance = null;
		}
		async #init() {
			await this.#initCore();
			return this;
		}
		async #initCore() {
			im_v2_application_core.Core.setApplicationData(this.#params);
			await im_v2_application_core.Core.ready();
		}
	}

	exports.MessengerApplication = MessengerApplication;

})(this.BX.Messenger.v2.Application = this.BX.Messenger.v2.Application || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Component);
//# sourceMappingURL=messenger.bundle.js.map
