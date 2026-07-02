/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.Embedding = this.BX.Messenger.Embedding || {};
(function (exports, im_oldChatEmbedding_application_core, im_oldChatEmbedding_component_leftPanel) {
	'use strict';

	class LeftPanelApplication {
		inited = false;
		initPromise = null;
		initPromiseResolver = null;
		rootNode = null;
		vueInstance = null;
		controller = null;
		bitrixVue = null;
		#applicationName = 'LeftPanel';
		constructor(params = {}) {
			this.initPromise = new Promise(resolve => {
				this.initPromiseResolver = resolve;
			});
			this.params = params;
			this.rootNode = this.params.node || document.createElement('div');
			this.initCore().then(() => this.initComplete());
		}
		initCore() {
			return new Promise(resolve => {
				im_oldChatEmbedding_application_core.Core.ready().then(controller => {
					this.controller = controller;
					resolve();
				});
			});
		}
		initComponent(node) {
			if (this.vueInstance) {
				this.bitrixVue.unmount();
				this.vueInstance = null;
			}
			return this.controller.createVue(this, {
				name: this.#applicationName,
				el: node,
				components: {
					LeftPanelComponent: im_oldChatEmbedding_component_leftPanel.LeftPanel
				},
				template: `<LeftPanelComponent />`
			}).then(vue => {
				this.vueInstance = vue;
				return Promise.resolve();
			});
		}
		initComplete() {
			this.inited = true;
			this.initPromiseResolver(this);
		}
		ready() {
			if (this.inited) {
				return Promise.resolve(this);
			}
			return this.initPromise;
		}
	}

	exports.LeftPanelApplication = LeftPanelApplication;

})(this.BX.Messenger.Embedding.Application = this.BX.Messenger.Embedding.Application || {}, BX.Messenger.Embedding.Application, BX.Messenger.Embedding.ComponentLegacy);
//# sourceMappingURL=left-panel.bundle.js.map
