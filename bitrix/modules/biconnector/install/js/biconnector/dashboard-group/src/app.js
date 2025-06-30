import { ajax as Ajax, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup, PopupManager } from 'main.popup';
import { BIcon, Set } from 'ui.icon-set.api.vue';
import type { BitrixVueComponentProps } from 'ui.vue3';
import { DashboardItem } from './components/dashboard-item';
import { DashboardSelector } from './components/dashboard-selector';
import { DeletionWarningPopup } from './components/deletion-warning-popup';
import { GroupScopeSelector } from './components/group-scope-selector';
import { TitleEditor } from './components/title-editor';
import type { Dashboard } from './type';

export const App: BitrixVueComponentProps = {
	mounted(): void
	{},
	data(): Object
	{
		return {
			deletionWarning: {
				popupShown: false,
				dashboardId: null,
			},
		};
	},
	computed: {
		isNoDashboards(): boolean
		{
			return this.$store.state.group.dashboardIds.length === 0;
		},
		dashboards(): Dashboard[]
		{
			return this.$store.getters.groupDashboardsData;
		},
		isSystemGroup(): boolean
		{
			return this.$store.getters.isSystemGroup;
		},
		isSaveEnabled(): boolean
		{
			return this.$store.getters.isSaveEnabled;
		},
		isLoading(): boolean
		{
			return this.$store.getters.isLoading;
		},
		isDashboardListScrollable(): boolean
		{
			if (this.isSaveEnabled)
			{
				return this.dashboards.length > 6;
			}

			return this.dashboards.length > 7;
		},
		set(): Set
		{
			return Set;
		},
	},
	methods: {
		updateRight(): void
		{
			EventEmitter.emit('BIConnector.GroupPopup:onGroupUpdated', {
				group: Runtime.clone(this.$store.getters.groupData),
				dashboards: Runtime.clone(this.$store.getters.dashboards),
			});
		},
		onGroupScopeAdd(event): void
		{
			this.$store.commit('addGroupScope', event);
			this.updateRight();
			for (const dashboardItem of this.$refs.dashboardItem ?? [])
			{
				dashboardItem.onGroupScopeChanged();
			}
		},
		onGroupScopeRemove(event): void
		{
			this.$store.commit('removeGroupScope', event);
			this.updateRight();
			for (const dashboardItem of this.$refs.dashboardItem ?? [])
			{
				dashboardItem.onGroupScopeChanged();
			}
		},
		onDashboardRemove(event): void
		{
			if (
				this.isSaveEnabled
				&& this.$store.getters.isNeedShowDeletionWarningPopup
			)
			{
				this.deletionWarning.dashboardId = event.dashboardId;
				this.deletionWarning.popupShown = true;
			}
			else
			{
				this.$store.commit('removeDashboard', event.dashboardId);
				this.updateRight();
			}
		},
		confirmDashboardDeletion(event): void
		{
			this.$store.commit('removeDashboard', this.deletionWarning.dashboardId);
			if (event.dontShow)
			{
				BX.userOptions.save('biconnector', 'deleteDashboardFromGroupPopup', 'needShow', false);
				this.$store.commit('setShowDeletionWarningPopup', false);
			}
			this.deletionWarning.dashboardId = null;
			this.deletionWarning.popupShown = false;
			this.updateRight();
		},
		cancelDashboardDeletion(): void
		{
			this.deletionWarning.dashboardId = null;
			this.deletionWarning.popupShown = false;
		},
		saveGroup(): void
		{
			this.$store.commit('setIsLoading', true);
			Ajax.runAction('biconnector.group.save', {
				data: {
					group: this.$store.getters.groupData,
					dashboards: [...this.$store.getters.dashboards.values()],
				},
			})
				.then(() => {
					this.$store.commit('setIsLoading', false);
					this.closePopup();
					EventEmitter.emit('BIConnector.GroupPopup:onGroupSaved', {
						group: Runtime.clone(this.$store.getters.groupData),
						dashboards: Runtime.clone(this.$store.getters.dashboards),
					});
				})
				.catch((response) => {
					BX.UI.Notification.Center.notify({
						content: response.errors[0]?.message,
					});
					this.$store.commit('setIsLoading', false);
				})
			;
		},
		closePopup(): void
		{
			const popup: Popup = PopupManager.getPopupById('biconnector-dashboard-group');
			popup.close();
		},
	},
	components: {
		BIcon,
		DashboardItem,
		DashboardSelector,
		GroupScopeSelector,
		TitleEditor,
		DeletionWarningPopup,
	},
	template: `
		<div class="group-header">
			<TitleEditor @on-name-update="updateRight" :can-edit="!isSystemGroup"/>
			<div class="group-header-controls">
				<BIcon
					:name="set.CROSS_25"
					:size="25"
					color="#BDC1C6"
					:class="'group-close'"
					@click="closePopup"
				></BIcon>
			</div>
		</div>
		<div class="group-button-panel">
			<div class="group-button-wrapper">
				<DashboardSelector :dashboards="dashboards" @on-dashboards-change="updateRight"/>
			</div>
			<div class="group-scope-selector">
				<GroupScopeSelector @on-group-scope-add="onGroupScopeAdd" @on-group-scope-remove="onGroupScopeRemove" :can-edit="!isSystemGroup"/>
			</div>
		</div>
		<div class="group-dashboard-empty" v-if="isNoDashboards">
			<img class="group-dashboard-empty-image" src="/bitrix/images/biconnector/dashboard-groups/empty-state.svg" alt="No dashboards">
			<div class="group-dashboard-empty-title">{{ $Bitrix.Loc.getMessage('BI_GROUP_EMPTY_TITLE') }}</div>
			<div class="group-dashboard-empty-subtitle">{{ $Bitrix.Loc.getMessage('BI_GROUP_EMPTY_SUBTITLE') }}</div>
		</div>
		<div class="group-dashboard-list" :class="{'group-dashboard-list-scroll': isDashboardListScrollable}" v-else>
			<DashboardItem 
				v-for="dashboard of dashboards" 
				ref="dashboardItem" 
				:dashboard="dashboard" 
				@on-dashboard-change="updateRight"
				@on-dashboard-remove="onDashboardRemove"
			/>
		</div>
		<div class="group-footer" v-if="isSaveEnabled">
			<div
				:class="['ui-btn ui-btn-primary ui-btn-md ui-btn-round ui-btn-no-caps group-footer-button', {'ui-btn-disabled ui-btn-clock': isLoading}]" 
				@click="saveGroup"
			>
				{{ $Bitrix.Loc.getMessage('BI_GROUP_SAVE') }}
			</div>
			<div
				class="ui-btn ui-btn-light-border ui-btn-md ui-btn-round ui-btn-no-caps group-footer-button"
				@click="closePopup"
			>
				{{ $Bitrix.Loc.getMessage('BI_GROUP_SAVE_CANCEL') }}
			</div>
		</div>
		<div class="group-loader" v-if="isLoading"></div>
		<DeletionWarningPopup 
			v-if="deletionWarning.popupShown" 
			@confirm="confirmDashboardDeletion" 
			@close="cancelDashboardDeletion"
		/>
	`,
};
