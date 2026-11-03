import { Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { BitrixVue } from 'ui.vue3';
import {
	TABLE_GROUP_POPUP_ID,
	type Table,
	type TableGroup,
	type TableGroupAppParams,
	type TableGroupAppState,
	TableGroupPopupEvent,
	TableGroupType,
} from '../const/type';
import { Store } from '../model/group-store';
import { App } from './app';

const NEW_GROUP_ID = 'new_T0';
const POPUP_CLASS = 'biconnector-table-group-popup';

const buildState = (appParams: TableGroupAppParams): TableGroupAppState => {
	const group: TableGroup = appParams.groups.find((item: TableGroup) => item.id === appParams.groupId) ?? {
		id: NEW_GROUP_ID,
		name: '',
		type: TableGroupType.custom,
		tableCodes: [],
	};

	return {
		group,
		otherGroups: appParams.groups.filter((item: TableGroup) => item.id !== group.id),
		tables: new Map(appParams.tables.map((table: Table) => [table.code, table])),
		saveEnabled: appParams.saveEnabled === true,
	};
};

export class TableGroupPopup
{
	static open(appParams: TableGroupAppParams): void
	{
		const store = Store.buildStore(buildState(appParams));
		const app = BitrixVue.createApp(App);
		app.use(store);

		const container: HTMLElement = Tag.render`
			<div class="biconnector-table-group --ui-context-content-light"></div>
		`;

		const popup = new Popup({
			id: TABLE_GROUP_POPUP_ID,
			// The class reaches the content container of the popup: the application fills its height
			// instead of the popup growing with the list.
			className: POPUP_CLASS,
			width: 800,
			height: 560,
			overlay: true,
			closeIcon: false,
			autoHide: true,
			padding: 0,
			cacheable: false,
			content: container,
			events: {
				onPopupClose: () => {
					EventEmitter.emit(TableGroupPopupEvent.PopupClose, {
						group: store.getters.groupData,
						isTitleEdited: store.getters.isTitleEdited,
						isTableListEdited: store.getters.isTableListEdited,
					});

					app.unmount();
				},
			},
		});

		popup.show();
		app.mount(container);
	}
}
