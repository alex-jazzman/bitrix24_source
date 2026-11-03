/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_vue3, main_core, main_core_events, biconnector_dashboardGroup, biconnector_tableGroup, biconnector_apacheSupersetAnalytics, ui_vue3_vuex) {
	'use strict';

	const SectionCode = Object.freeze({
		dashboardGroup: 'SECTION_RIGHTS_GROUP',
		tableGroup: 'SECTION_RIGHTS_TABLE_GROUP'
	});

	// The recognizer repeats the server one (/^T(0|[1-9]\d*)$/D) and adds the new_T<N> placeholder of an unsaved row.
	const TABLE_RIGHT_ID_PATTERN = /^(new_)?T(0|[1-9]\d*)$/;
	const NEW_TABLE_RIGHT_ID_PREFIX = 'new_T';
	const PermissionsApp = {
		props: {},
		mounted() {
			main_core_events.EventEmitter.subscribe('BX.UI.AccessRights.V2:onSectionHeaderClick', this.handleOnSectionHeaderClick);
			main_core_events.EventEmitter.subscribe('BX.UI.AccessRights.V2:onRightClick', this.handleOnRightClick);
			main_core_events.EventEmitter.subscribe('BX.UI.AccessRights.V2:onRightDelete', this.handleOnRightDelete);
			main_core_events.EventEmitter.subscribe('BX.UI.AccessRights.V2:additionalRightData', this.getRightDataForSave);
			main_core_events.EventEmitter.subscribe('BX.UI.AccessRights.V2:afterSave', this.afterSaveRights);
			main_core_events.EventEmitter.subscribe('BX.UI.AccessRights.V2:onResetState', this.handleResetState);
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup:onGroupUpdated', this.handleGroupChange);
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup:onPopupClose', this.handleGroupPopupClose);
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup.DashboardScopeSelector:onDialogHide', this.handleDashboardScopeSelectorClose);
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup.ScopeSelector:onDialogHide', this.handleScopeSelectorClose);
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup.DashboardSelector:onDialogHide', this.handleDashboardListEdit);
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup.DashboardList:onDashboardRemove', this.handleDashboardListEdit);
			main_core_events.EventEmitter.subscribe('BIConnector.TableGroupPopup:onGroupUpdated', this.handleTableGroupChange);
			main_core_events.EventEmitter.subscribe('BIConnector.TableGroupPopup:onPopupClose', this.handleTableGroupChange);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('BX.UI.AccessRights.V2:onSectionHeaderClick', this.handleOnSectionHeaderClick);
			main_core_events.EventEmitter.unsubscribe('BX.UI.AccessRights.V2:onRightClick', this.handleOnRightClick);
			main_core_events.EventEmitter.unsubscribe('BX.UI.AccessRights.V2:onRightDelete', this.handleOnRightDelete);
			main_core_events.EventEmitter.unsubscribe('BX.UI.AccessRights.V2:additionalRightData', this.getRightDataForSave);
			main_core_events.EventEmitter.unsubscribe('BX.UI.AccessRights.V2:afterSave', this.afterSaveRights);
			main_core_events.EventEmitter.unsubscribe('BX.UI.AccessRights.V2:onResetState', this.handleResetState);
			main_core_events.EventEmitter.unsubscribe('BIConnector.GroupPopup:onGroupUpdated', this.handleGroupChange);
			main_core_events.EventEmitter.unsubscribe('BIConnector.GroupPopup:onPopupClose', this.handleGroupPopupClose);
			main_core_events.EventEmitter.unsubscribe('BIConnector.GroupPopup.DashboardScopeSelector:onDialogHide', this.handleDashboardScopeSelectorClose);
			main_core_events.EventEmitter.unsubscribe('BIConnector.GroupPopup.ScopeSelector:onDialogHide', this.handleScopeSelectorClose);
			main_core_events.EventEmitter.unsubscribe('BIConnector.GroupPopup.DashboardSelector:onDialogHide', this.handleDashboardListEdit);
			main_core_events.EventEmitter.unsubscribe('BIConnector.GroupPopup.DashboardList:onDashboardRemove', this.handleDashboardListEdit);
			main_core_events.EventEmitter.unsubscribe('BIConnector.TableGroupPopup:onGroupUpdated', this.handleTableGroupChange);
			main_core_events.EventEmitter.unsubscribe('BIConnector.TableGroupPopup:onPopupClose', this.handleTableGroupChange);
		},
		computed: {},
		methods: {
			handleDashboardScopeSelectorClose(event) {
				if (!event.getData()?.isScopeListEdited) {
					return;
				}
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupDashboardScopeEditAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.permissionsSlider);
			},
			handleDashboardListEdit(event) {
				if (!event.getData()?.isDashboardListEdited) {
					return;
				}
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupDashboardEditAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.permissionsSlider);
			},
			handleScopeSelectorClose(event) {
				if (!event.getData()?.isScopeListEdited) {
					return;
				}
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupScopeEditAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.permissionsSlider);
			},
			handleGroupPopupClose(event) {
				const eventData = event.getData();
				const group = eventData?.group;
				const isTitleEdited = eventData?.isTitleEdited;
				const isDashboardListEdited = eventData?.isDashboardListEdited;
				const isScopeListEdited = eventData?.isScopeListEdited;
				if (!group || !isTitleEdited && !isDashboardListEdited && !isScopeListEdited) {
					return;
				}
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupActionAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.permissionsSlider, false, isDashboardListEdited, isScopeListEdited);
			},
			isTableRightId(rightId) {
				return TABLE_RIGHT_ID_PATTERN.test(String(rightId));
			},
			openTableGroupPopup(groupId) {
				biconnector_tableGroup.TableGroupPopup.open({
					groupId,
					groups: main_core.Runtime.clone(this.$store.getters.tableGroups),
					tables: main_core.Runtime.clone(this.$store.getters.tables)
				});
			},
			addTableGroupRight(existingRightIds) {
				let groupIndex = 0;
				while (existingRightIds.has(`${NEW_TABLE_RIGHT_ID_PREFIX}${groupIndex}`)) {
					groupIndex++;
				}
				const right = {
					...this.$store.getters.newTableGroupPermissions
				};
				right.id = `${NEW_TABLE_RIGHT_ID_PREFIX}${groupIndex}`;
				const group = {
					id: right.id,
					name: main_core.Loc.getMessage('BI_TABLE_GROUP_NAME_NEW'),
					type: biconnector_tableGroup.TableGroupType.custom,
					tableCodes: []
				};
				this.$store.commit('addTableGroup', group);
				main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:addRight', {
					guid: this.$store.getters.appGuid,
					sectionCode: SectionCode.tableGroup,
					right
				});
				this.openTableGroupPopup(group.id);
			},
			handleOnSectionHeaderClick(event) {
				const eventData = event.getData();
				if (eventData.section?.sectionCode === SectionCode.tableGroup) {
					this.addTableGroupRight(new Set(eventData.section.rights.keys()));
					return;
				}
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendClickGroupActionAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.permissionsSlider, true);
				if (eventData.section?.sectionCode === SectionCode.dashboardGroup) {
					const rightCodes = new Set(eventData.section.rights.keys());
					let groupIndex = 0;
					while (rightCodes.has(`new_G${groupIndex}`)) {
						groupIndex++;
					}
					const newGroupCode = `new_G${groupIndex}`;
					const right = {
						...this.$store.getters.newGroupPermissions
					};
					right.id = newGroupCode;
					const group = {
						id: right.id,
						name: this.$Bitrix.Loc.getMessage('BI_GROUP_NEW_TITLE'),
						type: biconnector_dashboardGroup.GroupType.custom,
						dashboardIds: [],
						scopes: []
					};
					this.$store.commit('addGroup', group);
					main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:addRight', {
						guid: this.$store.getters.appGuid,
						sectionCode: SectionCode.dashboardGroup,
						right
					});
					this.right = right;
					biconnector_dashboardGroup.DashboardGroup.open({
						groupId: main_core.Runtime.clone(right.id),
						groups: main_core.Runtime.clone(this.$store.getters.groups),
						dashboards: main_core.Runtime.clone(this.$store.getters.dashboards),
						saveEnabled: false,
						user: this.$store.getters.user
					});
				}
			},
			handleOnRightClick(event) {
				const eventData = event.getData();
				if (eventData.right && this.isTableRightId(eventData.right.id)) {
					this.openTableGroupPopup(eventData.right.id);
					return;
				}
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendClickGroupActionAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.permissionsSlider, false);
				if (eventData.right) {
					/** @type AccessRightItem */
					this.right = eventData.right;
					const rightId = eventData.right.id;
					biconnector_dashboardGroup.DashboardGroup.open({
						groupId: main_core.Runtime.clone(rightId),
						groups: main_core.Runtime.clone(this.$store.getters.groups),
						dashboards: main_core.Runtime.clone(this.$store.getters.dashboards),
						saveEnabled: false,
						user: this.$store.getters.user
					});
				}
			},
			handleOnRightDelete(event) {
				const eventData = event.getData();
				if (eventData.right && this.isTableRightId(eventData.right.id)) {
					this.$store.commit('deleteTableGroup', eventData.right.id);
					return;
				}
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupDeleteAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.permissionsSlider);
				if (eventData.right) {
					this.$store.commit('deleteGroup', eventData.right.id);
				}
			},
			handleGroupChange(event) {
				const group = event.getData()?.group;
				const dashboards = event.getData()?.dashboards;
				if (!group && !dashboards) {
					return;
				}

				/** @type AccessRightItem */
				const right = this.right;
				if (right) {
					this.$store.commit('updateGroup', {
						group,
						dashboards
					});
					main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:updateRightTitle', {
						guid: this.$store.getters.appGuid,
						sectionCode: SectionCode.dashboardGroup,
						rightId: right.id,
						rightTitle: group.name
					});
					main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:updateRightSubtitle', {
						guid: this.$store.getters.appGuid,
						sectionCode: SectionCode.dashboardGroup,
						rightId: right.id,
						rightSubtitle: main_core.Loc.getMessagePlural('BI_GROUP_SUBTITLE', group.dashboardIds.length, {
							'#COUNT#': group.dashboardIds.length
						})
					});
				}
			},
			handleTableGroupChange(event) {
				const group = event.getData()?.group;
				if (!group) {
					return;
				}
				this.$store.commit('updateTableGroup', group);
				main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:updateRightTitle', {
					guid: this.$store.getters.appGuid,
					sectionCode: SectionCode.tableGroup,
					rightId: group.id,
					rightTitle: group.name
				});
				main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:updateRightSubtitle', {
					guid: this.$store.getters.appGuid,
					sectionCode: SectionCode.tableGroup,
					rightId: group.id,
					rightSubtitle: main_core.Loc.getMessagePlural('BI_TABLE_GROUP_SUBTITLE', group.tableCodes.length, {
						'#COUNT#': group.tableCodes.length
					})
				});
			},
			getRightDataForSave(event) {
				const eventData = event.getData();
				if (eventData.right) {
					const rightId = eventData.right.id;
					const group = this.isTableRightId(rightId) ? this.$store.getters.tableGroupForSave(rightId) : this.$store.getters.groupForSave(rightId);
					if (group) {
						eventData.additionalRightData = {
							group
						};
						event.setCompatData(eventData);
					}
				}
				return event;
			},
			remapSavedGroupIds(accessRights, sectionCode, groups, updateIdMutation) {
				const savedRights = [...(accessRights.get(sectionCode)?.rights?.values() ?? [])];
				const savedRightIds = new Set(savedRights.map(item => item.id));
				const groupIds = new Set(groups.map(group => group.id));
				const newGroupsBeforeSave = groups.filter(group => !savedRightIds.has(group.id));
				const newGroupsAfterSave = savedRights.filter(right => !groupIds.has(right.id));
				if (newGroupsBeforeSave.length === 0 || newGroupsAfterSave.length === 0) {
					return;
				}
				for (const newGroupBeforeSave of newGroupsBeforeSave) {
					const possibleNewIds = newGroupsAfterSave.filter(item => item.title === newGroupBeforeSave.name).map(item => item.id);
					if (possibleNewIds.length === 1) {
						this.$store.commit(updateIdMutation, {
							oldId: newGroupBeforeSave.id,
							newId: possibleNewIds[0]
						});
					} else {
						window.location.reload();
					}
				}
			},
			afterSaveRights(event) {
				const eventData = event.getData();
				if (eventData.accessRights) {
					this.remapSavedGroupIds(eventData.accessRights, SectionCode.dashboardGroup, this.$store.getters.groups, 'updateGroupId');
					this.remapSavedGroupIds(eventData.accessRights, SectionCode.tableGroup, this.$store.getters.tableGroups, 'updateTableGroupId');
					this.$store.commit('setStateAsInitial');
				}
				if (parent?.BX) {
					parent.BX.Event.EventEmitter.emit('BIConnector.AccessRights:onRightsSaved');
				}
			},
			handleResetState() {
				this.$store.commit('resetState');
			}
		},
		template: '<template/>'
	};

	/* eslint-disable no-param-reassign */
	class Store {
		// eslint-disable-next-line max-lines-per-function
		static buildStore(defaultValues) {
			Store.initialGroups = main_core.Runtime.clone(defaultValues.groups);
			Store.initialDashboards = main_core.Runtime.clone(defaultValues.dashboards);
			Store.initialTableGroups = main_core.Runtime.clone(defaultValues.tableGroups);
			return ui_vue3_vuex.createStore({
				state() {
					return defaultValues;
				},
				mutations: {
					addGroup(state, group) {
						state.groups.push(group);
					},
					updateGroup(state, data) {
						const updatedGroup = data.group;
						const updatedDashboards = data.dashboards;
						const groupIndex = state.groups.findIndex(item => item.id === updatedGroup.id);
						if (groupIndex < 0) {
							return;
						}
						const group = state.groups[groupIndex];
						group.name = updatedGroup.name;
						group.scopes = updatedGroup.scopes;
						group.dashboardIds = updatedGroup.dashboardIds;
						state.dashboards = updatedDashboards;
						Store.checkModifiedGroups(state.groups, state.dashboards, state.appGuid);
					},
					updateGroupId(state, data) {
						const group = state.groups.find(item => item.id === data.oldId);
						if (group) {
							group.id = data.newId;
						}
					},
					deleteGroup(state, groupId) {
						state.groups = state.groups.filter(group => group.id !== groupId);
					},
					addTableGroup(state, group) {
						state.tableGroups.push(group);
					},
					updateTableGroup(state, updatedGroup) {
						const group = state.tableGroups.find(item => item.id === updatedGroup.id);
						if (!group) {
							return;
						}
						group.name = updatedGroup.name;
						group.tableCodes = [...updatedGroup.tableCodes];
						Store.checkModifiedTableGroups(state.tableGroups, state.appGuid);
					},
					updateTableGroupId(state, data) {
						const group = state.tableGroups.find(item => item.id === data.oldId);
						if (group) {
							group.id = data.newId;
						}
					},
					deleteTableGroup(state, groupId) {
						state.tableGroups = state.tableGroups.filter(group => group.id !== groupId);
					},
					resetState(state) {
						state.groups = Store.initialGroups;
						state.dashboards = Store.initialDashboards;
						state.tableGroups = main_core.Runtime.clone(Store.initialTableGroups);
					},
					setStateAsInitial(state) {
						Store.initialGroups = state.groups;
						Store.initialDashboards = state.dashboards;
						Store.initialTableGroups = main_core.Runtime.clone(state.tableGroups);
					}
				},
				getters: {
					user(state) {
						return state.user;
					},
					newGroupPermissions(state) {
						return state.newGroupPermissions;
					},
					groups(state) {
						return state.groups;
					},
					group(state) {
						return groupId => {
							const group = main_core.Runtime.clone(state.groups.find(item => item.id === groupId));
							if (!group) {
								return null;
							}
							return group;
						};
					},
					groupForSave(state) {
						return groupId => {
							const group = main_core.Runtime.clone(state.groups.find(item => item.id === groupId));
							if (!group) {
								return null;
							}
							group.dashboards = [];
							for (const dashboardId of group.dashboardIds) {
								group.dashboards.push(state.dashboards.get(dashboardId));
							}
							delete group.dashboardIds;
							return group;
						};
					},
					dashboards(state) {
						return state.dashboards;
					},
					dashboardScopes(state) {
						return dashboardId => state.dashboards.get(dashboardId)?.scopes ?? null;
					},
					appGuid(state) {
						return state.appGuid;
					},
					newTableGroupPermissions(state) {
						return state.newTableGroupPermissions;
					},
					tableGroups(state) {
						return state.tableGroups;
					},
					tables(state) {
						return state.tables;
					},
					tableGroup(state) {
						return groupId => {
							const group = state.tableGroups.find(item => item.id === groupId);
							return group ? main_core.Runtime.clone(group) : null;
						};
					},
					tableGroupForSave(state) {
						return groupId => {
							const group = state.tableGroups.find(item => item.id === groupId);
							if (!group) {
								return null;
							}
							return {
								id: group.id,
								name: group.name,
								type: group.type,
								tableCodes: main_core.Runtime.clone(group.tableCodes)
							};
						};
					}
				}
			});
		}
		static checkModifiedGroups(currentGroups, currentDashboards, appGuid) {
			const modifiedGroupIds = new Set();
			for (const currentGroup of currentGroups) {
				const initialGroup = Store.initialGroups.find(item => item.id === currentGroup.id);
				if (!initialGroup) {
					modifiedGroupIds.add(currentGroup.id);
					continue;
				}
				if (currentGroup.name !== initialGroup.name) {
					modifiedGroupIds.add(currentGroup.id);
					continue;
				}
				if (initialGroup.dashboardIds.length !== currentGroup.dashboardIds.length) {
					modifiedGroupIds.add(currentGroup.id);
					continue;
				}
				if (!Store.areSetsEqual(new Set(initialGroup.scopes.map(scope => scope.code)), new Set(currentGroup.scopes.map(scope => scope.code)))) {
					modifiedGroupIds.add(currentGroup.id);
				}
			}
			const modifiedDashboardIds = new Set();
			for (const currentDashboard of currentDashboards.values()) {
				const initialDashboard = Store.initialDashboards.get(currentDashboard.id);
				if (!initialDashboard) {
					modifiedDashboardIds.add(currentDashboard.id);
					continue;
				}
				if (!Store.areSetsEqual(new Set(initialDashboard.scopes.map(scope => scope.code)), new Set(currentDashboard.scopes.map(scope => scope.code)))) {
					modifiedDashboardIds.add(currentDashboard.id);
				}
			}
			for (const group of currentGroups) {
				let hasModifiedDashboards = false;
				for (const dashboardId of group.dashboardIds) {
					hasModifiedDashboards = hasModifiedDashboards || modifiedDashboardIds.has(dashboardId);
				}
				main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:markRightAsModified', {
					guid: appGuid,
					sectionCode: SectionCode.dashboardGroup,
					rightId: group.id,
					isModified: modifiedGroupIds.has(group.id) || hasModifiedDashboards
				});
			}
		}
		static checkModifiedTableGroups(currentGroups, appGuid) {
			for (const currentGroup of currentGroups) {
				const initialGroup = Store.initialTableGroups.find(item => item.id === currentGroup.id);
				const isModified = !initialGroup || initialGroup.name !== currentGroup.name || !Store.areSetsEqual(new Set(initialGroup.tableCodes), new Set(currentGroup.tableCodes));
				main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:markRightAsModified', {
					guid: appGuid,
					sectionCode: SectionCode.tableGroup,
					rightId: currentGroup.id,
					isModified
				});
			}
		}
		static areSetsEqual(setA, setB) {
			if (setA.size !== setB.size) {
				return false;
			}
			for (const item of setA) {
				if (!setB.has(item)) {
					return false;
				}
			}
			return true;
		}
	}

	class Permissions {
		static init(params) {
			const {
				newGroupPermissions,
				dashboardGroups,
				dashboards,
				newTableGroupPermissions,
				tableGroups,
				tables,
				user,
				appGuid
			} = params;
			const state = {
				groups: dashboardGroups,
				dashboards: new Map(Object.entries(dashboards).map(([key, value]) => [Number(key), value])),
				newGroupPermissions,
				tableGroups: tableGroups ?? [],
				tables: tables ?? [],
				newTableGroupPermissions,
				appGuid,
				user
			};
			const permissionsApp = ui_vue3.BitrixVue.createApp({
				name: 'BIConnectorRights',
				data() {
					return {};
				},
				components: {
					PermissionsApp
				},
				computed: {
					componentName() {
						return PermissionsApp;
					}
				},
				template: `
				<PermissionsApp/>
			`
			});
			const store = Store.buildStore(state);
			permissionsApp.use(store);
			permissionsApp.mount('#bx-biconnector-role-main2');
		}
	}

	exports.Permissions = Permissions;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX.Vue3, BX, BX.Event, BX.BIConnector, BX.BIConnector, BX.BIConnector, BX.Vue3.Vuex);
//# sourceMappingURL=script.js.map
