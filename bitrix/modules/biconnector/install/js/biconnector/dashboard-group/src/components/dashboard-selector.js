import type { BitrixVueComponentProps } from 'ui.vue3';
import { DashboardType, type Dashboard } from '../type';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Dialog, Item } from 'ui.entity-selector';
import { Store } from '../store';

export const DashboardSelector: BitrixVueComponentProps = {
	props: {
		dashboards: {
			/** @type Dashboard[] */
			type: Array,
			required: true,
		},
	},
	data()
	{
		return {
			initialDashboardIds: [],
			bypassDeselectHandler: false,
		};
	},
	mounted()
	{
		this.initDialog();
	},
	methods: {
		onAddDashboardClick()
		{
			this.initialDashboardIds = this.dashboards.map((dashboard: Dashboard) => dashboard.id);
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
				height: 370,
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
				tagSelectorOptions: {
					events: {
						onBeforeTagRemove: (event: BaseEvent) => {
							if (this.bypassDeselectHandler)
							{
								return;
							}

							const tag = event.data.tag;
							const dashboardId = tag.getId();
							if (
								this.$store.getters.isSaveEnabled
								&& this.$store.getters.shouldShowDeleteWarning(dashboardId)
							)
							{
								event.preventDefault();
								this.dialog.setAutoHide(false);
								this.$emit('onBeforeRemoveConfirmation', { dashboardId });
							}
						},
					},
				},
				events: {
					'Item:onSelect': (event: BaseEvent) => {
						const item: Item = event.data.item;
						const dashboard: Dashboard = {
							id: item.getId(),
							name: item.getTitle(),
							type: item.getCustomData().get('type') ?? DashboardType.system,
							createdById: item.getCustomData().get('createdById'),
							scopes: item.getCustomData().get('scopes') ?? [],
						};
						this.$store.commit('addDashboard', dashboard);
						this.$emit('onDashboardsChange');
					},
					'Item:onBeforeDeselect': (event: BaseEvent) => {
						if (this.bypassDeselectHandler)
						{
							return;
						}

						const item: Item = event.data.item;
						const dashboardId = item.getId();
						if (
							this.$store.getters.isSaveEnabled
							&& this.$store.getters.shouldShowDeleteWarning(dashboardId)
						)
						{
							event.preventDefault();
							this.dialog.setAutoHide(false);
							this.$emit('onBeforeRemoveConfirmation', { dashboardId });
						}
					},
					'Item:onDeselect': (event: BaseEvent) => {
						const item: Item = event.data.item;
						this.$store.commit('removeDashboard', item.getId());
						this.$emit('onDashboardsChange');
					},
					onHide: (event: BaseEvent): void => {
						const wasChanged: boolean = !Store.areSetsEqual(
							new Set(this.initialDashboardIds),
							new Set(this.dashboards.map((dashboard: Dashboard) => dashboard.id)),
						);

						EventEmitter.emit(
							'BIConnector.GroupPopup.DashboardSelector:onDialogHide',
							{
								isDashboardListEdited: wasChanged,
							},
						);
					},
				},
			});
		},
		deselect(dashboardId: number)
		{
			this.bypassDeselectHandler = true;
			this.dialog.getItem({ entityId: 'biconnector-superset-dashboard', id: dashboardId })?.deselect();
		},
		resetDialog()
		{
			this.dialog.setAutoHide(true);
			this.bypassDeselectHandler = false;
		},
	},
	emits: [
		'onBeforeRemoveConfirmation',
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
		<div class="ui-btn --air ui-btn-md ui-btn-icon-add ui-icon-set__scope --with-left-icon --style-tinted ui-btn-no-caps"
			@click="onAddDashboardClick"
			ref="addDashboardButton"
		>
			<span class="ui-btn-text">
				{{ $Bitrix.Loc.getMessage('BI_GROUP_ADD_DASHBOARD') }}
			</span>
		</div>
	`,
};
