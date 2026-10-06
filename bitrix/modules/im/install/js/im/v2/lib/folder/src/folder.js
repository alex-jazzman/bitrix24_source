import { Core, type FolderLimits } from 'im.v2.application.core';
import { Layout, RecentType, FolderType, type LayoutType, type RecentTypeItem } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { LayoutManager } from 'im.v2.lib.layout';
import { Notifier } from 'im.v2.lib.notifier';
import { type ImModelFolder, type ImModelLayout } from 'im.v2.model';

const getFolderLimits = (): FolderLimits => Core.getApplicationData().folderLimits;

const LayoutByRecentType: Record<RecentTypeItem, LayoutType> = {
	[RecentType.default]: Layout.chat,
	[RecentType.taskComments]: Layout.taskComments,
	[RecentType.copilot]: Layout.copilot,
	[RecentType.openChannel]: Layout.channel,
	[RecentType.collab]: Layout.collab,
};

export const FolderManager = {
	getMaxFolders(): number
	{
		return getFolderLimits().maxFolders;
	},
	getMaxChatsPerFolder(): number
	{
		return getFolderLimits().maxChatsPerFolder;
	},
	getMaxTitleLength(): number
	{
		return getFolderLimits().maxTitleLength;
	},
	isFolderLimitReached(): boolean
	{
		const personalFolderCount = Core.getStore().getters['recent/folders/getPersonalCount'];

		return personalFolderCount === this.getMaxFolders();
	},
	startCreation(): void
	{
		if (this.isFolderLimitReached())
		{
			Notifier.folder.onFolderLimitError(this.getMaxFolders());

			return;
		}

		void LayoutManager.getInstance().setLayout({ name: Layout.createFolder });
	},
	handleOpenedFolder(folderId: number): void
	{
		const layoutManager = LayoutManager.getInstance();
		const { name: layoutName, params: layoutParams } = layoutManager.getLayout();

		const isFolderOpened = layoutName === Layout.folder && layoutParams.folderId === folderId;
		if (isFolderOpened)
		{
			void layoutManager.setLayout({ name: Layout.chat });
		}
	},
	getLayoutByFolderCode(folderCode: RecentTypeItem): LayoutType
	{
		if (folderCode === RecentType.openlines)
		{
			return FeatureManager.isFeatureAvailable(Feature.openLinesV2) ? Layout.openlinesV2 : Layout.openlines;
		}

		return LayoutByRecentType[folderCode] ?? Layout.chat;
	},
	getPersonalFolderLayout(folderId: number): ImModelLayout
	{
		return { name: Layout.folder, params: { folderId } };
	},
	openPersonalFolder(folderId: number): void
	{
		void LayoutManager.getInstance().setLayout(this.getPersonalFolderLayout(folderId));
	},
	getInitialLayout(): ?ImModelLayout
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isChatFoldersWebAvailable))
		{
			return null;
		}

		const [firstFolder]: ImModelFolder[] = Core.getStore().getters['recent/folders/getList'];
		if (!firstFolder)
		{
			return null;
		}

		if (firstFolder.type === FolderType.personal)
		{
			return this.getPersonalFolderLayout(firstFolder.id);
		}

		return { name: this.getLayoutByFolderCode(firstFolder.code) };
	},
};
