/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_vue3_components_popup, ui_vue3_components_richLoc, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_core, tasks_v2_const, tasks_v2_component_elements_hoverPill, tasks_v2_component_elements_fieldHoverButton, tasks_v2_component_elements_fieldAdd, tasks_v2_component_elements_hint, tasks_v2_component_elements_userLabel, tasks_v2_lib_showLimit, tasks_v2_lib_idUtils, tasks_v2_lib_userSelectorDialog, tasks_v2_component_absencePopup, tasks_v2_provider_service_userService, main_core_events, ui_system_menu_vue) {
	'use strict';

	const userNamePlaceholder = '#VALUE#';

	// @vue/component
	const User = {
		name: 'TaskUser',
		components: {
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
			UserLabel: tasks_v2_component_elements_userLabel.UserLabel,
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			},
			userId: {
				type: Number,
				required: true
			},
			canAdd: {
				type: Boolean,
				required: true
			},
			withClear: {
				type: Boolean,
				required: true
			},
			withMenu: {
				type: Boolean,
				required: true
			},
			forceEdit: {
				type: Boolean,
				default: false
			},
			ariaLabel: {
				type: String,
				default: ''
			},
			userAriaLabelTemplate: {
				type: String,
				default: ''
			},
			ariaHaspopup: {
				type: String,
				default: ''
			},
			ariaExpanded: {
				type: Boolean,
				default: null
			},
			clearAriaLabel: {
				type: String,
				default: ''
			}
		},
		emits: ['edit', 'remove'],
		data() {
			return {
				isMenuShown: false,
				hasExternalItems: false
			};
		},
		created() {
			this.refreshExternalItems();
		},
		computed: {
			isViewTrigger() {
				return !this.canAdd && !this.forceEdit && this.withMenu;
			},
			triggerAriaLabel() {
				if (this.canAdd || this.forceEdit) {
					if (this.userAriaLabelTemplate && this.user?.name) {
						return this.userAriaLabelTemplate.replace(userNamePlaceholder, this.user.name);
					}
					return this.withUserName(this.ariaLabel);
				}
				return this.isViewTrigger ? this.user?.name ?? '' : '';
			},
			triggerAriaHaspopup() {
				if (this.isViewTrigger) {
					return this.hasExternalItems ? 'menu' : '';
				}
				return this.triggerAriaLabel ? this.ariaHaspopup : '';
			},
			triggerAriaExpanded() {
				if (this.isViewTrigger) {
					return this.hasExternalItems ? this.isMenuShown : null;
				}
				return this.triggerAriaLabel ? this.ariaExpanded : null;
			},
			user() {
				return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](this.userId);
			},
			clearLabel() {
				return this.withUserName(this.clearAriaLabel);
			},
			isProfileLink() {
				return !this.canAdd && !this.forceEdit && !this.withMenu;
			},
			profileUrl() {
				return tasks_v2_provider_service_userService.userService.getUrl(this.userId);
			}
		},
		methods: {
			menuOptions() {
				return {
					id: 'tasks-field-users-menu',
					bindElement: this.$refs.user.$el,
					offsetTop: 8,
					targetContainer: document.body,
					items: [{
						title: this.loc('TASKS_V2_USERS_VIEW'),
						icon: ui_iconSet_api_vue.Outline.PERSON,
						onClick: this.openProfile
					}, ...this.readExternalItems()]
				};
			},
			readExternalItems() {
				return main_core_events.EventEmitter.emit(tasks_v2_const.EventName.UserMenuExternalItems, {
					taskId: this.taskId,
					userId: this.userId
				}).filter(value => Boolean(value)).flat();
			},
			// Other modules answer this event only after their own async init, which lands well after
			// the card is rendered, so the answer is re-read on every approach instead of being frozen.
			refreshExternalItems() {
				this.hasExternalItems = this.readExternalItems().length > 0;
			},
			withUserName(label) {
				if (label === '' || !this.user?.name) {
					return label;
				}
				return `${label}, ${this.user.name}`;
			},
			handleClick() {
				this.refreshExternalItems();
				if (this.withMenu && this.hasExternalItems) {
					this.isMenuShown = true;
					return;
				}
				if (this.canAdd || this.forceEdit) {
					this.$emit('edit');
					return;
				}
				this.openProfile();
			},
			openProfile() {
				BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(this.userId));
			}
		},
		template: `
		<HoverPill
			ref="user"
			data-testid="task-participant-pill"
			:data-user-id="userId"
			:withClear
			:withFocusableContent="isProfileLink"
			:ariaLabel="triggerAriaLabel"
			:ariaHaspopup="triggerAriaHaspopup"
			:ariaExpanded="triggerAriaExpanded"
			:clearAriaLabel="clearLabel"
			@clear="$emit('remove')"
			@click="handleClick"
			@mouseenter="refreshExternalItems"
			@focusin="refreshExternalItems"
		>
			<a
				v-if="isProfileLink"
				:href="profileUrl"
				class="tasks-field-user-profile-link"
				data-testid="task-participant-profile-link"
				@click.prevent.stop="openProfile"
			>
				<UserLabel :user/>
			</a>
			<UserLabel v-else :user/>
		</HoverPill>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
		<slot :getUserEl="() => $refs.user?.$el" :user="user"/>
	`
	};

	// @vue/component
	const Users = {
		name: 'TaskUsers',
		components: {
			User
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			},
			isEdit: {
				type: Boolean,
				default: false
			},
			userIds: {
				type: Array,
				required: true
			},
			canAdd: {
				type: Boolean,
				default: false
			},
			canRemove: {
				type: Boolean,
				default: false
			},
			removableUserId: {
				type: Number,
				default: 0
			},
			single: {
				type: Boolean,
				default: false
			},
			inline: {
				type: Boolean,
				default: false
			},
			showMenu: {
				type: Boolean,
				default: true
			},
			forceEdit: {
				type: Boolean,
				default: false
			},
			fromPopup: {
				type: Boolean,
				default: false
			},
			ariaLabel: {
				type: String,
				default: ''
			},
			userAriaLabelTemplate: {
				type: String,
				default: ''
			},
			ariaHaspopup: {
				type: String,
				default: ''
			},
			ariaExpanded: {
				type: Boolean,
				default: null
			},
			clearAriaLabel: {
				type: String,
				default: ''
			}
		},
		emits: ['edit', 'remove'],
		computed: {
			isSafari() {
				return BX.browser.IsSafari();
			}
		},
		template: `
		<div
			class="tasks-field-users"
			:class="{
				'--safari': isSafari,
				'--overflow': fromPopup,
			}"
		>
			<template v-for="(userId, index) in userIds" :key="userId">
				<User
					:taskId
					:userId
					:forceEdit
					:canAdd="canAdd && single"
					:withClear="!single && !inline && (canRemove || userId === removableUserId)"
					:clearAriaLabel
					:withMenu="showMenu && isEdit && (canRemove || removableUserId === userId)"
					:ariaLabel
					:userAriaLabelTemplate
					:ariaHaspopup
					:ariaExpanded
					:clearAriaLabel
					@edit="$emit('edit')"
					@remove="$emit('remove', userId)"
				>
					<template v-slot="slotProps">
						<slot name="user" :userId="userId" :index="index" v-bind="slotProps"/>
					</template>
				</User>
			</template>
		</div>
	`
	};

	// @vue/component
	const More = {
		props: {
			count: {
				type: Number,
				required: true
			},
			withRemove: {
				type: Boolean,
				default: false
			},
			inline: {
				type: Boolean,
				default: false
			}
		},
		emits: ['showMore', 'removeAll'],
		computed: {
			moreFormatted() {
				return this.loc('TASKS_V2_USERS_MORE_COUNT', {
					'#COUNT#': this.count
				});
			}
		},
		template: `
		<div v-if="count || withRemove" :class="['tasks-field-users-footer', { '--inline': inline }]">
			<button v-if="count" type="button" class="tasks-field-users-more" @click="$emit('showMore')">
				{{ moreFormatted }}
			</button>
			<button v-if="withRemove" type="button" class="tasks-field-users-more --remove" @click="$emit('removeAll')">
				{{ loc('TASKS_V2_USERS_REMOVE_ALL') }}
			</button>
		</div>
	`
	};

	const maxUsers = 4;
	const hintActionPlaceholder = /\[\/?action]/g;

	// @vue/component
	const Participants = {
		name: 'TaskParticipants',
		components: {
			RichLoc: ui_vue3_components_richLoc.RichLoc,
			Popup: ui_vue3_components_popup.Popup,
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
			FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd,
			FieldHoverButton: tasks_v2_component_elements_fieldHoverButton.FieldHoverButton,
			Hint: tasks_v2_component_elements_hint.Hint,
			UserLabel: tasks_v2_component_elements_userLabel.UserLabel,
			Users,
			More
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			},
			context: {
				type: String,
				required: true
			},
			userIds: {
				type: Array,
				required: true
			},
			canAdd: {
				type: Boolean,
				default: true
			},
			canRemove: {
				type: Boolean,
				default: true
			},
			withHint: {
				type: Boolean,
				default: false
			},
			hintText: {
				type: String,
				default: ''
			},
			useRemoveAll: {
				type: Boolean,
				default: false
			},
			single: {
				type: Boolean,
				default: false
			},
			multipleOnPlus: {
				type: Boolean,
				default: false
			},
			inline: {
				type: Boolean,
				default: false
			},
			avatarOnly: {
				type: Boolean,
				default: false
			},
			dataset: {
				type: Object,
				required: true
			},
			isLocked: {
				type: Boolean,
				default: false
			},
			featureId: {
				type: String,
				default: ''
			},
			showMenu: {
				type: Boolean,
				default: true
			},
			forceEdit: {
				type: Boolean,
				default: false
			},
			warnAboutAbsence: {
				type: [Boolean, String],
				default: false
			},
			ariaLabel: {
				type: String,
				default: ''
			},
			userAriaLabelTemplate: {
				type: String,
				default: ''
			},
			addAriaLabel: {
				type: String,
				default: ''
			},
			ariaHaspopup: {
				type: String,
				default: ''
			},
			clearAriaLabel: {
				type: String,
				default: ''
			}
		},
		emits: ['update', 'hintClick', 'absenceLoaded'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isDialogShown: false,
				isMoreShown: false,
				isHintShown: false,
				isHovered: false,
				isFocusWithin: false,
				returnFocusElement: null
			};
		},
		computed: {
			isEdit() {
				return tasks_v2_lib_idUtils.idUtils.isReal(this.taskId);
			},
			removableUserId() {
				if (this.multipleOnPlus) {
					return 0;
				}
				return this.canAdd ? tasks_v2_core.Core.getParams().currentUser.id : 0;
			},
			userCount() {
				return this.userIds.length;
			},
			popupOptions() {
				return () => ({
					id: 'tasks-field-users-more-popup',
					bindElement: this.$refs.anchor,
					padding: 18,
					maxWidth: 300,
					maxHeight: 300,
					offsetTop: 8,
					focusTrap: true,
					closeByEsc: true,
					ariaLabel: this.loc('TASKS_V2_USERS_MORE_POPUP_ARIA_LABEL'),
					targetContainer: document.body
				});
			},
			hintOptions() {
				return {
					focusTrap: {
						initialFocus: false
					},
					ariaLabel: this.hintText.replaceAll(hintActionPlaceholder, '')
				};
			},
			bodyUserIds() {
				return this.userIds.slice(0, maxUsers);
			},
			moreUserIds() {
				return this.userIds.slice(maxUsers);
			},
			popupUserIds() {
				return this.inline && !this.canAdd ? this.userIds : this.moreUserIds;
			},
			withRemove() {
				if (!this.canRemove) {
					return false;
				}
				if (!this.useRemoveAll || this.userCount <= maxUsers) {
					return false;
				}
				return this.isDialogShown || this.isHovered;
			}
		},
		watch: {
			userCount() {
				if (this.popupUserIds.length === 0) {
					this.isMoreShown = false;
				}
			}
		},
		mounted() {
			void tasks_v2_provider_service_userService.userService.list(this.userIds);
		},
		methods: {
			getUser(userId) {
				return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](userId);
			},
			handleClick() {
				if (this.canAdd) {
					void this.showDialog();
					return;
				}
				if (this.userIds.length === 1) {
					BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(this.userIds[0]));
					return;
				}
				this.isMoreShown = true;
			},
			handleMore() {
				if ((!this.isEdit || this.inline) && this.canAdd) {
					void this.showDialog();
					return;
				}
				this.isMoreShown = true;
			},
			async showDialog(plus = false) {
				if (this.isLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						featureId: this.featureId,
						bindElement: this.$refs.anchor
					});
					return;
				}
				this.returnFocusElement = document.activeElement;
				if (this.withHint) {
					this.isHintShown = true;
					this.hintPromise = new Resolvable();
					if ((await this.hintPromise) === false) {
						return;
					}
				}
				this.isDialogShown = true;
				void tasks_v2_lib_userSelectorDialog.usersDialog.show({
					targetNode: this.$refs.anchor,
					ids: this.userIds,
					selectableIds: this.canRemove ? null : new Set([this.removableUserId]),
					onClose: this.handleDialogClose,
					isMultiple: !this.single && (!this.multipleOnPlus || plus)
				});
			},
			async handleDialogClose(userIds, items) {
				this.isDialogShown = false;
				if (tasks_v2_lib_userSelectorDialog.usersDialog.getDialog().isLoaded()) {
					this.updateUsers(this.getUserIds(items));
					if (this.warnAboutAbsence) {
						void this.loadUsersAbsenceInfo(items);
					}
				}
				await this.focusTrigger();
			},
			async focusTrigger() {
				const captured = this.returnFocusElement;
				this.returnFocusElement = null;
				await this.$nextTick();
				if (captured?.isConnected) {
					captured.focus?.();
					return;
				}
				const trigger = this.$refs.root?.querySelector('.b24-hover-pill-content');
				if (trigger?.isConnected) {
					trigger.focus();
				}
			},
			getUserIds(items) {
				if (!Array.isArray(items)) {
					return [];
				}
				const itemsNew = [...items];
				const itemsSorted = itemsNew.sort((a, b) => {
					const getIsOnVacation = item => {
						return item.customData?.get?.('isOnVacation') === true;
					};
					const isOnVacationA = getIsOnVacation(a);
					const isOnVacationB = getIsOnVacation(b);
					if (isOnVacationA === isOnVacationB) {
						return 0;
					}
					return isOnVacationA ? 1 : -1;
				});
				const ids = itemsSorted.map(({
					id
				}) => id);
				const idsFiltered = ids.filter(id => typeof id === 'number');
				return idsFiltered;
			},
			async removeUser(userId) {
				const remover = document.activeElement?.closest?.('.b24-hover-pill-remover') ?? null;
				const list = remover?.closest('.tasks-field-users') ?? null;
				const index = list ? [...list.querySelectorAll('.b24-hover-pill-remover')].indexOf(remover) : 0;
				this.updateUsers(this.userIds.filter(id => id !== userId));
				await this.focusAfterRemove(list, index);
			},
			async removeAll() {
				this.updateUsers([]);
				await this.focusAfterRemove(null, 0);
			},
			async focusAfterRemove(list, index) {
				await this.$nextTick();
				const removers = list?.isConnected ? [...list.querySelectorAll('.b24-hover-pill-remover')] : [];
				const neighbour = removers[index] ?? removers.at(-1);
				if (neighbour) {
					neighbour.focus();
					return;
				}
				const root = this.$refs.root;
				const trigger = root?.querySelector('.b24-field-hover-button, .b24-hover-pill-content');
				if (trigger?.isConnected) {
					trigger.focus();
				}
			},
			updateUsers(userIds) {
				this.$emit('update', userIds);
			},
			handleHintClick() {
				this.$emit('hintClick');
				this.hintPromise.resolve(true);
				this.isHintShown = false;
			},
			closeHint() {
				this.hintPromise.resolve(false);
				this.isHintShown = false;
			},
			async loadUsersAbsenceInfo(items = []) {
				const loadedUserIds = await tasks_v2_component_absencePopup.loadUsersAbsenceInfo(items);
				if (loadedUserIds.length > 0) {
					this.$emit('absenceLoaded', loadedUserIds);
				}
			}
		},
		template: `
		<div
			ref="root"
			v-bind="dataset"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
			@focusin="isFocusWithin = true"
			@focusout="isFocusWithin = false"
		>
			<FieldAdd
				v-if="userCount === 0"
				:icon="Outline.PERSON"
				:ariaLabel="addAriaLabel || ariaLabel"
				:ariaHaspopup
				:ariaExpanded="ariaLabel ? isDialogShown : null"
				:isLocked
				@click="showDialog"
			/>
			<div v-else-if="inline && userCount > 1 || avatarOnly" class="tasks-field-users-inline">
				<HoverPill
					compact
					:ariaLabel
					:ariaHaspopup
					:ariaExpanded="ariaLabel ? isDialogShown : null"
					@click="handleClick"
				>
					<template v-for="userId in bodyUserIds" :key="userId">
						<UserLabel class="tasks-field-user --inline" :user="getUser(userId)" avatarOnly/>
					</template>
				</HoverPill>
				<More
					:count="moreUserIds.length"
					:withRemove
					inline
					@showMore="handleMore"
					@removeAll="removeAll"
				/>
			</div>
			<div v-else>
				<FieldHoverButton
					v-if="canAdd && !inline"
					:icon="Outline.PLUS_L"
					:isVisible="isDialogShown || isHovered || isFocusWithin"
					:isLocked
					:ariaLabel
					:ariaHaspopup
					:ariaExpanded="ariaLabel ? isDialogShown : null"
					@click="showDialog(true)"
				/>
				<Users
					:taskId
					:isEdit
					:userIds="bodyUserIds"
					:canAdd
					:canRemove="canRemove && !multipleOnPlus"
					:removableUserId
					:single
					:inline
					:showMenu
					:forceEdit
					:ariaLabel
					:userAriaLabelTemplate
					:ariaHaspopup
					:ariaExpanded="ariaLabel ? isDialogShown : null"
					:clearAriaLabel
					@edit="showDialog"
					@remove="removeUser"
				>
					<template #user="slotProps">
						<slot name="user" v-bind="slotProps"/>
					</template>
				</Users>
				<More
					:count="moreUserIds.length"
					:withRemove
					@showMore="handleMore"
					@removeAll="removeAll"
				/>
			</div>
			<div ref="anchor"/>
		</div>
		<Popup v-if="isMoreShown" :options="popupOptions()" @close="isMoreShown = false">
			<Users
				:taskId
				:isEdit
				:userIds="popupUserIds"
				:canAdd
				:canRemove
				:removableUserId
				:single
				:showMenu
				:forceEdit
				:clearAriaLabel
				fromPopup
				@edit="showDialog"
				@remove="removeUser"
			>
				<template #user="slotProps">
					<slot name="user" v-bind="slotProps"/>
				</template>
			</Users>
		</Popup>
		<Hint v-if="isHintShown" :bindElement="$refs.anchor" :options="hintOptions" @close="closeHint">
			<RichLoc class="tasks-field-users-hint" :text="hintText" placeholder="[action]">
				<template #action="{ text }">
					<span @click="handleHintClick">{{ text }}</span>
				</template>
			</RichLoc>
		</Hint>
	`
	};
	function Resolvable() {
		const promise = new Promise(resolve => {
			this.resolve = resolve;
		});
		promise.resolve = this.resolve;
		return promise;
	}

	exports.Participants = Participants;

})(this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}, BX.UI.Vue3.Components, BX.UI.Vue3.Components, BX.UI.IconSet, window, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Component, BX.Tasks.V2.Provider.Service, BX.Event, BX.UI.System.Menu);
//# sourceMappingURL=participants.bundle.js.map
