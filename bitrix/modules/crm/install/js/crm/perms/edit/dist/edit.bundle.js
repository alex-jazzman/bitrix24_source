/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, ui_vue3, ui_vue3_vuex, main_core, ui_designTokens, ui_buttons, ui_sidepanel, ui_sidepanel_layout, main_core_events, ui_entitySelector, ui_loader) {
	'use strict';

	function entityHash(entity) {
		if (entity.stageField) {
			return `${entity.entityCode}__${entity.stageField}__${entity.stageCode}`;
		}
		return entity.entityCode;
	}
	function hashIdentifier(identifier) {
		let hash = `${identifier.entityCode}__${identifier.permissionCode}`;
		if (identifier.stageField) {
			hash = `${hash}__${identifier.stageField}__${identifier.stageCode}`;
		}
		return btoa(hash);
	}

	var getters = {
		permissionEntities(state) {
			return state.desk.permissionEntities;
		},
		permissionEntitiesExpanded(state) {
			return state.desk.permissionEntities.filter(entity => {
				return !(entity.stageField && !state.ui.expandedStageEntities[entity.entityCode]);
			});
		},
		getMainPermissionEntityByCode: state => entityCode => {
			return state.desk.permissionEntities.find(item => {
				return item.entityCode === entityCode && !item.stageField;
			});
		},
		getEntitiesGroupedByPermission: (state, getters) => entityCode => {
			const rootEntity = getters.getMainPermissionEntityByCode(entityCode);
			const entities = state.desk.permissionEntities.filter(entity => entity.entityCode === rootEntity.entityCode);
			let permissions = [];
			for (const entity of entities) {
				for (const permCode of Object.keys(entity.permissions)) {
					if (!Object.hasOwn(entity.permissions, permCode)) {
						continue;
					}
					const values = entity.permissions[permCode];
					const permissionConfig = state.desk.availablePermissions.find(perm => {
						return perm.code === permCode;
					});
					if (permissionConfig.sortOrder <= MAX_SORT_ORDER_ON_THE_DESK) {
						continue;
					}
					permissions.push({
						code: permCode,
						name: permissionConfig.name,
						values,
						isEntityStageSupport: entity.hasStages,
						isPermissionStageSupport: permissionConfig.canAssignPermissionToStages,
						stageField: entity.stageField,
						stageCode: entity.stageCode,
						stateName: entity.name,
						sortOrder: parseInt(permissionConfig.sortOrder, 10)
					});
				}
			}
			permissions = permissions.sort((a, b) => {
				if (a.sortOrder === b.sortOrder) {
					return 0;
				}
				return a.sortOrder < b.sortOrder ? -1 : 1;
			});
			return permissions;
		},
		availablePermissions(state) {
			return state.desk.availablePermissions;
		},
		getAssignedAttribute: state => ({
			permissionCode,
			entityCode,
			stageField,
			stageCode
		}) => {
			if (stageField) {
				let value = state.roleAssignedPermissions?.[entityCode]?.[permissionCode]?.[stageField]?.[stageCode];

				// Not assigned value of stage attribute means it is inherited val from root permission entity
				if (main_core.Type.isUndefined(value)) {
					value = '-';
				}
				return value;
			}
			return state.roleAssignedPermissions?.[entityCode]?.[permissionCode]?.['-'] || null;
		},
		isStageEntitiesVisible: state => entity => {
			const hash = entityHash(entity);
			return Boolean(state.ui.expandedStageEntities[hash]);
		},
		permissionsOnMainView(state) {
			return state.desk.availablePermissions.filter(perm => {
				return perm.sortOrder <= MAX_SORT_ORDER_ON_THE_DESK;
			});
		},
		hasTariffPermission(state) {
			return state.restriction.hasPermission;
		},
		getRestrictionScript(state) {
			return state.restriction.restrictionScript;
		},
		getAvailablePermissionsOrders(state) {
			return state.desk.availablePermissionsOrders;
		},
		getSaveData(state) {
			const toRemove = [];
			const toChange = [];
			for (const hash of Object.keys(state.touched.touchedAttributes)) {
				const touched = state.touched.touchedAttributes[hash];
				if (touched.identifier.stageField) {
					if (touched.value === '-') {
						toRemove.push({
							...touched.identifier
						});
					} else {
						toChange.push({
							...touched.identifier,
							value: touched.value
						});
					}
					continue;
				}
				if (touched.value === '') {
					toRemove.push({
						...touched.identifier
					});
				} else {
					toChange.push({
						...touched.identifier,
						value: touched.value
					});
				}
			}
			for (const hash of Object.keys(state.touched.touchedTransitions)) {
				const touched = state.touched.touchedTransitions[hash];
				if (touched.identifier.stageField) {
					if (touched.values === '-') {
						toRemove.push({
							...touched.identifier
						});
					} else {
						toChange.push({
							...touched.identifier,
							settings: touched.values
						});
					}
					continue;
				}
				if (touched.values.length === 0 || touched.values.length === 1 && touched.values[0] === 'INHERIT') {
					toRemove.push({
						...touched.identifier
					});
				} else {
					toChange.push({
						...touched.identifier,
						settings: touched.values
					});
				}
			}
			if (state.role.id === 0)
				// is new role
				{
					appendDefaultAttributesPermissionsToChange(state, toChange);
					appendDefaultTransitionPermissionsToChange(state, toChange);
				}
			return {
				id: state.role.id,
				name: state.role.name,
				permissions: {
					toRemove,
					toChange
				}
			};
		},
		getRoleName(state) {
			return state.role.name;
		},
		getRoleId(state) {
			return state.role.id;
		},
		isSaveInProgress(state) {
			return state.ui.isSaveInProgress;
		},
		getLastErrorMessage(state) {
			return state.ui.lastErrorMessage;
		},
		setSaveInProgress(state) {
			return state.ui.isSaveInProgress;
		},
		getTransitionSettings: state => ({
			permissionCode,
			entityCode,
			stageField,
			stageCode
		}) => {
			if (stageField) {
				let value = state.transitions?.[entityCode]?.[stageField]?.[stageCode];

				// Not assigned value of stage attribute means it is inherited val from root permission entity
				if (main_core.Type.isUndefined(value)) {
					value = ['INHERIT'];
				}
				return value;
			}
			return state.transitions?.[entityCode]?.['-'] || ['BLOCKED'];
		}
	};
	function appendDefaultAttributesPermissionsToChange(state, toChange) {
		Object.keys(state.roleAssignedPermissions).forEach(entityCode => {
			const permissions = state.roleAssignedPermissions[entityCode] ?? {};
			Object.keys(permissions).forEach(permissionCode => {
				if (permissionCode === 'TRANSITION') {
					return;
				}
				const permission = permissions[permissionCode];
				const value = permission?.['-'];
				if (!main_core.Type.isString(value)) {
					return;
				}
				const hasSelectedPermission = toChange.find(item => item.entityCode === entityCode && item.permissionCode === permissionCode && main_core.Type.isUndefined(item.stageCode));
				if (hasSelectedPermission) {
					return;
				}
				toChange.push({
					entityCode,
					permissionCode,
					value
				});
			});
		});
	}
	function appendDefaultTransitionPermissionsToChange(state, toChange) {
		const transitionPermissionCode = 'TRANSITION';
		for (const [entityCode, permission] of Object.entries(state.transitions)) {
			if (!Object.hasOwn(permission, ['-'])) {
				return;
			}
			const hasSelectedPermission = toChange.find(item => item.entityCode === entityCode && item.permissionCode === transitionPermissionCode && main_core.Type.isUndefined(item.stageCode));
			if (hasSelectedPermission) {
				return;
			}
			toChange.push({
				entityCode,
				permissionCode: transitionPermissionCode,
				settings: permission['-']
			});
		}
	}

	/* eslint no-param-reassign: off */
	var mutations = {
		setInitData(state, data) {
			state.roleAssignedPermissions = data.roleAssignedPermissions;
			state.desk.permissionEntities = data.permissionEntities;
			state.restriction.hasPermission = data.restriction.hasPermission;
			state.restriction.restrictionScript = data.restriction.restrictionScript;
			state.transitions = data.roleAssignedSettings;
			const availablePermissionsOrders = {};
			const availablePermissions = data.availablePermissions.map(item => {
				const sortOrder = parseInt(item.sortOrder, 10);
				availablePermissionsOrders[item.code] = sortOrder;
				return {
					...item,
					sortOrder
				};
			});
			state.desk.availablePermissionsOrders = availablePermissionsOrders;
			state.desk.availablePermissions = availablePermissions;
			state.role.id = parseInt(data.role.id, 10);
			state.role.name = data.role.name;
			state.touched.originalAttributes = structuredClone(data.roleAssignedPermissions);
			state.touched.originalTransitions = structuredClone(data.roleAssignedSettings);
		},
		assignPermissionAttribute(state, payload) {
			setAssignedAttributes(state.roleAssignedPermissions, payload.identifier, payload.value);
			this.commit('setAttributeTouched', {
				identifier: payload.identifier,
				value: payload.value
			});
		},
		assignTransitions(state, payload) {
			setAssignedTransitions(state.transitions, payload.identifier, payload.values);
			this.commit('setTransitionsTouched', {
				identifier: payload.identifier,
				values: payload.values
			});
		},
		setAttributeTouched(state, payload) {
			const permissionCode = payload.identifier.permissionCode;
			const entityCode = payload.identifier.entityCode;
			const stageField = payload.identifier.stageField;
			const stageCode = payload.identifier.stageCode;
			const value = payload.value;
			let original = '';
			if (stageField) {
				original = state.touched.originalAttributes?.[entityCode]?.[permissionCode]?.[stageField]?.[stageCode];
			} else {
				original = state.touched.originalAttributes?.[entityCode]?.[permissionCode]?.['-'];
			}
			const hash = hashIdentifier(payload.identifier);
			if (original === value) {
				try {
					delete state.touched.touchedAttributes[hash];
				} catch {}
			} else {
				state.touched.touchedAttributes[hash] = {
					value,
					identifier: payload.identifier
				};
			}
		},
		setTransitionsTouched(state, payload) {
			const entityCode = payload.identifier.entityCode;
			const stageField = payload.identifier.stageField;
			const stageCode = payload.identifier.stageCode;
			const values = payload.values;
			let original = [];
			if (stageField && stageCode) {
				original = state.touched.originalTransitions?.[entityCode]?.[stageField]?.[stageCode];
			} else {
				original = state.touched.originalTransitions?.[entityCode]?.['-'];
			}
			const hash = hashIdentifier(payload.identifier);
			if (main_core.Type.isArray(original) && isArraysEqual(original, values)) {
				try {
					delete state.touched.touchedTransitions[hash];
				} catch {}
			} else {
				state.touched.touchedTransitions[hash] = {
					values,
					identifier: payload.identifier
				};
			}
		},
		resetTouchedAttributes(state) {
			state.touched.originalAttributes = JSON.parse(JSON.stringify(state.roleAssignedPermissions));
			state.touched.touchedAttributes = {};
		},
		resetTouchedTransitions(state) {
			state.touched.originalTransitions = JSON.parse(JSON.stringify(state.transitions));
			state.touched.touchedTransitions = {};
		},
		toggleStagesVisibility(state, entity) {
			const hash = entityHash(entity);
			if (state.ui.expandedStageEntities[hash]) {
				delete state.ui.expandedStageEntities[hash];
			} else {
				state.ui.expandedStageEntities[hash] = true;
			}
		},
		setRoleName(state, newName) {
			state.role.name = newName;
		},
		setSaveInProgress(state, value) {
			state.ui.isSaveInProgress = value;
		},
		setLastErrorMessage(state, message) {
			state.ui.lastErrorMessage = message;
		}
	};
	function setAssignedAttributes(obj, identifier, value) {
		const permissionCode = identifier.permissionCode;
		const entityCode = identifier.entityCode;
		const stageField = identifier.stageField;
		const stageCode = identifier.stageCode;
		if (!obj[entityCode]) {
			obj[entityCode] = {};
		}
		if (!obj[entityCode][permissionCode]) {
			obj[entityCode][permissionCode] = {};
		}
		if (stageField) {
			if (!obj[entityCode][permissionCode][stageField]) {
				obj[entityCode][permissionCode][stageField] = {};
			}
			obj[entityCode][permissionCode][stageField][stageCode] = value;
			return;
		}
		if (value === '') {
			delete obj[entityCode][permissionCode]['-'];
		} else {
			obj[entityCode][permissionCode]['-'] = value;
		}
		clearEmptyNodes(obj);
	}
	function clearEmptyNodes(node, nodeName, parent) {
		if (!main_core.Type.isObject(node)) {
			return;
		}
		for (const [childName, childNode] of Object.entries(node)) {
			if (isObjectEmpty(childNode)) {
				delete node[childName];
				continue;
			}
			clearEmptyNodes(childNode, childName, node);
		}
		if (parent && isObjectEmpty(node)) {
			delete parent[nodeName];
		}
	}
	function isObjectEmpty(obj) {
		if (!obj) {
			return true;
		}
		return Object.keys(obj).length === 0;
	}
	function setAssignedTransitions(obj, identifier, values) {
		const entityCode = identifier.entityCode;
		const stageField = identifier.stageField;
		const stageCode = identifier.stageCode;
		if (!obj[entityCode]) {
			obj[entityCode] = {};
		}
		if (stageField && stageCode) {
			if (!obj[entityCode][stageField]) {
				obj[entityCode][stageField] = {};
			}
			obj[entityCode][stageField][stageCode] = values;
			return;
		}
		if (values === '') {
			delete obj[entityCode]['-'];
		} else {
			obj[entityCode]['-'] = values;
		}
		clearEmptyNodes(obj);
	}
	function isArraysEqual(first, second) {
		return first.sort().toString() === second.sort().toString();
	}

	var actions = {
		async saveRolePermission({
			commit,
			getters
		}, action) {
			if (getters.setSaveInProgress) {
				return;
			}
			commit('setSaveInProgress', true);
			commit('setLastErrorMessage', '');
			try {
				const response = await BX.ajax.runComponentAction('bitrix:crm.config.perms.role.edit.v2', 'save', {
					mode: 'class',
					json: {
						values: getters.getSaveData
					}
				});
				const redirectUrl = response?.data?.redirectUrl;
				const roleUrl = response?.data?.roleUrl;
				if (action === 'save' && redirectUrl) {
					window.location.href = redirectUrl;
					return;
				}
				if (action === 'apply' && roleUrl && getters.getRoleId === 0) {
					window.location.href = roleUrl;
					return;
				}
				commit('resetTouchedAttributes');
				commit('resetTouchedTransitions');
			} catch (err) {
				const errMessage = err?.data?.message;
				commit('setLastErrorMessage', errMessage);
			} finally {
				commit('setSaveInProgress', false);
			}
		},
		async deleteRole({
			commit,
			getters
		}) {
			if (getters.setSaveInProgress) {
				return;
			}
			const roleId = getters.getRoleId;
			if (!roleId) {
				return;
			}
			commit('setSaveInProgress', true);
			commit('setLastErrorMessage', '');
			try {
				const response = await BX.ajax.runComponentAction('bitrix:crm.config.perms.role.edit.v2', 'delete', {
					mode: 'class',
					json: {
						values: {
							roleId
						}
					}
				});
				let redirectUrl = response?.data?.redirectUrl;
				if (!redirectUrl) {
					redirectUrl = '/';
				}
				window.location.href = redirectUrl;
			} catch (err) {
				const errMessage = err?.data?.message;
				commit('setLastErrorMessage', errMessage);
			} finally {
				commit('setSaveInProgress', false);
			}
		}
	};

	const MAX_SORT_ORDER_ON_THE_DESK = 7;
	function initState() {
		return {
			ui: {
				expandedStageEntities: {},
				isSaveInProgress: false,
				lastErrorMessage: ''
			},
			roleAssignedPermissions: {},
			restriction: {
				hasPermission: null,
				restrictionScript: ''
			},
			role: {
				id: 0,
				name: ''
			},
			desk: {
				availablePermissions: [],
				permissionEntities: [],
				availablePermissionsOrders: {}
			},
			touched: {
				originalAttributes: {},
				touchedAttributes: {},
				originalTransitions: {},
				touchedTransitions: {}
			},
			transitions: {}
		};
	}
	var store = () => {
		return {
			state: initState(),
			getters,
			mutations,
			actions
		};
	};

	const PermissionControl = {
		name: 'PermissionControl',
		props: {
			value: {
				type: String,
				required: true
			},
			valuesMap: {
				type: Object,
				required: true
			},
			permissionIdentifier: {
				type: Object,
				required: true
			}
		},
		emits: ['valueChanged'],
		data() {
			return {
				label: {
					inherit: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_INHERIT')
				},
				isEditMode: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['getAssignedAttribute']),
			currentPermissionName() {
				if (this.permissionIdentifier.permissionCode === 'AUTOMATION' && this.isReadOnlyMode) {
					const forcePerm = 'X';
					return this.valuesMap[forcePerm];
				}
				if (this.isStageControl && this.model === '-') {
					return this.getParentName;
				}
				return this.valuesMap[this.value];
			},
			isInherited() {
				return this.isStageControl && this.model === '-';
			},
			model: {
				get() {
					return this.value;
				},
				set(value) {
					this.$emit('valueChanged', {
						identifier: this.permissionIdentifier,
						value
					});
				}
			},
			isStageControl() {
				return Boolean(this.permissionIdentifier.stageField);
			},
			getParentName() {
				const parentChose = this.getAssignedAttribute({
					permissionCode: this.permissionIdentifier.permissionCode,
					entityCode: this.permissionIdentifier.entityCode
				}) || '';
				return this.valuesMap[parentChose];
			},
			isReadOnlyMode() {
				if (this.permissionIdentifier.permissionCode === 'AUTOMATION') {
					return this.getAssignedAttribute({
						permissionCode: 'WRITE',
						entityCode: 'CONFIG'
					}) === 'X';
				}
				return false;
			}
		},
		methods: {
			toEditMode(e) {
				e.stopPropagation();
				if (this.isReadOnlyMode) {
					return;
				}
				this.isEditMode = true;
				main_core.Event.bind(window, 'click', this.windowClickListener);
			},
			windowClickListener(event) {
				if (event.target !== this.$refs.componentRef && !event.composedPath().includes(this.$refs.componentRef)) {
					this.isEditMode = false;
					main_core.Event.unbind(window, 'click', this.windowClickListener);
				}
			}
		},
		template: `
		<div 
			class="bx-crm-perms-edit-permission_control"
			ref="componentRef"
		>
			<div 
				class="bx-crm-perms-edit-permission_control-text"
				:class="{'--readonly': isReadOnlyMode, '--inherited': isInherited}"
				v-if="!isEditMode"
				@click="toEditMode"
			>{{ currentPermissionName }}</div>
			<select 
				v-model="model" 
				v-if="isEditMode" 
				class="bx-crm-perms-edit-permission_control-select"
			>
				<option 
					class="bx-crm-perms-edit-permission_control-select-option__grey" 
					v-if="isStageControl" 
					value="-"
				>{{ label.inherit }}</option>
				<option v-for="val in Object.keys(valuesMap)" :value="val">
					{{ valuesMap[val] }}
				</option>
			</select>
		</div>
	`
	};

	const ExpandControl = {
		name: 'ExpandControl',
		props: {
			entity: Object,
			isExpanded: Boolean
		},
		emits: ['toggle'],
		methods: {
			toggleState() {
				this.$emit('toggle');
			}
		},
		template: `
		<div
			:class="{'--expanded': isExpanded}"
			class="bx-crm-perms-edit-expand_control"
			@click="toggleState">
		</div>
	`
	};

	const ANY_VALUE = 'ANY';
	const BLOCKED_VALUE = 'BLOCKED';
	const INHERIT_VALUE = 'INHERIT';
	const EntityControl = {
		name: 'EntityControl',
		entitySelector: null,
		props: {
			values: {
				type: Array,
				required: true
			},
			valuesMap: {
				type: Object,
				required: true
			},
			permissionIdentifier: {
				type: Object,
				required: true
			}
		},
		emits: ['onTransitionValuesChanged'],
		data() {
			return {
				label: {
					any: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_ANY'),
					blocked: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_BLOCKED'),
					inherit: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_INHERIT'),
					stages: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_STAGES')
				},
				isEditMode: false,
				valuesData: this.values
			};
		},
		computed: {
			isStageControl() {
				return Boolean(this.permissionIdentifier.stageField);
			},
			isInherited() {
				return this.isStageControl && this.currentValues.some(el => el.id === INHERIT_VALUE);
			},
			currentValues: {
				get() {
					if (!main_core.Type.isArray(this.valuesData)) {
						return [];
					}
					return this.availableValues.filter(el => {
						return this.valuesData.includes(el.id);
					});
				},
				set(values) {
					this.valuesData = values.map(list => list.id);
					this.$emit('onTransitionValuesChanged', {
						identifier: this.permissionIdentifier,
						values: this.valuesData
					});
				}
			},
			availableValues() {
				const availableValues = [];
				for (const [key, value] of Object.entries(this.valuesMap)) {
					if (key === INHERIT_VALUE && main_core.Type.isUndefined(this.permissionIdentifier.stageField) && main_core.Type.isUndefined(this.permissionIdentifier.stageCode) || key === this.permissionIdentifier.stageCode) {
						continue;
					}
					availableValues.push({
						id: key,
						entityId: 'stages',
						tabs: 'stages_tab',
						title: value
					});
				}
				return availableValues;
			}
		},
		methods: {
			toEditMode() {
				this.isEditMode = true;
			},
			onHideDialogEvent() {
				if (this.entitySelector.getTags().length === 0) {
					const tag = {
						id: ANY_VALUE,
						entityId: 'stages',
						tabs: 'stages_tab',
						title: this.label.any
					};
					if (this.isStageControl) {
						tag.id = INHERIT_VALUE;
						tag.title = this.label.inherit;
					}
					this.entitySelector.addTag(tag);
				}
				this.currentValues = this.entitySelector.getTags();
				this.isEditMode = this.entitySelector.getDialog().isOpen();
			},
			readOnlyLabels() {
				return this.currentValues.map(list => list.title).join(', ');
			},
			clickSomewhere() {
				if (this.isEditMode && !this.entitySelector.getDialog().isOpen()) {
					this.isEditMode = false;
					this.onHideDialogEvent();
				}
			},
			getDialogOptions() {
				return {
					multiple: true,
					items: this.availableValues,
					selectedItems: this.currentValues,
					dropdownMode: false,
					height: 300,
					showAvatars: false,
					tabs: [{
						id: 'stages_tab',
						title: this.label.stages
					}],
					recentTabOptions: {
						visible: false
					},
					events: {
						onHide: this.onHideDialogEvent
					}
				};
			},
			selectorOnBeforeTagAdd(event) {
				const selector = event.getTarget();
				const {
					tag
				} = event.getData();
				const singleValues = new Set([ANY_VALUE, INHERIT_VALUE, BLOCKED_VALUE]);
				if (singleValues.has(tag.getId())) {
					selector.removeTags();
				} else {
					selector.getTags().forEach(item => {
						if (singleValues.has(item.getId())) {
							selector.removeTag(item);
						}
					});
				}
			}
		},
		mounted() {
			this.entitySelector = new ui_entitySelector.TagSelector({
				events: {
					onBeforeTagAdd: this.selectorOnBeforeTagAdd,
					onAfterTagRemove: this.onHideDialogEvent
				},
				dialogOptions: this.getDialogOptions()
			});
			this.entitySelector.renderTo(this.$refs.entitySelectorRef);
		},
		created() {
			main_core.Event.bind(window, 'click', this.clickSomewhere);
		},
		destroyed() {
			main_core.Event.unbind(window, 'click', this.clickSomewhere);
		},
		template: `
		<div class="bx-crm-perms-edit-entity_control">
			<div
				class="bx-crm-perms-edit-entity_control-text"
				:class="{'--inherited': isInherited}"
				data-role="crm-type-relation-parent-selected-values"
				@click.stop="toEditMode"
				v-if="!isEditMode"
			>{{ readOnlyLabels() }}
			</div>
			<div
				ref="entitySelectorRef"
				data-role="crm-type-relation-parent-entity-selector"
				v-show="isEditMode"
			></div>
		</div>
	`
	};

	const SliderPermissions = {
		name: 'SliderPermissions',
		props: {
			entityCode: {
				required: true,
				type: String
			}
		},
		components: {
			ExpandControl,
			PermissionControl,
			EntityControl
		},
		data() {
			return {
				ui: {
					stageVisibilityCodes: {}
				}
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['getEntitiesGroupedByPermission', 'getAssignedAttribute', 'getTransitionSettings']),
			permissions() {
				return this.getEntitiesGroupedByPermission(this.entityCode);
			},
			displayList() {
				return this.permissions.filter(perm => {
					if (!perm.stageField) {
						return true;
					}
					return this.ui.stageVisibilityCodes[perm.code];
				});
			},
			isShowExpandControl: () => perm => {
				if (perm.stageField) {
					return false;
				}
				if (!perm.isEntityStageSupport) {
					return false;
				}
				if (!perm.isPermissionStageSupport) {
					return false;
				}
				return true;
			},
			getName: () => perm => {
				if (!perm.stageField) {
					return perm.name;
				}
				return perm.stateName;
			},
			identifier(perm) {
				return this.getIdentifier(perm.code, perm.stageField, perm.stageCode);
			}
		},
		mounted() {},
		methods: {
			...ui_vue3_vuex.mapMutations(['assignPermissionAttribute', 'assignTransitions']),
			onToggleStageVisibility(code) {
				if (this.ui.stageVisibilityCodes[code]) {
					delete this.ui.stageVisibilityCodes[code];
				} else {
					this.ui.stageVisibilityCodes[code] = true;
				}
			},
			isExpanded(code) {
				return this.ui.stageVisibilityCodes[code] || false;
			},
			isRowStageRow(perm) {
				return Boolean(perm.stageField);
			},
			getAttributeValue(identifier) {
				return this.getAssignedAttribute(identifier) || '';
			},
			onAttributeValueChanged(payload) {
				this.assignPermissionAttribute({
					identifier: payload.identifier,
					value: payload.value
				});
			},
			getIdentifier(permissionCode, stageField, stageCode) {
				return {
					permissionCode,
					entityCode: this.entityCode,
					stageField,
					stageCode
				};
			},
			onTransitionValuesChanged(payload) {
				this.assignTransitions({
					identifier: payload.identifier,
					values: payload.values
				});
			}
		},
		template: `
		<div class="bx-crm-perms-edit-entity-permissions">
			<div
				v-for="perm of displayList"
				class="bx-crm-perms-edit-entity-permissions-item"
				:data-permission-code="perm.code"
				:class="{'stage-item': isRowStageRow(perm)}"
			>
				<div class="bx-crm-perms-edit-entity-permissions-item__column">
					<ExpandControl 
						v-if="isShowExpandControl(perm)"
						:is-expanded="isExpanded(perm.code)"
						@toggle="onToggleStageVisibility(perm.code)"
					/>
					<span :class="{'small-label': isRowStageRow(perm)}">
						{{ getName(perm) }}
					</span>
				</div>
				<div class="bx-crm-perms-edit-entity-permissions-item__column">
					<PermissionControl
						:value="getAttributeValue(getIdentifier(perm.code, perm.stageField, perm.stageCode))"
						:values-map="perm.values"
						:permission-identifier="getIdentifier(perm.code, perm.stageField, perm.stageCode)"
						@value-changed="onAttributeValueChanged"
						v-if="perm.code !== 'TRANSITION'"
					/>
					<EntityControl
						v-if="perm.code === 'TRANSITION'"
						:values="getTransitionSettings(getIdentifier(perm.code, perm.stageField, perm.stageCode))"
						@onTransitionValuesChanged="onTransitionValuesChanged"
						:values-map="perm.values"
						:permission-identifier="getIdentifier(perm.code, perm.stageField, perm.stageCode)"
					/>
				</div>
			</div>
		</div>
	`
	};

	class SliderManager {
		#url;
		#containerId;
		#sliderApplication;
		constructor(entityCode, storage) {
			const rnd = Math.round(Math.random() * 10000);
			this.#url = `bx-crm-perms-role-edit-slider__${Date.now()}`;
			this.#containerId = `bx-crm-perms-role-edit-slider-container__${Date.now()}__${rnd}`;
			this.#sliderApplication = this.#createApplication(entityCode);
			this.#sliderApplication.use(storage);
		}
		async open() {
			ui_sidepanel.SidePanel.Instance.open(this.#url, await this.#getOptions());
		}
		close() {}
		async #getOptions() {
			const buttons = [new ui_buttons.Button({
				text: main_core.Loc.getMessage('UI_BUTTONS_CLOSE_BTN_TEXT'),
				size: ui_buttons.Button.Size.MEDIUM,
				color: ui_buttons.Button.Color.LIGHT_BORDER,
				dependOnTheme: false,
				onclick: () => {
					this.#closeApplication();
					ui_sidepanel.SidePanel.Instance.close();
				}
			})];
			const layout = await ui_sidepanel_layout.Layout.createLayout({
				title: '',
				content: () => `<div id="${this.#containerId}"></div>`,
				buttons: () => buttons,
				design: {
					section: false
				}
			});
			return {
				contentClassName: '',
				allowChangeTitle: false,
				width: 800,
				cacheable: false,
				allowChangeHistory: false,
				label: '',
				contentCallback: slider => {
					return layout.render();
				},
				events: {
					onOpenComplete: () => {
						const rootNode = document.getElementById(this.#containerId);
						this.#sliderApplication.mount(rootNode);
					},
					onClose: () => {
						this.#closeApplication();
					}
				}
			};
		}
		#closeApplication() {
			if (this.#sliderApplication) {
				this.#sliderApplication.unmount();
				this.#sliderApplication = null;
			}
		}
		#createApplication(entityCode) {
			return ui_vue3.BitrixVue.createApp({
				name: 'CrmConfigPermsRoleEditSlider',
				components: {
					SliderPermissions
				},
				props: {
					entityCode: {
						required: true,
						type: String
					}
				},
				computed: {
					...ui_vue3_vuex.mapGetters(['permissionEntities', 'getMainPermissionEntityByCode']),
					entity() {
						return this.getMainPermissionEntityByCode(this.entityCode);
					},
					entityName() {
						return this?.entity?.name || '';
					}
				},
				methods: {
					...ui_vue3_vuex.mapMutations(['assignPermissionAttribute'])
				},
				template: `
				<div class="bx-crm-perms-edit-slider">
					<h1>{{ entityName }}</h1>
					<SliderPermissions
						:entity-code="entityCode"
					/>
				</div>
			`
			}, {
				entityCode
			});
		}
		static create(entity, storage) {
			return new SliderManager(entity, storage);
		}
	}

	var Row = {
		name: 'Row',
		props: {
			entity: Object
		},
		data() {
			return {
				labels: {
					moreName: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_MORE')
				},
				maxOrder: 0
			};
		},
		components: {
			PermissionControl,
			ExpandControl
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['availablePermissions', 'isStageEntitiesVisible', 'getAssignedAttribute', 'permissionsOnMainView', 'groupEntityPermission', 'getAvailablePermissionsOrders']),
			isExpandedStages() {
				return this.isStageEntitiesVisible(this.entity);
			},
			isShowMore() {
				return this.maxOrder > MAX_SORT_ORDER_ON_THE_DESK;
			}
		},
		mounted() {
			let maxOrder = 0;
			for (const permCode of Object.keys(this.entity.permissions)) {
				maxOrder = Math.max(maxOrder, this.getAvailablePermissionsOrders[permCode] || 0);
			}
			this.maxOrder = maxOrder;
		},
		methods: {
			...ui_vue3_vuex.mapMutations(['toggleStagesVisibility', 'assignPermissionAttribute', 'setEditMode']),
			expandChanged() {
				this.toggleStagesVisibility(this.entity);
			},
			openSlider() {
				SliderManager.create(this.entity.entityCode, this.$store).open();
			},
			attributeValue(permissionCode) {
				const identifier = this.getIdentifier(permissionCode);
				return this.getAssignedAttribute(identifier) || '';
			},
			onAttributeValueChanged(payload) {
				this.assignPermissionAttribute({
					identifier: payload.identifier,
					value: payload.value
				});
			},
			getIdentifier(permissionCode) {
				return {
					permissionCode,
					entityCode: this.entity.entityCode,
					stageField: this.entity.stageField,
					stageCode: this.entity.stageCode
				};
			},
			isShowControl(perm) {
				if (!this.entity.permissions[perm.code]) {
					return false;
				}
				if (this.entity.stageField && perm.canAssignPermissionToStages === false) {
					return false;
				}
				return true;
			}
		},
		template: `
		<tr 
			class="bx-crm-perms-desk-row bx-crm-perms-edit-desk__body"
		>
			<td class="bx-crm-perms-desk-row-item">
				<ExpandControl 
					v-if="entity.hasStages" 
					:is-expanded="isExpandedStages" 
					@toggle="expandChanged" 
				/> 
				<span :class="{'stage-row': !!entity.stageField}">{{ entity.name }}</span>
			</td>
			<td
				v-for="perm of permissionsOnMainView"
				class="bx-crm-perms-desk-row-item"
				:data-permission-code="perm.code"
				:data-permission-entity="entity.entityCode"
				:data-permission-attr-field="entity.stageField"
				:data-permission-attr-value="entity.stageCode"
			>
				<PermissionControl
					v-if="isShowControl(perm)"
					:value="attributeValue(perm.code)"
					:values-map="entity.permissions[perm.code]"
					:permission-identifier="getIdentifier(perm.code)"
					@value-changed="onAttributeValueChanged"
				></PermissionControl>
			</td>
			<td 
				v-if="!entity.stageField"
				class="bx-crm-perms-desk-row-item"
				data-permission-code="MORE"
				:data-permission-entity="entity.entityCode"
			>
				<span
					v-if="isShowMore"
					class="bx-crm-perms-edit-permission_control-text bx-crm-perms-desk-row-more"
					@click="openSlider"
				>
					{{ labels.moreName }}
				</span>
			</td>
		</tr>
	`
	};

	const Desk = {
		name: 'Desk',
		components: {
			PermissionControl,
			Row
		},
		data() {
			return {
				labels: {
					allowToChangeConfigName: main_core.Loc.getMessage('CRM_PERMS_EDIT_ALLOW_TO_CHANGE_CONFIG'),
					saveName: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_SAVE'),
					applyName: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_APPLY'),
					roleName: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_ROLE'),
					notAllowedByTariff: main_core.Loc.getMessage('CRM_PERMS_EDIT_RESTRICTION'),
					roleDelete: main_core.Loc.getMessage('CRM_PERMS_EDIT_ROLE_DELETE'),
					additionalName: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_ADDITIONAL')
				}
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['permissionEntitiesExpanded', 'permissionsOnMainView', 'getAssignedAttribute']),
			configWrite: {
				get() {
					return this.getAssignedAttribute({
						permissionCode: 'WRITE',
						entityCode: 'CONFIG'
					}) === 'X';
				},
				set(value) {
					this.assignPermissionAttribute({
						value: value ? 'X' : '',
						identifier: {
							permissionCode: 'WRITE',
							entityCode: 'CONFIG'
						}
					});
				}
			},
			columnsCount() {
				return MAX_SORT_ORDER_ON_THE_DESK + 2;
			}
		},
		methods: {
			...ui_vue3_vuex.mapMutations(['assignPermissionAttribute']),
			getStages(entity) {
				return entity.fields.STAGE_ID || {};
			}
		},
		mounted() {},
		template: `
		<table class="bx-crm-perms-edit-desk">
			<tr class="bx-crm-perms-desk-row bx-crm-perms-edit-desk__head">
				<th class="bx-crm-perms-desk-row-item"></th>
				<th
					v-for="perm in permissionsOnMainView"
					:key="perm.code"
					class="bx-crm-perms-desk-row-item"
				>
					{{ perm.name }}
				</th>
				<th class="bx-crm-perms-desk-row-item">
					{{ labels.additionalName }}
				</th>
			</tr>

			<Row v-for="permissionEntity of permissionEntitiesExpanded" :entity="permissionEntity" />
			
			<tr class="bx-crm-perms-desk-row bx-crm-perms-edit-desk__footer">
				<td class="bx-crm-perms-desk-row-item" :colspan="columnsCount">
					<label>
						<input name="WRITE" type="checkbox" v-model="configWrite">
						{{ labels.allowToChangeConfigName }}
					</label>
				</td>
			</tr>
		</table>
	`
	};

	const Loader = {
		name: 'Loader',
		mounted() {
			const loader = new ui_loader.Loader({
				target: this.$refs.loaderRef,
				type: 'BULLET',
				size: 'XL'
			});
			loader.render();
			loader.show();
		},
		template: `
		<div>
			<div class="bx-crm-perms-edit-loader"></div>
			<div class="bx-crm-perms-edit-loader-progress" ref="loaderRef"></div>
		</div>
	`
	};

	const Main = {
		name: 'Main',
		components: {
			Desk,
			Loader
		},
		data() {
			return {
				labels: {
					saveName: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_SAVE'),
					applyName: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_APPLY'),
					roleName: main_core.Loc.getMessage('CRM_PERMS_EDIT_ENTITIES_ROLE'),
					notAllowedByTariff: main_core.Loc.getMessage('CRM_PERMS_EDIT_RESTRICTION'),
					roleDelete: main_core.Loc.getMessage('CRM_PERMS_EDIT_ROLE_DELETE')
				}
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['hasTariffPermission', 'getRoleName', 'getRestrictionScript', 'getLastErrorMessage', 'getRoleId', 'isSaveInProgress']),
			roleName: {
				get() {
					return this.getRoleName;
				},
				set(val) {
					this.setRoleName(val);
				}
			},
			isShowDeleteBtn() {
				return this.getRoleId > 0;
			}
		},
		methods: {
			...ui_vue3_vuex.mapMutations(['setRoleName']),
			...ui_vue3_vuex.mapActions(['saveRolePermission', 'deleteRole']),
			async onPressSave() {
				await this.performSave('save');
			},
			async onPressApply() {
				await this.performSave('apply');
			},
			async onPressDeleteRole() {
				if (!this.hasTariffPermission) {
					this.executeTariffRestrictionScript();
				}
				await this.deleteRole();
			},
			async performSave(action) {
				if (!this.hasTariffPermission) {
					this.executeTariffRestrictionScript();
				}
				await this.saveRolePermission(action);
			},
			executeTariffRestrictionScript() {
				const script = this.getRestrictionScript;
				if (script) {
					// eslint-disable-next-line no-eval
					eval(script);
				}
			}
		},
		template: `
		<div class="bx-crm-perms-main">
			<Loader v-if="isSaveInProgress"/>
			<p class="bx-crm-perms-desk-error" v-if="getLastErrorMessage">
				{{ getLastErrorMessage }}
			</p>
	
			<label>
				{{ labels.roleName }}:
				<input name="NAME" v-model="roleName" class="bx-crm-perms-desk-input-role_name">
			</label>
	
			<Desk/>

			<div class="bx-crm-perms-desk-footer">
				<div class="bx-crm-perms-desk-footer-colleft">
					<button @click="onPressSave" class="bx-crm-perms-desk-btn" name="save">{{ labels.saveName }}</button>
					<button @click="onPressApply" class="bx-crm-perms-desk-btn" name="apply">{{ labels.applyName }}</button>
				</div>
				<div class="bx-crm-perms-desk-footer-colright">
					<span 
						v-if="isShowDeleteBtn" 
						class="bx-crm-perms-desk-delete"
						@click="onPressDeleteRole"
					>{{ labels.roleDelete }}</span>
				</div>
			</div>

			<div
				v-if="!hasTariffPermission"
				class="ui-alert ui-alert-warning"
				style="margin: 15px 0 0 0;"
			>
				<span class="ui-alert-message" v-html="labels.notAllowedByTariff"></span>
			</div>

		</div>
	`
	};

	class EditApp {
		#options;
		#application = null;
		constructor(options) {
			this.#options = options;
		}
		start(data) {
			const storage = ui_vue3_vuex.createStore(store());
			this.#application = ui_vue3.BitrixVue.createApp({
				name: 'CrmConfigPermsRoleEdit',
				components: {
					Main
				},
				template: `
				<Main/>
			`
			});
			storage.commit('setInitData', data);
			this.#application.use(storage);
			const rootNode = document.getElementById(this.#options.containerId);
			this.#application.mount(rootNode);
		}
	}

	exports.EditApp = EditApp;

})(this.BX.Crm.Perms = this.BX.Crm.Perms || {}, BX.Vue3, BX.Vue3.Vuex, BX, BX, BX.UI, BX, BX.UI.SidePanel, BX.Event, BX.UI.EntitySelector, BX.UI);
//# sourceMappingURL=edit.bundle.js.map
