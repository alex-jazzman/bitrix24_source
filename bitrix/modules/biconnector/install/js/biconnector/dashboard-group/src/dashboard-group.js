import { EventEmitter } from 'main.core.events';
import { Popup, PopupManager } from 'main.popup';
import { BitrixVue } from 'ui.vue3';
import { Store } from './store';
import { App } from './app';
import { GROUP_POPUP_ID } from './const';
import { type Group, GroupAppParams, GroupAppState, GroupType } from './type';

export class DashboardGroup
{
	static open(appParams: GroupAppParams = {})
	{
		// The popup is not cacheable, so it exists only while it is open.
		if (PopupManager.isPopupExists(GROUP_POPUP_ID))
		{
			return;
		}

		const app = this.getApp(appParams);

		const popup = new Popup({
			id: GROUP_POPUP_ID,
			width: 800,
			height: 560,
			overlay: true,
			closeIcon: false,
			autoHide: true,
			padding: 0,
			cacheable: false,
			content: '<div id="app"></div>',
			events: {
				onPopupClose: () => {
					EventEmitter.emit('BIConnector.Internal.GroupPopup:onPopupClose');

					app.unmount();
				},
			},
		});
		popup.show();
		app.mount('#app');
	}

	static getApp(appParams: GroupAppParams = {})
	{
		let group: Group = appParams.groups.find((item: Group) => item.id === appParams.groupId);
		if (!group)
		{
			group = {
				id: 'new_G0',
				name: '',
				type: GroupType.custom,
				scopes: [],
				dashboardIds: [],
			};
		}
		const state: GroupAppState = {
			group,
			otherGroups: appParams.groups.filter((item: Group) => item.id !== appParams.groupId),
			dashboards: appParams.dashboards,
			saveEnabled: appParams.saveEnabled,
			isLoading: false,
			user: appParams.user,
		};

		const app = BitrixVue.createApp({
			name: 'GroupPopupApp',
			data()
			{
				return {};
			},
			components: {
				App,
			},
			computed: {
				componentName()
				{
					return App;
				},
			},
			// language=Vue
			template: `
				<App/>
			`,
		});

		const store = Store.buildStore(state);
		app.use(store);

		return app;
	}
}
