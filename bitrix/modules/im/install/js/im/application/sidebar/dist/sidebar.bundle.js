/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, im_application_core, ui_vue, ui_vue_vuex) {
	'use strict';

	/**
	 * Bitrix im
	 * Sidebar vue component
	 *
	 * @package bitrix
	 * @subpackage mobile
	 * @copyright 2001-2019 Bitrix
	 */


	/**
	 * @notice Do not mutate or clone this component! It is under development.
	 */
	ui_vue.BitrixVue.component('bx-im-component-sidebar', {
		data: function () {
			return {};
		},
		created() {},
		computed: {
			...ui_vue_vuex.Vuex.mapState({
				recent: state => state.recent.collection.general,
				pinned: state => state.recent.collection.pinned
			}),
			recentData() {
				return [...this.recent, ...this.pinned];
			}
		},
		methods: {
			getController() {
				return this.$Bitrix.Data.get('controller');
			},
			getStore() {
				return this.getController().store;
			},
			onScroll(event) {
				if (this.oneScreenRemaining(event)) {
					this.getController().recent.loadMore();
				}
			},
			onClick(event) {
				this.getController().recent.openOldDialog(event);
			},
			onRightClick(event) {
				this.getController().recent.openOldContextMenu(event);
			},
			oneScreenRemaining(event) {
				return event.target.scrollTop + event.target.clientHeight >= event.target.scrollHeight - event.target.clientHeight;
			}
		},
		template: `
			<div class="sidebar-wrap">
				<bx-im-view-list-sidebar
					:recentData="recentData"
					@scroll="onScroll"
					@click="onClick"
					@rightClick="onRightClick"
				/>
			</div>
		`
	});

	/**
	 * Bitrix Im
	 * Core application
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */
	class SidebarApplication {
		/* region 01. Initialize */

		constructor(params = {}) {
			this.inited = false;
			this.initPromise = new BX.Promise();
			this.params = params;
			this.template = null;
			this.rootNode = this.params.node || document.createElement('div');
			this.templateTemp = null;
			this.rootNodeTemp = this.params.nodeTemp || document.createElement('div');
			this.eventBus = new ui_vue.VueVendorV2();
			this.initCore().then(() => this.initParams()).then(() => this.initComponent()).then(() => this.initComplete());
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
			return new Promise((resolve, reject) => resolve());
		}
		initComponent() {
			return this.controller.createVue(this, {
				el: this.rootNode,
				template: `<bx-im-component-sidebar/>`
			}).then(vue => {
				this.template = vue;
				return new Promise((resolve, reject) => resolve());
			});
		}
		initComplete() {
			this.inited = true;
			this.initPromise.resolve(this);
			return this.requestData();
		}
		requestData() {
			this.controller.recent.drawPlaceholders();
			this.controller.recent.getRecentData();
			return new Promise((resolve, reject) => resolve());
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

	exports.SidebarApplication = SidebarApplication;

})(this.BX.Messenger.Application = this.BX.Messenger.Application || {}, BX.Messenger.Application, BX, BX);
//# sourceMappingURL=sidebar.bundle.js.map
