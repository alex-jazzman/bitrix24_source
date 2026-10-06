import { EventEmitter } from 'main.core.events';
import { type JsonObject } from 'main.core';

import { Messenger } from 'im.public';
import { EventType, FolderType } from 'im.v2.const';
import { FolderManager } from 'im.v2.lib.folder';
import { type ImModelFolder } from 'im.v2.model';

import { FolderListSettings } from './components/folder-list-settings/folder-list-settings';
import { PanelItem } from './components/item';
import { PanelSettings } from './components/settings';
import { PanelItemMenu } from './classes/item-menu';

import './css/folder-panel.css';

// @vue/component
export const FolderPanel = {
	name: 'FolderPanel',
	components: { PanelSettings, PanelItem, FolderListSettings },
	data(): JsonObject
	{
		return {
			showFolderList: false,
		};
	},
	computed: {
		folderList(): ImModelFolder[]
		{
			return this.$store.getters['recent/folders/getList'];
		},
	},
	created()
	{
		this.contextMenuManager = new PanelItemMenu();
		this.contextMenuManager.subscribe(PanelItemMenu.events.openFolderList, this.onOpenFolderList);
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
	},
	methods: {
		openSystemFolder(folder: ImModelFolder)
		{
			void Messenger.openNavigationItem({ id: FolderManager.getLayoutByFolderCode(folder.code) });
		},
		openPersonalFolder(folder: ImModelFolder)
		{
			EventEmitter.emit(EventType.recent.closeNestedList);
			FolderManager.openPersonalFolder(folder.id);
		},
		isSystemFolder(folder: ImModelFolder): boolean
		{
			return folder.type === FolderType.system;
		},
		onSelectFolder(folder: ImModelFolder)
		{
			if (this.isSystemFolder(folder))
			{
				this.openSystemFolder(folder);

				return;
			}

			this.openPersonalFolder(folder);
		},
		onFolderRightClick(folder: ImModelFolder, event: PointerEvent)
		{
			const context = { folderId: folder.id, folderType: folder.type };
			const target = { left: event.pageX, top: event.pageY };

			this.contextMenuManager.openMenu(context, target);
		},
		onOpenFolderList()
		{
			this.showFolderList = true;
		},
	},
	template: `
		<div class="bx-im-messenger-folder-panel__container --hidden-scroll" data-testid="folder-panel-container">
			<div class="bx-im-messenger-folder-panel__header">
				<PanelSettings @openFolderList="onOpenFolderList" />
			</div>
			<div class="bx-im-messenger-folder-panel__separator"></div>
			<PanelItem
				v-for="folder in folderList"
				:key="folder.id"
				:item="folder"
				@click="onSelectFolder(folder)"
				@click.right.prevent="onFolderRightClick(folder, $event)"
			/>
		</div>
		<FolderListSettings v-if="showFolderList" @close="showFolderList = false" />
	`,
};
