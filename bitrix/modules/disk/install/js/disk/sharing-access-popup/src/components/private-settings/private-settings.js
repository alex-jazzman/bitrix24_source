import { Loc, Extension } from 'main.core';
import { postAccessPrivateRights } from '../../api';
import { notify } from '../../utils/notify.js';
import {
	ACCESS_PRIVATE_SELECT_ITEMS,
	DEFAULT_MAX_TASK_NAME,
	PREFERRED_DEFAULT_TASK_NAME,
	TASK_WEIGHT,
} from '../consts';
import { AccessSelect as PrivateAccessSelect } from '../access-select';
import { PrivateAccessAddEmployess } from './private-add-employess';
import { PrivateAccessDescription } from './private-description';
import { PrivateAccessFullSettingsSwitcher } from './private-full-settings-switcher';
import { PrivateAccessCheckout } from './private-access-checkout';
import { AccessCopyLink } from '../copy-link';
import { helpDesk } from '../../utils/help-desk';

const extensionSettings = Extension.getSettings('disk.sharing-access-popup');
const membersAccessDisableReasons = extensionSettings.get('membersAccessDisableReasons', {});
const limitSliders = extensionSettings.get('limitSliders', {});

function cloneMembers(membersById)
{
	const result = {};

	Object.keys(membersById).forEach((entityId) => {
		result[entityId] = { ...membersById[entityId] };
	});

	return result;
}

function getDefaultTaskName(maxTaskName = DEFAULT_MAX_TASK_NAME)
{
	return TASK_WEIGHT[maxTaskName] >= TASK_WEIGHT[PREFERRED_DEFAULT_TASK_NAME]
		? PREFERRED_DEFAULT_TASK_NAME
		: maxTaskName;
}

function getMembersDraftByIdFromAccessRights(accessRights)
{
	const members = accessRights?.membersAccess?.members ?? [];
	const owner = accessRights?.membersAccess?.owner ?? {};
	const maxTaskName = owner.maxTaskName ?? DEFAULT_MAX_TASK_NAME;
	const readOnly = owner.canOnlyShare === true;

	return members.reduce((acc, member) => {
		acc[member.entityId] = {
			entityId: member.entityId,
			title: member.name,
			avatar: member.avatar,
			right: member.right,
			maxTaskName,
			readOnly,
		};

		return acc;
	}, {});
}

function stringifyBoolean(value)
{
	return String(value === true);
}

