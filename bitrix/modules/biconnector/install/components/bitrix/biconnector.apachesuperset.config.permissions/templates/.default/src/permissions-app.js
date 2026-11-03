import { Loc, Runtime } from 'main.core';
import type { BitrixVueComponentProps } from 'ui.vue3';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { DashboardGroup, type Group, type Dashboard, GroupType } from 'biconnector.dashboard-group';
import { TableGroupPopup, type TableGroup, TableGroupType } from 'biconnector.table-group';
import { PermissionsAnalytics, PermissionsAnalyticsSource } from 'biconnector.apache-superset-analytics';
import { SectionCode } from './type';

// The recognizer repeats the server one (/^T(0|[1-9]\d*)$/D) and adds the new_T<N> placeholder of an unsaved row.
const TABLE_RIGHT_ID_PATTERN = /^(new_)?T(0|[1-9]\d*)$/;
const NEW_TABLE_RIGHT_ID_PREFIX = 'new_T';

export const PermissionsApp: BitrixVueComponentProps = {
	props: {},
	mounted(): void
	{
		EventEmitter.subscribe('BX.UI.AccessRights.V2:onSectionHeaderClick', this.handleOnSectionHeaderClick);
		EventEmitter.subscribe('BX.UI.AccessRights.V2:onRightClick', this.handleOnRightClick);
		EventEmitter.subscribe('BX.UI.AccessRights.V2:onRightDelete', this.handleOnRightDelete);
		EventEmitter.subscribe('BX.UI.AccessRights.V2:additionalRightData', this.getRightDataForSave);
		EventEmitter.subscribe('BX.UI.AccessRights.V2:afterSave', this.afterSaveRights);
		EventEmitter.subscribe('BX.UI.AccessRights.V2:onResetState', this.handleResetState);
		EventEmitter.subscribe('BIConnector.GroupPopup:onGroupUpdated', this.handleGroupChange);
		EventEmitter.subscribe('BIConnector.GroupPopup:onPopupClose', this.handleGroupPopupClose);
		EventEmitter.subscribe('BIConnector.GroupPopup.DashboardScopeSelector:onDialogHide', this.handleDashboardScopeSelectorClose);
		EventEmitter.subscribe('BIConnector.GroupPopup.ScopeSelector:onDialogHide', this.handleScopeSelectorClose);
		EventEmitter.subscribe('BIConnector.GroupPopup.DashboardSelector:onDialogHide', this.handleDashboardListEdit);
		EventEmitter.subscribe('BIConnector.GroupPopup.DashboardList:onDashboardRemove', this.handleDashboardListEdit);
		EventEmitter.subscribe('BIConnector.TableGroupPopup:onGroupUpdated', this.handleTableGroupChange);
		EventEmitter.subscribe('BIConnector.TableGroupPopup:onPopupClose', this.handleTableGroupChange);
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe('BX.UI.AccessRights.V2:onSectionHeaderClick', this.handleOnSectionHeaderClick);
		EventEmitter.unsubscribe('BX.UI.AccessRights.V2:onRightClick', this.handleOnRightClick);
		EventEmitter.unsubscribe('BX.UI.AccessRights.V2:onRightDelete', this.handleOnRightDelete);
		EventEmitter.unsubscribe('BX.UI.AccessRights.V2:additionalRightData', this.getRightDataForSave);
		EventEmitter.unsubscribe('BX.UI.AccessRights.V2:afterSave', this.afterSaveRights);
		EventEmitter.unsubscribe('BX.UI.AccessRights.V2:onResetState', this.handleResetState);
		EventEmitter.unsubscribe('BIConnector.GroupPopup:onGroupUpdated', this.handleGroupChange);
		EventEmitter.unsubscribe('BIConnector.GroupPopup:onPopupClose', this.handleGroupPopupClose);
		EventEmitter.unsubscribe('BIConnector.GroupPopup.DashboardScopeSelector:onDialogHide', this.handleDashboardScopeSelectorClose);
		EventEmitter.unsubscribe('BIConnector.GroupPopup.ScopeSelector:onDialogHide', this.handleScopeSelectorClose);
		EventEmitter.unsubscribe('BIConnector.GroupPopup.DashboardSelector:onDialogHide', this.handleDashboardListEdit);
		EventEmitter.unsubscribe('BIConnector.GroupPopup.DashboardList:onDashboardRemove', this.handleDashboardListEdit);
		EventEmitter.unsubscribe('BIConnector.TableGroupPopup:onGroupUpdated', this.handleTableGroupChange);
		EventEmitter.unsubscribe('BIConnector.TableGroupPopup:onPopupClose', this.handleTableGroupChange);
	},
	computed: {},
	methods: {
		handleDashboardScopeSelectorClose(event: BaseEvent): void
		{
			if (!event.getData()?.isScopeListEdited)
			{
				return;
			}

			PermissionsAnalytics.sendGroupDashboardScopeEditAnalytics(
				PermissionsAnalyticsSource.permissionsSlider,
			);
		},
		handleDashboardListEdit(event: BaseEvent): void
		{
			if (!event.getData()?.isDashboardListEdited)
			{
				return;
			}

			PermissionsAnalytics.sendGroupDashboardEditAnalytics(
				PermissionsAnalyticsSource.permissionsSlider,
			);
		},
		handleScopeSelectorClose(event: BaseEvent): void
		{
			if (!event.getData()?.isScopeListEdited)
			{
				return;
			}

			PermissionsAnalytics.sendGroupScopeEditAnalytics(
				PermissionsAnalyticsSource.permissionsSlider,
			);
		},
		handleGroupPopupClose(event: BaseEvent): void
		{
			const eventData = event.getData();
			const group = eventData?.group;
			const isTitleEdited = eventData?.isTitleEdited;
			const isDashboardListEdited = eventData?.isDashboardListEdited;
			const isScopeListEdited = eventData?.isScopeListEdited;

			if (!group || (!isTitleEdited && !isDashboardListEdited && !isScopeListEdited))
			{
				return;
			}

			PermissionsAnalytics.sendGroupActionAnalytics(
				PermissionsAnalyticsSource.permissionsSlider,
				false,
				isDashboardListEdited,
				isScopeListEdited,
			);
		},
		isTableRightId(rightId: string): boolean
		{
			return TABLE_RIGHT_ID_PATTERN.test(String(rightId));
		},
		openTableGroupPopup(groupId: string): void
		{
			TableGroupPopup.open({
				groupId,
				groups: Runtime.clone(this.$store.getters.tableGroups),
				tables: Runtime.clone(this.$store.getters.tables),
			});
		},
		addTableGroupRight(existingRightIds: Set<string>): void
		{
			let groupIndex = 0;
			while (existingRightIds.has(`${NEW_TABLE_RIGHT_ID_PREFIX}${groupIndex}`))
			{
				groupIndex++;
			}

			const right = { ...this.$store.getters.newTableGroupPermissions };
			right.id = `${NEW_TABLE_RIGHT_ID_PREFIX}${groupIndex}`;
			const group: TableGroup = {
				id: right.id,
				name: Loc.getMessage('BI_TABLE_GROUP_NAME_NEW'),
				type: TableGroupType.custom,
				tableCodes: [],
			};
			this.$store.commit('addTableGroup', group);
			EventEmitter.emit('BX.UI.AccessRights.V2:addRight', {
				guid: this.$store.getters.appGuid,
				sectionCode: SectionCode.tableGroup,
				right,
			});
			this.openTableGroupPopup(group.id);
		},
		handleOnSectionHeaderClick(event: BaseEvent): void
		{
			const eventData = event.getData();
			if (eventData.section?.sectionCode === SectionCode.tableGroup)
			{
				this.addTableGroupRight(new Set(eventData.section.rights.keys()));

				return;
			}

			PermissionsAnalytics.sendClickGroupActionAnalytics(
				PermissionsAnalyticsSource.permissionsSlider,
				true,
			);

			if (eventData.section?.sectionCode === SectionCode.dashboardGroup)
			{
				const rightCodes = new Set(eventData.section.rights.keys());
				let groupIndex = 0;
				while (rightCodes.has(`new_G${groupIndex}`))
				{
					groupIndex++;
				}
				const newGroupCode = `new_G${groupIndex}`;
				const right = { ...this.$store.getters.newGroupPermissions };
				right.id = newGroupCode;
				const group: Group = {
					id: right.id,
					name: this.$Bitrix.Loc.getMessage('BI_GROUP_NEW_TITLE'),
					type: GroupType.custom,
					dashboardIds: [],
					scopes: [],
				};
				this.$store.commit('addGroup', group);
				EventEmitter.emit('BX.UI.AccessRights.V2:addRight', {
					guid: this.$store.getters.appGuid,
					sectionCode: SectionCode.dashboardGroup,
					right,
				});
				this.right = right;
				DashboardGroup.open({
					groupId: Runtime.clone(right.id),
					groups: Runtime.clone(this.$store.getters.groups),
					dashboards: Runtime.clone(this.$store.getters.dashboards),
					saveEnabled: false,
					user: this.$store.getters.user,
				});
			}
		},
		handleOnRightClick(event: BaseEvent): void
		{
			const eventData = event.getData();
			if (eventData.right && this.isTableRightId(eventData.right.id))
			{
				this.openTableGroupPopup(eventData.right.id);

				return;
			}

			PermissionsAnalytics.sendClickGroupActionAnalytics(
				PermissionsAnalyticsSource.permissionsSlider,
				false,
			);

			if (eventData.right)
			{
				/** @type AccessRightItem */
				this.right = eventData.right;
				const rightId = eventData.right.id;
				DashboardGroup.open({
					groupId: Runtime.clone(rightId),
					groups: Runtime.clone(this.$store.getters.groups),
					dashboards: Runtime.clone(this.$store.getters.dashboards),
					saveEnabled: false,
					user: this.$store.getters.user,
				});
			}
		},
		handleOnRightDelete(event: BaseEvent): void
		{
			const eventData = event.getData();
			if (eventData.right && this.isTableRightId(eventData.right.id))
			{
				this.$store.commit('deleteTableGroup', eventData.right.id);

				return;
			}

			PermissionsAnalytics.sendGroupDeleteAnalytics(PermissionsAnalyticsSource.permissionsSlider);

			if (eventData.right)
			{
				this.$store.commit('deleteGroup', eventData.right.id);
			}
		},
		handleGroupChange(event: BaseEvent): void
		{
			const group: Group = event.getData()?.group;
			const dashboards: Map<number, Dashboard> = event.getData()?.dashboards;
			if (!group && !dashboards)
			{
				return;
			}

			/** @type AccessRightItem */
			const right = this.right;
			if (right)
			{
				this.$store.commit('updateGroup', { group, dashboards });
				EventEmitter.emit('BX.UI.AccessRights.V2:updateRightTitle', {
					guid: this.$store.getters.appGuid,
					sectionCode: SectionCode.dashboardGroup,
					rightId: right.id,
					rightTitle: group.name,
				});
				EventEmitter.emit('BX.UI.AccessRights.V2:updateRightSubtitle', {
					guid: this.$store.getters.appGuid,
					sectionCode: SectionCode.dashboardGroup,
					rightId: right.id,
					rightSubtitle: Loc.getMessagePlural('BI_GROUP_SUBTITLE', group.dashboardIds.length, {
						'#COUNT#': group.dashboardIds.length,
					}),
				});
			}
		},
		handleTableGroupChange(event: BaseEvent): void
		{
			const group: TableGroup = event.getData()?.group;
			if (!group)
			{
				return;
			}

			this.$store.commit('updateTableGroup', group);
			EventEmitter.emit('BX.UI.AccessRights.V2:updateRightTitle', {
				guid: this.$store.getters.appGuid,
				sectionCode: SectionCode.tableGroup,
				rightId: group.id,
				rightTitle: group.name,
			});
			EventEmitter.emit('BX.UI.AccessRights.V2:updateRightSubtitle', {
				guid: this.$store.getters.appGuid,
				sectionCode: SectionCode.tableGroup,
				rightId: group.id,
				rightSubtitle: Loc.getMessagePlural('BI_TABLE_GROUP_SUBTITLE', group.tableCodes.length, {
					'#COUNT#': group.tableCodes.length,
				}),
			});
		},
		getRightDataForSave(event: BaseEvent): BaseEvent
		{
			const eventData = event.getData();
			if (eventData.right)
			{
				const rightId = eventData.right.id;
				const group = this.isTableRightId(rightId)
					? this.$store.getters.tableGroupForSave(rightId)
					: this.$store.getters.groupForSave(rightId)
				;
				if (group)
				{
					eventData.additionalRightData = { group };
					event.setCompatData(eventData);
				}
			}

			return event;
		},
		remapSavedGroupIds(
			accessRights: Map,
			sectionCode: string,
			groups: Group[] | TableGroup[],
			updateIdMutation: string,
		): void
		{
			const savedRights: [] = [...accessRights.get(sectionCode)?.rights?.values() ?? []];
			const savedRightIds = new Set(savedRights.map((item) => item.id));
			const groupIds = new Set(groups.map((group) => group.id));

			const newGroupsBeforeSave = groups.filter((group) => !savedRightIds.has(group.id));
			const newGroupsAfterSave = savedRights.filter((right) => !groupIds.has(right.id));

			if (newGroupsBeforeSave.length === 0 || newGroupsAfterSave.length === 0)
			{
				return;
			}

			for (const newGroupBeforeSave of newGroupsBeforeSave)
			{
				const possibleNewIds = newGroupsAfterSave
					.filter((item) => item.title === newGroupBeforeSave.name)
					.map((item) => item.id)
				;
				if (possibleNewIds.length === 1)
				{
					this.$store.commit(updateIdMutation, { oldId: newGroupBeforeSave.id, newId: possibleNewIds[0] });
				}
				else
				{
					window.location.reload();
				}
			}
		},
		afterSaveRights(event: BaseEvent): void
		{
			const eventData = event.getData();
			if (eventData.accessRights)
			{
				this.remapSavedGroupIds(
					eventData.accessRights,
					SectionCode.dashboardGroup,
					this.$store.getters.groups,
					'updateGroupId',
				);
				this.remapSavedGroupIds(
					eventData.accessRights,
					SectionCode.tableGroup,
					this.$store.getters.tableGroups,
					'updateTableGroupId',
				);

				this.$store.commit('setStateAsInitial');
			}

			if (parent?.BX)
			{
				parent.BX.Event.EventEmitter.emit('BIConnector.AccessRights:onRightsSaved');
			}
		},
		handleResetState(): void
		{
			this.$store.commit('resetState');
		},
	},
	template: '<template/>',
};
