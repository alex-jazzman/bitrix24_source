import { Loc, Runtime } from 'main.core';
import type { BitrixVueComponentProps } from 'ui.vue3';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { DashboardGroup, type Group, type Dashboard, GroupType } from 'biconnector.dashboard-group';

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
	},
	computed: {},
	methods: {
		handleOnSectionHeaderClick(event: BaseEvent): void
		{
			const eventData = event.getData();
			if (eventData.section.sectionCode === 'SECTION_RIGHTS_GROUP')
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
					sectionCode: 'SECTION_RIGHTS_GROUP',
					right,
				});
				this.right = right;
				DashboardGroup.open({
					groupId: Runtime.clone(right.id),
					groups: Runtime.clone(this.$store.getters.groups),
					dashboards: Runtime.clone(this.$store.getters.dashboards),
					saveEnabled: false,
					isNeedShowDeletionWarningPopup: false,
				});
			}
		},
		handleOnRightClick(event: BaseEvent): void
		{
			const eventData = event.getData();
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
					isNeedShowDeletionWarningPopup: false,
				});
			}
		},
		handleOnRightDelete(event: BaseEvent): void
		{
			const eventData = event.getData();
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
					sectionCode: 'SECTION_RIGHTS_GROUP',
					rightId: right.id,
					rightTitle: group.name,
				});
				EventEmitter.emit('BX.UI.AccessRights.V2:updateRightSubtitle', {
					guid: this.$store.getters.appGuid,
					sectionCode: 'SECTION_RIGHTS_GROUP',
					rightId: right.id,
					rightSubtitle: Loc.getMessagePlural('BI_GROUP_SUBTITLE', group.dashboardIds.length, {
						'#COUNT#': group.dashboardIds.length,
					}),
				});
			}
		},
		getRightDataForSave(event: BaseEvent): BaseEvent
		{
			const eventData = event.getData();
			if (eventData.right)
			{
				const rightId = eventData.right.id;
				const group = this.$store.getters.groupForSave(rightId);
				if (group)
				{
					eventData.additionalRightData = { group };
					event.setCompatData(eventData);
				}
			}

			return event;
		},
		afterSaveRights(event: BaseEvent): void
		{
			const eventData = event.getData();
			if (eventData.accessRights)
			{
				const savedRights: [] = [...eventData.accessRights?.get('SECTION_RIGHTS_GROUP')?.rights?.values() ?? []];
				const savedRightIds = new Set(savedRights.map((item) => item.id));
				const groupIds = new Set();
				const groups = this.$store.getters.groups;
				for (const group: Group of this.$store.getters.groups)
				{
					groupIds.add(group.id);
				}

				const newGroupsBeforeSave = groups.filter((group: Group) => !savedRightIds.has(group.id));
				const newGroupsAfterSave = savedRights.filter((right) => !groupIds.has(right.id));

				if (newGroupsBeforeSave.length > 0 && newGroupsAfterSave.length > 0)
				{
					for (const newGroupBeforeSave of newGroupsBeforeSave)
					{
						const possibleNewIds = newGroupsAfterSave
							.filter((item) => item.title === newGroupBeforeSave.name)
							.map((item) => item.id)
						;
						if (possibleNewIds.length === 1)
						{
							this.$store.commit('updateGroupId', { oldId: newGroupBeforeSave.id, newId: possibleNewIds[0] });
						}
						else
						{
							window.location.reload();
						}
					}
				}

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