// @vue/component
export const SharingAccessPrivateSettings = {
	name: 'SharingAccessPrivateSettings',
	components: {
		PrivateAccessDescription,
		PrivateAccessSelect,
		PrivateAccessFullSettingsSwitcher,
		PrivateAccessCheckout,
		PrivateAccessAddEmployess,
		AccessCopyLink,
	},
	props: {
		accessRights: { type: Object, default: null },
		objectId: { type: [Number, String], required: true },
		entityType: { type: String, default: 'FILE' },
	},
	emits: ['reloadAccessRights'],
	data() {
		return {
			isChangeSettings: false,
			selectedAccessId: 'D',
			accessItems: ACCESS_PRIVATE_SELECT_ITEMS,
			isAccessRightsSaving: false,
			isActiveFullSettings: false,
			isDownload: false,
			isAllowControl: false,
			membersDraftById: {},
		};
	},
	computed: {
		getLink()
		{
			const unifiedLink = this.accessRights?.membersAccess?.unifiedLink;

			return unifiedLink?.link ?? '';
		},
		canChangeRights()
		{
			return this.accessRights?.membersAccess?.canChangeRights === true;
		},
		membersAccessDisableReason()
		{
			return this.accessRights?.membersAccessDisableReason ?? null;
		},
		isSettingsBlocked()
		{
			return this.membersAccessDisableReason === membersAccessDisableReasons.feature;
		},
		memberItems()
		{
			return Object.values(this.membersDraftById);
		},
		numberEmployees()
		{
			return this.memberItems.length;
		},
	},
	watch: {
		accessRights: {
			immediate: true,
			handler(next)
			{
				this.syncPrivateFlags(next);
				this.syncUnifiedLink(next);
				this.syncMembers(next);
			},
		},
	},
	methods: {
		getTariffSliderCode()
		{
			return limitSliders.membersAccessFileTariff;
		},
		handleBlockedPrivateSettings()
		{
			if (!this.isSettingsBlocked)
			{
				return;
			}

			helpDesk(this.getTariffSliderCode());
		},
		toggleSettings()
		{
			if (!this.canChangeRights)
			{
				return;
			}

			this.isChangeSettings = !this.isChangeSettings;
		},
		syncPrivateFlags(next)
		{
			this.isDownload = next?.allowDownloadingWithViewingRights === true;
			this.isAllowControl = next?.allowManagePublicAccessWithViewingRights === true;
		},
		syncUnifiedLink(next)
		{
			const currentAccessLevel = next?.membersAccess?.unifiedLink?.currentAccessLevel;

			if (currentAccessLevel && this.accessItems.some((item) => item.id === currentAccessLevel))
			{
				this.selectedAccessId = currentAccessLevel;
			}
		},
		syncMembers(next)
		{
			this.membersDraftById = getMembersDraftByIdFromAccessRights(next);

			if ((next?.membersAccess?.members?.length ?? 0) > 0)
			{
				this.isActiveFullSettings = true;
			}
		},
		async onFullSettingsToggle(next)
		{
			if (this.isAccessRightsSaving || next === this.isActiveFullSettings)
			{
				return;
			}

			if (next)
			{
				this.isActiveFullSettings = true;

				return;
			}

			const prevMembersDraftById = cloneMembers(this.membersDraftById);
			const prevIsActiveFullSettings = this.isActiveFullSettings;

			this.isActiveFullSettings = false;
			this.membersDraftById = {};

			try
			{
				await this.savePrivateRights();
			}
			catch
			{
				this.membersDraftById = prevMembersDraftById;
				this.isActiveFullSettings = prevIsActiveFullSettings;
			}
		},
		getMembersSignature(membersById)
		{
			return Object.values(membersById)
				.map((member) => `${member.entityId}:${member.right}`)
				.sort()
				.join('|');
		},
		buildMembersDraftById(items, sourceMembersById = this.membersDraftById)
		{
			const owner = this.accessRights?.membersAccess?.owner ?? {};
			const savedMembersById = getMembersDraftByIdFromAccessRights(this.accessRights);
			const maxTaskName = owner.maxTaskName ?? DEFAULT_MAX_TASK_NAME;
			const nextDraftById = {};

			items.forEach((item) => {
				const existing = sourceMembersById[item.entityId] ?? savedMembersById[item.entityId];

				nextDraftById[item.entityId] = {
					entityId: item.entityId,
					title: item.title,
					avatar: item.avatar,
					right: existing?.right ?? getDefaultTaskName(maxTaskName),
					maxTaskName: existing?.maxTaskName ?? maxTaskName,
					readOnly: existing?.readOnly ?? false,
				};
			});

			Object.values({ ...savedMembersById, ...sourceMembersById }).forEach((member) => {
				if (member.readOnly && !nextDraftById[member.entityId])
				{
					nextDraftById[member.entityId] = member;
				}
			});

			return nextDraftById;
		},
		buildEntityToNewShared(unifiedAccessLevel = this.selectedAccessId)
		{
			const payload = {};

			if (this.accessRights?.membersAccess?.unifiedLink)
			{
				payload.unifiedLink = {
					newAccessLevel: unifiedAccessLevel,
				};
			}

			Object.values(this.membersDraftById).forEach((member) => {
				payload[member.entityId] = {
					right: member.right,
				};
			});

			return payload;
		},
		buildSavePayload(unifiedAccessLevel = this.selectedAccessId)
		{
			return {
				entityToNewShared: this.buildEntityToNewShared(unifiedAccessLevel),
				allowDownloadingWithViewingRights: stringifyBoolean(this.isDownload),
				allowManagePublicAccessWithViewingRights: stringifyBoolean(this.isAllowControl),
			};
		},
		async savePrivateRights(unifiedAccessLevel = this.selectedAccessId)
		{
			if (this.isAccessRightsSaving)
			{
				return;
			}

			this.isAccessRightsSaving = true;

			try
			{
				await postAccessPrivateRights(
					this.objectId,
					this.buildSavePayload(unifiedAccessLevel),
				);

				this.$emit('reloadAccessRights');
			}
			catch (error)
			{
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
				throw error;
			}
			finally
			{
				this.isAccessRightsSaving = false;
			}
		},
		async onAccessRights(next)
		{
			if (this.isAccessRightsSaving || next === this.selectedAccessId)
			{
				return;
			}

			const prev = this.selectedAccessId;
			this.selectedAccessId = next;

			try
			{
				await this.savePrivateRights(next);
			}
			catch
			{
				this.selectedAccessId = prev;
			}
		},
		async onMembersSelection(items)
		{
			if (this.isAccessRightsSaving)
			{
				return;
			}

			const prevSaved = getMembersDraftByIdFromAccessRights(this.accessRights);
			const nextDraftById = this.buildMembersDraftById(items);

			this.membersDraftById = nextDraftById;

			if (this.getMembersSignature(prevSaved) === this.getMembersSignature(nextDraftById))
			{
				return;
			}

			try
			{
				await this.savePrivateRights();
			}
			catch
			{
				this.membersDraftById = prevSaved;
			}
		},
		onMembersSelectionChange(items)
		{
			if (this.isAccessRightsSaving)
			{
				return;
			}

			const nextDraftById = this.buildMembersDraftById(items);

			if (this.getMembersSignature(this.membersDraftById) === this.getMembersSignature(nextDraftById))
			{
				return;
			}

			this.membersDraftById = nextDraftById;
		},
		async onMemberRightChange({ entityId, right })
		{
			if (this.isAccessRightsSaving)
			{
				return;
			}

			const prev = cloneMembers(this.membersDraftById);
			const current = prev[entityId];

			if (!current || current.readOnly || current.right === right)
			{
				return;
			}

			this.membersDraftById = {
				...this.membersDraftById,
				[entityId]: {
					...current,
					right,
				},
			};

			try
			{
				await this.savePrivateRights();
			}
			catch
			{
				this.membersDraftById = prev;
			}
		},
		async updatePrivateFlag(flagName, value)
		{
			if (this.isAccessRightsSaving || this[flagName] === value)
			{
				return;
			}

			const prev = this[flagName];
			this[flagName] = value;

			try
			{
				await this.savePrivateRights();
			}
			catch
			{
				this[flagName] = prev;
			}
		},
		async onToggleDownload(value)
		{
			await this.updatePrivateFlag('isDownload', value);
		},
		async onToggleAllowControl(value)
		{
			await this.updatePrivateFlag('isAllowControl', value);
		},
	},
	template: `
		<div class="access-private-block__wrapper">
			<PrivateAccessDescription
				:isChangeSettings="isChangeSettings"
				:entityType="entityType"
				:selectedAccessId="selectedAccessId"
				:numberEmployees="numberEmployees"
				:canChangeRights="canChangeRights"
				:isSettingsBlocked="isSettingsBlocked"
				@changeSettings="toggleSettings"
				@blockedSettings="handleBlockedPrivateSettings"
			/>
			<PrivateAccessSelect
				v-if="isChangeSettings"
				:items="accessItems"
				variant="private"
				:selectedId="selectedAccessId"
				@select="onAccessRights"
				/>
			</div>
			<div v-if="isChangeSettings" class="access-private-full-settings__wrapper">
				<PrivateAccessFullSettingsSwitcher
					:isActive="isActiveFullSettings"
					@toggle="onFullSettingsToggle"
				/>
				<div v-if="isActiveFullSettings">
					<PrivateAccessAddEmployess
						:items="memberItems"
						:isSaving="isAccessRightsSaving"
						@selectionChange="onMembersSelectionChange"
						@selectionApply="onMembersSelection"
						@changeRight="onMemberRightChange"
					/>
					<PrivateAccessCheckout
						:isDownload="isDownload"
						@update:isDownload="onToggleDownload"
						:isAllowControl="isAllowControl"
						@update:isAllowControl="onToggleAllowControl"
					/>
				</div>
			</div>
		<div class="access-private-block__copy-link-wrapper">
			<AccessCopyLink :link="getLink" />
		</div>
	`,
};
