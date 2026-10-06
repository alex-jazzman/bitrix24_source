import { Loc, Runtime, Extension } from 'main.core';

import { postAccessPublicRights } from '../../api';
import { buildPublicAccessItems } from '../consts';
import { AccessSelect as PublicAccessSelect } from '../access-select';
import { PublicAccessDateRange } from './public-date-picker';
import { PublicAccessDescription } from './public-description';
import { PublicAccessFooter } from './public-footer';
import { PublicAccessHeader } from './public-header';
import { PublicAccessPassword } from './public-password';
import { notify } from '../../utils/notify';
import { AccessCopyLink } from '../copy-link';
import { helpDesk } from '../../utils/help-desk';

const extensionSettings = Extension.getSettings('disk.sharing-access-popup');
const externalLinkDisableReasons = extensionSettings.get('externalLinkDisableReasons', {});
const limitSliders = extensionSettings.get('limitSliders', {});

// @vue/component
export const SharingAccessPublicSettings = {
	name: 'SharingAccessPublicSettings',
	components: {
		PublicAccessHeader,
		PublicAccessDescription,
		PublicAccessSelect,
		PublicAccessDateRange,
		PublicAccessPassword,
		PublicAccessFooter,
		AccessCopyLink,
	},
	props: {
		isPublic: { type: Boolean, required: true },
		accessRights: { type: Object, default: null },
		objectId: { type: [Number, String], default: null },
		uniqueCode: { type: String, default: null },
		entityType: { type: String, default: 'FILE' },
	},
	emits: ['publicLinkChange'],
	data()
	{
		return {
			isActivePublicLink: false,
			isActivePublicLinkSaving: false,
			isFullSettings: false,
			selectedAccessId: 'read',
			isAccessRightsSaving: false,
			isPassword: false,
			publicPassword: '',
			isPasswordSaving: false,
			isDownload: true,
			accessEndDate: false,
			saveAccessEndDateDebounced: null,
		};
	},
	computed: {
		publicLink()
		{
			return this.accessRights?.publicLink ?? null;
		},
		getPublicLink()
		{
			return this.publicLink?.link ?? '';
		},
		isCopyLinkHiddenByDisableReason()
		{
			return [
				externalLinkDisableReasons.option,
				externalLinkDisableReasons.feature,
				externalLinkDisableReasons.fileOption,
			].includes(this.publicLinkDisabledReason);
		},
		visibleCopyLink()
		{
			return this.isPublic && this.isActivePublicLink && !this.isCopyLinkHiddenByDisableReason;
		},
		hasSavedPassword()
		{
			return Boolean(this.publicLink?.password);
		},
		publicLinkDisabledReason()
		{
			return this.publicLink?.disableReason ?? this.publicLink?.disabledReason ?? null;
		},
		isPublicLinkBlockedByPolicy()
		{
			return Boolean(this.publicLinkDisabledReason);
		},
		canEditPublicLinkSettings()
		{
			return this.publicLink?.canEditSettings !== false;
		},
		isPublicLinkSettingsBlocked()
		{
			return this.isPublicLinkBlockedByPolicy || !this.canEditPublicLinkSettings;
		},
		accessItems()
		{
			const publicLink = this.publicLink;

			if (!publicLink?.enabled)
			{
				return [];
			}

			return buildPublicAccessItems(publicLink.rightsList).items;
		},
		hasEmptyAccessItems()
		{
			return this.isActivePublicLink && this.isFullSettings && this.accessItems.length === 0;
		},
	},
	watch: {
		accessRights: {
			immediate: true,
			handler(next) {
				this.syncPublicLink(next);
				this.syncAccessRights(next);
				this.syncAccessEndDate(next);
				this.syncIsDownload(next);
				this.syncPassword(next);
			},
		},
		isActivePublicLink(next)
		{
			if (!next)
			{
				this.isFullSettings = false;
				this.publicPassword = '';
			}
		},
	},
	created()
	{
		this.saveAccessEndDateDebounced = Runtime.debounce(this.saveAccessEndDate, 400, this);
	},
	methods: {
		getTarget()
		{
			return {
				objectId: this.objectId,
				uniqueCode: this.uniqueCode,
			};
		},
		showSettings()
		{
			if (!this.isFullSettings && this.isPublicLinkSettingsBlocked)
			{
				this.handleBlockedPublicLinkSettings();

				return;
			}

			this.isFullSettings = !this.isFullSettings;
		},
		applyPublicLink(publicLink)
		{
			this.$emit('publicLinkChange', publicLink);
		},
		getTariffSliderCode()
		{
			return limitSliders.externalLinkFileTariff;
		},
		openPublicLinkDetails()
		{
			helpDesk(this.getTariffSliderCode());
		},
		handleBlockedPublicLink(reason = this.publicLinkDisabledReason)
		{
			if (!reason)
			{
				return;
			}

			if (reason === externalLinkDisableReasons.feature)
			{
				helpDesk(this.getTariffSliderCode());

				return;
			}

			if (reason === externalLinkDisableReasons.option || reason === externalLinkDisableReasons.fileOption)
			{
				return;
			}

			notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
		},
		handleBlockedPublicLinkSettings()
		{
			if (!this.canEditPublicLinkSettings)
			{
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_PUBLIC_LINK_EDIT_SETTINGS_DENIED');

				return;
			}

			if (this.isPublicLinkBlockedByPolicy)
			{
				this.handleBlockedPublicLink();

				return;
			}

			notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_PUBLIC_LINK_EDIT_DENIED');
		},
		onBlockedToggleAttempt()
		{
			this.handleBlockedPublicLink();
		},
		syncPublicLink(next)
		{
			const enabled = next?.publicLink?.enabled ?? false;
			this.isActivePublicLink = enabled;
		},
		async onTogglePublicLink(value)
		{
			if (this.isActivePublicLinkSaving)
			{
				return;
			}

			if (this.isPublicLinkBlockedByPolicy)
			{
				this.handleBlockedPublicLink();

				return;
			}

			const prev = this.isActivePublicLink;

			this.isActivePublicLink = value;
			this.isActivePublicLinkSaving = true;

			try
			{
				const publicLink = await postAccessPublicRights(
					this.getTarget(),
					{ enabled: value },
				);

				this.applyPublicLink(publicLink);
			}
			catch
			{
				this.isActivePublicLink = prev;
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
			}
			finally
			{
				this.isActivePublicLinkSaving = false;
			}
		},
		syncAccessRights(next)
		{
			const publicLink = next?.publicLink;

			if (!publicLink?.enabled)
			{
				this.selectedAccessId = 'read';

				return;
			}

			const { items, unknownRights } = buildPublicAccessItems(publicLink.rightsList);

			if (unknownRights.length > 0)
			{
				console.warn('[disk.sharing-access-popup] Unknown public rights codes:', unknownRights);
			}

			if (items.length === 0)
			{
				this.selectedAccessId = '';

				return;
			}

			const rights = publicLink.rights;
			const currentSelectedExists = items.some((item) => item.id === this.selectedAccessId);
			const rightsExists = rights && items.some((item) => item.id === rights);

			if (rightsExists)
			{
				this.selectedAccessId = rights;

				return;
			}

			if (currentSelectedExists)
			{
				return;
			}

			this.selectedAccessId = items[0].id;
		},
		async onAccessRights(next)
		{
			if (this.isAccessRightsSaving || this.isActivePublicLinkSaving)
			{
				return;
			}

			if (!this.isActivePublicLink)
			{
				return;
			}

			if (this.isPublicLinkSettingsBlocked)
			{
				this.handleBlockedPublicLinkSettings();

				return;
			}

			const prev = this.selectedAccessId;

			this.selectedAccessId = next;
			this.isAccessRightsSaving = true;

			try
			{
				const publicLink = await postAccessPublicRights(this.getTarget(), {
					enabled: this.isActivePublicLink,
					rights: next,
				});

				this.applyPublicLink(publicLink);
			}
			catch
			{
				this.selectedAccessId = prev;
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
			}
			finally
			{
				this.isAccessRightsSaving = false;
			}
		},
		syncPassword(next)
		{
			this.isPassword = Boolean(next?.publicLink?.password);

			if (!this.isPassword)
			{
				this.publicPassword = '';
			}
		},
		normalizeAccessEndDate(value)
		{
			return Number.isFinite(value) && value > 0 ? Math.floor(value) : false;
		},
		getPersistedAccessEndDate()
		{
			return this.normalizeAccessEndDate(this.publicLink?.publicLinkTtl);
		},
		async onPasswordToggle(value)
		{
			if (this.isPasswordSaving || this.isActivePublicLinkSaving || !this.isActivePublicLink)
			{
				return;
			}

			if (this.isPublicLinkSettingsBlocked)
			{
				this.handleBlockedPublicLinkSettings();

				return;
			}

			const hadSavedPassword = this.hasSavedPassword;

			if (value)
			{
				this.isPassword = true;

				return;
			}

			this.publicPassword = '';

			if (!hadSavedPassword)
			{
				this.isPassword = false;

				return;
			}

			this.isPasswordSaving = true;

			try
			{
				const publicLink = await postAccessPublicRights(this.getTarget(), {
					enabled: this.isActivePublicLink,
					newPassword: false,
				});

				this.applyPublicLink(publicLink);
				this.isPassword = false;
			}
			catch
			{
				this.isPassword = true;
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
			}
			finally
			{
				this.isPasswordSaving = false;
			}
		},
		async savePublicPassword()
		{
			const password = this.publicPassword.trim();

			if (password.length < 8 || this.isPasswordSaving || !this.isActivePublicLink)
			{
				return;
			}

			if (this.isPublicLinkSettingsBlocked)
			{
				this.handleBlockedPublicLinkSettings();

				return;
			}

			this.isPasswordSaving = true;

			try
			{
				const publicLink = await postAccessPublicRights(this.getTarget(), {
					enabled: this.isActivePublicLink,
					newPassword: password,
				});

				this.applyPublicLink(publicLink);
				this.isPassword = true;
				this.publicPassword = '';
			}
			catch
			{
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
			}
			finally
			{
				this.isPasswordSaving = false;
			}
		},
		syncAccessEndDate(next)
		{
			this.accessEndDate = this.normalizeAccessEndDate(next?.publicLink?.publicLinkTtl);
		},
		onAccessEndDateChange(value)
		{
			if (!this.isActivePublicLink || this.isActivePublicLinkSaving)
			{
				return;
			}

			if (this.isPublicLinkSettingsBlocked)
			{
				this.handleBlockedPublicLinkSettings();

				return;
			}

			const nextValue = this.normalizeAccessEndDate(value);
			if (nextValue === this.accessEndDate)
			{
				return;
			}

			const previousValue = this.getPersistedAccessEndDate();
			this.accessEndDate = nextValue;

			this.saveAccessEndDateDebounced(nextValue, previousValue);
		},
		async saveAccessEndDate(value, previousValue = this.getPersistedAccessEndDate())
		{
			const publicLinkTtl = this.normalizeAccessEndDate(value);
			try
			{
				const publicLink = await postAccessPublicRights(this.getTarget(), {
					enabled: this.isActivePublicLink,
					publicLinkTtl,
				});

				this.applyPublicLink(publicLink);
			}
			catch
			{
				this.accessEndDate = previousValue;
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
			}
		},
		syncIsDownload(next) {
			this.isDownload = next?.publicLink?.canDownloadWithReadAccess ?? true;
		},
		async onToggleDownload(value)
		{
			if (this.isPublicLinkSettingsBlocked)
			{
				this.handleBlockedPublicLinkSettings();

				return;
			}

			const prev = this.isDownload;

			try
			{
				const publicLink = await postAccessPublicRights(this.getTarget(), {
					enabled: this.isActivePublicLink,
					canDownloadWithReadAccess: value,
				});

				this.applyPublicLink(publicLink);
			}
			catch
			{
				this.isDownload = prev;
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
			}
		},
	},
	// TODO: Открыть footer как будет готова настройка на скачивание на бэке
	template: `
		<div v-if="isPublic" class="access-public-block__wrapper">
			<PublicAccessHeader
				:isActive="isActivePublicLink"
				:isDisabled="isActivePublicLinkSaving"
				:isToggleBlocked="isPublicLinkBlockedByPolicy"
				:isLoading="isActivePublicLinkSaving"
				@toggle="onTogglePublicLink"
				@blockedToggle="onBlockedToggleAttempt"

			/>
			<div class="access-public-block__main" :class="{ 'access-public-block__main--filtered': !isActivePublicLink }">
			<PublicAccessDescription
				:selectedAccessId="selectedAccessId"
				:entityType="entityType"
				:isActive="isActivePublicLink"
				:isFullSettings="isFullSettings"
				:accessEndDate="accessEndDate"
				:isPassword="hasSavedPassword"
				:isSettingsBlocked="isPublicLinkSettingsBlocked"
				@toggleSettings="showSettings"
				@blockedSettings="handleBlockedPublicLinkSettings"
			/>
				<div v-if="isActivePublicLink && isFullSettings" class="access-public-block__inputs">
					<PublicAccessSelect
						v-if="accessItems.length > 0"
						:items="accessItems"
						:selectedId="selectedAccessId"
						variant="public"
						@select="onAccessRights"
					/>
					<div v-if="hasEmptyAccessItems">
						${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_ACCESS_EMPTY')}
					</div>
					<PublicAccessDateRange 
						:modelValue="accessEndDate"
						@update:modelValue="onAccessEndDateChange"
					/>
					<PublicAccessPassword
						:isPassword="isPassword"
						:hasSavedPassword="hasSavedPassword"
						:password="publicPassword"
						:isSaving="isPasswordSaving"
						@update:isPassword="onPasswordToggle"
						@update:password="publicPassword = $event"
						@save="savePublicPassword"
					/>
				</div>
			</div>
			<PublicAccessFooter
				v-if="false"
				:isDownload="isDownload"
				@update:isDownload="onToggleDownload"
			/>
		</div>
		<div v-if="visibleCopyLink" class="access-public-block__copy-link-wrapper">
			<AccessCopyLink :link="getPublicLink" />
		</div>
	`,
};
