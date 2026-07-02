/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.Embedding = this.BX.Messenger.Embedding || {};
(function (exports, im_oldChatEmbedding_application_core, im_oldChatEmbedding_component_recentList) {
	'use strict';

	class SidebarApplication {
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
			this.initCore().then(() => this.initComponent()).then(() => this.initComplete());
		}
		initCore() {
			return new Promise(resolve => {
				im_oldChatEmbedding_application_core.Core.ready().then(controller => {
					this.controller = controller;
					resolve();
				});
			});
		}
		initComponent() {
			return this.controller.createVue(this, {
				name: this.#applicationName,
				el: this.rootNode,
				components: {
					RecentListComponent: im_oldChatEmbedding_component_recentList.RecentList
				},
				template: `<RecentListComponent :compactMode="true"/>`
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

	exports.SidebarApplication = SidebarApplication;

})(this.BX.Messenger.Embedding.Application = this.BX.Messenger.Embedding.Application || {}, BX.Messenger.Embedding.Application, BX.Messenger.Embedding.ComponentLegacy);
//# sourceMappingURL=sidebar.bundle.js.map
