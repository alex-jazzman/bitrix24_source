import { Type } from 'main.core';

import { Core, type FolderLimits } from 'im.v2.application.core';
import {
	Layout,
	FolderType,
	SystemFolderCode,
	type ChatTypeItem,
	type LayoutType,
	type SystemFolderCodeItem,
} from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { LayoutManager } from 'im.v2.lib.layout';
import { Notifier } from 'im.v2.lib.notifier';
import { type ImModelFolder, type ImModelLayout } from 'im.v2.model';

import { getIconByFolderCode } from './functions/folder-icon';

const getFolderLimits = (): FolderLimits => Core.getApplicationData().folders.limits;

const LayoutBySystemFolderCode: Record<SystemFolderCodeItem, LayoutType> = {
	[SystemFolderCode.default]: Layout.chat,
	[SystemFolderCode.tasksTask]: Layout.taskComments,
	[SystemFolderCode.copilot]: Layout.copilot,
	[SystemFolderCode.openChannel]: Layout.channel,
	[SystemFolderCode.collab]: Layout.collab,
	[SystemFolderCode.vibecodeApp]: Layout.vibecodeApp,
};

// Layouts that belong to folders as such and open straight as a folder layout. The remaining system
// folders (copilot, channels, task chats, collabs) are navigation menu items with a section layout of
// their own. The list is closed and manual: a new folder layout is added here on purpose.
const FolderLayouts: Set<LayoutType> = new Set([Layout.folder, Layout.folderAll]);

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
	// Snapshot of the server rule, already in web chat type values: the client neither copies nor
	// extends it. An empty snapshot closes everything instead of opening everything - the check here is
	// a hint of the interface, and the server refuses a forbidden composition on its own anyway.
	getAllowedChatTypes(): ChatTypeItem[]
	{
		const { folders } = Core.getApplicationData();

		return Type.isArrayFilled(folders.allowedTypes) ? folders.allowedTypes : [];
	},
	// Compare only with chat.type of the chats model: the raw REST type of a one-to-one dialog is
	// 'private', which the web ChatType enum does not have. ChatTypeItem names the meaning of the value
	// and does not close the set: the extended chat type comes from the pair "literal + ENTITY_TYPE",
	// and an unregistered pair makes the ENTITY_TYPE itself the extended type
	// (TypeRegistry::getFallback), so chats of applications, bots and external integrations carry a
	// type outside the enum and simply find no match here.
	canChatBeInFolder(chatType: ChatTypeItem): boolean
	{
		return this.getAllowedChatTypes().includes(chatType);
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
			Analytics.getInstance().folder.onFolderLimitException();
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
			void layoutManager.setLayout(this.getDefaultLayout() ?? { name: Layout.chat });
		}
	},
	// Codes left without a layout on purpose: `all` leaves earlier through the composite branch, and
	// `chat` / `channel` / `tasksTaskRoot` are member folders the server marks invisible.
	getLayoutByFolderCode(folderCode: SystemFolderCodeItem): ?LayoutType
	{
		if (folderCode === SystemFolderCode.openlines)
		{
			return FeatureManager.isFeatureAvailable(Feature.openLinesV2) ? Layout.openlinesV2 : Layout.openlines;
		}

		return LayoutBySystemFolderCode[folderCode] ?? null;
	},
	getPersonalFolderLayout(folderId: number): ImModelLayout
	{
		return { name: Layout.folder, params: { folderId } };
	},
	// Single resolver for any folder. Layout params carry the folder id only for personal folders:
	// there are many of them under one layout name, and the id is what tells them apart. Every other
	// folder owns its layout name alone and needs no discriminator.
	// No layout for the folder code means the folder has no section of its own - nothing to open.
	getFolderLayout(folder: ImModelFolder): ?ImModelLayout
	{
		if (folder.type === FolderType.personal)
		{
			return this.getPersonalFolderLayout(folder.id);
		}

		if (Core.getStore().getters['recent/folders/isComposite'](folder.id))
		{
			return { name: Layout.folderAll };
		}

		const layoutName = this.getLayoutByFolderCode(folder.code);

		return layoutName ? { name: layoutName } : null;
	},
	isFolderLayout(layoutName: LayoutType): boolean
	{
		return FolderLayouts.has(layoutName);
	},
	openPersonalFolder(folderId: number): void
	{
		void LayoutManager.getInstance().setLayout(this.getPersonalFolderLayout(folderId));
	},
	// The layout of the user's main place, asked by every entry that sends the user back and not only
	// by the start of the session. No rule (folders feature off or nothing visible) means null, and the
	// caller keeps today's behavior.
	getDefaultLayout(): ?ImModelLayout
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isChatFoldersWebAvailable))
		{
			return null;
		}

		// Invisible member folders take no part in navigation, so the default folder is the first
		// visible one and not the first one of the registry.
		const [firstFolder]: ImModelFolder[] = Core.getStore().getters['recent/folders/getVisibleList'];
		if (!firstFolder)
		{
			return null;
		}

		return this.getFolderLayout(firstFolder);
	},
	// The place where a plain chat lives now, asked by every entry that opens one. Unlike the default
	// layout above, this one always answers: the result goes straight into setLayout and the call sites
	// keep no fallback of their own. It never looks at the current layout - the only question it
	// answers is where a plain chat is shown.
	getRegularChatsLayout(): ImModelLayout
	{
		const allFolder: ?ImModelFolder = Core.getStore().getters['recent/folders/getByCode'](SystemFolderCode.all);
		// The composition of the All folder belongs to the server, so a folder left without one
		// resolves to nothing - the answer is then the same as with no folder at all.
		const folderLayout = allFolder ? this.getFolderLayout(allFolder) : null;

		return folderLayout ?? { name: Layout.chat };
	},
	// The glyph of a folder, drawn by the source rows of the composition screen; the tile of the folder bar
	// paints its own by a CSS modifier. The table binding a code to a glyph is large enough to live in a
	// file of its own, and the manager keeps it behind one entry.
	getFolderIcon(folderCode: SystemFolderCodeItem): string
	{
		return getIconByFolderCode(folderCode);
	},
	// The only entry to the composition screen of the composite folder, so the layout name stays here and
	// not in the surfaces that open it. The screen finds the folder by its code on its own - the caller has
	// nothing to pass, and the right to open is decided by the caller, not here.
	openAllFolderSettings(): void
	{
		void LayoutManager.getInstance().setLayout({ name: Layout.folderAllSettings });
	},
};
