import { Type, type JsonObject } from 'main.core';
import { HeadlineLg, TextSm } from 'ui.system.typography.vue';

import { ButtonPanel } from 'im.v2.component.content.chat-forms.elements';
import { Loader } from 'im.v2.component.elements.loader';
import { SystemFolderCode, type SystemFolderCodeItem } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { Notifier } from 'im.v2.lib.notifier';
import { type ImModelFolder } from 'im.v2.model';
import { FolderService, type FolderSourceItem } from 'im.v2.provider.service.folder';

import { SourceItem } from './source-item';

import './css/all-folder-settings.css';

// @vue/component
export const AllFolderSettings = {
	name: 'AllFolderSettings',
	components: { ButtonPanel, HeadlineLg, Loader, SourceItem, TextSm },
	props: {
		// Every content component of a layout is handed `entityId`. This screen serves exactly one
		// folder, so it takes the id from the folder registry and leaves the layout parameter alone.
		entityId: {
			type: String,
			default: '',
		},
	},
	data(): JsonObject
	{
		return {
			isLoading: true,
			isSaving: false,
			items: [],
			initialCodes: [],
		};
	},
	computed: {
		// The one folder the screen serves. Everything it shows of it - the id the sources are asked for
		// and the title of the header - is taken from the registry and from nowhere else. A registry
		// without that folder answers with null, and then there is no screen: see `created()`.
		folder(): ?ImModelFolder
		{
			return this.$store.getters['recent/folders/getByCode'](SystemFolderCode.all);
		},
		folderId(): number
		{
			return this.folder.id;
		},
		// A source whose folder is missing from the registry gets no row. Both are filled the same way at
		// the start of the application, so this is a tab that outlived a change of the availability and
		// not a normal state - a row without a title of its own would break on the folder it cannot find.
		// The set below keeps such a source all the same: dropping it would switch off what was never
		// shown.
		sourceRows(): FolderSourceItem[]
		{
			return this.items.filter((item: FolderSourceItem) => {
				return Boolean(this.$store.getters['recent/folders/getById'](item.folderId));
			});
		},
		// The whole set that goes to the server. A locked item never travels, neither on nor off:
		// the mandatory base of the folder is the business of the server alone.
		codesToSave(): SystemFolderCodeItem[]
		{
			const codes = [];
			this.items.forEach((item: FolderSourceItem) => {
				if (!item.togglable)
				{
					return;
				}

				if (item.enabled)
				{
					codes.push(item.code);
				}
			});

			return codes;
		},
		hasChanges(): boolean
		{
			if (this.codesToSave.length !== this.initialCodes.length)
			{
				return true;
			}

			const initialCodes = new Set(this.initialCodes);

			return this.codesToSave.some((code: SystemFolderCodeItem) => !initialCodes.has(code));
		},
	},
	created()
	{
		// The composition of the All folder belongs to the server, so a session left without that folder
		// has nothing to show here - not even the title of the header. The screen then leaves the way both
		// of its buttons leave it and asks for no sources at all. It is reachable past the menu that opens
		// the screen: the reload of the desktop restores the saved layout by its name alone.
		if (!this.folder)
		{
			void LayoutManager.getInstance().restoreOriginLayout();

			return;
		}

		void this.fillSnapshot();
	},
	methods: {
		// The snapshot is taken once, when the screen opens: a folder update arriving from another
		// device leaves the choice the user is making here untouched.
		async fillSnapshot()
		{
			try
			{
				const { sources } = await (new FolderService()).getSources(this.folderId);
				if (!Type.isArray(sources))
				{
					// An empty set is a legitimate answer - a portal where nothing of the composition is
					// switchable. A missing one is no answer at all, and the service reports the refusals
					// of the rest alone, so this one is told to the user here.
					Notifier.folder.onSourcesLoadError();

					return;
				}

				// the items keep the order of the answer, the screen never sorts them
				this.items = sources.map((source: FolderSourceItem) => ({ ...source }));
				this.initialCodes = [...this.codesToSave];
			}
			catch
			{
				// the service reports the refusal on its own; the screen stays put with an empty card
				return;
			}
			finally
			{
				this.isLoading = false;
			}
		},
		onSourceToggle(folderId: number, enabled: boolean)
		{
			const item = this.items.find((source: FolderSourceItem) => source.folderId === folderId);
			if (!item)
			{
				return;
			}

			item.enabled = enabled;
		},
		async onSave()
		{
			this.isSaving = true;
			try
			{
				await (new FolderService()).updateSources(this.folderId, this.codesToSave);
			}
			catch
			{
				// the service reports the refusal on its own; the screen keeps the choice and stays put
				return;
			}
			finally
			{
				this.isSaving = false;
			}

			// The screen leaves the way the cancel leaves it - on the layout it was entered from, chat and
			// all. Opening the folder by its name alone would take that chat away, and the cache that
			// could give one back holds nothing for a collab or a nested chat.
			void LayoutManager.getInstance().restoreOriginLayout();
		},
		onCancel()
		{
			void LayoutManager.getInstance().restoreOriginLayout();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<template v-if="folder">
			<div
				class="bx-im-content-folder-forms__container --all-folder-settings"
				data-testid="all-folder-settings-container"
			>
				<div class="bx-im-content-folder-all-settings__header" data-testid="all-folder-settings-header">
					<div class="bx-im-content-folder-all-settings__icon"></div>
					<HeadlineLg
						className="bx-im-content-folder-all-settings__title"
						data-testid="all-folder-settings-title"
					>
						{{ folder.title }}
					</HeadlineLg>
				</div>
				<div class="bx-im-content-folder-forms__heading" data-testid="all-folder-settings-base-note">
					{{ loc('IM_FOLDER_ALL_SETTINGS_HEADING_TITLE') }}
				</div>
				<TextSm
					tag="div"
					className="bx-im-content-folder-all-settings__section-title"
					data-testid="all-folder-settings-section-title"
				>
					{{ loc('IM_FOLDER_ALL_SETTINGS_SECTION_TITLE') }}
				</TextSm>
				<div class="bx-im-content-folder-all-settings__card" data-testid="all-folder-settings-card">
					<div
						v-if="isLoading"
						class="bx-im-content-folder-all-settings__loader"
						data-testid="all-folder-settings-loader"
					>
						<Loader />
					</div>
					<SourceItem
						v-for="item in sourceRows"
						:key="item.folderId"
						:item="item"
						@toggle="onSourceToggle"
					/>
				</div>
			</div>
			<ButtonPanel
				:isCreating="isSaving"
				:createButtonDisabled="!hasChanges"
				:createButtonTitle="loc('IM_UPDATE_FOLDER_CONFIRM')"
				forceAirDesign
				@create="onSave"
				@cancel="onCancel"
			/>
		</template>
	`,
};
