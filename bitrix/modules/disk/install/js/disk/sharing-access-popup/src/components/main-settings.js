import { notify } from '../utils/notify';
import { TYPE_FILE_BOARD, TYPE_FILE_DOCUMENT } from './consts.js';
import { SharingAccessPublicSettings } from './public-settings';
import { SharingAccessPrivateSettings } from './private-settings';
import { getAccessRights } from '../api';
import { SharingAccessLoader } from './loader';
import { AnimateWrapper } from './animate-wrapper';

// @vue/component
export const SharingAccessMainSettings = {
	name: 'SharingAccessState',
	components:
		{
			SharingAccessPublicSettings,
			SharingAccessPrivateSettings,
			SharingAccessLoader,
			AnimateWrapper
		},
	props: {
		isPublic: { type: Boolean, required: true },
		objectId: { type: [Number, String], required: true },
		uniqueCode: { type: String, default: null },
		initialAccessRights: { type: Object, default: null },
		mode: { type: String, default: 'default' },
		closeDialog: { type: Function, required: true },
	},
	data()
	{
		return {
			accessRights: this.initialAccessRights,
			accessRightsLoading: this.initialAccessRights === null,
			// a saving of the public tab outlives the block that started it, so what it blocks is kept
			// here, above the tabs, and comes back together with the tab
			publicSavingState: {
				publicLink: false,
				accessRights: false,
				password: false,
				download: false,
			},
		};
	},
	computed: {
		entityType()
		{
			const typeFile = this.accessRights?.typeFile;

			if (typeFile === null)
			{
				return 'FOLDER';
			}

			switch (Number(typeFile))
			{
				case TYPE_FILE_DOCUMENT:
					return 'DOCUMENT';
				case TYPE_FILE_BOARD:
					return 'BOARD';
				default:
					return 'FILE';
			}
		},
	},
	mounted()
	{
		if (this.accessRightsLoading)
		{
			this.loadAccessRights();
		}
	},
	methods: {
		async loadAccessRights()
		{
			try
			{
				this.accessRights = await getAccessRights({
					objectId: this.objectId,
					uniqueCode: this.uniqueCode,
				});
			}
			catch
			{
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
				this.closeDialog();
			}
			finally
			{
				this.accessRightsLoading = false;
			}
		},
		applyPublicLink(publicLink)
		{
			if (!this.accessRights)
			{
				return;
			}

			this.accessRights = {
				...this.accessRights,
				publicLink,
			};
		},
	},
	template: `
		<SharingAccessLoader v-if="accessRightsLoading"/>
		<div v-else-if="accessRights" class="disk-sharing-access-popup__state">
			<AnimateWrapper>
				<SharingAccessPublicSettings
					v-if="isPublic"
					:objectId="objectId"
					:accessRights="accessRights"
					:uniqueCode="uniqueCode"
					:entityType="entityType"
					:applyPublicLink="applyPublicLink"
					:savingState="publicSavingState"
				/>
				<SharingAccessPrivateSettings
					v-else
					:accessRights="accessRights"
					:objectId="objectId"
					:entityType="entityType"
					:reloadAccessRights="loadAccessRights"
				/>
			</AnimateWrapper>
		</div>
	`,
};
