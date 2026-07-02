/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_component_quickAccess) {
	'use strict';

	class QuickAccessApplication {
		inited = false;
		initPromise = null;
		initPromiseResolver = null;
		rootNode = null;
		vueInstance = null;
		controller = null;
		#applicationName = 'Sidebar';
		constructor(params = {}) {
			this.initPromise = new Promise(resolve => {
				this.initPromiseResolver = resolve;
			});
			this.params = params;
			this.rootNode = this.params.node || document.createElement('div');

			// eslint-disable-next-line promise/catch-or-return
			this.initCore().then(() => this.initComponent()).then(() => this.initComplete());
		}
		async initCore() {
			im_v2_application_core.Core.setApplicationData(this.params);
			this.controller = await im_v2_application_core.Core.ready();
			return true;
		}
		async initComponent() {
			this.vueInstance = await this.controller.createVue(this, {
				name: this.#applicationName,
				el: this.rootNode,
				components: {
					QuickAccess: im_v2_component_quickAccess.QuickAccess
				},
				template: '<QuickAccess />'
			});
			return true;
		}
		initComplete() {
			this.inited = true;
			this.initPromiseResolver(this);
			return Promise.resolve();
		}
		ready() {
			if (this.inited) {
				return Promise.resolve(this);
			}
			return this.initPromise;
		}
	}

	exports.QuickAccessApplication = QuickAccessApplication;

})(this.BX.Messenger.v2.Application = this.BX.Messenger.v2.Application || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Component);
//# sourceMappingURL=quick-access.js.bundle.js.map
