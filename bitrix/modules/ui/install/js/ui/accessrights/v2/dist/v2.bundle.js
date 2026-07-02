/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.AccessRights = this.BX.UI.AccessRights || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_dialogs_messagebox, ui_vue3, ui_vue3_vuex, ui_entitySelector, main_popup, ui_vue3_components_richMenu, ui_accessrights_v2_itemListSelector, ui_vue3_directives_hint, ui_system_chip_vue, ui_icon, ui_iconSet_actions, ui_vue3_components_switcher, ui_iconSet_api_vue, ui_vue3_components_popup, ui_ears, ui_hint, ui_notification, ui_analytics, main_loader) {
	'use strict';

	/**
	 * @abstract
	 */
	class Base {
		/*
		 * @abstract
		 */
		getComponentName() {
			throw new Error('not implemented');
		}
		getEmptyValue(item) {
			return item.emptyValue ?? new Set();
		}
		getMinValue(item) {
			if (!main_core.Type.isNil(item.minValue)) {
				return item.minValue;
			}
			return null;
		}
		getMaxValue(item) {
			if (!main_core.Type.isNil(item.maxValue)) {
				return item.maxValue;
			}
			return null;
		}
		isRowValueConfigurable() {
			return true;
		}
	}

	let DependentVariables$2 = class DependentVariables extends Base {
		getComponentName() {
			return 'DependentVariables';
		}
	};

	let Multivariables$2 = class Multivariables extends Base {
		getComponentName() {
			return 'Multivariables';
		}
	};

	let Toggler$1 = class Toggler extends Base {
		getComponentName() {
			return 'Toggler';
		}
		getEmptyValue(item) {
			const isFalsy = !item.emptyValue || !item.emptyValue[0];
			if (isFalsy) {
				// use explicit '0' for correctly identify modifications
				return new Set(['0']);
			}
			return super.getEmptyValue(item);
		}
		getMinValue(item) {
			const explicit = super.getMinValue(item);
			if (!main_core.Type.isNull(explicit)) {
				return explicit;
			}
			return new Set(['0']);
		}
		getMaxValue(item) {
			const explicit = super.getMaxValue(item);
			if (!main_core.Type.isNull(explicit)) {
				return explicit;
			}
			return new Set(['1']);
		}
		isRowValueConfigurable() {
			return false;
		}
	};

	let Variables$2 = class Variables extends Base {
		getComponentName() {
			return 'Variables';
		}
	};

	const EntitySelectorContext = Object.freeze({
		ROLE: 'ui.accessrights.v2~role-selector',
		MEMBER: 'ui.accessrights.v2~member-selector',
		VARIABLE: 'ui.accessrights.v2~variable-selector',
		USER: 'ui.accessrights.v2~user-selector'
	});
	const EntitySelectorEntities = Object.freeze({
		ROLE: 'ui.accessrights.v2~role',
		VARIABLE: 'ui.accessrights.v2~variable'
	});

	const STRUCTURE_NODE_ENTITY_TYPE = Object.freeze({
		TEAM: 'team',
		DEPARTMENT: 'department'
	});
	const STRUCTURE_NODE_ENTITY_TYPE_INFO = Object.freeze({
		[STRUCTURE_NODE_ENTITY_TYPE.DEPARTMENT]: {
			commonPrefix: 'SND',
			recursivePrefix: 'SNDR',
			memberType: 'structuredepartments'
		},
		[STRUCTURE_NODE_ENTITY_TYPE.TEAM]: {
			commonPrefix: 'SNT',
			recursivePrefix: 'SNTR',
			memberType: 'structureteams'
		}
	});
	class SelectorService {
		#options;
		constructor(options) {
			this.#options = options;
		}
		createDialog(dialogOptions) {
			return new ui_entitySelector.Dialog({
				...dialogOptions,
				context: EntitySelectorContext.MEMBER,
				enableSearch: true,
				alwaysShowLabels: true,
				cacheable: false,
				entities: dialogOptions.entities ?? this.entities()
			});
		}
		entities() {
			const entities = [{
				id: 'user',
				options: {
					intranetUsersOnly: true,
					emailUsers: false,
					inviteEmployeeLink: false,
					inviteGuestLink: false
				}
			}];
			const includedNodeEntityTypes = [];
			if (this.#options.useStructureDepartmentsProviderTab) {
				includedNodeEntityTypes.push('department');
			}
			if (this.#options.addStructureTeamsProviderTab) {
				includedNodeEntityTypes.push('team');
			}
			if (includedNodeEntityTypes.length > 0) {
				entities.push({
					id: 'structure-node',
					options: {
						selectMode: 'usersAndDepartments',
						allowSelectRootDepartment: true,
						allowFlatDepartments: true,
						includedNodeEntityTypes,
						useMultipleTabs: true,
						visual: {
							avatarMode: 'node',
							tagStyle: 'none'
						}
					}
				});
			}
			if (!this.#options.useStructureDepartmentsProviderTab) {
				entities.push({
					id: 'department',
					options: {
						selectMode: 'usersAndDepartments',
						allowSelectRootDepartment: true,
						allowFlatDepartments: true
					}
				});
			}
			entities.push({
				id: 'site-groups',
				dynamicLoad: true,
				dynamicSearch: true
			});
			if (this.#options.addStructureRolesProviderTab) {
				entities.push({
					id: 'structure-role',
					options: {
						includedNodeEntityTypes: ['team', 'department']
					},
					dynamicLoad: true,
					dynamicSearch: true
				});
			}
			if (this.#options.addProjectsProviderTab) {
				entities.push({
					id: 'project-access-codes'
				});
			}
			if (this.#options.addUserGroupsProviderTab) {
				entities.push({
					id: 'user-groups',
					dynamicLoad: true,
					options: {}
				});
			}
			return entities;
		}

		// eslint-disable-next-line sonarjs/cognitive-complexity
		getItemIdByAccessCode(accessCode) {
			if (/^I?U(\d+)$/.test(accessCode)) {
				const match = accessCode.match(/^I?U(\d+)$/) || null;
				const userId = match ? match[1] : null;
				return ['user', userId];
			}
			if (/^DR(\d+)$/.test(accessCode)) {
				const match = accessCode.match(/^DR(\d+)$/) || null;
				const departmentId = match ? match[1] : null;
				return ['department', departmentId];
			}
			if (/^D(\d+)$/.test(accessCode)) {
				const match = accessCode.match(/^D(\d+)$/) || null;
				const departmentId = match ? match[1] : null;
				return ['department', `${departmentId}:F`];
			}
			if (/^G(\d+)$/.test(accessCode)) {
				const match = accessCode.match(/^G(\d+)$/) || null;
				const groupId = match ? match[1] : null;
				return ['site-groups', groupId];
			}
			if (/^(?:ATD|ATE|ATT|AD|AE|AT)[1-9]\d*$/.test(accessCode)) {
				return ['structure-role', accessCode];
			}
			if (accessCode.at(0) === 'A') {
				return ['user-groups', accessCode];
			}
			if (/^SG(\d+)_([AEK])$/.test(accessCode)) {
				return ['project-access-codes', accessCode];
			}
			if (/^SNT(\d+)$/.test(accessCode)) {
				const match = accessCode.match(/^SNT(\d+)$/) || null;
				const structureNodeId = match ? match[1] : null;
				return ['structure-node', `${structureNodeId}:F`];
			}
			if (/^SNTR(\d+)$/.test(accessCode)) {
				const match = accessCode.match(/^SNTR(\d+)$/) || null;
				const structureNodeId = match ? match[1] : null;
				return ['structure-node', structureNodeId];
			}
			if (/^SND(\d+)$/.test(accessCode)) {
				const match = accessCode.match(/^SND(\d+)$/) || null;
				const structureNodeId = match ? match[1] : null;
				return ['structure-node', `${structureNodeId}:F`];
			}
			if (/^SNDR(\d+)$/.test(accessCode)) {
				const match = accessCode.match(/^SNDR(\d+)$/) || null;
				const structureNodeId = match ? match[1] : null;
				return ['structure-node', structureNodeId];
			}
			return ['unknown', accessCode];
		}
		getMemberTypeByItem(item) {
			switch (item.entityId) {
				case 'user':
					return 'users';
				case 'intranet':
				case 'department':
					return 'departments';
				case 'socnetgroup':
				case 'project-access-codes':
					return 'sonetgroups';
				case 'group':
					return 'groups';
				case 'structure-node':
					return this.getItemStructureNodeEntityTypeInfo(item, STRUCTURE_NODE_ENTITY_TYPE.TEAM).memberType;
				case 'site-groups':
				case 'user-groups':
				case 'structure-role':
					return 'usergroups';
				default:
					return '';
			}
		}
		getItemStructureNodeEntityTypeInfo(item, defaultNodeEntityType) {
			const availableNodeEntityTypes = Object.values(STRUCTURE_NODE_ENTITY_TYPE);
			let itemNodeEntityType = item.getCustomData().get('nodeEntityType') ?? '';
			if (availableNodeEntityTypes.includes(itemNodeEntityType)) {
				return STRUCTURE_NODE_ENTITY_TYPE_INFO[itemNodeEntityType];
			}
			const accessCode = item.getCustomData().get('accessCode') ?? '';
			Object.entries(STRUCTURE_NODE_ENTITY_TYPE_INFO).forEach(([nodeEntityType, info]) => {
				if (accessCode.startsWith(info.commonPrefix)) {
					itemNodeEntityType = nodeEntityType;
				}
			});
			if (!availableNodeEntityTypes.includes(itemNodeEntityType)) {
				itemNodeEntityType = defaultNodeEntityType;
			}
			return STRUCTURE_NODE_ENTITY_TYPE_INFO[itemNodeEntityType];
		}

		// eslint-disable-next-line sonarjs/cognitive-complexity
		getAccessCodeByItem(item) {
			const entityId = item.entityId;
			if (entityId === 'user') {
				return `U${item.id}`;
			}
			if (entityId === 'department') {
				if (main_core.Type.isString(item.id) && item.id.endsWith(':F')) {
					const match = item.id.match(/^(\d+):F$/);
					const originalId = match ? match[1] : null;

					// only members of the department itself
					return `D${originalId}`;
				}

				// whole department recursively
				return `DR${item.id}`;
			}
			if (entityId === 'structure-node') {
				const itemNodeEntityType = this.getItemStructureNodeEntityTypeInfo(item, STRUCTURE_NODE_ENTITY_TYPE.TEAM);
				if (main_core.Type.isString(item.id) && item.id.endsWith(':F')) {
					const match = item.id.match(/^(\d+):F$/);
					const originalId = match ? match[1] : null;
					const prefix = itemNodeEntityType.commonPrefix;
					return `${prefix}${originalId}`;
				}
				const prefix = itemNodeEntityType.recursivePrefix;
				return `${prefix}${item.id}`;
			}
			if (entityId === 'site-groups') {
				return `G${item.id}`;
			}
			if (entityId === 'structure-role') {
				return item.id;
			}
			if (entityId === 'user-groups') {
				return item.id;
			}
			if (entityId === 'project-access-codes') {
				return item.id;
			}
			return '';
		}
		getItemIdsByAccessCodes(accessCodes) {
			const map = new Map();
			accessCodes.forEach(accessCode => {
				map.set(accessCode, this.getItemIdByAccessCode(accessCode));
			});
			return map;
		}
		getMemberByItem(item) {
			return {
				id: this.getAccessCodeByItem(item),
				type: this.getMemberTypeByItem(item),
				name: item.title.text,
				avatar: main_core.Type.isStringFilled(item.avatar) ? item.avatar : null
			};
		}
	}

	class ServiceLocator {
		static #cache = new main_core.Cache.MemoryCache();

		/**
		 * `BX.UI.Hint.createInstance` takes up to 30% of CPU time when multiple hints are mounted on page
		 * (e.g. on a load, search), probably because of `Manager.initByClassName` call in `new Manager`.
		 * therefore, we share a Manager instance across all hints in the app
		 */
		static getHint(appGuid) {
			return this.#cache.remember(`hint-${appGuid}`, () => {
				return BX.UI.Hint.createInstance({
					id: `ui-access-rights-v2-hint-${appGuid}`,
					classNameIcon: 'ui-icon-set --o-question',
					popupParameters: {
						className: 'ui-access-rights-v2-popup-pointer-events ui-hint-popup',
						autoHide: true,
						darkMode: true,
						maxWidth: 280,
						offsetTop: 0,
						offsetLeft: 8,
						angle: true,
						animation: 'fading-slide'
					}
				});
			});
		}
		static getValueTypeByRight(right) {
			return this.getValueType(right.type);
		}
		static getValueType(type) {
			const stringType = String(type);
			return this.#cache.remember(stringType, () => {
				if (stringType === 'dependent_variables') {
					return new DependentVariables$2();
				}
				if (stringType === 'multivariables') {
					return new Multivariables$2();
				}
				if (stringType === 'toggler') {
					return new Toggler$1();
				}
				if (stringType === 'variables') {
					return new Variables$2();
				}
				console.warn('ui.accessrights.v2: Unknown access right type', type);
				return null;
			});
		}
		static getSelectorService(memberOptions) {
			return new SelectorService(memberOptions);
		}
	}

	const Selector$1 = {
		name: 'Selector',
		emits: ['close'],
		props: {
			userGroup: {
				/** @type UserGroup */
				type: Object,
				required: true
			},
			bindNode: {
				type: HTMLElement,
				required: true
			}
		},
		computed: {
			selectedItems() {
				const result = [];
				for (const accessCode of this.userGroup.members.keys()) {
					result.push(this.getSelectorService().getItemIdByAccessCode(accessCode));
				}
				return result;
			},
			...ui_vue3_vuex.mapState({
				options: state => state.application.options,
				memberOptions: state => state.application.options.additionalMembersParams
			})
		},
		mounted() {
			this.getSelectorService().createDialog({
				targetNode: this.bindNode,
				preselectedItems: this.selectedItems,
				events: {
					onHide: this.onHide
				}
			}).show();
		},
		methods: {
			onHide(event) {
				const dialog = event.getTarget();
				const members = [];
				dialog.selectedItems.forEach(item => {
					members.push(this.getSelectorService().getMemberByItem(item));
				});
				this.$store.dispatch('userGroups/updateMembersForUserGroup', {
					userGroupId: this.userGroup.id,
					members
				});
				this.$emit('close');
			},
			getMemberFromEvent(event) {
				const {
					item
				} = event.getData();
				return this.getSelectorService().getMemberByItem(item);
			},
			getSelectorService() {
				return ServiceLocator.getSelectorService(this.memberOptions);
			}
		},
		// just a template stub
		template: '<div hidden></div>'
	};

	const SingleMember = {
		name: 'SingleMember',
		props: {
			member: {
				/** @type Member */
				type: Object,
				required: true
			}
		},
		computed: {
			avatarBackgroundImage() {
				return `url('${encodeURI(this.member.avatar)}')`;
			},
			noAvatarClass() {
				if (this.member.type === 'groups') {
					return 'ui-icon-common-user-group';
				}
				if (this.member.type === 'sonetgroups' || this.member.type === 'departments' || this.member.type === 'structuredepartments') {
					return 'ui-icon-common-company';
				}
				if (this.member.type === 'usergroups') {
					return 'ui-icon-common-user-group';
				}
				if (this.member.type === 'structureteams') {
					return 'ui-icon-common-my-plan';
				}
				return 'ui-icon-common-user';
			},
			memberTitle() {
				if (main_core.Type.isStringFilled(this.member.name)) {
					return this.member.name;
				}
				return '';
			}
		},
		template: `
		<div class='ui-access-rights-v2-members-item'>
			<a
				v-if="member.avatar"
				class='ui-access-rights-v2-members-item-avatar'
				:title="memberTitle"
				:style="{
						backgroundImage: avatarBackgroundImage,
						backgroundSize: 'cover',
					}"
			>
			</a>
			<a v-else class='ui-icon ui-access-rights-v2-members-item-icon' :class="noAvatarClass" :title="memberTitle">
				<i></i>
			</a>
		</div>
	`
	};

	const MAX_SHOWN_MEMBERS = 5;
	const Members = {
		name: 'Members',
		components: {
			SingleMember,
			Selector: Selector$1
		},
		props: {
			userGroup: {
				/** @type UserGroup */
				type: Object,
				required: true
			}
		},
		data() {
			return {
				isSelectorShown: false,
				isSelectedMembersPopupShown: false
			};
		},
		popup: null,
		computed: {
			shownMembers() {
				if (this.userGroup.members.size <= MAX_SHOWN_MEMBERS) {
					return this.userGroup.members;
				}
				const shownKeyValuePairs = [...this.userGroup.members].slice(0, MAX_SHOWN_MEMBERS);
				return new Map(shownKeyValuePairs);
			},
			notShownMembersCount() {
				if (this.userGroup.members.size > MAX_SHOWN_MEMBERS) {
					return this.userGroup.members.size - MAX_SHOWN_MEMBERS;
				}
				return 0;
			},
			bindNode() {
				return this.$refs.container;
			}
		},
		template: `
		<div ref="container" class="ui-access-rights-v2-members-container"  @click="isSelectorShown = true">
			<div v-if="userGroup.members.size > 0" class='ui-access-rights-v2-members'>
				<SingleMember v-for="[accessCode, member] in shownMembers" :key="accessCode" :member="member"/>
				<span v-if="notShownMembersCount > 0" class="ui-access-rights-v2-members-more">
					+ {{ notShownMembersCount }}
				</span>
			</div>
			<div
				class='ui-access-rights-v2-members-item ui-access-rights-v2-members-item-add'
				:class="{
					'--show-always': userGroup.members.size <= 0,
					'--has-siblings': userGroup.members.size > 0,
				}"
			>
				<div class="ui-icon-set --plus-m"></div>
			</div>
			<Selector
				v-if="isSelectorShown"
				:user-group="userGroup"
				:bind-node="bindNode"
				@close="isSelectorShown = false"
			/>
		</div>
	`
	};

	const RoleHeading = {
		name: 'RoleHeading',
		components: {
			RichMenuPopup: ui_vue3_components_richMenu.RichMenuPopup,
			RichMenuItem: ui_vue3_components_richMenu.RichMenuItem
		},
		props: {
			userGroup: {
				/** @type UserGroup */
				type: Object,
				required: true
			}
		},
		data() {
			return {
				isEdit: false,
				isPopupShown: false
			};
		},
		computed: {
			RichMenuItemIcon: () => ui_vue3_components_richMenu.RichMenuItemIcon,
			...ui_vue3_vuex.mapState({
				isProgress: state => state.application.isProgress,
				guid: state => state.application.guid,
				maxVisibleUserGroups: state => state.application.options.maxVisibleUserGroups
			}),
			...ui_vue3_vuex.mapGetters({
				isMaxVisibleUserGroupsReached: 'userGroups/isMaxVisibleUserGroupsReached',
				isMaxValueSetForAny: 'accessRights/isMaxValueSetForAny',
				isMinValueSetForAny: 'accessRights/isMinValueSetForAny'
			}),
			title: {
				get() {
					return this.userGroup.title;
				},
				set(title) {
					this.$store.dispatch('userGroups/setRoleTitle', {
						userGroupId: this.userGroup.id,
						title
					});
				}
			}
		},
		watch: {
			isEdit(newValue) {
				if (newValue === true) {
					this.bindClickedOutsideHandler();
					void this.$nextTick(() => {
						this.$refs.input.scrollIntoView({
							behavior: 'smooth',
							block: 'nearest',
							inline: 'nearest'
						});
						this.$refs.input.focus();
						this.$refs.input.select();
					});
				} else {
					this.unbindClickedOutsideHandler();
				}
			}
		},
		mounted() {
			// todo fix hide/show new role
			if (this.userGroup.isNew) {
				// start editing a newly created role right away
				this.isEdit = true;
			}
		},
		beforeUnmount() {
			this.unbindClickedOutsideHandler();
		},
		methods: {
			bindClickedOutsideHandler() {
				main_core.Event.bind(window, 'click', this.turnOffEditWhenClickedOutside, {
					capture: true
				});
			},
			unbindClickedOutsideHandler() {
				main_core.Event.unbind(window, 'click', this.turnOffEditWhenClickedOutside, {
					capture: true
				});
			},
			turnOffEditWhenClickedOutside(event) {
				if (event.target !== this.$refs.input) {
					this.isEdit = false;
				}
			},
			showDeleteConfirmation() {
				const popup = new main_popup.Popup({
					bindElement: this.$refs.container,
					width: 250,
					overlay: true,
					contentPadding: 10,
					content: this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_POPUP_REMOVE_ROLE'),
					className: 'ui-access-rights-del-role',
					animation: 'fading-slide',
					cacheable: false,
					buttons: [new ui_buttons.Button({
						text: this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_POPUP_REMOVE_ROLE_YES'),
						size: ui_buttons.ButtonSize.SMALL,
						color: ui_buttons.ButtonColor.PRIMARY,
						useAirDesign: true,
						events: {
							click: () => {
								popup.destroy();
								this.$store.dispatch('userGroups/removeUserGroup', {
									userGroupId: this.userGroup.id
								});
							}
						}
					}), new ui_buttons.CancelButton({
						text: this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_CANCEL'),
						size: ui_buttons.ButtonSize.SMALL,
						useAirDesign: true,
						style: ui_buttons.AirButtonStyle.OUTLINE,
						events: {
							click: () => {
								popup.destroy();
							}
						}
					})]
				});
				popup.show();
			},
			showActionsMenu() {
				if (!this.isProgress) {
					this.isPopupShown = true;
				}
			},
			onSetMaxValuesClick() {
				this.isPopupShown = false;
				this.$store.dispatch('userGroups/setMaxAccessRightValues', {
					userGroupId: this.userGroup.id
				});
			},
			onSetMinValuesClick() {
				this.isPopupShown = false;
				this.$store.dispatch('userGroups/setMinAccessRightValues', {
					userGroupId: this.userGroup.id
				});
			},
			onEnableEditClick() {
				this.isPopupShown = false;
				this.isEdit = true;
			},
			onCopyRoleClick() {
				if (this.isMaxVisibleUserGroupsReached) {
					return;
				}
				this.isPopupShown = false;
				this.$store.dispatch('userGroups/copyUserGroup', {
					userGroupId: this.userGroup.id
				});
			},
			onDeleteRoleClick() {
				this.isPopupShown = false;
				this.showDeleteConfirmation();
			}
		},
		template: `
		<div ref="container" class='ui-access-rights-v2-role'>
			<div class="ui-access-rights-v2-role-value-container">
				<input
					v-if="isEdit && !isProgress"
					ref="input"
					type='text'
					class='ui-access-rights-v2-role-input'
					v-model="title"
					:placeholder="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE_NAME')"
					@keydown.enter="isEdit = false"
				/>
				<div v-else class='ui-access-rights-v2-role-value' :title="title">{{ title }}</div>
			</div>
			<div 
				ref="menu"
				class="ui-icon-set --more-l ui-access-rights-v2-icon-more"
				style="position: absolute; right: 11px; top: 5px;"
				@click="showActionsMenu"
			>
				<RichMenuPopup v-if="isPopupShown" @close="isPopupShown = false" :popup-options="{bindElement: $refs.menu}">
					<RichMenuItem
						v-if="isMaxValueSetForAny"
						:icon="RichMenuItemIcon.check"
						:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SET_MAX_ACCESS_RIGHTS')"
						:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SET_MAX_ACCESS_RIGHTS_SUBTITLE')"
						@click="onSetMaxValuesClick"
					/>
					<RichMenuItem
						v-if="isMinValueSetForAny"
						:icon="RichMenuItemIcon['red-lock']"
						:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SET_MIN_ACCESS_RIGHTS')"
						:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SET_MIN_ACCESS_RIGHTS_SUBTITLE')"
						@click="onSetMinValuesClick"
					/>
					<RichMenuItem
						:icon="RichMenuItemIcon.pencil"
						:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_RENAME')"
						:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_RENAME_SUBTITLE')"
						@click="onEnableEditClick"
					/>
					<RichMenuItem
						:icon="RichMenuItemIcon.copy"
						:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_COPY')"
						:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_COPY_ROLE_SUBTITLE')"
						:disabled="isMaxVisibleUserGroupsReached"
						:hint="
							isMaxVisibleUserGroupsReached
								? $Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE_COPYING_DISABLED', {
									'#COUNT#': maxVisibleUserGroups,
								})
								: null
						"
						@click="onCopyRoleClick"
					/>
					<RichMenuItem
						:icon="RichMenuItemIcon['trash-bin']"
						:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_REMOVE')"
						:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_REMOVE_SUBTITLE')"
						@click="onDeleteRoleClick"
					/>
				</RichMenuPopup>
			</div>
		</div>
	`
	};

	class ItemsMapper {
		static mapUserGroups(userGroups) {
			const result = [];
			for (const userGroup of userGroups.values()) {
				result.push({
					id: userGroup.id,
					entityId: EntitySelectorEntities.ROLE,
					title: userGroup.title,
					supertitle: main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE'),
					avatar: '/bitrix/js/ui/accessrights/v2/images/role-avatar.svg',
					tabs: ['recents']
				});
			}
			return result;
		}
		static mapVariables(variables) {
			const items = [];
			for (const variable of variables.values()) {
				const item = main_core.Runtime.clone(variable);
				item.entityId = item.entityId || EntitySelectorEntities.VARIABLE;
				item.tabs = 'recents';
				items.push(item);
			}
			return items;
		}
	}

	// aka Role

	// access code => member

	// user/group/department/set of users

	const NEW_USER_GROUP_ID_PREFIX = 'new~~~';
	const SELECTED_ALL_USER_ID = 'all-users';
	class UserGroupsModel extends ui_vue3_vuex.BuilderModel {
		#initialUserGroups = new Map();
		#sortConfig = {};
		#selectedMember;
		getName() {
			return 'userGroups';
		}
		setInitialUserGroups(groups) {
			this.#initialUserGroups = groups;
			return this;
		}
		setSortConfig(sortConfig) {
			this.#sortConfig = sortConfig;
			return this;
		}
		setSelectedMember(selectedMember) {
			this.#selectedMember = selectedMember;
			return this;
		}
		getState() {
			return {
				collection: main_core.Runtime.clone(this.#initialUserGroups),
				deleted: new Set(),
				selectedMember: this.#selectedMember,
				sortConfig: this.#sortConfig
			};
		}
		getElementState(params = {}) {
			return {
				id: `${NEW_USER_GROUP_ID_PREFIX}${main_core.Text.getRandom()}`,
				isNew: true,
				isModified: true,
				title: main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE_NAME'),
				accessRights: new Map(),
				members: new Map()
			};
		}
		#getUserGroupsCollectionBySelectedMember(state) {
			const result = new Map();
			const selectedMemberId = state.selectedMember?.id ?? SELECTED_ALL_USER_ID;
			const accessCodes = state.selectedMember?.accessCodes ? [...state.selectedMember.accessCodes] : [];
			for (const [userGroupId, userGroup] of state.collection) {
				if (selectedMemberId === SELECTED_ALL_USER_ID || accessCodes.some(code => userGroup.members.has(code))) {
					result.set(userGroupId, userGroup);
				}
			}
			return result;
		}
		getGetters() {
			return {
				shown: (state, getters, rootState) => {
					const selectedMemberId = state.selectedMember?.id ?? SELECTED_ALL_USER_ID;
					const collection = this.#getUserGroupsCollectionBySelectedMember(state);
					if (!state.sortConfig || !state.sortConfig[selectedMemberId]) {
						if (rootState.application.options.maxVisibleUserGroups > 0) {
							return new Map([...collection].slice(0, rootState.application.options.maxVisibleUserGroups));
						}
						return collection;
					}
					const sortedGroups = [...collection].filter(([userGroupId]) => state.sortConfig[selectedMemberId][userGroupId] >= 0).sort(([idA], [idB]) => (state.sortConfig[selectedMemberId][idA] ?? Infinity) - (state.sortConfig[selectedMemberId][idB] ?? Infinity));
					if (rootState.application.options.maxVisibleUserGroups > 0) {
						return new Map(sortedGroups.slice(0, rootState.application.options.maxVisibleUserGroups));
					}
					return new Map(sortedGroups);
				},
				userGroupsBySelectedMember: state => {
					return this.#getUserGroupsCollectionBySelectedMember(state);
				},
				getEmptyAccessRightValue: (state, getters, rootState, rootGetters) => (userGroupId, sectionCode, valueId) => {
					const values = rootGetters['accessRights/getEmptyValue'](sectionCode, valueId);
					return {
						id: valueId,
						values,
						isModified: state.collection.get(userGroupId).isNew
					};
				},
				getAccessRightValue: (state, getters) => (userGroup, sectionCode, valueId) => {
					const value = userGroup.accessRights.get(valueId);
					return value ?? getters.getEmptyAccessRightValue(userGroup.id, sectionCode, valueId);
				},
				defaultAccessRightValues: (state, getters, rootState) => {
					const result = new Map();
					for (const section of rootState.accessRights.collection.values()) {
						for (const [rightId, right] of section.rights) {
							if (main_core.Type.isNil(right.defaultValue)) {
								continue;
							}
							result.set(rightId, {
								id: rightId,
								values: right.defaultValue,
								isModified: true
							});
						}
					}
					return result;
				},
				isModified: state => {
					if (state.deleted.size > 0) {
						return true;
					}
					for (const userGroup of state.collection.values()) {
						if (userGroup.isNew || userGroup.isModified) {
							return true;
						}
						for (const value of userGroup.accessRights.values()) {
							if (value.isModified) {
								return true;
							}
						}
					}
					return false;
				},
				isMaxVisibleUserGroupsReached: (state, getters, rootState, rootGetters) => {
					if (!rootGetters['application/isMaxVisibleUserGroupsSet']) {
						return false;
					}
					return getters.shown.size >= rootState.application.options.maxVisibleUserGroups;
				}
			};
		}
		getActions() {
			return {
				setAccessRightValues: (store, payload) => {
					this.#setAccessRightValuesAction(store, payload);
				},
				setAccessRightValuesForShown: (store, payload) => {
					this.#setAccessRightValuesForShownAction(store, payload);
				},
				setMinAccessRightValues: (store, payload) => {
					this.#setMinAccessRightValuesAction(store, payload);
				},
				setMaxAccessRightValues: (store, payload) => {
					this.#setMaxAccessRightValuesAction(store, payload);
				},
				setMinAccessRightValuesInSection: (store, payload) => {
					this.#setMinAccessRightValuesInSectionAction(store, payload);
				},
				setMaxAccessRightValuesInSection: (store, payload) => {
					this.#setMaxAccessRightValuesInSectionAction(store, payload);
				},
				setMinAccessRightValuesForRight: (store, payload) => {
					this.#setMinAccessRightValuesForRight(store, payload);
				},
				setMaxAccessRightValuesForRight: (store, payload) => {
					this.#setMaxAccessRightValuesForRight(store, payload);
				},
				setRoleTitle: (store, payload) => {
					this.#setRoleTitleAction(store, payload);
				},
				addMember: (store, payload) => {
					this.#addMemberAction(store, payload);
				},
				removeMember: (store, payload) => {
					this.#removeMemberAction(store, payload);
				},
				updateMembersForUserGroup: (store, payload) => {
					this.#updateMembersForUserGroupAction(store, payload);
				},
				copyUserGroup: (store, payload) => {
					this.#copyUserGroupAction(store, payload);
				},
				copySectionValues: (store, payload) => {
					this.#copySectionValuesAction(store, payload);
				},
				addUserGroup: store => {
					this.#addUserGroupAction(store);
				},
				removeUserGroup: (store, payload) => {
					this.#removeUserGroupAction(store, payload);
				},
				updateUserGroupSort: (store, payload) => {
					this.#updateUserGroupSortAction(store, payload);
				},
				updateSortConfigForSelectedMember: (store, payload) => {
					this.#updateSortConfigForSelectedMemberAction(store, payload);
				},
				updateSortConfig: (store, payload) => {
					this.#updateSortConfigAction(store, payload);
				},
				deleteRight: (store, payload) => {
					this.#deleteRightAction(store, payload);
				},
				selectMember: (store, payload) => {
					this.#selectMemberAction(store, payload);
				}
			};
		}
		#setAccessRightValuesAction(store, payload) {
			if (!main_core.Type.isSet(payload.values)) {
				console.warn('ui.accessrights.v2: Attempt to set not-Set values', payload);
				return;
			}
			if (!this.#isUserGroupExists(store, payload.userGroupId)) {
				console.warn('ui.accessrights.v2: Attempt to set value to a user group that dont exists', payload);
				return;
			}
			if (!this.#isValueExistsInStructure(store, payload.sectionCode, payload.valueId)) {
				console.warn('ui.accessrights.v2: Attempt to set value to a right that dont exists in structure', payload);
				return;
			}
			store.commit('setAccessRightValues', {
				userGroupId: payload.userGroupId,
				valueId: payload.valueId,
				values: payload.values,
				isModified: this.#isValueModified(payload.userGroupId, payload.valueId, payload.values, store.rootGetters['accessRights/getEmptyValue'](payload.sectionCode, payload.valueId))
			});
		}
		#setAccessRightValuesForShownAction(store, payload) {
			for (const userGroupId of store.getters.shown.keys()) {
				void store.dispatch('setAccessRightValues', {
					...payload,
					userGroupId
				});
			}
		}
		#setMinAccessRightValuesAction(store, {
			userGroupId
		}) {
			for (const sectionCode of store.rootState.accessRights.collection.keys()) {
				void store.dispatch('setMinAccessRightValuesInSection', {
					userGroupId,
					sectionCode
				});
			}
			void store.dispatch('accessRights/expandAllSections', null, {
				root: true
			});
		}
		#setMinAccessRightValuesInSectionAction(store, {
			userGroupId,
			sectionCode
		}) {
			const section = store.rootState.accessRights.collection.get(sectionCode);
			if (!section) {
				console.warn('ui.accessrights.v2: attempt to set min values in section that dont exists', {
					sectionCode
				});
				return;
			}
			for (const item of section.rights.values()) {
				const valueToSet = this.#getMinValueForColumnAction(item, store.rootGetters['accessRights/getEmptyValue'](section.sectionCode, item.id));
				if (main_core.Type.isNil(valueToSet)) {
					continue;
				}
				void store.dispatch('setAccessRightValues', {
					userGroupId,
					sectionCode: section.sectionCode,
					valueId: item.id,
					values: valueToSet
				});
			}
		}
		#setMinAccessRightValuesForRight(store, {
			sectionCode,
			rightId
		}) {
			const right = store.rootState.accessRights.collection.get(sectionCode)?.rights.get(rightId);
			if (!right) {
				console.warn('ui.accessrights.v2: attempt to set min values for right that dont exists', {
					sectionCode,
					rightId
				});
				return;
			}
			const valueToSet = this.#getMinValue(right);
			if (main_core.Type.isNil(valueToSet)) {
				console.warn('ui.accessrights.v2: attempt to set min values for right that dont have min value set', {
					sectionCode,
					rightId
				});
				return;
			}
			void store.dispatch('setAccessRightValuesForShown', {
				sectionCode,
				valueId: rightId,
				values: valueToSet
			});
		}
		#getMinValueForColumnAction(item, emptyValue) {
			const setEmpty = main_core.Type.isBoolean(item.setEmptyOnSetMinMaxValueInColumn) && item.setEmptyOnSetMinMaxValueInColumn;
			if (setEmpty) {
				return emptyValue;
			}
			return this.#getMinValue(item);
		}
		#getMinValue(item) {
			return ServiceLocator.getValueTypeByRight(item)?.getMinValue(item);
		}
		#setMaxAccessRightValuesAction(store, {
			userGroupId
		}) {
			for (const sectionCode of store.rootState.accessRights.collection.keys()) {
				void store.dispatch('setMaxAccessRightValuesInSection', {
					userGroupId,
					sectionCode
				});
			}
			void store.dispatch('accessRights/expandAllSections', null, {
				root: true
			});
		}
		#setMaxAccessRightValuesInSectionAction(store, {
			userGroupId,
			sectionCode
		}) {
			const section = store.rootState.accessRights.collection.get(sectionCode);
			if (!section) {
				console.warn('ui.accessrights.v2: attempt to set max values in section that dont exists', {
					sectionCode
				});
				return;
			}
			for (const item of section.rights.values()) {
				const valueToSet = this.#getMaxValueForColumnAction(item, store.rootGetters['accessRights/getEmptyValue'](section.sectionCode, item.id));
				if (main_core.Type.isNil(valueToSet)) {
					continue;
				}
				void store.dispatch('setAccessRightValues', {
					userGroupId,
					sectionCode: section.sectionCode,
					valueId: item.id,
					values: valueToSet
				});
			}
		}
		#setMaxAccessRightValuesForRight(store, {
			sectionCode,
			rightId
		}) {
			const right = store.rootState.accessRights.collection.get(sectionCode)?.rights.get(rightId);
			if (!right) {
				console.warn('ui.accessrights.v2: attempt to set max values for right that dont exists', {
					sectionCode,
					rightId
				});
				return;
			}
			const valueToSet = this.#getMaxValue(right);
			if (main_core.Type.isNil(valueToSet)) {
				console.warn('ui.accessrights.v2: attempt to set max values for right that dont have max value set', {
					sectionCode,
					rightId
				});
				return;
			}
			void store.dispatch('setAccessRightValuesForShown', {
				sectionCode,
				valueId: rightId,
				values: valueToSet
			});
		}
		#getMaxValueForColumnAction(item, emptyValue) {
			const setEmpty = main_core.Type.isBoolean(item.setEmptyOnSetMinMaxValueInColumn) && item.setEmptyOnSetMinMaxValueInColumn;
			if (setEmpty) {
				return emptyValue;
			}
			return this.#getMaxValue(item);
		}
		#getMaxValue(item) {
			return ServiceLocator.getValueTypeByRight(item)?.getMaxValue(item);
		}
		#copySectionValuesAction(store, payload) {
			const src = this.#getUserGroup(store.state, payload.srcUserGroupId);
			if (!src) {
				console.warn('ui.accessrights.v2: Attempt to copy values from user group that dont exists', payload);
				return;
			}
			const section = store.rootState.accessRights.collection.get(payload.sectionCode);
			if (!section) {
				console.warn('ui.accessrights.v2: Attempt to copy values for section that dont exists', payload);
				return;
			}
			for (const rightId of section.rights.keys()) {
				const value = src.accessRights.get(rightId);
				if (value) {
					void store.dispatch('setAccessRightValues', {
						userGroupId: payload.dstUserGroupId,
						sectionCode: section.sectionCode,
						valueId: value.id,
						values: value.values
					});
				} else {
					const emptyValue = store.rootGetters['accessRights/getEmptyValue'](section.sectionCode, rightId);
					void store.dispatch('setAccessRightValues', {
						userGroupId: payload.dstUserGroupId,
						sectionCode: section.sectionCode,
						valueId: rightId,
						values: emptyValue
					});
				}
			}
		}
		#setRoleTitleAction(store, payload) {
			if (!main_core.Type.isString(payload.title)) {
				console.warn('ui.accessrights.v2: Attempt to set role title with something other than string', payload);
				return;
			}
			if (!this.#isUserGroupExists(store, payload.userGroupId)) {
				console.warn('ui.accessrights.v2: Attempt to update user group that dont exists', payload);
				return;
			}
			store.commit('setRoleTitle', payload);
		}
		#addMemberAction(store, payload) {
			if (!this.#isUserGroupExists(store, payload.userGroupId)) {
				console.warn('ui.accessrights.v2: Attempt to add member to a user group that dont exists', payload);
				return;
			}
			if (!main_core.Type.isStringFilled(payload.accessCode) || !this.#isMemberValid(payload)) {
				console.warn('ui.accessrights.v2: Attempt to add member with invalid payload', payload);
				return;
			}
			store.commit('addMember', payload);
		}
		#isMemberValid(payload) {
			return main_core.Type.isStringFilled(payload.member.id) && main_core.Type.isStringFilled(payload.member.type) && main_core.Type.isStringFilled(payload.member.name) && (main_core.Type.isNil(payload.member.avatar) || main_core.Type.isStringFilled(payload.member.avatar));
		}
		#removeMemberAction(store, payload) {
			if (!this.#isUserGroupExists(store, payload.userGroupId)) {
				console.warn('ui.accessrights.v2: Attempt to remove member from a user group that dont exists', payload);
				return;
			}
			if (!main_core.Type.isStringFilled(payload.accessCode)) {
				console.warn('ui.accessrights.v2: Attempt to remove member with invalid payload', payload);
				return;
			}
			store.commit('removeMember', payload);
		}
		#updateMembersForUserGroupAction(store, payload) {
			if (!this.#isUserGroupExists(store, payload.userGroupId)) {
				console.warn('ui.accessrights.v2: Attempt to remove member from a user group that dont exists', payload);
				return;
			}
			const memberCollection = new Map();
			payload.members.forEach(member => {
				if (!main_core.Type.isStringFilled(member.id) || !main_core.Type.isStringFilled(member.type) || !main_core.Type.isStringFilled(member.name) || !(main_core.Type.isNil(member.avatar) || main_core.Type.isStringFilled(member.avatar))) {
					console.warn('ui.accessrights.v2: Attempt to add member with invalid payload', member);
				} else {
					memberCollection.set(member.id, member);
				}
			});
			store.commit('updateMembersForUserGroup', {
				userGroupId: payload.userGroupId,
				memberCollection
			});
		}
		#copyUserGroupAction(store, {
			userGroupId
		}) {
			const sourceGroup = this.#getUserGroup(store.state, userGroupId);
			if (!sourceGroup) {
				console.warn('ui.accessrights.v2: Attempt to copy user group that dont exists', {
					userGroupId
				});
				return;
			}
			const emptyGroup = this.getElementState();
			const copy = {
				...main_core.Runtime.clone(sourceGroup),
				id: emptyGroup.id,
				title: main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_COPIED_ROLE_NAME', {
					'#ORIGINAL#': sourceGroup.title
				}),
				isNew: true,
				isModified: true
			};
			for (const value of copy.accessRights.values()) {
				// is a new group all values are modified
				value.isModified = true;
			}
			const updatedSortConfig = this.#updateSortConfig(store.state.sortConfig, copy.id);
			this.#updateSortConfigAction(store, {
				sortConfig: updatedSortConfig
			});
			store.commit('addUserGroup', {
				userGroup: copy
			});
		}
		#addUserGroupAction(store) {
			const newGroup = {
				...this.getElementState(),
				accessRights: main_core.Runtime.clone(store.getters.defaultAccessRightValues),
				members: new Map()
			};
			if (store.state.selectedMember && store.state.selectedMember.id !== SELECTED_ALL_USER_ID && store.state.selectedMember.member) {
				newGroup.members.set(store.state.selectedMember.member.id, store.state.selectedMember.member);
			}
			const updatedSortConfig = this.#updateSortConfig(store.state.sortConfig, newGroup.id, store.state.selectedMember?.id);
			this.#updateSortConfigAction(store, {
				sortConfig: updatedSortConfig
			});
			store.commit('addUserGroup', {
				userGroup: newGroup
			});
		}
		#removeUserGroupAction(store, {
			userGroupId
		}) {
			const userGroup = this.#getUserGroup(store.state, userGroupId);
			if (!userGroup) {
				console.warn('ui.accessrights.v2: Attempt to remove user group that dont exists', {
					userGroupId
				});
				return;
			}
			store.commit('removeUserGroup', {
				userGroupId
			});
			if (!userGroup.isNew) {
				store.commit('markUserGroupForDeletion', {
					userGroupId
				});
			}
		}
		#updateUserGroupSortAction(store, {
			userGroupId,
			sort
		}) {
			if (!this.#isUserGroupExists(store, userGroupId)) {
				console.warn('ui.accessrights.v2: Attempt to show user group that dont exists', {
					userGroupId
				});
				return;
			}
			store.commit('updateUserGroupSort', {
				userGroupId,
				sort
			});
		}
		#updateSortConfigForSelectedMemberAction(store, {
			sortConfigForSelectedMember
		}) {
			if (!this.#isValidSortConfigForSelectedMember(sortConfigForSelectedMember)) {
				console.warn('ui.accessrights.v2: Invalid sort configuration provided', sortConfigForSelectedMember);
				return;
			}
			store.commit('updateSortConfigForSelectedMember', {
				sortConfigForSelectedMember
			});
		}
		#updateSortConfigAction(store, {
			sortConfig
		}) {
			if (!this.#isValidSortConfig(sortConfig)) {
				console.warn('ui.accessrights.v2: Invalid sort configuration provided', sortConfig);
				return;
			}
			store.commit('updateSortConfig', {
				sortConfig
			});
		}
		#selectMemberAction(store, payload) {
			if (!this.#isValidSelectedMember(payload.member)) {
				console.warn('ui.accessrights.v2: Invalid selected member provided', payload.member);
				return;
			}
			store.commit('selectMember', main_core.Runtime.clone(payload));
		}
		#hideUserGroupAction(store, {
			userGroupId
		}) {
			if (!this.#isUserGroupExists(store, userGroupId)) {
				console.warn('ui.accessrights.v2: Attempt to shrink user group that dont exists', {
					userGroupId
				});
				return;
			}
			store.commit('hideUserGroup', {
				userGroupId
			});
		}
		#updateSortConfig(currentSorting, groupId, selectedMemberId) {
			const userIdsToUpdate = new Set([SELECTED_ALL_USER_ID]);
			if (selectedMemberId) {
				userIdsToUpdate.add(selectedMemberId);
			}
			const newSortConfig = {
				...currentSorting
			};
			for (const userId of userIdsToUpdate) {
				if (!newSortConfig[userId]) {
					continue;
				}
				const currentValues = Object.values(newSortConfig[userId]);
				const maxValue = currentValues.length > 0 ? Math.max(...currentValues) : 0;
				newSortConfig[userId] = {
					...newSortConfig[userId],
					[groupId]: maxValue + 1
				};
			}
			return newSortConfig;
		}
		#isUserGroupExists(store, userGroupId) {
			const group = this.#getUserGroup(store.state, userGroupId);
			return Boolean(group);
		}
		#isValidSortConfigForSelectedMember(config) {
			return Object.values(config).every(value => main_core.Type.isNumber(value));
		}
		#isValidSortConfig(config) {
			return Object.values(config).every(userConfig => this.#isValidSortConfigForSelectedMember(userConfig));
		}
		#isValidSelectedMember(selectedMember) {
			if (selectedMember.id === SELECTED_ALL_USER_ID) {
				return true;
			}
			return main_core.Type.isString(selectedMember.id) && main_core.Type.isObject(selectedMember.member) && main_core.Type.isArray(selectedMember.accessCodes);
		}
		#getUserGroup(state, userGroupId) {
			return state.collection.get(userGroupId);
		}
		#isValueExistsInStructure(store, sectionCode, valueId) {
			const section = store.rootState.accessRights.collection.get(sectionCode);
			return section?.rights.has(valueId);
		}
		#deleteRightAction(store, {
			rightId
		}) {
			store.commit('deleteRight', {
				rightId
			});
		}
		getMutations() {
			return {
				setAccessRightValues: (state, {
					userGroupId,
					valueId,
					values,
					isModified
				}) => {
					const userGroup = this.#getUserGroup(state, userGroupId);
					const accessRightValue = userGroup.accessRights.get(valueId);
					if (!accessRightValue) {
						userGroup.accessRights.set(valueId, {
							id: valueId,
							values,
							isModified
						});
						return;
					}
					accessRightValue.values = values;
					accessRightValue.isModified = isModified;
				},
				setRoleTitle: (state, {
					userGroupId,
					title
				}) => {
					const userGroup = this.#getUserGroup(state, userGroupId);
					userGroup.title = title;
					userGroup.isModified = this.#isUserGroupModified(userGroup);
				},
				addMember: (state, {
					userGroupId,
					accessCode,
					member
				}) => {
					const userGroup = this.#getUserGroup(state, userGroupId);
					userGroup.members.set(accessCode, member);
					userGroup.isModified = this.#isUserGroupModified(userGroup);
				},
				removeMember: (state, {
					userGroupId,
					accessCode
				}) => {
					const userGroup = this.#getUserGroup(state, userGroupId);
					userGroup.members.delete(accessCode);
					userGroup.isModified = this.#isUserGroupModified(userGroup);
				},
				updateMembersForUserGroup: (state, {
					userGroupId,
					memberCollection
				}) => {
					const userGroup = this.#getUserGroup(state, userGroupId);
					userGroup.members = memberCollection;
					userGroup.isModified = this.#isUserGroupModified(userGroup);
				},
				addUserGroup: (state, {
					userGroup
				}) => {
					state.collection.set(userGroup.id, userGroup);
				},
				removeUserGroup: (state, {
					userGroupId
				}) => {
					state.collection.delete(userGroupId);
				},
				markUserGroupForDeletion: (state, {
					userGroupId
				}) => {
					state.deleted.add(userGroupId);
				},
				updateSortConfigForSelectedMember: (state, {
					sortConfigForSelectedMember
				}) => {
					const selectedMemberId = state.selectedMember?.id ?? SELECTED_ALL_USER_ID;
					// eslint-disable-next-line no-param-reassign
					state.sortConfig[selectedMemberId] = sortConfigForSelectedMember;
				},
				updateSortConfig: (state, {
					sortConfig
				}) => {
					// eslint-disable-next-line no-param-reassign
					state.sortConfig = sortConfig;
				},
				deleteRight: (state, {
					rightId
				}) => {
					for (const role of state.collection.values()) {
						if (role.accessRights.get(rightId)) {
							role.accessRights.delete(rightId);
						}
					}
				},
				selectMember: (state, {
					member
				}) => {
					// eslint-disable-next-line no-param-reassign
					state.selectedMember = member;
				}
			};
		}
		#isValueModified(userGroupId, valueId, values, emptyValue) {
			const initialGroup = this.#initialUserGroups.get(userGroupId);
			if (!initialGroup) {
				// its a newly created group, all values are modified

				return true;
			}
			const initialValues = initialGroup.accessRights.get(valueId)?.values ?? emptyValue;

			// use native Sets instead of Vue-wrapped proxy-sets, they throw an error on `symmetricDifference`
			return !this.#isSetsEqual(new Set(initialValues), new Set(values));
		}
		#isSetsEqual(a, b) {
			if (main_core.Type.isFunction(a.symmetricDifference)) {
				// native way to compare sets for modern browsers
				return a.symmetricDifference(b).size === 0;
			}

			// polyfill

			if (a.size !== b.size) {
				return false;
			}
			for (const value of a) {
				if (!b.has(value)) {
					return false;
				}
			}
			for (const value of b) {
				if (!a.has(value)) {
					return false;
				}
			}
			return true;
		}
		#isUserGroupModified(userGroup) {
			if (userGroup.isNew) {
				return true;
			}
			const initialGroup = this.#initialUserGroups.get(userGroup.id);
			if (!initialGroup) {
				throw new Error('ui.accessrights.v2: initial user group not found');
			}
			if (userGroup.title !== initialGroup.title) {
				return true;
			}
			const initialAccessCodes = new Set(initialGroup.members.keys());
			const currentAccessCodes = new Set(userGroup.members.keys());
			return !this.#isSetsEqual(initialAccessCodes, currentAccessCodes);
		}
	}

	function shouldRowBeRendered(accessRightItem) {
		if (!accessRightItem.isShown) {
			return false;
		}
		return !accessRightItem.group || accessRightItem.isGroupExpanded;
	}
	function getSelectedVariables(variables, selected, isAllSelected) {
		if (isAllSelected) {
			return variables;
		}
		const selectedVariables = new Map();
		for (const [variableId, variable] of variables) {
			if (selected.has(variableId)) {
				selectedVariables.set(variableId, variable);
			}
		}
		return selectedVariables;
	}
	function isUseGroupHeadValuesInHintByVariables(selectedVariables) {
		return [...selectedVariables].some(([, value]) => value.isUseGroupHeadValuesInHint === true);
	}
	function getMultipleSelectedVariablesTitle(selectedVariables) {
		const lastVariable = [...selectedVariables.values()].pop();
		if (selectedVariables.size === 1) {
			return lastVariable.title;
		}
		return main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_HAS_SELECTED_ITEMS', {
			'#FIRST_ITEM_NAME#': cutLongTitle(lastVariable.title),
			'#COUNT_REST_ITEMS#': selectedVariables.size - 1
		});
	}
	function cutLongTitle(title) {
		const VARIABLE_TITLE_MAX_LENGTH = 15;
		if (title.length > VARIABLE_TITLE_MAX_LENGTH) {
			return `${title.slice(0, VARIABLE_TITLE_MAX_LENGTH)}...`;
		}
		return title;
	}
	function getMultipleSelectedVariablesHintHtml(selectedVariables, hintTitle, allVariables, isInherit = false) {
		if (!isInherit && selectedVariables.size < 2) {
			return '';
		}
		let listItems = '';
		for (const value of makeSortedVariablesArray(selectedVariables, allVariables)) {
			listItems += `<li>${main_core.Text.encode(value.title)}</li>`;
		}
		return `
		<p>${main_core.Text.encode(hintTitle)}</p>
		<ul>${listItems}</ul>
	`;
	}
	function makeSortedVariablesArray(toSort, example) {
		const orderMap = new Map();
		let index = 0;
		for (const [variableId] of example) {
			orderMap.set(variableId, index);
			index++;
		}
		return [...toSort.values()].sort((a, b) => {
			const indexA = orderMap.get(a.id);
			const indexB = orderMap.get(b.id);
			if (main_core.Type.isNil(indexA)) {
				return 1;
			}
			if (main_core.Type.isNil(indexB)) {
				return -1;
			}
			return indexA - indexB;
		});
	}
	const DEFAULT_ALIAS_SEPARATOR = '|';
	function parseAliasKey(key, separator = DEFAULT_ALIAS_SEPARATOR) {
		const parts = key.split(separator);
		return new Set(parts);
	}
	function compileAliasKey(parts, separator = DEFAULT_ALIAS_SEPARATOR) {
		const sortedParts = [...parts].sort();
		return sortedParts.join(separator);
	}
	function normalizeAliasKey(key, separator = DEFAULT_ALIAS_SEPARATOR) {
		const parsed = parseAliasKey(key, separator);
		return compileAliasKey(parsed, separator);
	}
	function saveSortConfigForAllUserGroups(categoryName, sortConfig) {
		return main_core.ajax.runAction('ui.accessrights.setUserSortConfig', {
			data: {
				name: categoryName,
				userSortConfig: sortConfig
			}
		});
	}

	const CellLayout = {
		template: `
		<div class='ui-access-rights-v2-column-item'>
			<slot/>
		</div>
	`
	};

	const ColumnLayout = {
		template: `
		<div class='ui-access-rights-v2-column'>
			<slot/>
		</div>
	`
	};

	const RolesControl = {
		name: 'RolesControl',
		components: {
			CellLayout,
			ColumnLayout,
			RichMenuPopup: ui_vue3_components_richMenu.RichMenuPopup,
			RichMenuItem: ui_vue3_components_richMenu.RichMenuItem
		},
		props: {
			userGroups: {
				type: Map,
				required: true
			}
		},
		viewDialog: null,
		computed: {
			RichMenuItemIcon: () => ui_vue3_components_richMenu.RichMenuItemIcon,
			...ui_vue3_vuex.mapState({
				allUserGroups: state => state.userGroups.collection,
				maxVisibleUserGroups: state => state.application.options.maxVisibleUserGroups,
				guid: state => state.application.guid,
				userSortConfigName: state => state.application.options.userSortConfigName,
				selectedMember: state => state.userGroups.selectedMember,
				sortConfig: state => state.userGroups.sortConfig
			}),
			...ui_vue3_vuex.mapGetters({
				isMaxVisibleUserGroupsSet: 'application/isMaxVisibleUserGroupsSet',
				isMaxVisibleUserGroupsReached: 'userGroups/isMaxVisibleUserGroupsReached',
				userGroupsBySelectedMember: 'userGroups/userGroupsBySelectedMember'
			}),
			shownGroupsCounter() {
				return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE_COUNTER', {
					'#VISIBLE_ROLES#': this.userGroups.size,
					'#ALL_ROLES#': this.userGroupsBySelectedMember.size,
					'#GREY_START#': '<span style="opacity: var(--ui-opacity-30)">',
					'#GREY_FINISH#': '</span>'
				});
			},
			copyDialogItems() {
				return ItemsMapper.mapUserGroups(this.userGroupsBySelectedMember);
			},
			viewDialogItems() {
				const result = [];
				const selectedMemberId = this.selectedMember?.id ? this.selectedMember.id : SELECTED_ALL_USER_ID;
				for (const copyDialogItem of ItemsMapper.mapUserGroups(this.userGroupsBySelectedMember)) {
					result.push({
						...copyDialogItem,
						selected: this.userGroups.has(copyDialogItem.id),
						sort: this.sortConfig[selectedMemberId] ? this.sortConfig[selectedMemberId][copyDialogItem.id] : null
					});
				}
				return result;
			}
		},
		data() {
			return {
				isPopupShown: false
			};
		},
		methods: {
			onCreateNewRoleClick() {
				if (this.isMaxVisibleUserGroupsReached) {
					return;
				}
				this.isPopupShown = false;
				this.$store.dispatch('userGroups/addUserGroup');
			},
			onRoleViewClick() {
				this.isPopupShown = false;
				this.showViewDialog(this.$refs.configure);
			},
			onCopyRoleClick() {
				if (this.isMaxVisibleUserGroupsReached) {
					return;
				}
				this.isPopupShown = false;
				this.showCopyDialog();
			},
			showCopyDialog() {
				const copyDialog = new ui_entitySelector.Dialog({
					context: EntitySelectorContext.ROLE,
					targetNode: this.$refs.configure,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					cacheable: false,
					items: this.copyDialogItems,
					events: {
						'Item:onSelect': dialogEvent => {
							const {
								item
							} = dialogEvent.getData();
							this.$store.dispatch('userGroups/copyUserGroup', {
								userGroupId: item.getId()
							});
						}
					}
				});
				copyDialog.show();
			},
			showViewDialog(target) {
				this.viewDialog = new ui_accessrights_v2_itemListSelector.ItemListSelector({
					title: this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLES_SELECTOR_TITLE'),
					subtitle: this.maxVisibleUserGroups ? main_core.Loc.getMessagePlural('JS_UI_ACCESSRIGHTS_V2_ROLES_SELECTOR_SUBTITLE', this.maxVisibleUserGroups, {
						'#COUNT#': this.maxVisibleUserGroups
					}) : null,
					targetNode: target,
					items: this.viewDialogItems,
					maxSelected: this.maxVisibleUserGroups,
					events: {
						onSave: () => {
							const selectedItems = this.viewDialog.getSelectedItems();
							const userSortConfig = {};
							selectedItems.forEach((item, index) => {
								userSortConfig[item.id] = index;
							});
							this.$store.dispatch('userGroups/updateSortConfigForSelectedMember', {
								sortConfigForSelectedMember: userSortConfig
							});
							if (!this.selectedMember?.id || this.selectedMember.id === SELECTED_ALL_USER_ID) {
								saveSortConfigForAllUserGroups(this.userSortConfigName, userSortConfig);
							}
							this.viewDialog = null;
						},
						onHide: () => {
							this.viewDialog = null;
						}
					}
				});
				this.viewDialog.show();
			},
			toggleViewDialog(target) {
				if (this.viewDialog) {
					this.viewDialog.hide();
				} else {
					this.showViewDialog(target);
				}
			}
		},
		template: `
		<ColumnLayout>
			<CellLayout class="ui-access-rights-v2-header-roles-control">
				<div class='ui-access-rights-v2-column-item-text ui-access-rights-v2-header-roles-control-header'>
					<div>{{ $Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLES') }}</div>
					<div
						ref="configure"
						class="ui-icon-set --more-l ui-access-rights-v2-icon-more"
						style="position: absolute; right: 11px; top: 5px;"
						@click="isPopupShown = true"
					>
						<RichMenuPopup v-if="isPopupShown" @close="isPopupShown = false" :popup-options="{bindElement: $refs.configure}">
							<RichMenuItem
								:icon="RichMenuItemIcon.role"
								:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_NEW_ROLE')"
								:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_NEW_ROLE_SUBTITLE')"
								:disabled="isMaxVisibleUserGroupsReached"
								:hint="
									isMaxVisibleUserGroupsReached
										? $Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE_ADDING_DISABLED', {
											'#COUNT#': maxVisibleUserGroups,
										})
										: null
								"
								@click="onCreateNewRoleClick"
							/>
							<RichMenuItem
								:icon="RichMenuItemIcon.copy"
								:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_COPY_ROLE')"
								:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_COPY_ROLE_SUBTITLE')"
								:disabled="isMaxVisibleUserGroupsReached"
								:hint="
									isMaxVisibleUserGroupsReached
										? $Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE_COPYING_DISABLED', {
											'#COUNT#': maxVisibleUserGroups,
										})
										: null
								"
								@click="onCopyRoleClick"
							/>
							<RichMenuItem
								:icon="RichMenuItemIcon['opened-eye']"
								:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE_VIEW')"
								:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE_VIEW_SUBTITLE_MSGVER_1')"
								@click="onRoleViewClick"
							/>
						</RichMenuPopup>
					</div>
				</div>
				<div class="ui-access-rights-v2-header-roles-control-actions">
					<div
						ref="counter"
						class="ui-access-rights-v2-header-roles-control-counter"
						@click="toggleViewDialog($refs.counter)"
					>
						<div class="ui-icon-set --o-observer" style="--ui-icon-set__icon-size: 18px;"></div>
						<span v-html="shownGroupsCounter"></span>
						<div class="ui-icon-set --chevron-down ui-access-rights-v2-header-roles-control-chevron"></div>
					</div>
					<div class="ui-access-rights-v2-header-roles-control-expander">
						<div class="ui-access-rights-v2-header-roles-control-expander-button">
							<div
								class="ui-icon-set --collapse"
								:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_COLLAPSE_ALL_SECTIONS')"
								@click="$store.dispatch('accessRights/collapseAllSections')"
							></div>
						</div>
						<div class="ui-access-rights-v2-header-roles-control-expander-button">
							<div
								class="ui-icon-set --expand-1"
								:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_EXPAND_ALL_SECTIONS')"
								@click="$store.dispatch('accessRights/expandAllSections')"
							></div>
						</div>
					</div>
				</div>
			</CellLayout>
		</ColumnLayout>
	`
	};

	const isMaxListenersSet = new Map();
	const lastScrollLeft = new Map();

	/**
	 * A div without styling that synchronizes horizontal scroll of all elements wrapped in this component with other
	 * wrapped elements in this Vue application.
	 */
	const SyncHorizontalScroll = {
		name: 'SyncHorizontalScroll',
		data() {
			return {
				componentGuid: main_core.Text.getRandom(16)
			};
		},
		computed: {
			...ui_vue3_vuex.mapState({
				guid: state => state.application.guid
			})
		},
		throttledEmitScrollEvent: null,
		created() {
			this.throttledEmitScrollEvent = requestAnimationFrameThrottle(this.emitScrollEvent);
		},
		mounted() {
			if (!isMaxListenersSet.has(this.guid)) {
				// + 1 for header
				const sectionsNumber = this.$store.state.accessRights.collection.size + 1;

				// correctly notify about memory leak
				this.$Bitrix.eventEmitter.incrementMaxListeners('ui:accessrights:v2:syncScroll', sectionsNumber);
				isMaxListenersSet.set(this.guid, true);
			}
			this.$Bitrix.eventEmitter.subscribe('ui:accessrights:v2:syncScroll', this.handleScrollEvent);
			void this.$nextTick(() => {
				if (lastScrollLeft.has(this.guid)) {
					this.syncScroll(lastScrollLeft.get(this.guid));
				}
			});
		},
		beforeUnmount() {
			this.$Bitrix.eventEmitter.unsubscribe('ui:accessrights:v2:syncScroll', this.handleScrollEvent);
		},
		methods: {
			emitScrollEvent(event) {
				// this component instance is being scrolled, we need to notify other instances
				const {
					scrollLeft
				} = event.target;
				lastScrollLeft.set(this.guid, scrollLeft);

				// emit global application event so other SyncHorizontalScroll instances receive it
				this.$Bitrix.eventEmitter.emit('ui:accessrights:v2:syncScroll', {
					scrollLeft,
					componentGuid: this.componentGuid
				});
			},
			handleScrollEvent(event) {
				const {
					scrollLeft,
					componentGuid
				} = event.getData();
				if (this.componentGuid === componentGuid) {
					// this event was sent by this exact instance
					return;
				}
				this.syncScroll(scrollLeft);
			},
			syncScroll(scrollLeft) {
				// magic hack - don't update the element if value not changed.
				// I'm not sure whether this works, but why not
				if (this.$el.scrollLeft !== scrollLeft) {
					this.$el.scrollLeft = scrollLeft;
				}
			}
		},
		template: `
		<div @scroll="throttledEmitScrollEvent">
			<slot/>
		</div>
	`
	};

	/**
	 * Same as `Runtime.throttle`, but uses `requestAnimationFrame` instead of setTimeout.
	 * Why? To sync wait time with display refresh rate for smother animations.
	 */
	function requestAnimationFrameThrottle(func) {
		let callbackSet = false;
		let invoke = false;
		return function wrapper(...args) {
			invoke = true;
			if (!callbackSet) {
				const q = function q() {
					if (invoke) {
						func(...args);
						invoke = false;
						requestAnimationFrame(q);
						callbackSet = true;
					} else {
						callbackSet = false;
					}
				};
				q();
			}
		};
	}

	/**
	 * A special case of Section
	 */
	// @vue/component
	const Header$2 = {
		name: 'Header',
		components: {
			RoleHeading,
			SyncHorizontalScroll,
			Members,
			RolesControl,
			ColumnLayout,
			CellLayout
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			userGroups: {
				type: Map,
				required: true
			}
		},
		computed: {
			...ui_vue3_vuex.mapState({
				maxVisibleUserGroups: state => state.application.options.maxVisibleUserGroups
			}),
			...ui_vue3_vuex.mapGetters({
				isMaxVisibleUserGroupsReached: 'userGroups/isMaxVisibleUserGroupsReached'
			})
		},
		methods: {
			onCreateNewRoleClick() {
				if (this.isMaxVisibleUserGroupsReached) {
					return;
				}
				this.$store.dispatch('userGroups/addUserGroup');
			}
		},
		// data attributes are needed for e2e automated tests
		template: `
		<div class="ui-access-rights-v2-section ui-access-rights-v2--head-section">
			<div class='ui-access-rights-v2-section-container'>
				<div class='ui-access-rights-v2-section-head'>
					<RolesControl :user-groups="userGroups"/>
				</div>
				<div class='ui-access-rights-v2-section-content'>
					<SyncHorizontalScroll class='ui-access-rights-v2-section-wrapper'>
						<ColumnLayout
							v-for="[groupId, group] in userGroups" 
							:key="groupId"
							:data-accessrights-user-group-id="groupId"
						>
							<CellLayout class="ui-access-rights-v2-header-role-cell">
								<RoleHeading :user-group="group"/>
								<Members :user-group="group"/>
							</CellLayout>
						</ColumnLayout>
						<ColumnLayout>
							<div class="ui-access-rights-v2-header-role-add">
								<button class="ui-btn ui-btn-light-border ui-btn-round ui-btn-disabled"
										v-if="isMaxVisibleUserGroupsReached"
										v-hint="$Bitrix.Loc.getMessage(
									 'JS_UI_ACCESSRIGHTS_V2_ROLE_ADDING_DISABLED', 
									 {'#COUNT#': maxVisibleUserGroups,})"
								>
									<div class="ui-icon-set --plus-20"/>
								</button>
								<button class="ui-btn ui-btn-light-border ui-btn-round"
										v-else
										@click="onCreateNewRoleClick"
								>
									<div class="ui-icon-set --plus-20"/>
								</button>
							</div>
						</ColumnLayout>
					</SyncHorizontalScroll>
				</div>
			</div>
		</div>
	`
	};

	const SearchBox = {
		name: 'SearchBox',
		debouncedSetSearchQuery: null,
		created() {
			const setSearchQuery = query => {
				this.$store.dispatch('accessRights/search', {
					query
				});
			};
			this.debouncedSetSearchQuery = main_core.Runtime.debounce(setSearchQuery, 200);
		},
		computed: {
			searchQuery: {
				get() {
					return this.$store.state.accessRights.searchQuery;
				},
				set(query) {
					this.debouncedSetSearchQuery(query);
				}
			}
		},
		template: `
		<div
			class="ui-ctl ui-ctl-after-icon ui-access-rights-v2-search">
			<input
				type="text"
				class="ui-ctl-element ui-ctl-textbox ui-access-rights-v2-search-input"
				:placeholder="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SEARCH_PLACEHOLDER')"
				v-model="searchQuery"
				ref="searchInput"
			>
			<a 
				class="ui-icon-set --o-search ui-access-rights-v2-search-icon"
				@click="this.$refs.searchInput.focus()"
			></a>
		</div>
	`
	};

	const MemberSelector = {
		name: 'MemberSelector',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		data() {
			return {
				accessCodesCache: {}
			};
		},
		dialog: null,
		computed: {
			selectedMember: {
				get() {
					return this.$store.state.userGroups.selectedMember;
				},
				set(member) {
					this.$store.dispatch('userGroups/selectMember', {
						member
					});
				}
			},
			selectedMemberName() {
				if (!this.selectedMember.id || this.selectedMember.id === SELECTED_ALL_USER_ID || !this.selectedMember?.member?.name) {
					return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_USER_SELECTOR_ALL_USERS');
				}
				return this.selectedMember.member.name;
			},
			selectedMemberAvatar() {
				if (!this.selectedMember.id || this.selectedMember.id === SELECTED_ALL_USER_ID) {
					return null;
				}
				return this.selectedMember?.member?.avatar ?? '/bitrix/js/ui/accessrights/v2/images/user-avatar.svg';
			},
			chipImage() {
				if (!this.selectedMemberAvatar) {
					return null;
				}
				return {
					src: this.selectedMemberAvatar,
					alt: this.selectedMemberName
				};
			},
			avatarBackgroundImage() {
				return `url(${encodeURI(this.selectedMemberAvatar)})`;
			},
			selectedItems() {
				if (this.selectedMember && this.selectedMember.id && this.selectedMember.id !== SELECTED_ALL_USER_ID) {
					return [[this.selectedMember.entityType, this.selectedMember.entityId]];
				}
				return [['meta-user', SELECTED_ALL_USER_ID]];
			},
			...ui_vue3_vuex.mapState({
				memberOptions: state => state.application.options.additionalMembersParams
			})
		},
		methods: {
			toggleUserSelector() {
				if (this.dialog?.isOpen()) {
					this.dialog.hide();
					return;
				}
				this.dialog ??= this.getSelectorService().createDialog({
					targetNode: this.$refs.userSelector,
					preselectedItems: this.selectedItems,
					multiple: false,
					hideOnSelect: true,
					hideOnDeselect: true,
					events: {
						'Item:onSelect': this.onMemberSelect,
						'Item:onDeselect': this.onMemberDeselect,
						onDestroy: () => {
							this.dialog = null;
						}
					},
					entities: this.getEntities()
				});
				this.dialog.show();
			},
			getEntities() {
				const entities = this.getSelectorService().entities();
				entities.push({
					id: 'meta-user',
					options: {
						'all-users': true
					}
				});
				return entities;
			},
			onMemberSelect(event) {
				const {
					item
				} = event.getData();
				const cacheKey = item.id === SELECTED_ALL_USER_ID ? SELECTED_ALL_USER_ID : item.entityId + item.id;
				const newSelectedMember = {
					id: cacheKey,
					entityId: item.id,
					entityType: item.entityId,
					member: this.getSelectorService().getMemberByItem(item)
				};
				const cachedAccessCodes = this.getAccessCodesFromCache(cacheKey);
				if (cachedAccessCodes.length > 0 || item.id === SELECTED_ALL_USER_ID) {
					this.selectedMember = {
						...newSelectedMember,
						accessCodes: cachedAccessCodes
					};
					return;
				}
				if (!this.shouldUseAjax(item)) {
					this.selectedMember = {
						...newSelectedMember,
						accessCodes: this.getDefaultAccessCodesByItem(item)
					};
					return;
				}
				this.$store.commit('application/setProgress', true);
				main_core.ajax.runAction('ui.accessrights.getAccessCodes', {
					data: {
						id: newSelectedMember.member.id,
						params: this.$store.state.application.options.additionalSaveParams,
						moduleId: this.$store.state.application.options.moduleId
					}
				}).then(response => {
					let accessCodes = response.data ?? [];
					if (accessCodes.length === 0) {
						accessCodes = this.getDefaultAccessCodesByItem(item);
					}
					this.selectedMember = {
						...newSelectedMember,
						accessCodes
					};
					this.accessCodesCache[cacheKey] = new Set(accessCodes);
					this.$store.commit('application/setProgress', false);
				}).catch(() => {
					const accessCodes = this.getDefaultAccessCodesByItem(item);
					this.selectedMember = {
						...newSelectedMember,
						accessCodes
					};
					this.accessCodesCache[cacheKey] = accessCodes;
					this.$store.commit('application/setProgress', false);
				});
			},
			shouldUseAjax(item) {
				const entityTypes = ['user', 'department', 'structure-node'];
				return entityTypes.includes(item.entityId);
			},
			onMemberDeselect() {
				this.selectedMember = {
					id: SELECTED_ALL_USER_ID,
					entityId: SELECTED_ALL_USER_ID,
					entityType: 'meta-user',
					accessCodes: []
				};
			},
			getDefaultAccessCodesByItem(item) {
				if (item.entityId === 'structure-role') {
					const itemId = item.id.match(/^(?:ATD|ATE|ATT|AD|AE|AT)([1-9]\d*)$/)?.[1];
					const accessCodes = [this.getSelectorService().getAccessCodeByItem(item), `AE${itemId}`];
					return [...new Set(accessCodes)];
				}
				if (item.entityId === 'project-access-codes') {
					const itemId = item.id.match(/^SG(\d+)_([AEK])$/)?.[1];
					const accessCodes = [this.getSelectorService().getAccessCodeByItem(item), `SG${itemId}_K`];
					return [...new Set(accessCodes)];
				}
				return [this.getSelectorService().getAccessCodeByItem(item)];
			},
			getAccessCodesFromCache(id) {
				return this.accessCodesCache[id] || [];
			},
			getSelectorService() {
				return ServiceLocator.getSelectorService(this.memberOptions);
			}
		},
		template: `
		<div ref="userSelector" class="ui-access-rights-v2-user-selector">
			<Chip
				:image="chipImage"
				:dropdown="true"
				:text="selectedMemberName"
				@click="toggleUserSelector"
			/>
		</div>
	`
	};

	const MenuCell$1 = {
		name: 'MenuCell',
		components: {
			CellLayout,
			RichMenuPopup: ui_vue3_components_richMenu.RichMenuPopup,
			RichMenuItem: ui_vue3_components_richMenu.RichMenuItem
		},
		inject: ['section', 'userGroup'],
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			RichMenuItemIcon: () => ui_vue3_components_richMenu.RichMenuItemIcon,
			...ui_vue3_vuex.mapGetters({
				isMaxValueSetForAny: 'accessRights/isMaxValueSetForAny',
				isMinValueSetForAny: 'accessRights/isMinValueSetForAny'
			}),
			menuPopupOptions() {
				const width = 290;
				return {
					bindElement: this.$refs.icon,
					width,
					// by default popup is positioned so that the left top angle is below the bind element.
					// we need to position it in the center of the column
					offsetLeft: -Math.floor(width / 2) + 9
				};
			},
			shownUserGroupsWithoutCurrent() {
				const shown = this.$store.getters['userGroups/shown'];
				const shownWithoutCurrent = main_core.Runtime.clone(shown);
				shownWithoutCurrent.delete(this.userGroup.id);
				return shownWithoutCurrent;
			},
			applyDialogItems() {
				return ItemsMapper.mapUserGroups(this.shownUserGroupsWithoutCurrent);
			}
		},
		methods: {
			toggleMenu() {
				this.isMenuShown = !this.isMenuShown;
			},
			showApplyDialog() {
				this.isMenuShown = false;
				const applyDialog = new ui_entitySelector.Dialog({
					context: EntitySelectorContext.ROLE,
					targetNode: this.$refs.icon,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					cacheable: false,
					items: this.applyDialogItems,
					events: {
						'Item:onSelect': dialogEvent => {
							const {
								item
							} = dialogEvent.getData();
							this.$store.dispatch('userGroups/copySectionValues', {
								srcUserGroupId: this.userGroup.id,
								dstUserGroupId: item.getId(),
								sectionCode: this.section.sectionCode
							});
						}
					}
				});
				applyDialog.show();
			},
			setMaxValuesInSection() {
				this.isMenuShown = false;
				this.$store.dispatch('userGroups/setMaxAccessRightValuesInSection', {
					userGroupId: this.userGroup.id,
					sectionCode: this.section.sectionCode
				});
			},
			setMinValuesInSection() {
				this.isMenuShown = false;
				this.$store.dispatch('userGroups/setMinAccessRightValuesInSection', {
					userGroupId: this.userGroup.id,
					sectionCode: this.section.sectionCode
				});
			}
		},
		template: `
		<CellLayout class="ui-access-rights-v2-menu-cell" style="cursor: pointer" @click="toggleMenu">
			<div
				ref="icon"
				class="ui-icon-set --more-l ui-access-rights-v2-icon-more"
			>
				<RichMenuPopup
					v-if="isMenuShown"
					@close="isMenuShown = false"
					:popup-options="menuPopupOptions"
				>
					<RichMenuItem
						v-if="isMaxValueSetForAny"
						:icon="RichMenuItemIcon.check"
						:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SET_MAX_ACCESS_RIGHTS')"
						:subtitle="$Bitrix.Loc.getMessage(
							'JS_UI_ACCESSRIGHTS_V2_SET_MAX_ACCESS_RIGHTS_SUBTITLE_SECTION',
							{
								'#SECTION#': section.sectionTitle + (section.sectionSubTitle ? (' ' + section.sectionSubTitle) : ''),
							}
						)"
						@click="setMaxValuesInSection"
					/>
					<RichMenuItem
						v-if="isMinValueSetForAny"
						:icon="RichMenuItemIcon['red-lock']"
						:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SET_MIN_ACCESS_RIGHTS')"
						:subtitle="$Bitrix.Loc.getMessage(
							'JS_UI_ACCESSRIGHTS_V2_SET_MIN_ACCESS_RIGHTS_SUBTITLE_SECTION',
							{
								'#SECTION#': section.sectionTitle + (section.sectionSubTitle ? (' ' + section.sectionSubTitle) : ''),
							}
						)"
						@click="setMinValuesInSection"
					/>
					<RichMenuItem
						:icon="RichMenuItemIcon.copy"
						:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_APPLY_TO_ROLE')"
						:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_APPLY_TO_ROLE_SUBTITLE')"
						@click="showApplyDialog"
					/>
				</RichMenuPopup>
			</div>
		</CellLayout>
	`
	};

	const Icon = {
		name: 'Icon',
		inject: ['section'],
		computed: {
			iconBgColor() {
				if (this.section.sectionIcon.bgColor.startsWith('--')) {
					// css variable
					return `var(${this.section.sectionIcon.bgColor})`;
				}

				// we assume its hex
				return this.section.sectionIcon.bgColor;
			}
		},
		template: `
		<div v-if="section.sectionIcon" class="ui-access-rights-v2-section-header-icon" :style="{
			backgroundColor: iconBgColor,
		}">
			<div class="ui-icon-set" :class="'--' + section.sectionIcon.type"></div>
		</div>
	`
	};

	const Locator = {
		name: 'Locator',
		components: {
			SectionIcon: Icon
		},
		props: {
			maxWidth: {
				type: Number,
				// same as value popup width
				default: 430
			}
		},
		inject: ['section', 'right'],
		computed: {
			rightOrGroupTitle() {
				if (!this.right.group) {
					return this.right.title;
				}
				const groupHead = this.section.rights.get(this.right.group);
				return groupHead?.title;
			}
		},
		template: `
		<div class="ui-access-rights-v2-cell-popup-header-locator" :style="{
			maxWidth: maxWidth + 'px',
		}">
			<SectionIcon/>
			<span
				class="ui-access-rights-v2-text-ellipsis"
				:title="section.sectionTitle"
			>{{ section.sectionTitle }}</span>
			<span
				v-if="section.sectionSubTitle" 
				class="ui-access-rights-v2-text-ellipsis"
				:title="section.sectionSubTitle"
				style="margin-left: 5px; color: var(--ui-color-palette-gray-70);"
			>{{ section.sectionSubTitle }}</span>
			<div class="ui-icon-set --chevron-right ui-access-rights-v2-cell-popup-header-chevron"></div>
			<template v-if="rightOrGroupTitle !== right.title">
				<span class="ui-access-rights-v2-text-ellipsis" :title="right.title">{{ right.title }}</span>
				<div class="ui-icon-set --chevron-right ui-access-rights-v2-cell-popup-header-chevron"></div>
			</template>
			<span class="ui-access-rights-v2-text-ellipsis" :title="rightOrGroupTitle">{{ rightOrGroupTitle }}</span>
		</div>
	`
	};

	const MasterSwitcher = {
		name: 'MasterSwitcher',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher
		},
		emits: ['check', 'uncheck'],
		props: {
			isChecked: {
				type: Boolean,
				required: true
			}
		},
		inject: ['section', 'right'],
		computed: {
			switcherOptions() {
				return {
					size: 'small',
					color: 'green'
				};
			}
		},
		template: `
		<div class="ui-access-rights-v2-cell-popup-header-master-switcher" :class="{
			'--checked': isChecked,
		}">
			<slot/>
			<div class="ui-access-rights-v2-cell-popup-header-toggle-container">
				<Switcher
					:is-checked="isChecked"
					@check="$emit('check')"
					@uncheck="$emit('uncheck')"
					:options="switcherOptions"
					data-accessrights-min-max
				/>
			</div>
		</div>
	`
	};

	const SingleRoleTitle = {
		name: 'SingleRoleTitle',
		props: {
			userGroupTitle: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="ui-access-rights-v2-cell-popup-header-role-container">
			<div>
				<div class="ui-access-rights-v2-cell-popup-header-role-caption">
					{{ $Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ROLE') }}
				</div>
				<div
					class="ui-access-rights-v2-cell-popup-header-role-title ui-access-rights-v2-text-ellipsis"
					:title="userGroupTitle"
				>
					{{ userGroupTitle }}
				</div>
			</div>
		</div>
	`
	};

	const PopupHeader = {
		name: 'DependentVariablesPopupHeader',
		components: {
			Locator,
			MasterSwitcher,
			SingleRoleTitle
		},
		emits: ['setMax', 'setMin'],
		props: {
			values: {
				/** @type Set<string> */
				type: Set,
				required: true
			}
		},
		inject: ['right'],
		computed: {
			isChecked() {
				if (!this.isMinMaxValuesSet) {
					return this.values.size > 0;
				}
				return this.isSelectedAnythingBesidesMin;
			},
			isMinMaxValuesSet() {
				return !main_core.Type.isNil(this.right.minValue) && !main_core.Type.isNil(this.right.maxValue);
			},
			isSelectedAnythingBesidesMin() {
				if (this.values.size <= 0) {
					return false;
				}
				for (const variableId of this.values) {
					if (!this.right.minValue.has(variableId)) {
						return true;
					}
				}
				return false;
			}
		},
		methods: {
			setMin() {
				if (this.isMinMaxValuesSet) {
					this.$emit('setMin');
				}
			},
			setMax() {
				if (this.isMinMaxValuesSet) {
					this.$emit('setMax');
				}
			}
		},
		template: `
		<div>
			<Locator/>
			<MasterSwitcher
				:is-checked="isChecked"
				@check="setMax"
				@uncheck="setMin"
			>
				<slot/>
			</MasterSwitcher>
		</div>
	`
	};

	const PopupContent = {
		name: 'DependentVariablesPopupContent',
		emits: ['apply'],
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			PopupHeader,
			Icon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			// value for selector is id of a selected variable
			initialValues: {
				type: Set,
				default: new Set()
			}
		},
		data() {
			return {
				// values modified during popup lifetime and not yet dispatched to store
				notSavedValues: this.getNotSavedValues()
			};
		},
		inject: ['section', 'right', 'redefineApply'],
		computed: {
			isMinMaxValuesSet() {
				return !main_core.Type.isNil(this.right.minValue) && !main_core.Type.isNil(this.right.maxValue);
			},
			variablesShownInList() {
				if (!this.isMinMaxValuesSet) {
					return this.right.variables;
				}
				const variablesWithoutMinAndSecondary = main_core.Runtime.clone(this.right.variables);
				for (const variableId of this.right.minValue) {
					variablesWithoutMinAndSecondary.delete(variableId);
				}
				for (const [variableId, variable] of variablesWithoutMinAndSecondary) {
					if (variable.secondary) {
						variablesWithoutMinAndSecondary.delete(variableId);
					}
					if (!main_core.Type.isNil(variable.dependant) && !this.notSavedValues.has(variableId)) {
						for (const dependantId of variable.dependant) {
							variablesWithoutMinAndSecondary.delete(dependantId);
						}
					}
				}
				return variablesWithoutMinAndSecondary;
			},
			secondaryVariables() {
				const result = new Map();
				for (const [variableId, variable] of this.right.variables) {
					if (variable.secondary) {
						result.set(variableId, variable);
					}
				}
				return result;
			},
			nothingSelectedValues() {
				return this.$store.getters['accessRights/getNothingSelectedValue'](this.section.sectionCode, this.right.id);
			},
			switcherOptions() {
				return {
					size: 'large',
					color: 'primary',
					useAirDesign: true
				};
			},
			secondarySwitcherOptions() {
				return {
					size: 'extra-small',
					color: 'green'
				};
			},
			iconSet() {
				return ui_iconSet_api_vue.Set;
			}
		},
		mounted() {
			this.redefineApply(() => {
				this.apply();
			});
		},
		methods: {
			addValue(variableId) {
				const variable = this.right.variables.get(variableId);
				if (!variable) {
					return;
				}
				this.notSavedValues.add(variableId);
				if (!main_core.Type.isNil(variable.requires)) {
					for (const requiredId of variable.requires) {
						this.notSavedValues.add(requiredId);
					}
				}
				if (!main_core.Type.isNil(variable.conflictsWith)) {
					// remove old variables that conflict with variable we want to add
					for (const conflictId of variable.conflictsWith) {
						this.notSavedValues.delete(conflictId);
					}
				}
				for (const otherVariable of this.right.variables.values()) {
					if (otherVariable.id === variableId) {
						continue;
					}

					// if one of the current variables conflicts with newly added variables, we remove old variable
					if (this.notSavedValues.has(otherVariable.id) && !main_core.Type.isNil(otherVariable.conflictsWith)) {
						for (const conflictId of otherVariable.conflictsWith) {
							if (this.notSavedValues.has(conflictId)) {
								this.notSavedValues.delete(otherVariable.id);
							}
						}
					}
				}
			},
			removeValue(variableId) {
				this.notSavedValues.delete(variableId);
				for (const otherVariableId of this.notSavedValues) {
					if (otherVariableId === variableId) {
						continue;
					}
					const otherVariable = this.right.variables.get(otherVariableId);
					if (!otherVariable) {
						continue;
					}
					if (!main_core.Type.isNil(otherVariable.requires) && otherVariable.requires.has(variableId)) {
						this.notSavedValues.delete(otherVariableId);
					}
				}
			},
			setMaxValue() {
				for (const variableId of this.right.maxValue) {
					this.addValue(variableId);
				}
			},
			setMinValue() {
				for (const variableId of this.right.minValue) {
					this.addValue(variableId);
				}
			},
			apply() {
				let values = this.notSavedValues;
				if (values.size <= 0) {
					values = this.nothingSelectedValues;
				}
				this.$emit('apply', {
					values
				});
			},
			getNotSavedValues() {
				const result = new Set();
				this.initialValues.forEach(value => {
					if (this.right.variables.has(value)) {
						result.add(value);
					}
				});
				return result;
			},
			getVariableHintOptions(variable) {
				return {
					text: variable.hint,
					popupOptions: {
						bindOptions: {
							position: 'bottom'
						},
						width: 262,
						angle: {
							position: 'top',
							offset: 33
						}
					}
				};
			},
			isDependantVariable(variableId) {
				for (const [, variable] of this.variablesShownInList) {
					if (!main_core.Type.isNil(variable.dependant) && variable.dependant.has(variableId)) {
						return true;
					}
				}
				return false;
			},
			className(variableId) {
				return this.isDependantVariable(variableId) ? '--dependant' : '';
			}
		},
		// data attributes are needed for e2e automated tests
		template: `
		<div>
			<PopupHeader
				:values="notSavedValues"
				@set-max="setMaxValue"
				@set-min="setMinValue"
			>
				<slot name="role-title"/>
			</PopupHeader>
			<div class="ui-access-rights-v2-dv-popup--line-container">
				<TransitionGroup
					name="ui-access-rights-v2-dv-fade"
					tag="div"
				>
					<div
						v-for="[variableId, variable] in variablesShownInList"
						:key="variableId"
						class="ui-access-rights-v2-dv-popup--line"
						:class="className(variableId)"
					>
						<div class="ui-access-rights-v2-dv-popup--line-title">
							<span class="ui-access-rights-v2-text-ellipsis" :title="variable.title">{{ variable.title }}</span>
							<Icon v-if="variable.hint" :name="iconSet.INFO_1" :color="'var(--ui-color-palette-gray-40)'" :size="20" v-hint="getVariableHintOptions(variable)"></Icon>
						</div>
						<Switcher
							:is-checked="notSavedValues.has(variable.id)"
							@check="addValue(variable.id)"
							@uncheck="removeValue(variable.id)"
							:options="switcherOptions"
							:data-accessrights-variable-id="variable.id"
						/>
					</div>
				</TransitionGroup>
				<div
					v-for="[variableId, variable] in secondaryVariables"
					:key="variableId"
					class="ui-access-rights-v2-dv-popup--line --secondary"
				>
					<Switcher
						:is-checked="notSavedValues.has(variable.id)"
						@check="addValue(variable.id)"
						@uncheck="removeValue(variable.id)"
						:options="secondarySwitcherOptions"
						style="padding-right: 5px;"
						:data-accessrights-variable-id="variable.id"
					/>
					<span class="ui-access-rights-v2-text-ellipsis">{{ variable.title }}</span>
				</div>
			</div>
			<div
				v-if="right.dependentVariablesPopupHint"
				class="ui-access-rights-v2-dv-popup--hint"
			>
				<Icon :name="iconSet.INFO_1" :color="'var(--ui-color-palette-gray-40)'" :size="20"></Icon>
				<span>{{ right.dependentVariablesPopupHint }}</span>
			</div>
		</div>
	`
	};

	const AllRolesTitle = {
		name: 'AllRolesTitle',
		template: `
		<div class="ui-access-rights-v2-cell-popup-header-all-role-container">
			<div class="ui-icon-set --persons-3" style="margin-right: 4px;"></div>
			<div class="ui-access-rights-v2-cell-popup-header-all-roles-caption">{{ 
				$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ALL_ROLES')
			}}</div>
		</div>
	`
	};

	const ValuePopup = {
		name: 'ValuePopup',
		components: {
			Popup: ui_vue3_components_popup.Popup
		},
		emits: ['close', 'apply'],
		provide() {
			return {
				redefineApply: func => {
					this.onApply = func;
				}
			};
		},
		data() {
			return {
				onApply: () => {
					this.$emit('apply');
				}
			};
		},
		computed: {
			popupOptions() {
				return {
					autoHide: true,
					closeEsc: true,
					cacheable: false,
					minWidth: 466,
					padding: 18
				};
			}
		},
		mounted() {
			void this.$nextTick(() => {
				const applyButton = new ui_buttons.ApplyButton({
					color: ui_buttons.ButtonColor.PRIMARY,
					onclick: () => {
						this.apply();
						this.$emit('close');
					},
					useAirDesign: true
				});
				applyButton.renderTo(this.$refs['button-container']);
				const cancelButton = new ui_buttons.CancelButton({
					onclick: () => {
						this.$emit('close');
					},
					text: this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_CANCEL'),
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.OUTLINE
				});
				cancelButton.renderTo(this.$refs['button-container']);
			});
		},
		methods: {
			apply() {
				this.onApply();
			}
		},
		template: `
		<Popup @close="$emit('close')" :options="popupOptions">
			<slot/>
			<div ref="button-container" class="ui-access-rights-v2-value-popup-buttons"></div>
		</Popup>
	`
	};

	const DependentVariables$1 = {
		name: 'DependentVariables',
		components: {
			PopupContent,
			AllRolesTitle,
			ValuePopup
		},
		emits: ['close'],
		inject: ['section', 'right'],
		methods: {
			apply({
				values
			}) {
				this.$store.dispatch('userGroups/setAccessRightValuesForShown', {
					sectionCode: this.section.sectionCode,
					valueId: this.right.id,
					values
				});
			}
		},
		template: `
		<ValuePopup @close="$emit('close')">
			<PopupContent @apply="apply">
				<template #role-title>
					<AllRolesTitle/>
				</template>
			</PopupContent>
		</ValuePopup>
	`
	};

	class Footer extends ui_entitySelector.DefaultFooter {
		constructor(dialog, options) {
			super(dialog, options);
			this.selectAllButton = main_core.Tag.render`<div class="ui-selector-footer-link">${main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ALL_SELECT_LABEL')}</div>`;
			main_core.Dom.style(this.selectAllButton, 'display', 'none');
			main_core.Event.bind(this.selectAllButton, 'click', this.#selectAll.bind(this));
			this.deselectAllButton = main_core.Tag.render`<div class="ui-selector-footer-link">${main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ALL_DESELECT_LABEL')}</div>`;
			main_core.Dom.style(this.deselectAllButton, 'display', 'none');
			main_core.Event.bind(this.deselectAllButton, 'click', this.#deselectAll.bind(this));
			this.getDialog().subscribe('Item:onSelect', this.#onItemStatusChange.bind(this));
			this.getDialog().subscribe('Item:onDeselect', this.#onItemStatusChange.bind(this));
		}
		getContent() {
			this.#toggleSelectButtons();
			return [this.selectAllButton, this.deselectAllButton];
		}
		#toggleSelectButtons() {
			if (this.getDialog().getSelectedItems().length === this.getDialog().getItems().length) {
				main_core.Dom.style(this.selectAllButton, 'display', 'none');
				main_core.Dom.style(this.deselectAllButton, 'display', '');
			} else {
				main_core.Dom.style(this.selectAllButton, 'display', '');
				main_core.Dom.style(this.deselectAllButton, 'display', 'none');
			}
		}
		#selectAll() {
			this.getDialog().getItems().forEach(item => {
				item.select();
			});
		}
		#deselectAll() {
			this.getDialog().getSelectedItems().forEach(item => {
				item.deselect();
			});
		}
		#onItemStatusChange() {
			this.#toggleSelectButtons();
		}
	}

	let Header$1 = class Header extends ui_entitySelector.BaseHeader {
		render() {
			return this.#renderVueApp();
		}
		#renderVueApp() {
			const container = main_core.Tag.render`<div style="padding: 20px 20px 0;"></div>`;
			const app = ui_vue3.BitrixVue.createApp(Locator, {
				maxWidth: this.getDialog().getWidth()
			});
			app.provide('section', this.getOption('section'));
			app.provide('right', this.getOption('right'));
			app.mount(container);
			return container;
		}
	};

	const Selector = {
		name: 'Selector',
		emits: ['apply', 'close'],
		props: {
			// value for selector is id of a selected variable
			initialValues: {
				type: Set,
				default: new Set()
			}
		},
		inject: ['section', 'right'],
		data() {
			return {
				// values modified during popup lifetime and not yet dispatched to store
				values: this.initialValues
			};
		},
		dialog: null,
		computed: {
			isAllSelected() {
				return this.values.has(this.right.allSelectedCode);
			},
			selectedVariables() {
				return getSelectedVariables(this.right.variables, this.values, this.isAllSelected);
			},
			dialogItems() {
				return ItemsMapper.mapVariables(this.right.variables);
			},
			selectedDialogItems() {
				return this.dialogItems.filter(item => this.selectedVariables.has(item.id));
			}
		},
		mounted() {
			this.showSelector();
		},
		beforeUnmount() {
			this.dialog?.hide();
		},
		methods: {
			showSelector() {
				this.dialog = new ui_entitySelector.Dialog({
					height: 400,
					context: EntitySelectorContext.VARIABLE,
					enableSearch: this.right.enableSearch,
					multiple: true,
					autoHide: true,
					hideByEsc: true,
					dropdownMode: true,
					compactView: this.right.compactView,
					showAvatars: this.right.showAvatars,
					selectedItems: this.selectedDialogItems,
					searchOptions: {
						allowCreateItem: false
					},
					cacheable: false,
					events: {
						'Item:onSelect': this.onItemSelect,
						'Item:onDeselect': this.onItemDeselect,
						onHide: this.apply,
						onDestroy: () => {
							this.dialog = null;
						}
					},
					entities: [{
						id: EntitySelectorEntities.VARIABLE
					}],
					items: this.dialogItems,
					header: Header$1,
					headerOptions: {
						section: this.section,
						right: this.right
					},
					footer: Footer
				});
				this.dialog.show();
			},
			onItemSelect(event) {
				const addedItem = event.getData().item;
				this.addValue(String(addedItem.getId()));
			},
			onItemDeselect(event) {
				const removedItem = event.getData().item;
				this.removeValue(String(removedItem.getId()));
			},
			addValue(value) {
				const newValues = main_core.Runtime.clone(this.values);
				newValues.add(value);
				if (newValues.size >= this.right.variables.size) {
					this.setValues(new Set([this.right.allSelectedCode]));
				} else {
					this.setValues(newValues);
				}
			},
			removeValue(value) {
				if (this.values.has(this.right.allSelectedCode)) {
					const allVariablesIds = [...this.right.variables.values()].map(variable => variable.id);
					const allVariablesIdsWithoutRemoved = new Set(allVariablesIds);
					allVariablesIdsWithoutRemoved.delete(value);
					this.setValues(allVariablesIdsWithoutRemoved);
				} else {
					const newValues = [...this.values].filter(candidate => candidate !== value);
					this.setValues(new Set(newValues));
				}
			},
			setValues(newValues) {
				this.values = newValues;
			},
			apply() {
				this.setNothingSelectedValueIfNeeded();
				this.$emit('apply', {
					values: this.values
				});
				this.$emit('close');
			},
			setNothingSelectedValueIfNeeded() {
				if (this.values.size <= 0) {
					const nothingSelected = this.$store.getters['accessRights/getNothingSelectedValue'](this.section.sectionCode, this.right.id);
					for (const nothing of nothingSelected) {
						this.addValue(nothing);
					}
				}
			}
		},
		template: `
		<div></div>
	`
	};

	const Multivariables$1 = {
		name: 'Multivariables',
		emits: ['close'],
		components: {
			Selector
		},
		inject: ['section', 'right'],
		methods: {
			apply({
				values
			}) {
				this.$store.dispatch('userGroups/setAccessRightValuesForShown', {
					sectionCode: this.section.sectionCode,
					valueId: this.right.id,
					values
				});
			},
			close() {
				this.$emit('close');
			}
		},
		template: `
		<Selector @apply="apply" @close="close"/>
	`
	};

	const POPUP_ID$1 = 'ui-access-rights-v2-row-value-variables';
	const Variables$1 = {
		name: 'Variables',
		emits: ['close'],
		inject: ['section', 'right'],
		mounted() {
			this.showSelector();
		},
		beforeUnmount() {
			this.closeSelector();
		},
		methods: {
			showSelector() {
				const menuItems = [];
				for (const variable of this.right.variables.values()) {
					menuItems.push({
						id: variable.id,
						text: variable.title,
						onclick: (innerEvent, item) => {
							item.getMenuWindow()?.close();
							this.setValue(variable.id);
						}
					});
				}
				main_popup.MenuManager.show({
					id: POPUP_ID$1,
					bindElement: this.$el,
					items: menuItems,
					autoHide: true,
					cacheable: false,
					events: {
						onClose: () => {
							this.$emit('close');
						}
					}
				});
			},
			setValue(value) {
				this.$store.dispatch('userGroups/setAccessRightValuesForShown', {
					sectionCode: this.section.sectionCode,
					valueId: this.right.id,
					values: new Set([value])
				});
			},
			closeSelector() {
				main_popup.MenuManager.getMenuById(POPUP_ID$1)?.close();
			}
		},
		// invisible div for binding selector to it
		template: `
		<div></div>
	`
	};

	/**
	 * A special case of Hint. We don't need interactivity here, but we do need to wrap slot with a hint.
	 * Combine these properties in a single vue hint wrapper is impossible.
	 */
	const SelectedHint = {
		name: 'SelectedHint',
		props: {
			html: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isRendered: true
			};
		},
		watch: {
			html() {
				// force hint directive to re-render
				this.isRendered = false;
				void this.$nextTick(() => {
					this.isRendered = true;
				});
			}
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		// offsetTop is needed to fix infinite mouseenter/mouseleave loop in chromium. issue 204272
		template: `
		<div v-if="isRendered" v-hint="{
			html,
			popupOptions: {
				offsetTop: 3,
			},
		}" data-hint-init="vue">
			<slot/>
		</div>
	`
	};

	const DependentVariables = {
		name: 'DependentVariables',
		components: {
			ValuePopup,
			PopupContent,
			SelectedHint,
			SingleRoleTitle
		},
		props: {
			// value for selector is id of a selected variable
			value: {
				/** @type AccessRightValue */
				type: Object,
				required: true
			}
		},
		data() {
			return {
				isPopupShown: false
			};
		},
		inject: ['section', 'userGroup', 'right'],
		computed: {
			parentRight() {
				if (!this.right.group) {
					return null;
				}
				return this.$store.getters['accessRights/getAccessRightItemById'](this.section.sectionCode, this.right.group);
			},
			parentValue() {
				return this.$store.getters['userGroups/getAccessRightValue'](this.userGroup, this.section.sectionCode, this.parentRight.id);
			},
			selectedVariables() {
				return getSelectedVariables(this.right.variables, this.value.values, false);
			},
			parentSelectedVariables() {
				return getSelectedVariables(this.parentRight.variables, this.parentValue.values, false);
			},
			currentAlias() {
				return this.$store.getters['accessRights/getSelectedVariablesAlias'](this.section.sectionCode, this.value.id, this.value.values);
			},
			title() {
				if (main_core.Type.isString(this.currentAlias)) {
					return this.currentAlias;
				}
				if (this.selectedVariables.size <= 0) {
					return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ADD');
				}
				return getMultipleSelectedVariablesTitle(this.selectedVariables);
			},
			isUseGroupHeadValuesInHint() {
				return isUseGroupHeadValuesInHintByVariables(this.selectedVariables);
			},
			hintHtml() {
				if (this.right.group && this.isUseGroupHeadValuesInHint) {
					return getMultipleSelectedVariablesHintHtml(this.parentSelectedVariables, this.title, this.parentRight.variables, true);
				}
				return getMultipleSelectedVariablesHintHtml(this.selectedVariables, this.hintTitle, this.right.variables);
			},
			hintTitle() {
				if (main_core.Type.isString(this.right.hintTitle)) {
					return this.right.hintTitle;
				}
				return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SELECTED_ITEMS_TITLE');
			}
		},
		methods: {
			apply({
				values
			}) {
				this.$store.dispatch('userGroups/setAccessRightValues', {
					sectionCode: this.section.sectionCode,
					userGroupId: this.userGroup.id,
					valueId: this.value.id,
					values
				});
			}
		},
		template: `
		<div class='ui-access-rights-v2-column-item-text-link' :class="{
			'ui-access-rights-v2-text-ellipsis': !hintHtml
		}" @click="isPopupShown = true">
			<SelectedHint v-if="hintHtml" :html="hintHtml">{{title}}</SelectedHint>
			<div v-else :title="title">{{title}}</div>
			<ValuePopup v-if="isPopupShown" @close="isPopupShown = false">
				<PopupContent
					@apply="apply"
					:initial-values="value.values"
				>
					<template #role-title>
						<SingleRoleTitle :user-group-title="userGroup.title"/>
					</template>
				</PopupContent>
			</ValuePopup>
		</div>
	`
	};

	const Multivariables = {
		name: 'Multivariables',
		components: {
			SelectedHint,
			Selector
		},
		props: {
			// value for selector is id of a selected variable
			value: {
				/** @type AccessRightValue */
				type: Object,
				required: true
			}
		},
		inject: ['section', 'userGroup', 'right'],
		data() {
			return {
				isSelectorShown: false
			};
		},
		computed: {
			isAllSelected() {
				return this.value.values.has(this.right.allSelectedCode);
			},
			selectedVariables() {
				return getSelectedVariables(this.right.variables, this.value.values, this.isAllSelected);
			},
			currentAlias() {
				return this.$store.getters['accessRights/getSelectedVariablesAlias'](this.section.sectionCode, this.value.id, this.value.values);
			},
			title() {
				if (main_core.Type.isString(this.currentAlias)) {
					return this.currentAlias;
				}
				if (this.isAllSelected) {
					return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ALL_ACCEPTED');
				}
				if (this.selectedVariables.size <= 0) {
					return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ADD');
				}
				return getMultipleSelectedVariablesTitle(this.selectedVariables);
			},
			hintHtml() {
				if (this.right.group && this.isUseGroupHeadValuesInHint) {
					return getMultipleSelectedVariablesHintHtml(this.parentSelectedVariables, this.title, this.parentRight.variables, true);
				}
				return getMultipleSelectedVariablesHintHtml(this.selectedVariables, this.hintTitle, this.right.variables);
			},
			hintTitle() {
				if (main_core.Type.isString(this.right.hintTitle)) {
					return this.right.hintTitle;
				}
				return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SELECTED_ITEMS_TITLE');
			},
			parentRight() {
				if (!this.right.group) {
					return null;
				}
				return this.$store.getters['accessRights/getAccessRightItemById'](this.section.sectionCode, this.right.group);
			},
			parentValue() {
				return this.$store.getters['userGroups/getAccessRightValue'](this.userGroup, this.section.sectionCode, this.parentRight.id);
			},
			parentSelectedVariables() {
				return getSelectedVariables(this.parentRight.variables, this.parentValue.values, false);
			},
			isUseGroupHeadValuesInHint() {
				return isUseGroupHeadValuesInHintByVariables(this.selectedVariables);
			}
		},
		methods: {
			showSelector() {
				this.isSelectorShown = true;
			},
			setValues({
				values
			}) {
				this.$store.dispatch('userGroups/setAccessRightValues', {
					sectionCode: this.section.sectionCode,
					userGroupId: this.userGroup.id,
					valueId: this.value.id,
					values
				});
			}
		},
		template: `
		<SelectedHint 
			v-if="hintHtml"
			:html="hintHtml" 
			class='ui-access-rights-v2-column-item-text-link'
			@click="showSelector"
			v-bind="$attrs"
		>
			{{ title }}
		</SelectedHint>
		<div 
			v-else
			class='ui-access-rights-v2-column-item-text-link ui-access-rights-v2-text-ellipsis'
			@click="showSelector"
			:title="title"
			v-bind="$attrs"
		>
			{{ title }}
		</div>
		<Selector
			v-if="isSelectorShown" 
			:initial-values="value.values"
			@close="isSelectorShown = false"
			@apply="setValues"
		/>
	`
	};

	const Toggler = {
		name: 'Toggler',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher
		},
		props: {
			value: {
				/** @type AccessRightValue */
				type: Object,
				required: true
			}
		},
		inject: ['section', 'userGroup'],
		computed: {
			isChecked() {
				return this.value.values.has('1');
			}
		},
		methods: {
			setValue(value) {
				this.$store.dispatch('userGroups/setAccessRightValues', {
					userGroupId: this.userGroup.id,
					sectionCode: this.section.sectionCode,
					valueId: this.value.id,
					values: new Set([value])
				});
			}
		},
		// eslint-disable-next-line quotes
		template: `
		<Switcher
			:is-checked="isChecked"
			@check="setValue('1')"
			@uncheck="setValue('0')"
			:options="{
				size: 'small',
				color: 'primary',
				useAirDesign: true,
			}"
		/>
	`
	};

	const POPUP_ID = 'ui-access-rights-v2-column-item-popup-variables';
	const Variables = {
		name: 'Variables',
		components: {
			SelectedHint
		},
		props: {
			// value for selector is id of a selected variable
			value: {
				/** @type AccessRightValue */
				type: Object,
				required: true
			}
		},
		inject: ['section', 'userGroup', 'right'],
		computed: {
			emptyVariableId() {
				const emptyValue = this.$store.getters['accessRights/getEmptyValue'](this.section.sectionCode, this.value.id);
				return emptyValue[0];
			},
			currentVariableId() {
				if (this.value.values.size <= 0) {
					return this.emptyVariableId;
				}
				const [firstItem] = this.value.values;
				return firstItem;
			},
			currentAlias() {
				return this.$store.getters['accessRights/getSelectedVariablesAlias'](this.section.sectionCode, this.value.id, this.value.values);
			},
			currentVariable() {
				if (main_core.Type.isString(this.currentAlias)) {
					return this.currentAlias;
				}
				return this.right.variables.get(this.currentVariableId);
			},
			currentVariableTitle() {
				const variable = this.currentVariable;
				if (!variable) {
					return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ADD');
				}
				return variable.title;
			},
			hintHtml() {
				if (this.right.group && this.isUseGroupHeadValuesInHint) {
					return getMultipleSelectedVariablesHintHtml(this.parentSelectedVariables, this.currentVariableTitle, this.parentRight.variables, true);
				}
				return '';
			},
			parentRight() {
				if (!this.right.group) {
					return null;
				}
				return this.$store.getters['accessRights/getAccessRightItemById'](this.section.sectionCode, this.right.group);
			},
			parentValue() {
				return this.$store.getters['userGroups/getAccessRightValue'](this.userGroup, this.section.sectionCode, this.parentRight.id);
			},
			parentSelectedVariables() {
				return getSelectedVariables(this.parentRight.variables, this.parentValue.values, false);
			},
			isUseGroupHeadValuesInHint() {
				const currentVariable = this.currentVariable;
				if (!currentVariable) {
					return false;
				}
				const variablesCollection = new Map([[currentVariable.id, currentVariable]]);
				return isUseGroupHeadValuesInHintByVariables(variablesCollection);
			}
		},
		methods: {
			showSelector(event) {
				const menuItems = [];
				for (const variable of this.right.variables.values()) {
					menuItems.push({
						id: variable.id,
						text: variable.title,
						onclick: (innerEvent, item) => {
							item.getMenuWindow()?.close();
							this.setValue(variable.id);
						}
					});
				}
				main_popup.MenuManager.show({
					id: POPUP_ID,
					bindElement: event.target,
					items: menuItems,
					autoHide: true,
					cacheable: false
				});
			},
			setValue(value) {
				this.$store.dispatch('userGroups/setAccessRightValues', {
					sectionCode: this.section.sectionCode,
					userGroupId: this.userGroup.id,
					valueId: this.value.id,
					values: new Set([value])
				});
			}
		},
		template: `
		<div
			class='ui-access-rights-v2-column-item-text-link ui-access-rights-v2-text-ellipsis'
			:title="hintHtml ? '' : currentVariableTitle"
			@click="showSelector"
		>
			<SelectedHint v-if="hintHtml" :html="hintHtml">{{currentVariableTitle}}</SelectedHint>
			<template v-else>{{ currentVariableTitle }}</template>
		</div>
	`
	};

	const Cells = Object.freeze({
		DependentVariables: DependentVariables,
		Multivariables: Multivariables,
		Toggler: Toggler,
		Variables: Variables
	});
	const Rows = Object.freeze({
		DependentVariables: DependentVariables$1,
		Multivariables: Multivariables$1,
		// no row value for toggler
		Variables: Variables$1
	});
	function getValueComponent(accessRightItem) {
		const type = ServiceLocator.getValueTypeByRight(accessRightItem);
		if (!type) {
			// vue will render empty cell
			return '';
		}
		return type.getComponentName();
	}

	const ValueCell = {
		name: 'ValueCell',
		components: {
			CellLayout,
			...Cells
		},
		props: {
			right: {
				/** @type AccessRightItem */
				type: Object,
				required: true
			}
		},
		inject: ['section', 'userGroup'],
		provide() {
			return {
				right: this.right
			};
		},
		computed: {
			value() {
				const value = this.userGroup.accessRights.get(this.right.id);
				return value || this.$store.getters['userGroups/getEmptyAccessRightValue'](this.userGroup.id, this.section.sectionCode, this.right.id);
			},
			cellComponent() {
				return getValueComponent(this.right);
			}
		},
		// data attributes are needed for e2e automated tests
		template: `
		<CellLayout
			:class="{
				'ui-access-rights-v2-group-children': right.group,
				'--modified': value.isModified
			}"
			v-memo="[userGroup.id, value.values, value.isModified]"
		>
			<Component
				:is="cellComponent"
				:value="value"
				:data-accessrights-right-id="right.id"
			/>
		</CellLayout>
	`
	};

	const Column = {
		name: 'Column',
		components: {
			ColumnLayout,
			ValueCell,
			MenuCell: MenuCell$1
		},
		props: {
			userGroup: {
				/** @type UserGroup */
				type: Object,
				required: true
			},
			rights: {
				type: Map,
				required: true
			}
		},
		provide() {
			return {
				userGroup: ui_vue3.computed(() => this.userGroup)
			};
		},
		computed: {
			renderedRights() {
				const result = new Map();
				for (const [rightId, right] of this.rights) {
					if (shouldRowBeRendered(right)) {
						result.set(rightId, right);
					}
				}
				return result;
			}
		},
		template: `
		<ColumnLayout ref="column">
			<MenuCell/>
			<ValueCell
				v-for="[rightId, accessRightItem] in renderedRights"
				:key="rightId"
				:right="accessRightItem"
			/>
		</ColumnLayout>
	`
	};

	const ColumnList = {
		name: 'ColumnList',
		components: {
			Column,
			SyncHorizontalScroll,
			ColumnLayout
		},
		props: {
			userGroups: {
				type: Map,
				required: true
			},
			rights: {
				type: Map,
				required: true
			}
		},
		throttledScrollHandler: null,
		throttledResizeHandler: null,
		ears: null,
		isEarsInited: false,
		data() {
			return {
				isLeftShadowShown: false,
				isRightShadowShown: false
			};
		},
		created() {
			this.throttledScrollHandler = main_core.Runtime.throttle(() => {
				this.adjustShadowsVisibility();
			}, 200);
			this.throttledResizeHandler = main_core.Runtime.throttle(() => {
				this.adjustShadowsVisibility();
				this.adjustEars();
			}, 200);
		},
		mounted() {
			main_core.Event.bind(window, 'resize', this.throttledResizeHandler);
			this.adjustShadowsVisibility();
			this.initEars();
		},
		beforeUnmount() {
			this.destroyEars();
			main_core.Event.unbind(window, 'resize', this.throttledResizeHandler);
		},
		watch: {
			userGroups(newValue, oldValue) {
				if (newValue.size !== oldValue.size) {
					this.adjustShadowsVisibility();
					this.adjustEars();
				}
			}
		},
		methods: {
			calculateShadowsVisibility() {
				if (!this.$refs['column-container']) {
					// in case it's accidentally called before mount or after unmount
					return {
						isLeftShadowShown: false,
						isRightShadowShown: false
					};
				}
				const scrollLeft = this.$refs['column-container'].$el.scrollLeft;
				const isLeftShadowShown = scrollLeft > 0;
				const offsetWidth = this.$refs['column-container'].$el.offsetWidth;
				return {
					isLeftShadowShown,
					isRightShadowShown: this.$refs['column-container'].$el.scrollWidth > Math.round(scrollLeft + offsetWidth)
				};
			},
			adjustShadowsVisibility() {
				// avoid "forced synchronous layout"
				requestAnimationFrame(() => {
					const {
						isLeftShadowShown,
						isRightShadowShown
					} = this.calculateShadowsVisibility();
					this.isLeftShadowShown = isLeftShadowShown;
					this.isRightShadowShown = isRightShadowShown;
				});
			},
			adjustEars() {
				if (!this.isEarsInited) {
					return;
				}

				// avoid "forced synchronous layout"
				requestAnimationFrame(() => {
					// force ears to recalculate its visibility
					this.ears.toggleEars();
				});
			},
			initEars() {
				if (!this.$refs['column-container']) {
					return;
				}
				if (this.ears) {
					return;
				}
				this.ears = new ui_ears.Ears({
					container: this.$refs['column-container'].$el,
					immediateInit: true,
					smallSize: true
				});

				// chrome is not happy when we query DOM values (scrollLeft, offsetWidth, ...) just after we've changed them
				// avoid "forced synchronous layout"
				requestAnimationFrame(() => {
					if (!this.ears || !this.$refs['column-container']) {
						this.ears = null;

						// sometimes the callback is fired after the component is unmounted
						return;
					}
					const scrollLeft = this.$refs['column-container'].$el.scrollLeft;
					this.ears.init();

					// Ears add wrapper around the container, and it breaks our markup a little. Fix it
					main_core.Dom.style(this.ears.getWrapper(), 'flex', 1);
					if (scrollLeft > 0) {
						// ears.init resets scrollLeft to 0
						this.$refs['column-container'].$el.scrollLeft = scrollLeft;
					}
					this.isEarsInited = true;
				});
			},
			destroyEars() {
				this.ears?.destroy();
				this.isEarsInited = false;
				this.ears = null;
			}
		},
		template: `
		<div
			class='ui-access-rights-v2-section-content'
			:class="{
				'ui-access-rights-v2-section-shadow-left-shown': isLeftShadowShown,
				'ui-access-rights-v2-section-shadow-right-shown': isRightShadowShown,
			}"
		>
			<SyncHorizontalScroll
				ref="column-container"
				class='ui-access-rights-v2-section-wrapper'
				@scroll="throttledScrollHandler"
			>
				<Column
					v-for="[groupId, group] in userGroups"
					:key="groupId"
					:user-group="group"
					:rights="rights"
					:data-accessrights-user-group-id="groupId"
				/>
				<ColumnLayout/>
			</SyncHorizontalScroll>
		</div>
	`
	};

	/**
	 * A special case of Hint that provides interactivity and reactivity.
	 */
	const Hint = {
		name: 'Hint',
		props: {
			html: {
				type: String,
				required: true
			}
		},
		computed: {
			...ui_vue3_vuex.mapState({
				guid: state => state.application.guid
			})
		},
		mounted() {
			this.renderHint();
		},
		watch: {
			html() {
				// make ui.hint reactive :(
				main_core.Dom.clean(this.$refs.container);
				this.renderHint();
			}
		},
		methods: {
			renderHint() {
				const hintIconWrapper = main_core.Tag.render`<span data-hint-html="true" data-hint-interactivity="true"></span>`;
				// Tag.render cant set prop value with HTML properly :(
				hintIconWrapper.setAttribute('data-hint', this.html);
				main_core.Dom.append(hintIconWrapper, this.$refs.container);
				this.getHintManager().initNode(hintIconWrapper);
			},
			getHintManager() {
				return ServiceLocator.getHint(this.guid);
			}
		},
		template: '<span class="ui-access-rights-v2-hint-container" ref="container"></span>'
	};

	const Header = {
		name: 'Header',
		components: {
			Hint,
			Icon
		},
		inject: ['section'],
		methods: {
			toggleSection() {
				this.$store.dispatch('accessRights/toggleSection', {
					sectionCode: this.section.sectionCode
				});
			},
			onSectionEventButtonClick() {
				const eventData = {
					guid: this.$store.getters['application/guid'],
					section: this.section
				};
				main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:onSectionHeaderClick', eventData);
			}
		},
		template: `
		<div
			@click="toggleSection"
			class='ui-access-rights-v2-section-header'
			:class="{
				'--expanded': section.isExpanded,
			}" 
			v-memo="[section.isExpanded]"
		>
			<div class="ui-access-rights-v2-section-header-expander">
				<div class='ui-icon-set' :class="{
					'--chevron-up': section.isExpanded,
					'--chevron-down': !section.isExpanded,
				}"
				></div>
			</div>
			<Icon/>
			<span 
				class="ui-access-rights-v2-text-ellipsis ui-access-rights-v2-section-title"
				:title="section.sectionTitle"
			>{{ section.sectionTitle }}</span>
			<span
				v-if="section.sectionSubTitle"
				class="ui-access-rights-v2-text-ellipsis ui-access-rights-v2-section-subtitle"
				:title="section.sectionSubTitle"
			>
				{{ section.sectionSubTitle }}
			</span>
			<Hint v-if="section.sectionHint" :html="section.sectionHint"/>
			<span 
				v-if="section.action"
				class="ui-btn ui-btn-light-border ui-btn-xs ui-access-rights-v2-section-action"
				@click.stop="onSectionEventButtonClick"
			>{{ section.action.buttonText }}</span>
		</div>
	`
	};

	const MenuCell = {
		name: 'MenuCell',
		components: {
			CellLayout
		},
		template: `
		<CellLayout class="ui-access-rights-v2-menu-cell"/>
	`
	};

	const RowValue = {
		name: 'RowValue',
		components: {
			...Rows
		},
		emits: ['close'],
		inject: ['right'],
		computed: {
			component() {
				return getValueComponent(this.right);
			}
		},
		template: `
		<Component :is="component" @close="$emit('close')" />
	`
	};

	const TitleCell = {
		name: 'TitleCell',
		components: {
			Hint,
			RowValue,
			RichMenuItem: ui_vue3_components_richMenu.RichMenuItem,
			RichMenuPopup: ui_vue3_components_richMenu.RichMenuPopup
		},
		props: {
			right: {
				/** @type AccessRightItem */
				type: Object,
				required: true
			}
		},
		inject: ['section'],
		provide() {
			return {
				right: this.right
			};
		},
		data() {
			return {
				isMenuShown: false,
				isRowValueShown: false
			};
		},
		computed: {
			RichMenuItemIcon: () => ui_vue3_components_richMenu.RichMenuItemIcon,
			isMinValueSet() {
				return this.$store.getters['accessRights/isMinValueSet'](this.section.sectionCode, this.right.id);
			},
			isMaxValueSet() {
				return this.$store.getters['accessRights/isMaxValueSet'](this.section.sectionCode, this.right.id);
			},
			isRowValueConfigurable() {
				return ServiceLocator.getValueTypeByRight(this.right)?.isRowValueConfigurable() ?? false;
			},
			isRightDeletable() {
				return this.right.isDeletable;
			},
			rightCellStyle() {
				return {
					'margin-left': !this.right.groupHead && !this.right.group && !this.right.iconClass ? '23px' : null,
					'max-width': this.right.iconClass ? 'calc(100% - 52px)' : 'auto'
				};
			}
		},
		methods: {
			toggleGroup() {
				if (!this.right.groupHead) {
					return;
				}
				this.$store.dispatch('accessRights/toggleGroup', {
					sectionCode: this.section.sectionCode,
					groupId: this.right.id
				});
			},
			toggleMenu() {
				this.isMenuShown = !this.isMenuShown;
			},
			setMaxValuesForRight() {
				this.isRowValueShown = false;
				this.isMenuShown = false;
				this.$store.dispatch('userGroups/setMaxAccessRightValuesForRight', {
					sectionCode: this.section.sectionCode,
					rightId: this.right.id
				});
			},
			setMinValuesForRight() {
				this.isRowValueShown = false;
				this.isMenuShown = false;
				this.$store.dispatch('userGroups/setMinAccessRightValuesForRight', {
					sectionCode: this.section.sectionCode,
					rightId: this.right.id
				});
			},
			openRowValue() {
				this.isMenuShown = false;
				this.isRowValueShown = true;
			},
			onRightClick() {
				const eventData = {
					guid: this.$store.getters['application/guid'],
					right: this.right
				};
				main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:onRightClick', eventData);
			},
			deleteRight() {
				this.$store.dispatch('userGroups/deleteRight', {
					rightId: this.right.id
				});
				this.$store.dispatch('accessRights/deleteRight', {
					sectionCode: this.section.sectionCode,
					rightId: this.right.id
				});
				main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:onRightDelete', {
					guid: this.$store.getters['application/guid'],
					right: this.right
				});
			}
		},
		// data attributes are needed for e2e automated tests
		template: `
		<div
			class='ui-access-rights-v2-column-item-text ui-access-rights-v2-column-item-title'
			@click="toggleGroup"
			:style="{
				cursor: right.groupHead ? 'pointer' : null,
			}"
			v-memo="[right.isGroupExpanded, right.title, right.subtitle]"
			:data-accessrights-right-id="right.id"
		>
			<span
				v-if="right.groupHead"
				class="ui-icon-set"
				:class="{
					'--o-circle-minus': right.isGroupExpanded,
					'--o-circle-plus': !right.isGroupExpanded,
				}"
			></span>
			<div 
				v-if="right.iconClass" 
				:class="right.iconClass"
				class="ui-access-rights-v2-column-item-title-icon"
			><i></i></div>
			<div class="ui-access-rights-v2-column-item-title-block" :style="rightCellStyle">
				<span
					v-if="right.isClickable"
					class="ui-access-rights-v2-column-item-title-link ui-access-rights-v2-text-ellipsis"
					@click="onRightClick"
				>
					{{ right.title }}<Hint v-once v-if="right.hint" :html="right.hint"/>
				</span>
				<span 
					v-else 
					class="ui-access-rights-v2-text-wrap"
				>
					{{ right.title }}<Hint v-once v-if="right.hint" :html="right.hint"/>
				</span>
				<span 
					v-if="right.subtitle" 
					class="ui-access-rights-v2-column-item-subtitle ui-access-rights-v2-text-ellipsis"
				>{{ right.subtitle }}</span>
			</div>
		</div>
		<div
			ref="icon" 
			class="ui-icon-set --more-l ui-access-rights-v2-icon-more ui-access-rights-v2-title-column-menu" 
			@click="toggleMenu"
		>
			<RichMenuPopup
				v-if="isMenuShown"
				@close="isMenuShown = false"
				:popup-options="{bindElement: $refs.icon, width: 300}"
			>
				<RichMenuItem
					v-if="isMaxValueSet"
					:icon="RichMenuItemIcon.check"
					:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SET_MAX_ACCESS_RIGHTS_ROW')"
					:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SET_MAX_ACCESS_RIGHTS_ROW_SUBTITLE')"
					@click="setMaxValuesForRight"
				/>
				<RichMenuItem
					v-if="isMinValueSet"
					:icon="RichMenuItemIcon['red-lock']"
					:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SET_MIN_ACCESS_RIGHTS_ROW')"
					:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SET_MIN_ACCESS_RIGHTS_ROW_SUBTITLE')"
					@click="setMinValuesForRight"
				/>
				<RichMenuItem
					v-if="isRowValueConfigurable"
					:icon="RichMenuItemIcon.settings"
					:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_OPEN_ROW_VALUE')"
					:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_OPEN_ROW_VALUE_SUBTITLE')"
					@click="openRowValue"
				/>
				<RichMenuItem
					v-if="isRightDeletable"
					:icon="RichMenuItemIcon['trash-bin']"
					:title="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_DELETE_ROW')"
					:subtitle="$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_DELETE_ROW_SUBTITLE')"
					@click="deleteRight"
				/>
			</RichMenuPopup>
			<RowValue v-if="isRowValueShown" @close="isRowValueShown = false"/>
		</div>
	`
	};

	const TitleColumn = {
		name: 'TitleColumn',
		components: {
			TitleCell,
			ColumnLayout,
			CellLayout,
			MenuCell
		},
		props: {
			rights: {
				type: Map,
				required: true
			}
		},
		computed: {
			renderedRights() {
				const result = new Map();
				for (const [rightId, right] of this.rights) {
					if (shouldRowBeRendered(right)) {
						result.set(rightId, right);
					}
				}
				return result;
			}
		},
		template: `
		<ColumnLayout>
			<MenuCell/>
			<CellLayout
				v-for="[rightId, accessRightItem] in renderedRights"
				:key="rightId"
				:class="{
					'ui-access-rights-v2-group-children': accessRightItem.group,
				}"
			>
				<TitleCell :right="accessRightItem" />
			</CellLayout>
		</ColumnLayout>
	`
	};

	// @vue/component
	const Section = {
		name: 'Section',
		components: {
			Column,
			SyncHorizontalScroll,
			TitleColumn,
			Header,
			ColumnList
		},
		props: {
			userGroups: {
				type: Map,
				required: true
			},
			rights: {
				type: Map,
				required: true
			},
			code: {
				type: String,
				required: true
			},
			isExpanded: {
				type: Boolean,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			subTitle: {
				type: String
			},
			hint: {
				type: String
			},
			icon: {
				/** @type AccessRightSectionIcon */
				type: Object
			},
			action: {
				/** @type AccessRightSectionAction */
				type: Object
			}
		},
		provide() {
			return {
				section: ui_vue3.computed(() => {
					return {
						sectionCode: this.code,
						sectionTitle: this.title,
						sectionSubTitle: this.subTitle,
						sectionIcon: this.icon,
						sectionHint: this.hint,
						isExpanded: this.isExpanded,
						rights: this.rights,
						action: this.action
					};
				})
			};
		},
		// data attributes are needed for e2e automated tests
		template: `
		<div class="ui-access-rights-v2-section" :data-accessrights-section-code="code">
			<Header/>
			<div v-if="isExpanded" class='ui-access-rights-v2-section-container'>
				<div class='ui-access-rights-v2-section-head'>
					<TitleColumn :rights="rights" />
				</div>
				<ColumnList :rights="rights" :user-groups="userGroups"/>
			</div>
		</div>
	`
	};

	const GridSkeleton = {
		name: 'GridSkeleton',
		template: `
		<div class="ui-access-rights-v2-grid-skeleton" />
	`
	};

	const Grid = {
		name: 'Grid',
		components: {
			Section,
			Header: Header$2,
			SearchBox,
			MemberSelector,
			GridSkeleton
		},
		loader: null,
		computed: {
			...ui_vue3_vuex.mapState({
				isProgress: state => state.application.isProgress,
				guid: state => state.application.guid,
				searchContainerSelector: state => state.application.options.searchContainerSelector,
				maxVisibleUserGroups: state => state.application.options.maxVisibleUserGroups,
				sortConfig: state => state.userGroups.sortConfig,
				selectedMember: state => state.userGroups.selectedMember
			}),
			...ui_vue3_vuex.mapGetters({
				shownSections: 'accessRights/shown',
				userGroups: 'userGroups/shown'
			})
		},
		mounted() {
			ServiceLocator.getHint(this.guid).initOwnerDocument(this.$refs.container);
			main_core_events.EventEmitter.subscribe('BX.UI.AccessRights.V2:addRight', this.addRight);
			main_core_events.EventEmitter.subscribe('BX.UI.AccessRights.V2:updateRightTitle', this.updateRightTitle);
			main_core_events.EventEmitter.subscribe('BX.UI.AccessRights.V2:updateRightSubtitle', this.updateRightSubtitle);
			main_core_events.EventEmitter.subscribe('BX.UI.AccessRights.V2:markRightAsModified', this.markRightAsModified);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('BX.UI.AccessRights.V2:addRight', this.addRight);
			main_core_events.EventEmitter.unsubscribe('BX.UI.AccessRights.V2:updateRightTitle', this.updateRightTitle);
			main_core_events.EventEmitter.unsubscribe('BX.UI.AccessRights.V2:updateRightSubtitle', this.updateRightSubtitle);
			main_core_events.EventEmitter.unsubscribe('BX.UI.AccessRights.V2:markRightAsModified', this.markRightAsModified);
		},
		methods: {
			scrollToSection(sectionCode) {
				const section = this.$refs.sections.find(item => item.code === sectionCode);
				if (section) {
					scrollTo({
						top: main_core.Dom.getPosition(section.$el).top - 155,
						behavior: 'smooth'
					});
				}
			},
			addRight(event) {
				const {
					guid,
					sectionCode,
					right
				} = event.data;
				if (!guid) {
					console.warn('ui.accessrights.v2: addRight: application guid should be passed in event data');
					return;
				}
				if (guid === this.$store.getters['application/guid']) {
					this.$store.dispatch('accessRights/addRight', {
						sectionCode,
						right
					});
				}
			},
			updateRightTitle(event) {
				const {
					guid,
					sectionCode,
					rightId,
					rightTitle
				} = event.data;
				if (!guid) {
					console.warn('ui.accessrights.v2: updateRightTitle: application guid should be passed in event data');
					return;
				}
				if (guid === this.$store.getters['application/guid']) {
					this.$store.dispatch('accessRights/updateRightTitle', {
						sectionCode,
						rightId,
						rightTitle
					});
				}
			},
			updateRightSubtitle(event) {
				const {
					guid,
					sectionCode,
					rightId,
					rightSubtitle
				} = event.data;
				if (!guid) {
					console.warn('ui.accessrights.v2: updateRightSubtitle: application guid should be passed in event data');
					return;
				}
				if (guid === this.$store.getters['application/guid']) {
					this.$store.dispatch('accessRights/updateRightSubtitle', {
						sectionCode,
						rightId,
						rightSubtitle
					});
				}
			},
			markRightAsModified(event) {
				const {
					guid,
					sectionCode,
					rightId,
					isModified
				} = event.data;
				if (!guid) {
					console.warn('ui.accessrights.v2: markRightAsModified: application guid should be passed in event data');
					return;
				}
				if (guid === this.$store.getters['application/guid']) {
					this.$store.dispatch('accessRights/markRightAsModified', {
						sectionCode,
						rightId,
						isModified
					});
				}
			}
		},
		template: `
		<Teleport v-if="searchContainerSelector" :to="searchContainerSelector">
			<div class="ui-access-rights-v2-search-container">
				<MemberSelector/>
				<SearchBox/>
			</div>
		</Teleport>
		<div ref="container" class='ui-access-rights-v2'>
			<GridSkeleton v-if="isProgress" />
			<template v-else>
				<Header :user-groups="userGroups"/>
				<Section
					v-for="[sectionCode, accessRightSection] in shownSections"
					:key="sectionCode"
					:code="accessRightSection.sectionCode"
					:is-expanded="accessRightSection.isExpanded"
					:title="accessRightSection.sectionTitle"
					:sub-title="accessRightSection.sectionSubTitle"
					:hint="accessRightSection.sectionHint"
					:icon="accessRightSection.sectionIcon"
					:rights="accessRightSection.rights"
					:action="accessRightSection.action"
					:user-groups="userGroups"
					ref="sections"
				/>
			</template>
		</div>
	`
	};

	class AnalyticsManager {
		#store;
		#data;
		#isEnabled;
		#isCancelAlreadyRegistered = false;
		constructor(store, analyticsData) {
			this.#store = store;
			this.#data = analyticsData;

			// check 2 out of 3 required fields
			// 'event' field is provided by AnalyticsManager
			this.#isEnabled = Object.hasOwn(this.#data, 'tool') && Object.hasOwn(this.#data, 'category');
		}
		onSaveSuccess() {
			if (!this.#isEnabled) {
				return;
			}
			const {
				createdRoles,
				editedRoles,
				deletedRoles
			} = this.#analyzeRoles();
			for (let i = 0; i < createdRoles; i++) {
				this.#registerRoleCreateEvent('success');
			}
			for (let i = 0; i < editedRoles; i++) {
				this.#registerRoleEditEvent('success');
			}
			for (let i = 0; i < deletedRoles; i++) {
				this.#registerRoleDeleteEvent('success');
			}
		}
		onSaveError(response) {
			if (!this.#isEnabled) {
				return;
			}
			const status = this.#getSaveErrorStatus(response);
			const {
				createdRoles,
				editedRoles,
				deletedRoles
			} = this.#analyzeRoles();
			for (let i = 0; i < createdRoles; i++) {
				this.#registerRoleCreateEvent(status);
			}
			for (let i = 0; i < editedRoles; i++) {
				this.#registerRoleEditEvent(status);
			}
			for (let i = 0; i < deletedRoles; i++) {
				this.#registerRoleDeleteEvent(status);
			}
		}
		onCancelChanges() {
			if (!this.#isEnabled) {
				return;
			}
			if (this.#isCancelAlreadyRegistered) {
				return;
			}
			ui_analytics.sendData({
				...this.#data,
				event: 'settings_cancel'
			});
			this.#isCancelAlreadyRegistered = true;
		}
		onCloseWithoutSave() {
			if (!this.#isEnabled) {
				return;
			}
			ui_analytics.sendData({
				...this.#data,
				event: 'settings_pop_cancel'
			});
		}
		#analyzeRoles() {
			const result = {
				createdRoles: 0,
				editedRoles: 0,
				deletedRoles: this.#store.state.userGroups.deleted.size
			};
			for (const userGroup of this.#store.state.userGroups.collection.values()) {
				if (userGroup.isNew) {
					result.createdRoles++;
				} else if (this.#isUserGroupEdited(userGroup)) {
					result.editedRoles++;
				}
			}
			return result;
		}
		#isUserGroupEdited(userGroup) {
			if (userGroup.isModified) {
				return true;
			}
			for (const value of userGroup.accessRights.values()) {
				if (value.isModified) {
					return true;
				}
			}
			return false;
		}
		#getSaveErrorStatus(response) {
			if (!main_core.Type.isArrayFilled(response?.errors)) {
				return 'error';
			}
			for (const error of response.errors) {
				if (main_core.Type.isStringFilled(error?.code)) {
					return `error_${main_core.Text.toCamelCase(error.code)}`;
				}
			}
			return 'error';
		}
		#registerRoleCreateEvent(status) {
			const data = {
				...this.#data,
				event: 'role_create',
				status
			};
			this.#appendRoleCountView(data);
			ui_analytics.sendData(data);
		}
		#registerRoleEditEvent(status) {
			const data = {
				...this.#data,
				event: 'role_edit',
				status
			};
			this.#appendRoleCountView(data);
			ui_analytics.sendData(data);
		}
		#registerRoleDeleteEvent(status) {
			const data = {
				...this.#data,
				event: 'role_delete',
				status
			};
			this.#appendRoleCountView(data);
			ui_analytics.sendData(data);
		}
		#appendRoleCountView(data) {
			this.#appendP(data, 'roleCountView', this.#store.getters['userGroups/shown'].size);
		}
		#appendP(data, name, value) {
			for (const pName of ['p1', 'p2', 'p3', 'p4', 'p5']) {
				if (!Object.hasOwn(data, pName)) {
					// eslint-disable-next-line no-param-reassign
					data[pName] = `${name}_${value}`;
					return;
				}
			}
		}
	}

	class AccessRightsInternalizer {
		transform(externalSource) {
			const result = new Map();
			for (const external of externalSource) {
				const internalized = this.#internalizeExternalSection(external);
				result.set(internalized.sectionCode, internalized);
			}
			return result;
		}
		#internalizeExternalSection(externalSection) {
			const internalizedSection = {
				sectionCode: main_core.Type.isStringFilled(externalSection.sectionCode) ? externalSection.sectionCode : main_core.Text.getRandom(),
				sectionTitle: String(externalSection.sectionTitle),
				sectionSubTitle: main_core.Type.isStringFilled(externalSection.sectionSubTitle) ? externalSection.sectionSubTitle : null,
				sectionHint: main_core.Type.isStringFilled(externalSection.sectionHint) ? externalSection.sectionHint : null,
				sectionIcon: this.#internalizeExternalIcon(externalSection.sectionIcon),
				rights: new Map(),
				isExpanded: true,
				isShown: true,
				action: this.#internalizeExternalSectionAction(externalSection.action)
			};
			for (const externalItem of externalSection.rights) {
				const internalizedItem = this.internalizeExternalItem(externalItem);
				internalizedSection.rights.set(internalizedItem.id, internalizedItem);
			}
			return internalizedSection;
		}
		#internalizeExternalIcon(externalIcon) {
			if (main_core.Type.isStringFilled(externalIcon?.type) && main_core.Type.isStringFilled(externalIcon?.bgColor)) {
				return {
					type: externalIcon.type,
					bgColor: externalIcon.bgColor
				};
			}
			return null;
		}
		#internalizeExternalSectionAction(externalSectionAction) {
			if (main_core.Type.isStringFilled(externalSectionAction?.buttonText)) {
				return {
					buttonText: externalSectionAction.buttonText
				};
			}
			return null;
		}
		internalizeExternalItem(externalItem) {
			const [aliases, separator] = this.#internalizeSelectedVariablesAliases(externalItem.selectedVariablesAliases);
			const normalizedItem = {
				id: String(externalItem.id),
				type: String(externalItem.type),
				title: String(externalItem.title),
				subtitle: main_core.Type.isStringFilled(externalItem.subtitle) ? externalItem.subtitle : null,
				hint: main_core.Type.isStringFilled(externalItem.hint) ? externalItem.hint : null,
				group: main_core.Type.isNil(externalItem.group) ? null : String(externalItem.group),
				groupHead: main_core.Type.isBoolean(externalItem.groupHead) ? externalItem.groupHead : false,
				isShown: true,
				minValue: this.#internalizeValueSet(externalItem.minValue),
				maxValue: this.#internalizeValueSet(externalItem.maxValue),
				defaultValue: this.#internalizeValueSet(externalItem.defaultValue),
				emptyValue: this.#internalizeValueSet(externalItem.emptyValue),
				nothingSelectedValue: this.#internalizeValueSet(externalItem.nothingSelectedValue),
				setEmptyOnSetMinMaxValueInColumn: this.#internalizeSetEmptyOnSetMinMaxValueInColumn(externalItem),
				variables: main_core.Type.isArray(externalItem.variables) || main_core.Type.isMap(externalItem.variables) ? new Map() : null,
				allSelectedCode: main_core.Type.isStringFilled(externalItem.allSelectedCode) ? externalItem.allSelectedCode : null,
				selectedVariablesAliases: aliases,
				selectedVariablesAliasesSeparator: separator,
				enableSearch: main_core.Type.isBoolean(externalItem.enableSearch) ? externalItem.enableSearch : null,
				showAvatars: main_core.Type.isBoolean(externalItem.showAvatars) ? externalItem.showAvatars : null,
				compactView: main_core.Type.isBoolean(externalItem.compactView) ? externalItem.compactView : null,
				hintTitle: main_core.Type.isStringFilled(externalItem.hintTitle) ? externalItem.hintTitle : null,
				dependentVariablesPopupHint: main_core.Type.isStringFilled(externalItem.dependentVariablesPopupHint) ? externalItem.dependentVariablesPopupHint : null,
				iconClass: main_core.Type.isStringFilled(externalItem.iconClass) ? externalItem.iconClass : null,
				isClickable: main_core.Type.isBoolean(externalItem.isClickable) ? externalItem.isClickable : false,
				isDeletable: main_core.Type.isBoolean(externalItem.isDeletable) ? externalItem.isDeletable : false,
				isNew: main_core.Type.isBoolean(externalItem.isNew) ? externalItem.isNew : false,
				isModified: main_core.Type.isBoolean(externalItem.isModified) ? externalItem.isModified : false
			};
			if (normalizedItem.groupHead || normalizedItem.group) {
				normalizedItem.isGroupExpanded = false;
			}
			if (main_core.Type.isArray(externalItem.variables)) {
				for (const variable of externalItem.variables) {
					const normalizedVariable = this.#internalizeExternalVariable(variable);
					normalizedItem.variables.set(normalizedVariable.id, normalizedVariable);
				}
			} else if (main_core.Type.isMap(externalItem.variables)) {
				for (const variable of externalItem.variables.values()) {
					const normalizedVariable = this.#internalizeExternalVariable(variable);
					normalizedItem.variables.set(normalizedVariable.id, normalizedVariable);
				}
			}
			return normalizedItem;
		}
		#internalizeSelectedVariablesAliases(externalAliases) {
			if (!main_core.Type.isPlainObject(externalAliases)) {
				return [new Map(), DEFAULT_ALIAS_SEPARATOR];
			}
			const separator = main_core.Type.isString(externalAliases.separator) ? externalAliases.separator : DEFAULT_ALIAS_SEPARATOR;
			const result = new Map();
			for (const [key, value] of Object.entries(externalAliases)) {
				if (key === 'separator') {
					continue;
				}
				result.set(normalizeAliasKey(key, separator), String(value));
			}
			return [result, separator];
		}
		#internalizeValueSet(value) {
			if (main_core.Type.isNil(value)) {
				return null;
			}
			if (main_core.Type.isArray(value)) {
				return new Set(value.map(item => String(item)));
			}
			if (main_core.Type.isSet(value)) {
				return new Set(Array.from(value, item => String(item)));
			}
			return new Set([String(value)]);
		}
		#internalizeSetEmptyOnSetMinMaxValueInColumn(externalItem) {
			const boolOrNull = x => main_core.Type.isBoolean(x) ? x : null;
			if (!main_core.Type.isUndefined(externalItem.setEmptyOnSetMinMaxValueInColumn)) {
				return boolOrNull(externalItem.setEmptyOnSetMinMaxValueInColumn);
			}

			// todo compatibility, can be removed when crm update is out
			return boolOrNull(externalItem.setEmptyOnGroupActions);
		}
		#internalizeExternalVariable(externalVariable) {
			return {
				id: String(externalVariable.id),
				title: String(externalVariable.title),
				entityId: main_core.Type.isStringFilled(externalVariable.entityId) ? externalVariable.entityId : null,
				supertitle: main_core.Type.isStringFilled(externalVariable.supertitle) ? externalVariable.supertitle : null,
				avatar: main_core.Type.isStringFilled(externalVariable.avatar) ? externalVariable.avatar : null,
				avatarOptions: main_core.Type.isPlainObject(externalVariable.avatarOptions) ? externalVariable.avatarOptions : null,
				conflictsWith: main_core.Type.isArray(externalVariable.conflictsWith) ? new Set(externalVariable.conflictsWith.map(x => String(x))) : null,
				requires: main_core.Type.isArray(externalVariable.requires) ? new Set(externalVariable.requires.map(x => String(x))) : null,
				dependant: main_core.Type.isArray(externalVariable.dependant) ? new Set(externalVariable.dependant.map(x => String(x))) : null,
				secondary: main_core.Type.isBoolean(externalVariable.secondary) ? externalVariable.secondary : null,
				hint: main_core.Type.isStringFilled(externalVariable.hint) ? externalVariable.hint : null,
				isUseGroupHeadValuesInHint: main_core.Type.isBoolean(externalVariable.isUseGroupHeadValuesInHint) ? externalVariable.isUseGroupHeadValuesInHint : false
			};
		}
	}

	class AccessRightsModel extends ui_vue3_vuex.BuilderModel {
		#initialRights = new Map();
		getName() {
			return 'accessRights';
		}
		setInitialAccessRights(rights) {
			this.#initialRights = rights;
			return this;
		}
		getState() {
			return {
				collection: main_core.Runtime.clone(this.#initialRights),
				searchQuery: '',
				deleted: new Set()
			};
		}
		getElementState(params = {}) {
			throw new Error('Cant create AccessRightSection. You are doing something wrong');
		}

		// eslint-disable-next-line max-lines-per-function
		getGetters() {
			return {
				shown: state => {
					const result = new Map();
					for (const [sectionCode, section] of state.collection) {
						if (section.isShown) {
							result.set(sectionCode, section);
						}
					}
					return result;
				},
				isMinValueSetForAny: (state, getters) => {
					for (const section of state.collection.values()) {
						for (const item of section.rights.values()) {
							const isSet = getters.isMinValueSet(section.sectionCode, item.id);
							if (isSet) {
								return true;
							}
						}
					}
					return false;
				},
				isMinValueSet: state => (sectionCode, rightId) => {
					const item = state.collection.get(sectionCode)?.rights.get(rightId);
					if (!item) {
						console.warn('ui.accessrights.v2: attempt to check if min value set for unknown right', {
							sectionCode,
							rightId
						});
						return false;
					}
					return !main_core.Type.isNil(item.minValue);
				},
				isMaxValueSetForAny: (state, getters) => {
					for (const section of state.collection.values()) {
						for (const item of section.rights.values()) {
							const isSet = getters.isMaxValueSet(section.sectionCode, item.id);
							if (isSet) {
								return true;
							}
						}
					}
					return false;
				},
				isMaxValueSet: state => (sectionCode, rightId) => {
					const item = state.collection.get(sectionCode)?.rights.get(rightId);
					if (!item) {
						console.warn('ui.accessrights.v2: attempt to check if max value set for unknown right', {
							sectionCode,
							rightId
						});
						return false;
					}
					return !main_core.Type.isNil(item.maxValue);
				},
				getEmptyValue: state => (sectionCode, valueId) => {
					const item = state.collection.get(sectionCode)?.rights.get(valueId);
					if (!item) {
						return new Set();
					}
					return ServiceLocator.getValueTypeByRight(item)?.getEmptyValue(item) ?? new Set();
				},
				getNothingSelectedValue: (state, getters) => (sectionCode, valueId) => {
					const item = state.collection.get(sectionCode)?.rights.get(valueId);
					return item?.nothingSelectedValue ?? getters.getEmptyValue(sectionCode, valueId);
				},
				getSelectedVariablesAlias: state => (sectionCode, valueId, values) => {
					const item = state.collection.get(sectionCode)?.rights.get(valueId);
					if (!item) {
						return null;
					}
					const key = compileAliasKey(values, item.selectedVariablesAliasesSeparator);
					return item.selectedVariablesAliases.get(key);
				},
				isModified: state => {
					if (state.deleted.size > 0) {
						return true;
					}
					for (const section of state.collection.values()) {
						for (const rightItem of section.rights.values()) {
							if (rightItem.isNew || rightItem.isModified) {
								return true;
							}
						}
					}
					return false;
				},
				getAccessRightItemById: state => (sectionCode, rightId) => {
					const item = state.collection.get(sectionCode)?.rights.get(rightId);
					if (!item) {
						return null;
					}
					return item;
				}
			};
		}
		getActions() {
			return {
				toggleSection: (store, {
					sectionCode
				}) => {
					if (!store.state.collection.has(sectionCode)) {
						console.warn('ui.accessrights.v2: Attempt to toggle section that dont exists', {
							sectionCode
						});
						return;
					}
					store.commit('toggleSection', {
						sectionCode
					});
				},
				expandAllSections: store => {
					for (const sectionCode of store.state.collection.keys()) {
						store.commit('expandSection', {
							sectionCode
						});
					}
				},
				collapseAllSections: store => {
					for (const sectionCode of store.state.collection.keys()) {
						store.commit('collapseSection', {
							sectionCode
						});
					}
				},
				toggleGroup: (store, {
					sectionCode,
					groupId
				}) => {
					const item = store.state.collection.get(sectionCode)?.rights.get(groupId);
					if (!item) {
						console.warn('ui.accessrights.v2: Attempt to toggle group that dont exists', {
							groupId
						});
						return;
					}
					if (!item.groupHead) {
						console.warn('ui.accessrights.v2: Attempt to toggle group that is not group head', {
							groupId
						});
						return;
					}
					store.commit('toggleGroup', {
						sectionCode,
						groupId
					});
				},
				search: (store, payload) => {
					this.#searchAction(store, payload);
				},
				addRight: (store, {
					sectionCode,
					right
				}) => {
					if (!store.state.collection.has(sectionCode)) {
						console.warn('ui.accessrights.v2: Adding right to section that doesn`t exists', {
							sectionCode
						});
						return;
					}
					const section = store.state.collection.get(sectionCode);
					if (section) {
						const internalRight = new AccessRightsInternalizer().internalizeExternalItem(right);
						store.commit('expandSection', {
							sectionCode
						});
						store.commit('addRight', {
							sectionCode,
							right: internalRight
						});
					}
				},
				updateRightTitle: (store, {
					sectionCode,
					rightId,
					rightTitle
				}) => {
					if (!store.state.collection.has(sectionCode)) {
						console.warn('ui.accessrights.v2: Updating right in section that doesn`t exists', {
							sectionCode
						});
						return;
					}
					const section = store.state.collection.get(sectionCode);
					if (!section.rights.has(rightId)) {
						console.warn('ui.accessrights.v2: Updating right that doesn`t exists', {
							rightId
						});
						return;
					}
					store.commit('expandSection', {
						sectionCode
					});
					store.commit('setRightTitle', {
						sectionCode,
						rightId,
						title: rightTitle
					});
				},
				updateRightSubtitle: (store, {
					sectionCode,
					rightId,
					rightSubtitle
				}) => {
					if (!store.state.collection.has(sectionCode)) {
						console.warn('ui.accessrights.v2: Updating right in section that doesn`t exists', {
							sectionCode
						});
						return;
					}
					const section = store.state.collection.get(sectionCode);
					if (!section.rights.has(rightId)) {
						console.warn('ui.accessrights.v2: Updating right that doesn`t exists', {
							rightId
						});
						return;
					}
					store.commit('expandSection', {
						sectionCode
					});
					store.commit('setRightSubtitle', {
						sectionCode,
						rightId,
						subtitle: rightSubtitle
					});
				},
				deleteRight: (store, {
					sectionCode,
					rightId
				}) => {
					if (!store.state.collection.has(sectionCode)) {
						console.warn('ui.accessrights.v2: Deleting right in section that doesn`t exists', {
							sectionCode
						});
						return;
					}
					const section = store.state.collection.get(sectionCode);
					if (!section.rights.has(rightId)) {
						console.warn('ui.accessrights.v2: Deleting right that doesn`t exists', {
							rightId
						});
						return;
					}
					store.commit('expandSection', {
						sectionCode
					});
					store.commit('deleteRight', {
						sectionCode,
						rightId
					});
				},
				markRightAsModified: (store, {
					sectionCode,
					rightId,
					isModified
				}) => {
					if (!store.state.collection.has(sectionCode)) {
						console.warn('ui.accessrights.v2: Updating right in section that doesn`t exists', {
							sectionCode
						});
						return;
					}
					const section = store.state.collection.get(sectionCode);
					if (!section.rights.has(rightId)) {
						console.warn('ui.accessrights.v2: Updating right that doesn`t exists', {
							rightId
						});
						return;
					}
					store.commit('expandSection', {
						sectionCode
					});
					store.commit('markRightAsModified', {
						sectionCode,
						rightId,
						isModified
					});
				}
			};
		}
		#searchAction(store, {
			query
		}) {
			if (!main_core.Type.isString(query)) {
				console.warn('ui.accessrights.v2: attempt to search with non-string search query');
				return;
			}
			store.commit('setSearchQuery', {
				query
			});
			if (query === '') {
				store.commit('showAll');
				return;
			}
			store.commit('hideAll');
			const lowerQuery = query.toLowerCase();
			for (const section of store.state.collection.values()) {
				if (section.sectionTitle.toLowerCase().includes(lowerQuery) || section.sectionSubTitle?.toLowerCase().includes(lowerQuery)) {
					store.commit('showSection', {
						sectionCode: section.sectionCode
					});
					continue;
				}
				for (const item of section.rights.values()) {
					if (!item.title.toLowerCase().includes(lowerQuery)) {
						continue;
					}
					if (item.groupHead) {
						store.commit('showGroup', {
							sectionCode: section.sectionCode,
							groupId: item.id
						});
					} else {
						store.commit('showItem', {
							sectionCode: section.sectionCode,
							itemId: item.id
						});
						if (item.group) {
							store.commit('expandGroup', {
								sectionCode: section.sectionCode,
								groupId: item.group
							});
						}
					}
				}
			}
		}

		// eslint-disable-next-line max-lines-per-function
		getMutations() {
			return {
				addRight: (state, {
					sectionCode,
					right
				}) => {
					const section = state.collection.get(sectionCode);
					section.rights.set(right.id, right);
				},
				setRightTitle: (state, {
					sectionCode,
					rightId,
					title
				}) => {
					const section = state.collection.get(sectionCode);
					section.rights.get(rightId).title = title;
				},
				setRightSubtitle: (state, {
					sectionCode,
					rightId,
					subtitle
				}) => {
					const section = state.collection.get(sectionCode);
					section.rights.get(rightId).subtitle = subtitle;
				},
				deleteRight: (state, {
					sectionCode,
					rightId
				}) => {
					const section = state.collection.get(sectionCode);
					section.rights.delete(rightId);
					state.deleted.add(rightId);
				},
				markRightAsModified: (state, {
					sectionCode,
					rightId,
					isModified
				}) => {
					const section = state.collection.get(sectionCode);
					section.rights.get(rightId).isModified = isModified;
				},
				toggleSection: (state, {
					sectionCode
				}) => {
					const section = state.collection.get(sectionCode);
					section.isExpanded = !section.isExpanded;
				},
				expandSection: (state, {
					sectionCode
				}) => {
					const section = state.collection.get(sectionCode);
					section.isExpanded = true;
				},
				collapseSection: (state, {
					sectionCode
				}) => {
					const section = state.collection.get(sectionCode);
					section.isExpanded = false;
				},
				toggleGroup: (state, {
					sectionCode,
					groupId
				}) => {
					const section = state.collection.get(sectionCode);
					for (const item of section.rights.values()) {
						if (item.id === groupId && item.groupHead || item.group === groupId) {
							item.isGroupExpanded = !item.isGroupExpanded;
						}
					}
				},
				expandGroup: (state, {
					sectionCode,
					groupId
				}) => {
					const section = state.collection.get(sectionCode);
					section.isExpanded = true;
					for (const item of section.rights.values()) {
						if (item.id === groupId && item.groupHead || item.group === groupId) {
							item.isGroupExpanded = true;
						}
					}
				},
				showItem: (state, {
					sectionCode,
					itemId
				}) => {
					const section = state.collection.get(sectionCode);
					section.isShown = true;
					const item = section.rights.get(itemId);
					item.isShown = true;
					if (item.group) {
						section.rights.get(item.group).isShown = true;
					}
				},
				showGroup: (state, {
					sectionCode,
					groupId
				}) => {
					const section = state.collection.get(sectionCode);
					section.isShown = true;
					for (const item of section.rights.values()) {
						if (item.id === groupId && item.groupHead || item.group === groupId) {
							item.isShown = true;
						}
					}
				},
				showSection: (state, {
					sectionCode
				}) => {
					const section = state.collection.get(sectionCode);
					section.isShown = true;
					for (const item of section.rights.values()) {
						item.isShown = true;
					}
				},
				showAll: state => {
					for (const section of state.collection.values()) {
						section.isShown = true;
						for (const item of section.rights.values()) {
							item.isShown = true;
						}
					}
				},
				hideAll: state => {
					for (const section of state.collection.values()) {
						section.isShown = false;
						for (const item of section.rights.values()) {
							item.isShown = false;
						}
					}
				},
				setSearchQuery: (state, {
					query
				}) => {
					// eslint-disable-next-line no-param-reassign
					state.searchQuery = String(query);
				}
			};
		}
	}

	const ACTION_SAVE = 'save';
	const MODE = 'ajax';
	const BODY_TYPE = 'data';
	class ApplicationModel extends ui_vue3_vuex.BuilderModel {
		#guid;
		#options;
		getName() {
			return 'application';
		}
		setOptions(options) {
			this.#options = options;
			return this;
		}
		setGuid(guid) {
			this.#guid = guid;
			return this;
		}
		getState() {
			return {
				options: this.#options,
				guid: this.#guid,
				isProgress: false
			};
		}
		getGetters() {
			return {
				isMaxVisibleUserGroupsSet: state => {
					return state.options.maxVisibleUserGroups > 0;
				},
				isModified: (state, getters, rootState, rootGetters) => {
					return rootGetters['userGroups/isModified'] || rootGetters['accessRights/isModified'];
				},
				guid: state => {
					return state.guid;
				},
				additionalMembersParams: state => {
					return state.options.additionalMembersParams;
				}
			};
		}
		getMutations() {
			return {
				setProgress: (state, isProgress) => {
					// eslint-disable-next-line no-param-reassign
					state.isProgress = Boolean(isProgress);
				}
			};
		}
	}

	function createStore(options, userGroups, accessRights, appGuid, userGroupsOption) {
		const sortConfig = userGroupsOption.sortConfig ?? {};
		const selectedMember = userGroupsOption.selectedMember ?? {};
		const userGroupsModel = UserGroupsModel.create().setInitialUserGroups(userGroups).setSortConfig(sortConfig).setSelectedMember(selectedMember);
		const accessRightsModel = AccessRightsModel.create().setInitialAccessRights(accessRights);
		const {
			store
		} = ui_vue3_vuex.Builder.init().addModel(ApplicationModel.create().setOptions(options).setGuid(appGuid)).addModel(accessRightsModel).addModel(userGroupsModel).syncBuild();
		return {
			store,
			resetState: () => {
				userGroupsModel.clearState();
				accessRightsModel.clearState();
				main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:onResetState', {
					guid: appGuid
				});
			},
			userGroupsModel,
			accessRightsModel
		};
	}

	class AccessRightsExporter {
		transform(source, appGuid) {
			const result = [];
			for (const accessRightSection of source.values()) {
				for (const accessRight of accessRightSection.rights.values()) {
					const data = {
						id: accessRight.id,
						name: accessRight.title,
						additionalRightData: {}
					};
					const eventResults = main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:additionalRightData', {
						guid: appGuid,
						right: accessRight
					});
					for (const eventResult of eventResults) {
						data.additionalRightData = {
							...data.additionalRightData,
							...eventResult.getData()?.additionalRightData
						};
					}
					result.push(data);
				}
			}
			return result;
		}
	}

	/**
	 * @abstract
	 */
	class BaseUserGroupsExporter {
		transform(source) {
			const result = [];
			for (const userGroup of source.values()) {
				result.push({
					id: userGroup.id.startsWith(NEW_USER_GROUP_ID_PREFIX) ? '0' : userGroup.id,
					title: userGroup.title,
					accessCodes: this.#transformAccessCodes(userGroup.members),
					accessRights: this.#transformAccessRightValues(userGroup)
				});
			}
			return result;
		}
		#transformAccessCodes(members) {
			const result = {};
			for (const [accessCode, member] of members) {
				result[accessCode] = member.type;
			}
			return result;
		}
		#transformAccessRightValues(userGroup) {
			const result = [];
			for (const accessRightValue of userGroup.accessRights.values()) {
				if (!this.shouldBeIncludedInExport(userGroup, accessRightValue)) {
					continue;
				}
				for (const singleValue of accessRightValue.values) {
					result.push({
						id: accessRightValue.id,
						value: singleValue
					});
				}
			}
			return result;
		}

		/**
		 * @abstract
		 * @protected
		 */
		shouldBeIncludedInExport(userGroup, accessRightValue) {
			throw new Error('Not implemented');
		}
	}

	class AllUserGroupsExporter extends BaseUserGroupsExporter {
		shouldBeIncludedInExport(userGroup, accessRightValue) {
			return true;
		}
	}

	class OnlyChangedUserGroupsExporter extends BaseUserGroupsExporter {
		shouldBeIncludedInExport(userGroup, accessRightValue) {
			return userGroup.isNew || accessRightValue.isModified;
		}
	}

	class ApplicationInternalizer {
		// noinspection OverlyComplexFunctionJS
		transform(externalSource) {
			// freeze tells vue that we don't need reactivity on this state
			// and prevents accidental modification as well
			return this.#deepFreeze({
				component: String(externalSource.component),
				actionSave: main_core.Type.isStringFilled(externalSource.actionSave) ? externalSource.actionSave : ACTION_SAVE,
				mode: main_core.Type.isStringFilled(externalSource.mode) ? externalSource.mode : MODE,
				bodyType: main_core.Type.isStringFilled(externalSource.bodyType) ? externalSource.bodyType : BODY_TYPE,
				additionalSaveParams: main_core.Type.isPlainObject(externalSource.additionalSaveParams) ? externalSource.additionalSaveParams : [],
				isSaveOnlyChangedRights: main_core.Type.isBoolean(externalSource.isSaveOnlyChangedRights) ? externalSource.isSaveOnlyChangedRights : false,
				maxVisibleUserGroups: main_core.Type.isInteger(externalSource.maxVisibleUserGroups) ? externalSource.maxVisibleUserGroups : null,
				searchContainerSelector: main_core.Type.isStringFilled(externalSource.searchContainerSelector) ? externalSource.searchContainerSelector : null,
				additionalMembersParams: main_core.Type.isPlainObject(externalSource.additionalMembersParams) ? {
					addUserGroupsProviderTab: Boolean(externalSource.additionalMembersParams?.addUserGroupsProviderTab ?? false),
					addProjectsProviderTab: Boolean(externalSource.additionalMembersParams?.addProjectsProviderTab ?? true),
					addStructureTeamsProviderTab: Boolean(externalSource.additionalMembersParams?.addStructureTeamsProviderTab ?? false),
					useStructureDepartmentsProviderTab: Boolean(externalSource.additionalMembersParams?.useStructureDepartmentsProviderTab ?? false),
					addStructureRolesProviderTab: Boolean(externalSource.additionalMembersParams?.addStructureRolesProviderTab ?? false)
				} : {
					addUserGroupsProviderTab: false,
					addProjectsProviderTab: true,
					addStructureTeamsProviderTab: false,
					useStructureDepartmentsProviderTab: false,
					addStructureRolesProviderTab: false
				},
				userSortConfigName: String(externalSource.userSortConfigName ?? externalSource.component),
				isSaveAccessRightsList: main_core.Type.isBoolean(externalSource.isSaveAccessRightsList) ? externalSource.isSaveAccessRightsList : false,
				moduleId: main_core.Type.isString(externalSource.moduleId) ? externalSource.moduleId : ''
			});
		}
		#deepFreeze(target) {
			if (main_core.Type.isObject(target)) {
				Object.values(target).forEach(value => {
					this.#deepFreeze(value);
				});
				return Object.freeze(target);
			}
			return target;
		}
	}

	class UserGroupsInternalizer {
		#maxVisibleUserGroups = null;
		constructor(maxVisibleUserGroups) {
			if (main_core.Type.isInteger(maxVisibleUserGroups)) {
				this.#maxVisibleUserGroups = maxVisibleUserGroups;
			}
		}
		transform(externalSource) {
			const result = new Map();
			for (const externalGroup of externalSource) {
				const internalGroup = this.#internalizeExternalGroup(externalGroup);
				result.set(internalGroup.id, internalGroup);
			}
			return result;
		}
		#internalizeExternalGroup(externalGroup) {
			const internalizedGroup = {
				id: String(externalGroup.id),
				isNew: false,
				isModified: false,
				title: String(externalGroup.title),
				accessRights: new Map(),
				members: new Map()
			};
			for (const externalValue of externalGroup.accessRights) {
				const internalizedValue = this.#internalizeExternalAccessRightsValue(externalValue);
				if (internalizedGroup.accessRights.has(internalizedValue.id)) {
					for (const previousValue of internalizedGroup.accessRights.get(internalizedValue.id).values) {
						internalizedValue.values.add(previousValue);
					}
				}
				internalizedGroup.accessRights.set(internalizedValue.id, internalizedValue);
			}
			for (const [accessCode, externalMember] of Object.entries(externalGroup.members)) {
				const internalizedAccessCode = this.#internalizeExternalAccessCode(accessCode);
				internalizedGroup.members.set(internalizedAccessCode, this.#internalizeExternalMember(externalMember));
			}
			return internalizedGroup;
		}
		#internalizeExternalAccessRightsValue(externalAccessRightsValue) {
			const valueId = String(externalAccessRightsValue.id);
			const internalized = {
				id: valueId,
				isModified: false
			};
			const values = main_core.Type.isArray(externalAccessRightsValue.value) ? externalAccessRightsValue.value : [externalAccessRightsValue.value];
			internalized.values = new Set(values.map(x => String(x)));
			return internalized;
		}
		#internalizeExternalAccessCode(accessCode) {
			let stringAccessCode = String(accessCode);
			if (/^IU(\d+)$/.test(stringAccessCode)) {
				// `IU` and `U` are basically the same in this extension. differentiation between them is not supported
				// for data consistency, force `U`
				stringAccessCode = stringAccessCode.replace('IU', 'U');
			}
			return stringAccessCode;
		}
		#internalizeExternalMember(externalMember) {
			return {
				id: String(externalMember.id),
				type: main_core.Type.isStringFilled(externalMember.type) ? externalMember.type : null,
				name: main_core.Type.isStringFilled(externalMember.name) ? externalMember.name : null,
				avatar: main_core.Type.isStringFilled(externalMember.avatar) ? externalMember.avatar : null
			};
		}
	}

	class ShownUserGroupsCopier {
		#srcUserGroups;
		#maxVisibleUserGroups = null;
		#sortConfig;
		constructor(srcUserGroups, maxVisibleUserGroups, sortConfig) {
			this.#srcUserGroups = srcUserGroups;
			if (main_core.Type.isInteger(maxVisibleUserGroups)) {
				this.#maxVisibleUserGroups = maxVisibleUserGroups;
			}
			this.#sortConfig = sortConfig;
		}

		/**
		 * WARNING! Mutates `externalSource`. Src is not copied for perf reasons, since we don't need it functionally
		 */
		transform(externalSource) {
			for (const [userGroupId, userGroup] of externalSource) {
				const srcUserGroup = this.#srcUserGroups.get(userGroupId);
				if (!srcUserGroup) {
					// likely it's a just created user group
					this.#addUserGroupInSortConfig(userGroup);
				}
			}
			return externalSource;
		}
		#addUserGroupInSortConfig(userGroup) {
			const updateUserSortConfig = userId => {
				if (!this.#sortConfig[userId]) {
					return;
				}
				const values = Object.values(this.#sortConfig[userId]);
				const maxSortValue = values.length > 0 ? Math.max(...values) : 0;
				this.#sortConfig[userId][userGroup.id] = maxSortValue + 1;
			};
			for (const [memberId] of userGroup.members) {
				updateUserSortConfig(memberId);
			}
			updateUserSortConfig(SELECTED_ALL_USER_ID);
		}
		getSortConfig() {
			return this.#sortConfig;
		}
	}

	/**
	 * @memberOf BX.UI.AccessRights.V2
	 */
	class App {
		#options = {};
		#renderTo;
		#buttonPanel;
		#guid;
		#isUserConfirmedClose = false;
		#handleSliderClose;
		#app;
		#rootComponent;
		#store;
		#resetState;
		#unwatch;
		#userGroupsModel;
		#accessRightsModel;
		#analyticsManager;
		#selectedMember;
		#sortConfigForAllUserGroups;
		#confirmationPopup = null;
		constructor(options) {
			this.#options = options || {};
			this.#renderTo = this.#getRenderTo();
			this.#buttonPanel = BX.UI.ButtonPanel || null;
			this.#sortConfigForAllUserGroups = options.sortConfigForAllUserGroups;
			this.#selectedMember = options.selectedMember;
			this.#options.userSortConfigName = options.userSortConfigName ?? options.component;
			this.#guid = main_core.Text.getRandom(16);
			this.#bindEvents();
		}
		#getRenderTo() {
			if (main_core.Type.isElementNode(this.#options.renderTo)) {
				return this.#options.renderTo;
			}
			return document.getElementById(this.#options.renderToContainerId);
		}
		#bindEvents() {
			this.#handleSliderClose = event => {
				const [sliderEvent] = event.getData();
				const isSliderBelongsToThisApp = BX.SidePanel?.Instance?.getSliderByWindow(window) === sliderEvent?.getSlider();
				if (!isSliderBelongsToThisApp) {
					return;
				}
				this.#confirmBeforeClosingModifiedSlider(sliderEvent);
			};
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', this.#handleSliderClose);
		}
		#unbindEvents() {
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onClose', this.#handleSliderClose);
			this.#handleSliderClose = null;
		}
		fireEventReset() {
			const box = ui_dialogs_messagebox.MessageBox.create({
				message: main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_MODIFIED_CANCEL_WARNING'),
				modal: true,
				buttons: [new ui_buttons.Button({
					color: ui_buttons.ButtonColor.PRIMARY,
					size: ui_buttons.ButtonSize.SMALL,
					text: main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_MODIFIED_CANCEL_YES_CANCEL'),
					onclick: () => {
						this.#analyticsManager.onCancelChanges();
						this.#resetState();
						box.close();
					},
					useAirDesign: true
				}), new ui_buttons.Button({
					color: ui_buttons.ButtonColor.LINK,
					size: ui_buttons.ButtonSize.SMALL,
					text: main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_MODIFIED_CANCEL_NO_CANCEL'),
					onclick: () => {
						box.close();
					},
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.OUTLINE
				})],
				useAirDesign: true
			});
			box.show();
		}
		#tryShowFeaturePromoter(response) {
			if (!main_core.Type.isArrayFilled(response?.errors)) {
				return false;
			}
			for (const error of response.errors) {
				if (main_core.Type.isStringFilled(error?.customData?.sliderCode)) {
					main_core.Runtime.loadExtension('ui.info-helper').then(({
						FeaturePromotersRegistry
					}) => {
						/** @see BX.UI.FeaturePromotersRegistry */
						FeaturePromotersRegistry.getPromoter({
							code: error.customData.sliderCode
						}).show();
					}).catch(loadError => {
						console.error('ui.accessrights.v2: could not load ui.info-helper', loadError);
					});
					return true;
				}
			}
			return false;
		}
		#showNotification(title) {
			BX.UI.Notification.Center.notify({
				content: title,
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		sendActionRequest() {
			return new Promise((resolve, reject) => {
				if (this.#store.state.application.isProgress || !this.#store.getters['application/isModified']) {
					resolve();
					return;
				}
				this.#store.commit('application/setProgress', true);
				this.#runSaveAjaxRequest().then(({
					userGroups,
					accessRights,
					sortConfig
				}) => {
					this.#analyticsManager.onSaveSuccess();
					this.#userGroupsModel.setInitialUserGroups(userGroups).setSortConfig(sortConfig).setSelectedMember(this.getSelectedMember());
					if (accessRights) {
						this.#accessRightsModel.setInitialAccessRights(accessRights);
					}
					const guid = this.#guid;
					main_core_events.EventEmitter.emit('BX.UI.AccessRights.V2:afterSave', {
						userGroups,
						accessRights,
						guid
					});

					// reset modification flags and stuff
					this.#resetState();
					this.#saveUserSortConfig(sortConfig[SELECTED_ALL_USER_ID]);
					this.#showNotification(main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SETTINGS_HAVE_BEEN_SAVED'));
				}).catch(response => {
					this.#analyticsManager.onSaveError(response);
					console.warn('ui.accessrights.v2: error during save', response);
					if (this.#tryShowFeaturePromoter(response)) {
						reject(response);
						return;
					}
					this.#showNotification(response?.errors?.[0]?.message || 'Something went wrong');
					main_core_events.EventEmitter.emit('ui:accessRights:v2:onSaveError', {
						response
					});
					reject(response);
				}).finally(() => {
					const waitContainer = this.#buttonPanel?.getContainer().querySelector('.ui-btn-wait');
					main_core.Dom.removeClass(waitContainer, 'ui-btn-wait');
					this.#store.commit('application/setProgress', false);
					resolve();
				});
			});
		}
		#saveUserSortConfig(userSortConfig) {
			if (!main_core.Type.isObject(userSortConfig)) {
				return;
			}
			const userGroups = this.#store.state.userGroups.collection;
			const validUserSortConfig = {};
			for (const [groupId, sortValue] of Object.entries(userSortConfig)) {
				if (userGroups.has(groupId)) {
					validUserSortConfig[groupId] = sortValue;
				}
			}
			this.#sortConfigForAllUserGroups = validUserSortConfig;
			return saveSortConfigForAllUserGroups(this.#options.userSortConfigName, this.#sortConfigForAllUserGroups);
		}
		#runSaveAjaxRequest() {
			const internalUserGroups = this.#store.state.userGroups.collection;
			let userGroups = null;
			if (this.#store.state.application.options.isSaveOnlyChangedRights) {
				userGroups = new OnlyChangedUserGroupsExporter().transform(internalUserGroups);
			} else {
				userGroups = new AllUserGroupsExporter().transform(internalUserGroups);
			}
			const bodyType = this.#store.state.application.options.bodyType;
			let accessRights = null;
			let deletedAccessRights = null;
			if (this.#store.state.application.options.isSaveAccessRightsList) {
				accessRights = new AccessRightsExporter().transform(this.#store.state.accessRights.collection, this.#guid);
				deletedAccessRights = [...this.#store.state.accessRights.deleted.values()];
			}

			// wrap ajax in native promise
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction(this.#store.state.application.options.component, this.#store.state.application.options.actionSave, {
					mode: this.#store.state.application.options.mode,
					[bodyType]: {
						userGroups,
						deletedUserGroups: [...this.#store.state.userGroups.deleted.values()],
						parameters: this.#store.state.application.options.additionalSaveParams,
						accessRights,
						deletedAccessRights
					}
				}).then(response => {
					const maxVisibleUserGroups = this.#store.state.application.options.maxVisibleUserGroups;
					const sortConfig = this.#store.state.userGroups.sortConfig;
					const newUserGroups = new UserGroupsInternalizer(maxVisibleUserGroups).transform(response.data.USER_GROUPS);
					const transformer = new ShownUserGroupsCopier(internalUserGroups, maxVisibleUserGroups, sortConfig);
					transformer.transform(newUserGroups);
					const newSortConfig = transformer.getSortConfig();
					let newAccessRights = null;
					if (response.data.ACCESS_RIGHTS) {
						newAccessRights = new AccessRightsInternalizer().transform(response.data.ACCESS_RIGHTS);
					}
					resolve({
						userGroups: newUserGroups,
						sortConfig: newSortConfig,
						accessRights: newAccessRights
					});
				}).catch(reject);
			});
		}
		#confirmBeforeClosingModifiedSlider(sliderEvent) {
			if (!this.#store.getters['application/isModified'] || this.#isUserConfirmedClose) {
				return;
			}
			sliderEvent.denyAction();
			if (this.#confirmationPopup && this.#confirmationPopup.getPopupWindow().isShown()) {
				return;
			}
			this.#confirmationPopup = ui_dialogs_messagebox.MessageBox.create({
				mediumButtonSize: false,
				title: main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_MODIFIED_CLOSE_WARNING_TITLE'),
				message: main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_MODIFIED_CLOSE_WARNING'),
				modal: true,
				buttons: [new ui_buttons.Button({
					color: ui_buttons.ButtonColor.PRIMARY,
					size: ui_buttons.ButtonSize.SMALL,
					text: main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_MODIFIED_CLOSE_YES_CLOSE'),
					onclick: () => {
						this.#analyticsManager.onCloseWithoutSave();
						this.#isUserConfirmedClose = true;
						this.#confirmationPopup.close();
						this.#confirmationPopup = null;
						setTimeout(() => {
							sliderEvent.getSlider().close();
						});
					},
					useAirDesign: true
				}), new ui_buttons.CancelButton({
					size: ui_buttons.ButtonSize.SMALL,
					style: ui_buttons.AirButtonStyle.OUTLINE,
					text: main_core.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_CANCEL'),
					onclick: () => {
						this.#confirmationPopup.close();
						this.#confirmationPopup = null;
					},
					useAirDesign: true
				})],
				popupOptions: {
					fixed: true
				},
				useAirDesign: true
			});
			this.#confirmationPopup.show();
		}
		#getSortConfigForAllUserGroups() {
			if (this.#sortConfigForAllUserGroups) {
				return Promise.resolve(this.#sortConfigForAllUserGroups);
			}
			return new Promise(resolve => {
				main_core.ajax.runAction('ui.accessrights.getUserSortConfig', {
					data: {
						name: this.#options.userSortConfigName
					}
				}).then(response => resolve(response.data ? {
					...response.data
				} : null)).catch(() => resolve(null));
			});
		}
		draw() {
			const loader = new main_loader.Loader({
				target: this.#renderTo
			});
			loader.show();
			this.#getSortConfigForAllUserGroups().then(result => {
				this.#sortConfigForAllUserGroups = result;
			}).catch(() => {
				this.#sortConfigForAllUserGroups = null;
			}).finally(() => {
				const applicationOptions = new ApplicationInternalizer().transform(this.#options);
				const userGroupsOptions = {
					sortConfig: {},
					selectedMember: this.#selectedMember
				};
				if (main_core.Type.isObject(this.#sortConfigForAllUserGroups)) {
					userGroupsOptions.sortConfig[SELECTED_ALL_USER_ID] = this.#sortConfigForAllUserGroups;
				}
				const {
					store,
					resetState,
					userGroupsModel,
					accessRightsModel
				} = createStore(applicationOptions, new UserGroupsInternalizer(applicationOptions.maxVisibleUserGroups).transform(this.#options.userGroups), new AccessRightsInternalizer().transform(this.#options.accessRights), this.#guid, userGroupsOptions);
				this.#store = store;
				this.#resetState = resetState;
				this.#userGroupsModel = userGroupsModel;
				this.#accessRightsModel = accessRightsModel;
				this.#unwatch = this.#store.watch((state, getters) => getters['application/isModified'], newValue => {
					if (newValue) {
						this.#buttonPanel?.show();
					} else {
						this.#buttonPanel?.hide();
					}
				});
				this.#app = ui_vue3.BitrixVue.createApp(Grid);
				this.#app.use(this.#store);
				loader.hide();
				main_core.Dom.clean(this.#renderTo);
				this.#rootComponent = this.#app.mount(this.#renderTo);
				this.#analyticsManager = new AnalyticsManager(this.#store, this.#options.analytics);
			});
		}
		destroy() {
			this.#analyticsManager = null;
			this.#app.unmount();
			this.#app = null;
			this.#unbindEvents();
			this.#unwatch();
			this.#unwatch = null;
			this.#store = null;
			this.#resetState = null;
			this.#userGroupsModel = null;
			this.#options = null;
			this.#buttonPanel = null;
			main_core.Dom.clean(this.#renderTo);
			this.#renderTo = null;
			if (this.#confirmationPopup) {
				this.#confirmationPopup.close();
				this.#confirmationPopup.getPopupWindow().destroy();
				this.#confirmationPopup = null;
			}
		}
		hasUnsavedChanges() {
			return !(!this.#store.getters['application/isModified'] || this.#isUserConfirmedClose);
		}
		scrollToSection(sectionCode) {
			this.#rootComponent.scrollToSection(sectionCode);
		}
		getSelectedMember() {
			return this.#store.state.userGroups.selectedMember;
		}
		getGuid() {
			return this.#guid;
		}
	}

	exports.App = App;

})(this.BX.UI.AccessRights.V2 = this.BX.UI.AccessRights.V2 || {}, BX, BX.Event, BX.UI, BX.UI.Dialogs, BX.Vue3, BX.Vue3.Vuex, BX.UI.EntitySelector, BX.Main, BX.UI.Vue3.Components, BX.UI.AccessRights.V2, BX.Vue3.Directives, BX.UI.System.Chip.Vue, BX, window, BX.UI.Vue3.Components, BX.UI.IconSet, BX.UI.Vue3.Components, BX.UI, BX.UI, BX, BX.UI.Analytics, BX);
//# sourceMappingURL=v2.bundle.js.map
