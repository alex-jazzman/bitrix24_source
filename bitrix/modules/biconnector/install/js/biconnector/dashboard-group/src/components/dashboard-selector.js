import type { BitrixVueComponentProps } from 'ui.vue3';
import { DashboardType, type Dashboard } from '../type';
import { BaseEvent } from 'main.core.events';
import { Dialog, Item } from 'ui.entity-selector';

export const DashboardSelector: BitrixVueComponentProps = {
	props: {
		dashboards: {
			/** @type Dashboard[] */
			type: Array,
			required: true,
		},
	},
	mounted()
	{
		this.initDialog();
	},
	methods: {
		onAddDashboardClick()
		{
			this.dialog.show();
		},
		initDialog()
		{
			const preselectedItems = [];
			for (const dashboard: Dashboard of this.dashboards)
			{
				preselectedItems.push(['biconnector-superset-dashboard', dashboard.id]);
			}
			this.dialog = new Dialog({
				id: 'group-dashboard-selector',
				targetNode: this.$refs.addDashboardButton,
				width: 400,
				height: 300,
				dropdownMode: true,
				enableSearch: true,
				preload: true,
				preselectedItems,
				entities: [
					{
						id: 'biconnector-superset-dashboard',
						dynamicLoad: true,
						dynamicSearch: true,
						options: {
							loadProxyData: false,
							checkAccessRights: this.$store.getters.isSaveEnabled,
						},
					},
				],
				events: {
					'Item:onSelect': (event: BaseEvent) => {
						const item: Item = event.data.item;
						const dashboard: Dashboard = {
							id: item.getId(),
							name: item.getTitle(),
							type: item.getCustomData().get('type') ?? DashboardType.system,
							scopes: item.getCustomData().get('scopes') ?? [],
						};
						this.$store.commit('addDashboard', dashboard);
						this.$emit('onDashboardsChange');
					},
					'Item:onDeselect': (event: BaseEvent) => {
						const item = event.data.item;
						this.$store.commit('removeDashboard', item.getId());
						this.$emit('onDashboardsChange');
					},
				},
			});
		},
	},
	emits: [
		'onDashboardsChange',
	],
	watch: {
		dashboards(newValue, oldValue)
		{
			const dialog: Dialog = this.dialog;
			for (const oldItem of oldValue)
			{
				if (!newValue.includes(oldItem))
				{
					dialog.getItem(['biconnector-superset-dashboard', oldItem.id])?.deselect();
				}
			}
		},
	},
	template: `
		<div class="ui-btn ui-btn-primary ui-btn-sm ui-btn-round ui-btn-icon-add ui-btn-no-caps group-add-dashboards-button"
			@click="onAddDashboardClick"
			ref="addDashboardButton"
		>
			{{ $Bitrix.Loc.getMessage('BI_GROUP_ADD_DASHBOARD') }}
		</div>
	`,
};
