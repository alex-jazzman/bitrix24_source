/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_system_dialog, ui_vue3, ui_vue3_pinia, ui_a11y, ui_iconSet_api_core, ui_notificationPanel, ui_iconSet_main, ui_system_typography_vue, ui_vue3_components_avatar, ui_vue3_components_button, ui_entitySelector, ui_system_menu_vue) {
	'use strict';

	const StubAvatarPath = new Set(['/bitrix/images/disk/default_avatar.png', '/bitrix/images/disk/default_groupe.png']);
	function mapOwnerToModel(owner) {
		return {
			name: owner.name,
			avatar: StubAvatarPath.has(owner.avatar) ? '' : owner.avatar,
			link: owner.link
		};
	}
	function mapMembersToModel(members) {
		return members.map(member => {
			return {
				sharingId: main_core.Type.isNil(member.sharingId) ? null : main_core.Text.toNumber(member.sharingId),
				entityId: member.entityId,
				name: member.name,
				right: member.right,
				avatar: member.avatar,
				url: main_core.Type.isStringFilled(member.url) ? member.url : null,
				type: member.type
			};
		});
	}
	function mapDraftToEntityToNewShared(draft) {
		const entityToNewShared = {};
		draft.members.forEach(member => {
			entityToNewShared[member.entityId] = {
				item: {
					id: member.entityId,
					name: member.name,
					avatar: member.avatar
				},
				type: member.type,
				right: member.right
			};
		});
		return entityToNewShared;
	}

	const SharingControlType = Object.freeze({
		WithoutEdit: 'without-edit',
		WithChangeRights: 'with-change-rights',
		WithSharing: 'with-sharing',
		BlockedByFeature: 'blocked-by-feature'
	});
	const NoSharingModePermission = Object.freeze({
		canChangeMembers: false,
		canAddMembers: false,
		canSave: false,
		locksLoadedMembers: false,
		limitsRightsByMaxRight: false
	});
	const SharingModePermissionByMode = Object.freeze({
		[SharingControlType.WithoutEdit]: Object.freeze({
			canChangeMembers: false,
			canAddMembers: false,
			canSave: false,
			locksLoadedMembers: false,
			limitsRightsByMaxRight: false
		}),
		[SharingControlType.WithChangeRights]: Object.freeze({
			canChangeMembers: true,
			canAddMembers: true,
			canSave: true,
			locksLoadedMembers: false,
			limitsRightsByMaxRight: false
		}),
		[SharingControlType.WithSharing]: Object.freeze({
			canChangeMembers: true,
			canAddMembers: true,
			canSave: true,
			locksLoadedMembers: true,
			limitsRightsByMaxRight: true
		})
	});
	const SharingRight = Object.freeze({
		Read: 'disk_access_read',
		Add: 'disk_access_add',
		Edit: 'disk_access_edit',
		Full: 'disk_access_full'
	});
	const SharingRightInfo = Object.freeze({
		[SharingRight.Read]: {
			weight: 2,
			phraseCode: 'JS_DISK_SHARING_MEMBERS_POPUP_RIGHT_READ'
		},
		[SharingRight.Add]: {
			weight: 3,
			phraseCode: 'JS_DISK_SHARING_MEMBERS_POPUP_RIGHT_ADD'
		},
		[SharingRight.Edit]: {
			weight: 4,
			phraseCode: 'JS_DISK_SHARING_MEMBERS_POPUP_RIGHT_EDIT'
		},
		[SharingRight.Full]: {
			weight: 5,
			phraseCode: 'JS_DISK_SHARING_MEMBERS_POPUP_RIGHT_FULL'
		}
	});
	const SharingRightList = Object.freeze(Object.keys(SharingRightInfo));
	const UnknownRightWeight = -1;
	const DefaultSharingRight = SharingRight.Edit;

	const ajaxUrl = '/bitrix/components/bitrix/disk.folder.list/ajax.php';
	const readActionByMode = Object.freeze({
		[SharingControlType.WithoutEdit]: 'showSharingDetail',
		[SharingControlType.WithChangeRights]: 'showSharingDetailChangeRights',
		[SharingControlType.WithSharing]: 'showSharingDetailAppendSharing'
	});
	const saveActionByMode = Object.freeze({
		[SharingControlType.WithChangeRights]: 'changeSharingAndRights',
		[SharingControlType.WithSharing]: 'appendSharing'
	});
	function getLastErrorMessage(errors) {
		const message = main_core.Type.isArrayFilled(errors) ? errors[errors.length - 1]?.message : '';
		return main_core.Type.isStringFilled(message) ? message : '';
	}
	function toResult(response) {
		if (!main_core.Type.isPlainObject(response)) {
			return {
				status: 'error',
				errorMessage: ''
			};
		}
		const raw = response;
		if (raw.status === 'success') {
			return {
				status: 'success',
				data: response
			};
		}
		if (raw.status === 'denied') {
			return {
				status: 'denied',
				errorMessage: main_core.Type.isStringFilled(raw.message) ? raw.message : ''
			};
		}
		return {
			status: 'error',
			errorMessage: getLastErrorMessage(raw.errors)
		};
	}
	class SharingService {
		load(mode, objectId) {
			return this.#request(readActionByMode[mode], {
				objectId
			});
		}
		save(mode, objectId, entityToNewShared) {
			return this.#request(saveActionByMode[mode], {
				objectId,
				entityToNewShared
			});
		}
		async #request(action, data) {
			try {
				const response = await main_core.ajax.promise({
					url: `${ajaxUrl}?action=${action}`,
					method: 'POST',
					dataType: 'json',
					data: {
						...data,
						sessid: main_core.Loc.getMessage('bitrix_sessid'),
						SITE_ID: main_core.Loc.getMessage('SITE_ID')
					}
				});
				return toResult(response);
			} catch {
				return {
					status: 'error',
					errorMessage: ''
				};
			}
		}
	}
	const sharingService = new SharingService();

	const FallbackPhrase$1 = Object.freeze({
		denied: 'JS_DISK_SHARING_MEMBERS_POPUP_ERROR_ACCESS_DENIED',
		error: 'JS_DISK_SHARING_MEMBERS_POPUP_ERROR_LOAD'
	});
	function toSnapshot(mode, data) {
		const {
			members,
			owner
		} = data;
		return {
			mode,
			owner: mapOwnerToModel(owner),
			members: mapMembersToModel(members),
			maxRight: owner.maxTaskName ?? null
		};
	}
	function toErrorMessage$1(status, errorMessage) {
		if (errorMessage !== '') {
			return errorMessage;
		}
		return main_core.Loc.getMessage(FallbackPhrase$1[status]) ?? '';
	}
	async function loadSharing(mode, objectId) {
		const result = await sharingService.load(mode, objectId);
		if (result.status === 'success') {
			return {
				isLoaded: true,
				snapshot: toSnapshot(mode, result.data)
			};
		}
		return {
			isLoaded: false,
			errorMessage: toErrorMessage$1(result.status, result.errorMessage)
		};
	}

	const AutoHideDelay = 5000;
	let activePanel = null;
	let autoHideTimeout = null;
	function clearAutoHide() {
		if (autoHideTimeout !== null) {
			clearTimeout(autoHideTimeout);
			autoHideTimeout = null;
		}
	}
	function hideActivePanel() {
		clearAutoHide();
		if (activePanel !== null) {
			activePanel.hide();
			activePanel = null;
		}
	}
	function show(message, backgroundColor, icon, politeness) {
		hideActivePanel();
		ui_a11y.LiveAnnouncer.announce(message, politeness);
		const panel = new ui_notificationPanel.NotificationPanel({
			id: null,
			styleClass: '',
			content: main_core.Text.encode(message),
			backgroundColor,
			textColor: 'var(--ui-color-base-white-fixed)',
			crossColor: 'var(--ui-color-base-white-fixed)',
			leftIcon: new ui_iconSet_api_core.Icon({
				icon,
				color: 'var(--ui-color-base-white-fixed)'
			}),
			rightButtons: [],
			showCloseIcon: true,
			zIndex: null,
			events: {
				onShow: () => {},
				onHideByButton: () => {},
				onHide: () => {
					if (activePanel === panel) {
						activePanel = null;
						clearAutoHide();
					}
				}
			}
		});
		activePanel = panel;
		panel.show();
		autoHideTimeout = setTimeout(() => {
			if (activePanel === panel) {
				panel.hide();
			}
		}, AutoHideDelay);
	}
	function notifyError(message) {
		show(message, 'var(--ui-color-accent-main-alert)', ui_iconSet_api_core.Main.WARNING_ALARM, 'assertive');
	}
	function notifySuccess(message) {
		show(message, 'var(--ui-color-accent-main-success)', ui_iconSet_api_core.Main.CIRCLE_CHECK, 'polite');
	}

	function getRightWeight(right) {
		if (right === null || !Object.prototype.hasOwnProperty.call(SharingRightInfo, right)) {
			return UnknownRightWeight;
		}
		return SharingRightInfo[right].weight;
	}
	function getRightForNewMember(availableRights) {
		if (availableRights.includes(DefaultSharingRight)) {
			return DefaultSharingRight;
		}
		return availableRights.length === 0 ? null : availableRights[availableRights.length - 1];
	}
	function getModePermission(mode) {
		if (mode === null) {
			return NoSharingModePermission;
		}
		return SharingModePermissionByMode[mode] ?? NoSharingModePermission;
	}
	const useSharingStore = ui_vue3_pinia.defineStore('diskSharingMembers', {
		state: () => ({
			objectId: null,
			objectName: '',
			mode: null,
			owner: null,
			members: [],
			maxRight: null,
			lockedEntityIds: [],
			isSaving: false,
			isSelectorOpen: false
		}),
		getters: {
			permission(state) {
				return getModePermission(state.mode);
			},
			availableRights(state) {
				const permission = getModePermission(state.mode);
				if (!permission.canChangeMembers) {
					return [];
				}
				if (!permission.limitsRightsByMaxRight) {
					return [...SharingRightList];
				}
				const maxWeight = getRightWeight(state.maxRight);
				return SharingRightList.filter(right => getRightWeight(right) <= maxWeight);
			},
			canAddMembers(state) {
				return getModePermission(state.mode).canAddMembers && this.availableRights.length > 0;
			},
			isMemberLocked(state) {
				return entityId => state.lockedEntityIds.includes(entityId);
			},
			draft(state) {
				return {
					members: [...state.members]
				};
			}
		},
		actions: {
			setObject(objectId, objectName) {
				this.objectId = objectId;
				this.objectName = objectName;
			},
			fill(snapshot) {
				this.mode = snapshot.mode;
				this.owner = snapshot.owner;
				this.members = [...snapshot.members];
				this.maxRight = snapshot.maxRight;
				this.lockedEntityIds = getModePermission(snapshot.mode).locksLoadedMembers ? snapshot.members.map(member => member.entityId) : [];
			},
			addMember(member) {
				const isKnown = this.members.some(existing => existing.entityId === member.entityId);
				if (isKnown) {
					return;
				}
				const right = getRightForNewMember(this.availableRights);
				if (right === null) {
					return;
				}
				this.members.push({
					sharingId: null,
					entityId: member.entityId,
					name: member.name,
					right,
					avatar: member.avatar,
					url: member.url ?? null,
					type: member.type
				});
			},
			removeMember(entityId) {
				if (this.isMemberLocked(entityId)) {
					return;
				}
				this.members = this.members.filter(member => member.entityId !== entityId);
			},
			changeMemberRight(entityId, right) {
				if (this.isMemberLocked(entityId)) {
					return;
				}
				const member = this.members.find(item => item.entityId === entityId);
				if (member === undefined) {
					return;
				}
				member.right = right;
			},
			setSaving(isSaving) {
				this.isSaving = isSaving;
			},
			setSelectorOpen(isSelectorOpen) {
				this.isSelectorOpen = isSelectorOpen;
			}
		}
	});

	const BoardExtension = 'board';
	const FallbackPhrase = Object.freeze({
		denied: 'JS_DISK_SHARING_MEMBERS_POPUP_ERROR_ACCESS_DENIED',
		error: 'JS_DISK_SHARING_MEMBERS_POPUP_ERROR_SAVE'
	});
	function toSaveMode(mode) {
		if (mode === SharingControlType.WithChangeRights || mode === SharingControlType.WithSharing) {
			return mode;
		}
		return null;
	}
	function getSuccessMessage(mode, objectName) {
		if (mode !== SharingControlType.WithChangeRights) {
			return main_core.Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_SUCCESS') ?? '';
		}
		const segments = objectName.split('.');
		const extension = (segments.pop() ?? '').toLowerCase();
		const name = segments.join('.');
		if (name !== '' && extension === BoardExtension) {
			return main_core.Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_SUCCESS_BOARD', {
				'#FILE#': name
			}) ?? '';
		}
		return main_core.Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_SUCCESS_FILE', {
			'#FILE#': objectName
		}) ?? '';
	}
	function toErrorMessage(status, errorMessage) {
		if (errorMessage !== '') {
			return errorMessage;
		}
		return main_core.Loc.getMessage(FallbackPhrase[status]) ?? '';
	}
	async function saveSharing(store) {
		const mode = toSaveMode(store.mode);
		if (store.isSaving || mode === null || store.objectId === null) {
			return {
				status: 'ignored'
			};
		}
		store.setSaving(true);
		const entityToNewShared = mapDraftToEntityToNewShared(store.draft);
		const result = await sharingService.save(mode, store.objectId, entityToNewShared);
		store.setSaving(false);
		if (result.status === 'success') {
			return {
				status: 'saved',
				successMessage: getSuccessMessage(mode, store.objectName)
			};
		}
		return {
			status: 'error',
			errorMessage: toErrorMessage(result.status, result.errorMessage)
		};
	}

	const SaveShortcutKey = 'Enter';
	const PopupWindowSelector = '.popup-window';
	const TestId = Object.freeze({
		save: {
			testid: 'disk-sharing-members-save'
		},
		close: {
			testid: 'disk-sharing-members-close'
		}
	});
	const InteractiveSelector = ['input', 'textarea', 'select', 'button', 'a[href]', '[contenteditable=""]', '[contenteditable="true"]', '[role="button"]', '[role="menuitem"]', '[role="menuitemcheckbox"]'].join(',');
	function claimsEnter(target) {
		return target instanceof Element && target.closest(InteractiveSelector) !== null;
	}
	const Footer = ui_vue3.defineComponent({
		name: 'DiskSharingFooter',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			closeDialog: {
				type: Function,
				required: true
			}
		},
		setup() {
			return {
				store: useSharingStore(),
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				TestId
			};
		},
		data() {
			return {
				keydownTarget: null,
				saveButtonId: `disk-sharing-members-save-${main_core.Text.getRandom(8)}`
			};
		},
		computed: {
			canSave() {
				return this.store.permission.canSave;
			},
			isSaving() {
				return this.store.isSaving;
			}
		},
		mounted() {
			main_core.Dom.attr(this.$el.querySelector(`#${this.saveButtonId}`), 'aria-keyshortcuts', SaveShortcutKey);
			void this.$nextTick(this.listenForShortcut);
		},
		beforeUnmount() {
			if (this.keydownTarget !== null) {
				main_core.Event.unbind(this.keydownTarget, 'keydown', this.handlePopupKeydown);
			}
		},
		methods: {
			loc(messageCode) {
				return main_core.Loc.getMessage(messageCode) ?? '';
			},
			listenForShortcut() {
				const keydownTarget = this.$el.closest(PopupWindowSelector);
				if (keydownTarget === null) {
					return;
				}
				this.keydownTarget = keydownTarget;
				main_core.Event.bind(keydownTarget, 'keydown', this.handlePopupKeydown);
			},
			handlePopupKeydown(event) {
				const isPlainEnter = event.key === SaveShortcutKey && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
				if (!isPlainEnter || event.defaultPrevented) {
					return;
				}
				if (claimsEnter(event.target) || this.store.isSelectorOpen || !this.canSave) {
					return;
				}
				void this.handleSave();
			},
			async handleSave() {
				const result = await saveSharing(this.store);
				if (result.status === 'ignored') {
					return;
				}
				if (result.status === 'saved') {
					this.closeDialog();
					notifySuccess(result.successMessage);
					return;
				}
				notifyError(result.errorMessage);
			}
		},
		template: `
		<div class="disk-sharing-members-popup-footer">
			<UiButton
				v-if="canSave"
				:id="saveButtonId"
				:text="loc('JS_DISK_SHARING_MEMBERS_POPUP_BUTTON_SAVE')"
				:style="AirButtonStyle.FILLED"
				:size="ButtonSize.LARGE"
				:loading="isSaving"
				:dataset="TestId.save"
				@click="handleSave"
			/>
			<UiButton
				:text="loc('JS_DISK_SHARING_MEMBERS_POPUP_BUTTON_CLOSE')"
				:style="AirButtonStyle.PLAIN"
				:size="ButtonSize.LARGE"
				:dataset="TestId.close"
				@click="closeDialog"
			/>
		</div>
	`
	});

	const SelectorEntity = Object.freeze({
		User: 'user',
		Project: 'project',
		Department: 'department'
	});
	const SelectorEntityInfo = Object.freeze({
		[SelectorEntity.User]: {
			accessCodePrefix: 'U',
			memberType: 'users'
		},
		[SelectorEntity.Project]: {
			accessCodePrefix: 'SG',
			memberType: 'groups'
		},
		[SelectorEntity.Department]: {
			accessCodePrefix: 'DR',
			memberType: 'department'
		}
	});

	function getSelectorItemIdByAccessCode(accessCode) {
		const entity = Object.keys(SelectorEntityInfo).find(candidate => accessCode.startsWith(SelectorEntityInfo[candidate].accessCodePrefix));
		if (entity === undefined) {
			return null;
		}
		return [entity, accessCode.slice(SelectorEntityInfo[entity].accessCodePrefix.length)];
	}
	function getAccessCodeBySelectorItem(entity, id) {
		const info = SelectorEntityInfo[entity];
		if (info === undefined) {
			return null;
		}
		return `${info.accessCodePrefix}${id}`;
	}
	function getMemberTypeBySelectorEntity(entity) {
		const info = SelectorEntityInfo[entity];
		if (info === undefined) {
			return null;
		}
		return info.memberType;
	}

	function announce(phraseCode, name) {
		ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage(phraseCode, {
			'#NAME#': name
		}) ?? '');
	}
	function addSelectedMember(store, selected) {
		const entityId = getAccessCodeBySelectorItem(selected.entity, selected.id);
		const type = getMemberTypeBySelectorEntity(selected.entity);
		if (entityId === null || type === null) {
			return;
		}
		const countBefore = store.members.length;
		store.addMember({
			entityId,
			name: selected.title,
			avatar: selected.avatar,
			type
		});
		if (store.members.length > countBefore) {
			announce('JS_DISK_SHARING_MEMBERS_POPUP_ANNOUNCE_MEMBER_ADDED', selected.title);
		}
	}
	function removeDeselectedMember(store, selected) {
		const entityId = getAccessCodeBySelectorItem(selected.entity, selected.id);
		if (entityId === null) {
			return;
		}
		const countBefore = store.members.length;
		store.removeMember(entityId);
		if (store.members.length < countBefore) {
			announce('JS_DISK_SHARING_MEMBERS_POPUP_ANNOUNCE_MEMBER_REMOVED', selected.title);
		}
	}

	const DialogId = 'disk-sharing-members-popup-selector';
	const DialogContext = 'DISK_SHARING_PRIVATE_ACCESS';
	const DialogWidth = 420;
	const DialogHeight = 360;
	const ButtonTestId = Object.freeze({
		testid: 'disk-sharing-members-add'
	});
	const MemberAdd = ui_vue3.defineComponent({
		name: 'DiskSharingMemberAdd',
		components: {
			TextSm: ui_system_typography_vue.TextSm,
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				store: useSharingStore(),
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				ButtonTestId
			};
		},
		data() {
			return {
				dialog: null,
				isProjectAvailable: false
			};
		},
		computed: {
			isVisible() {
				return this.store.canAddMembers;
			},
			isSaving() {
				return this.store.isSaving;
			},
			description() {
				return main_core.Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_EMPLOYEES_LABEL') ?? '';
			},
			buttonText() {
				return main_core.Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_EMPLOYEES_BUTTON') ?? '';
			}
		},
		beforeUnmount() {
			this.destroyDialog();
		},
		methods: {
			getSelectorItems(members) {
				const items = [];
				members.forEach(member => {
					const itemId = getSelectorItemIdByAccessCode(member.entityId);
					if (itemId !== null && (itemId[0] !== SelectorEntity.Project || this.isProjectAvailable)) {
						items.push(itemId);
					}
				});
				return items;
			},
			getPreselectedItems() {
				return this.getSelectorItems(this.store.members);
			},
			getUndeselectedItems() {
				return this.getSelectorItems(this.store.members.filter(member => this.store.isMemberLocked(member.entityId)));
			},
			getDialogEntities() {
				const entities = [{
					id: SelectorEntity.User,
					options: {
						inviteEmployeeLink: false,
						inviteGuestLink: true,
						selectFields: ['workDepartment']
					}
				}, {
					id: SelectorEntity.Department,
					options: {
						selectMode: 'usersAndDepartments'
					}
				}];
				if (this.isProjectAvailable) {
					entities.push({
						id: SelectorEntity.Project
					});
				}
				return entities;
			},
			getTargetNode() {
				const button = this.$refs.selectButton;
				return button?.button?.getContainer() ?? null;
			},
			toSelectedEntity(item) {
				return {
					entity: item.getEntityId(),
					id: item.getId(),
					title: item.getTitle(),
					avatar: item.getAvatar() ?? ''
				};
			},
			destroyDialog() {
				if (this.dialog === null) {
					return;
				}
				this.dialog.destroy();
				this.dialog = null;
				this.store.setSelectorOpen(false);
			},
			async handleClick() {
				this.isProjectAvailable = await main_core.Runtime.loadExtension('socialnetwork.entity-selector').then(() => true).catch(() => false);
				this.destroyDialog();
				const targetNode = this.getTargetNode();
				if (targetNode === null) {
					return;
				}
				const dialog = ui_vue3.markRaw(new ui_entitySelector.Dialog({
					id: DialogId,
					context: DialogContext,
					targetNode,
					width: DialogWidth,
					height: DialogHeight,
					multiple: true,
					enableSearch: true,
					compactView: true,
					preselectedItems: this.getPreselectedItems(),
					undeselectedItems: this.getUndeselectedItems(),
					entities: this.getDialogEntities(),
					events: {
						onShow: () => this.store.setSelectorOpen(true),
						onHide: () => this.store.setSelectorOpen(false),
						'Item:onSelect': event => {
							addSelectedMember(this.store, this.toSelectedEntity(event.getData().item));
						},
						'Item:onDeselect': event => {
							removeDeselectedMember(this.store, this.toSelectedEntity(event.getData().item));
						}
					}
				}));
				this.dialog = dialog;
				dialog.show();
			}
		},
		template: `
		<div v-if="isVisible" class="disk-sharing-members-popup-add">
			<TextSm class="disk-sharing-members-popup-add__description">{{ description }}</TextSm>
			<UiButton
				ref="selectButton"
				:text="buttonText"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.OUTLINE_ACCENT_2"
				:disabled="isSaving"
				:dataset="ButtonTestId"
				@click="handleClick"
			/>
		</div>
	`
	});

	function getRightLabel(right) {
		if (!Object.prototype.hasOwnProperty.call(SharingRightInfo, right)) {
			return '';
		}
		return main_core.Loc.getMessage(SharingRightInfo[right].phraseCode) ?? '';
	}

	function changeMemberRight(store, entityId, right) {
		if (!store.availableRights.includes(right)) {
			return;
		}
		store.changeMemberRight(entityId, right);
		const member = store.members.find(item => item.entityId === entityId);
		if (member?.right === right) {
			ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_ANNOUNCE_RIGHT_CHANGED', {
				'#NAME#': member.name,
				'#LEVEL#': getRightLabel(right)
			}) ?? '');
		}
	}

	const RightSelect = ui_vue3.defineComponent({
		name: 'DiskSharingRightSelect',
		components: {
			BMenu: ui_system_menu_vue.BMenu,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			modelValue: {
				type: String,
				required: true
			},
			memberName: {
				type: String,
				required: true
			}
		},
		emits: ['update:modelValue'],
		setup() {
			return {
				store: useSharingStore()
			};
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			selectedLabel() {
				return getRightLabel(this.modelValue);
			},
			availableRights() {
				return this.store.availableRights;
			},
			accessibleName() {
				return main_core.Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_MEMBER_ACCESS_LEVEL', {
					'#LEVEL#': this.selectedLabel,
					'#NAME#': this.memberName
				}) ?? '';
			}
		},
		methods: {
			getTriggerElement() {
				return this.$refs.trigger?.$el ?? null;
			},
			getMenuOptions() {
				return {
					bindElement: this.getTriggerElement(),
					closeOnItemClick: true,
					items: this.availableRights.map(right => {
						return {
							title: getRightLabel(right),
							isSelected: right === this.modelValue,
							onClick: () => this.handleSelect(right)
						};
					})
				};
			},
			handleClick() {
				this.isMenuShown = !this.isMenuShown && this.availableRights.length > 0;
			},
			handleSelect(right) {
				this.isMenuShown = false;
				this.$emit('update:modelValue', right);
			}
		},
		template: `
		<TextSm
			ref="trigger"
			tag="button"
			type="button"
			class="disk-sharing-members-popup-right"
			data-testid="disk-sharing-members-right"
			:aria-label="accessibleName"
			@click="handleClick"
		>{{ selectedLabel }}</TextSm>
		<BMenu
			v-if="isMenuShown"
			:options="getMenuOptions()"
			@close="isMenuShown = false"
		/>
	`
	});

	const MemberItem = ui_vue3.defineComponent({
		name: 'DiskSharingMemberItem',
		components: {
			RightSelect,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			member: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				store: useSharingStore()
			};
		},
		computed: {
			rightLabel() {
				return getRightLabel(this.member.right);
			},
			isEditable() {
				return this.store.permission.canChangeMembers && !this.store.isMemberLocked(this.member.entityId);
			},
			right: {
				get() {
					return this.member.right;
				},
				set(right) {
					changeMemberRight(this.store, this.member.entityId, right);
				}
			}
		},
		template: `
		<div class="disk-sharing-members-popup-member" :data-testid="'disk-sharing-members-item-' + member.entityId">
			<TextSm
				class="disk-sharing-members-popup-member__name"
				wrap="truncate"
				data-testid="disk-sharing-members-name"
			>{{ member.name }}</TextSm>
			<RightSelect v-if="isEditable" v-model="right" :memberName="member.name"/>
			<TextSm
				v-else
				class="disk-sharing-members-popup-member__right"
				data-testid="disk-sharing-members-right-label"
			>{{ rightLabel }}</TextSm>
		</div>
	`
	});

	const MemberList = ui_vue3.defineComponent({
		name: 'DiskSharingMemberList',
		components: {
			MemberItem,
			TextSm: ui_system_typography_vue.TextSm
		},
		setup() {
			return {
				store: useSharingStore()
			};
		},
		computed: {
			members() {
				return this.store.members;
			},
			nameColumn() {
				return main_core.Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_USERS_NAME') ?? '';
			},
			rightColumn() {
				return main_core.Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_ACCESS_LEVEL') ?? '';
			}
		},
		template: `
		<div class="disk-sharing-members-popup-members" :class="{ '--filled': members.length > 0 }">
			<div v-if="members.length" class="disk-sharing-members-popup-columns">
				<TextSm class="disk-sharing-members-popup-columns__title">{{ nameColumn }}</TextSm>
				<TextSm class="disk-sharing-members-popup-columns__title">{{ rightColumn }}</TextSm>
			</div>
			<div class="disk-sharing-members-popup__list" data-testid="disk-sharing-members-list">
				<MemberItem
					v-for="member in members"
					:key="member.entityId"
					:member="member"
				/>
			</div>
		</div>
	`
	});

	const AvatarSize = 30;
	const App = ui_vue3.defineComponent({
		name: 'DiskSharingMembersApp',
		components: {
			Avatar: ui_vue3_components_avatar.Avatar,
			Footer,
			HeadlineXs: ui_system_typography_vue.HeadlineXs,
			MemberAdd,
			MemberList,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			closeDialog: {
				type: Function,
				required: true
			}
		},
		setup() {
			return {
				store: useSharingStore()
			};
		},
		computed: {
			owner() {
				return this.store.owner;
			}
		},
		methods: {
			loc(messageCode) {
				return main_core.Loc.getMessage(messageCode) ?? '';
			},
			avatarOptions(name, avatar) {
				return {
					size: AvatarSize,
					userName: name,
					userpicPath: avatar
				};
			}
		},
		template: `
		<div class="disk-sharing-members-popup__body" data-testid="disk-sharing-members-popup">
			<div class="disk-sharing-members-popup__section --padded">
				<HeadlineXs class="disk-sharing-members-popup__label">
					{{ loc('JS_DISK_SHARING_MEMBERS_POPUP_LABEL_OWNER') }}
				</HeadlineXs>
				<a v-if="owner" class="disk-sharing-members-popup__row" :href="owner.link" data-testid="disk-sharing-members-owner">
					<Avatar :options="avatarOptions(owner.name, owner.avatar)"/>
					<TextSm class="disk-sharing-members-popup__name">{{ owner.name }}</TextSm>
				</a>
			</div>
			<div class="disk-sharing-members-popup__section">
				<MemberAdd/>
				<MemberList/>
			</div>
			<Footer :closeDialog="closeDialog"/>
		</div>
	`
	});

	const ScopeClass = 'disk-sharing-members-popup';
	const disposedPinias = new WeakSet();
	const previousPinias = new WeakMap();
	function findLivingPrevious(pinia) {
		let previous = previousPinias.get(pinia);
		while (previous !== undefined && disposedPinias.has(previous)) {
			previous = previousPinias.get(previous);
		}
		return previous;
	}
	class SharingMembersPopup {
		#dialog = null;
		#app = null;
		#pinia = null;
		#container = null;
		#onAfterHide = null;
		#openGeneration = 0;
		async open(params) {
			const openGeneration = ++this.#openGeneration;
			const result = await loadSharing(params.mode, params.objectId);
			if (!this.#isCurrentOpen(openGeneration)) {
				return;
			}
			if (!result.isLoaded) {
				notifyError(result.errorMessage);
				return;
			}
			this.#onAfterHide = params.onAfterHide ?? null;
			const pinia = this.#ensurePinia();
			const store = useSharingStore(pinia);
			store.$reset();
			store.setObject(params.objectId, params.objectName);
			store.fill(result.snapshot);
			const container = this.#ensureDialog();
			if (this.#app === null) {
				this.#mount(container, pinia);
			}
			this.#dialog?.show();
		}
		close() {
			this.#openGeneration += 1;
			if (this.#dialog !== null) {
				this.#dialog.hide();
				return;
			}
			this.#reset();
		}
		#ensureDialog() {
			if (this.#container !== null) {
				return this.#container;
			}
			const container = main_core.Tag.render`<div class="${ScopeClass}__content"></div>`;
			this.#dialog = new ui_system_dialog.Dialog({
				title: this.#getTitle(),
				content: container,
				hasOverlay: true,
				background: ui_system_dialog.DialogBackground.vibrant,
				events: {
					onShow: () => {},
					onHide: () => {},
					onAfterShow: () => this.#markPopup(),
					onAfterHide: () => {
						const onAfterHide = this.#onAfterHide;
						this.#reset();
						onAfterHide?.();
					}
				}
			});
			this.#container = container;
			return container;
		}
		#markPopup() {
			const popup = this.#container?.closest('.popup-window');
			if (popup) {
				main_core.Dom.addClass(popup, ScopeClass);
				main_core.Dom.attr(popup, 'aria-label', this.#getTitle());
			}
		}
		#getTitle() {
			return main_core.Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_TITLE') ?? '';
		}
		#ensurePinia() {
			if (this.#pinia === null) {
				const previous = ui_vue3_pinia.getActivePinia();
				this.#pinia = ui_vue3_pinia.createPinia();
				if (previous !== undefined) {
					previousPinias.set(this.#pinia, previous);
				}
			}
			return this.#pinia;
		}
		#mount(container, pinia) {
			const app = ui_vue3.BitrixVue.createApp(App, {
				closeDialog: this.close.bind(this)
			});
			app.use(pinia);
			app.mount(container);
			this.#app = app;
		}
		#unmount() {
			if (this.#app !== null) {
				this.#app.unmount();
				this.#app = null;
			}
			if (this.#pinia !== null) {
				const pinia = this.#pinia;
				this.#pinia = null;
				ui_vue3_pinia.disposePinia(pinia);
				disposedPinias.add(pinia);
				if (ui_vue3_pinia.getActivePinia() === pinia) {
					ui_vue3_pinia.setActivePinia(findLivingPrevious(pinia));
				}
			}
		}
		#reset() {
			this.#openGeneration += 1;
			this.#unmount();
			this.#dialog = null;
			this.#container = null;
			this.#onAfterHide = null;
		}
		#isCurrentOpen(openGeneration) {
			return this.#openGeneration === openGeneration;
		}
	}

	exports.SharingControlType = SharingControlType;
	exports.SharingMembersPopup = SharingMembersPopup;

})(this.BX.Disk = this.BX.Disk || {}, BX, BX.UI.System, BX.Vue3, BX.Vue3.Pinia, BX.UI.Accessibility, BX.UI.IconSet, BX.UI, window, BX.UI.System.Typography.Vue, BX.UI.Vue3.Components, BX.Vue3.Components, BX.UI.EntitySelector, BX.UI.System.Menu);
//# sourceMappingURL=sharing-members-popup.bundle.js.map
