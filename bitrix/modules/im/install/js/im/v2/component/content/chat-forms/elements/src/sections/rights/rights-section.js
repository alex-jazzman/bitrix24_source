import { UserRole, PopupType, ChatType, ChatActionGroup } from 'im.v2.const';
import { type DropdownItem } from 'im.v2.component.elements.dropdown';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { CreateChatSection } from '../section/section';
import { RoleSelector } from './components/role-selector';
import { ManagersSelector } from './components/user-selector/managers';
import { OwnerSelector } from './components/user-selector/owner';
import { UserSelector } from './components/user-selector/user-selector';
import {
	BlocksByChatType,
	CanAddUsersCaptionByChatType,
	CanSendMessageCaptionByChatType,
	CanKickUsersCaptionByChatType,
	OwnerHintByChatType,
	ManagerHintByChatType,
	AddUsersHintByChatType,
	DeleteUsersHintByChatType,
	ManageUiHintByChatType,
	SendMessagesHintByChatType,
} from './const/config';
import { getDropdownItemsWithDefault } from './helpers/get-dropdown-items-with-default.js';

type UserRoleItem = $Keys<typeof UserRole>;

// @vue/component
export const RightsSection = {
	name: 'RightsSection',
	components: { CreateChatSection, RoleSelector, UserSelector, OwnerSelector, ManagersSelector },
	props: {
		ownerId: {
			type: Number,
			required: true,
		},
		managerIds: {
			type: Array,
			required: true,
		},
		manageUsersAdd: {
			type: String,
			required: true,
		},
		manageUsersDelete: {
			type: String,
			required: true,
		},
		manageUi: {
			type: String,
			required: true,
		},
		manageMessages: {
			type: String,
			required: true,
		},
		manageGuestInvites: {
			type: String,
			default: '',
		},
		chatType: {
			type: String,
			default: ChatType.chat,
		},
	},
	emits: ['ownerChange', 'managersChange', 'rightChange'],
	computed: {
		PopupType: () => PopupType,
		manageUsersAddItems(): DropdownItem[]
		{
			return getDropdownItemsWithDefault(this.manageUsersAdd);
		},
		manageUsersDeleteItems(): DropdownItem[]
		{
			return getDropdownItemsWithDefault(this.manageUsersDelete);
		},
		manageUiItems(): DropdownItem[]
		{
			return getDropdownItemsWithDefault(this.manageUi);
		},
		manageMessagesItems(): DropdownItem[]
		{
			return getDropdownItemsWithDefault(this.manageMessages);
		},
		manageGuestInvitesItems(): DropdownItem[]
		{
			return getDropdownItemsWithDefault(this.manageGuestInvites);
		},
		showManageGuestInvitesBlock(): boolean
		{
			if (!FeatureManager.isFeatureAvailable(Feature.isChatWithGuestsAvailable))
			{
				return false;
			}

			if (!this.manageGuestInvites)
			{
				return false;
			}

			const blocksByType = BlocksByChatType[this.chatType] ?? BlocksByChatType.default;

			return blocksByType.has(ChatActionGroup.manageGuestInvites);
		},
		showManageUiBlock(): boolean
		{
			const blocksByType = BlocksByChatType[this.chatType] ?? BlocksByChatType.default;

			return blocksByType.has(ChatActionGroup.manageUi);
		},
		canAddUsersCaption(): string
		{
			return CanAddUsersCaptionByChatType[this.chatType] ?? CanAddUsersCaptionByChatType.default;
		},
		canKickUsersCaption(): string
		{
			return CanKickUsersCaptionByChatType[this.chatType] ?? CanKickUsersCaptionByChatType.default;
		},
		canSendCaption(): string
		{
			return CanSendMessageCaptionByChatType[this.chatType] ?? CanSendMessageCaptionByChatType.default;
		},
		ownerHint(): string
		{
			return OwnerHintByChatType[this.chatType] ?? OwnerHintByChatType.default;
		},
		managerHint(): string
		{
			return ManagerHintByChatType[this.chatType] ?? ManagerHintByChatType.default;
		},
		addUsersHint(): string
		{
			return AddUsersHintByChatType[this.chatType] ?? AddUsersHintByChatType.default;
		},
		deleteUsersHint(): string
		{
			return DeleteUsersHintByChatType[this.chatType] ?? DeleteUsersHintByChatType.default;
		},
		manageUiHint(): string
		{
			return ManageUiHintByChatType[this.chatType] ?? ManageUiHintByChatType.default;
		},
		sendMessagesHint(): string
		{
			return SendMessagesHintByChatType[this.chatType] ?? SendMessagesHintByChatType.default;
		},
	},
	methods: {
		onOwnerChange(ownerId: number)
		{
			this.$emit('ownerChange', ownerId);
		},
		onManagersChange(managerIds: number[])
		{
			this.$emit('managersChange', managerIds);
		},
		emitRight(name: string, value: UserRoleItem)
		{
			this.$emit('rightChange', { name, value });
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<CreateChatSection name="rights" :title="loc('IM_CREATE_CHAT_RIGHTS_SECTION')">
			<UserSelector :title="loc('IM_CREATE_CHAT_SETTINGS_SECTION_OWNER')" :hintText="ownerHint">
				<OwnerSelector :ownerId="ownerId" @ownerChange="onOwnerChange" />
			</UserSelector>
			<UserSelector :title="loc('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGERS')" :hintText="managerHint">
				<ManagersSelector :managerIds="managerIds" @managersChange="onManagersChange" />
			</UserSelector>
			<RoleSelector
				:title="canAddUsersCaption"
				:hintText="addUsersHint"
				:dropdownId="PopupType.createChatManageUsersAddMenu"
				:dropdownItems="manageUsersAddItems"
				@itemChange="emitRight('manageUsersAdd', $event)"
			/>
			<RoleSelector
				v-if="showManageGuestInvitesBlock"
				:title="loc('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGE_GUEST_INVITES')"
				:hintText="loc('IM_CREATE_CHAT_MANAGE_GUEST_INVITES_HINT')"
				:dropdownId="PopupType.createChatManageGuestInvitesMenu"
				:dropdownItems="manageGuestInvitesItems"
				@itemChange="emitRight('manageGuestInvites', $event)"
			/>
			<RoleSelector
				:title="canKickUsersCaption"
				:hintText="deleteUsersHint"
				:dropdownId="PopupType.createChatManageUsersDeleteMenu"
				:dropdownItems="manageUsersDeleteItems"
				@itemChange="emitRight('manageUsersDelete', $event)"
			/>
			<RoleSelector
				v-if="showManageUiBlock"
				:title="loc('IM_CREATE_CHAT_RIGHTS_SECTION_MANAGE_UI_MSGVER_2')"
				:hintText="manageUiHint"
				:dropdownId="PopupType.createChatManageUiMenu"
				:dropdownItems="manageUiItems"
				@itemChange="emitRight('manageUi', $event)"
			/>
			<RoleSelector
				:title="canSendCaption"
				:hintText="sendMessagesHint"
				:dropdownId="PopupType.createChatManageMessagesMenu"
				:dropdownItems="manageMessagesItems"
				@itemChange="emitRight('manageMessages', $event)"
			/>
		</CreateChatSection>
	`,
};
