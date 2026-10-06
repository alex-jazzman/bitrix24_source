import { Runtime, Tag } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { Layout as SidePanelLayout } from 'ui.sidepanel.layout';
import { AirButtonStyle, Button as UiButton, ButtonSize, ButtonIcon } from 'ui.vue3.components.button';

import { FolderManager } from 'im.v2.lib.folder';
import { type ImModelFolder } from 'im.v2.model';
import { FolderService } from 'im.v2.provider.service.folder';

import { FolderListItemMenu } from '../../classes/list-item-menu';
import { FolderListSettingsItem } from './components/folder-list-settings-item';

import './css/folder-list-settings.css';

const SLIDER_ID = 'im:folder-list';
const SLIDER_WIDTH = 456;

// @vue/component
export const FolderListSettings = {
	name: 'FolderListSettings',
	components: { UiButton, FolderListSettingsItem },
	emits: ['close'],
	data()
	{
		return {
			orderedFolders: [],
			isSaving: false,
		};
	},
	computed: {
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
		ButtonIcon: () => ButtonIcon,
		folderList(): ImModelFolder[]
		{
			return this.$store.getters['recent/folders/getList'];
		},
		contentContainer(): HTMLElement
		{
			return Tag.render`<div></div>`;
		},
		footerContainer(): HTMLElement
		{
			return Tag.render`<div></div>`;
		},
		toolbarContainer(): HTMLElement
		{
			return Tag.render`<div></div>`;
		},
	},
	created()
	{
		this.orderedFolders = [...this.folderList];
		this.initialFolderIds = this.orderedFolders.map((folder) => folder.id);

		this.itemMenu = new FolderListItemMenu();
		this.itemMenu.subscribe(FolderListItemMenu.events.editFolder, this.onEditFolder);
		this.openSlider();
	},
	mounted()
	{
		void this.$nextTick(() => this.initDraggable());
	},
	beforeUnmount()
	{
		this.draggable?.destroy();
		this.itemMenu?.destroy();
		this.closeSlider();
	},
	methods: {
		openSlider()
		{
			SidePanel.Instance.open(SLIDER_ID, {
				cacheable: false,
				width: SLIDER_WIDTH,
				contentCallback: () => this.createLayoutContent(),
				events: {
					onCloseComplete: () => this.$emit('close'),
				},
			});
		},
		closeSlider()
		{
			const slider = SidePanel.Instance.getSlider(SLIDER_ID);
			if (!slider)
			{
				return;
			}

			slider.close();
		},
		createLayoutContent(): HTMLElement
		{
			return SidePanelLayout.createContent({
				title: this.loc('IM_MESSENGER_FOLDER_PANEL_MENU_LIST'),
				design: { section: false, alignButtonsLeft: true },
				toolbar: () => [this.toolbarContainer],
				content: () => this.contentContainer,
				buttons: () => [this.footerContainer],
			});
		},
		onItemMenuClick(folder: ImModelFolder, event: PointerEvent)
		{
			const target = { left: event.pageX, top: event.pageY };
			this.itemMenu.openMenu({ folderId: folder.id }, target);
		},
		onEditFolder()
		{
			this.$emit('close');
		},
		onCreateClick()
		{
			FolderManager.startCreation();
			this.$emit('close');
		},
		async initDraggable()
		{
			if (!this.$refs.itemsContainer)
			{
				return;
			}

			const { Draggable } = await Runtime.loadExtension('ui.draganddrop.draggable');

			const container = this.$refs.itemsContainer;
			if (!container)
			{
				return;
			}

			this.draggable = new Draggable({
				container,
				draggable: '.bx-im-folder-list-item__container',
				dragElement: '.bx-im-folder-list-item__handle-icon',
				type: Draggable.CLONE,
				transitionDuration: 0,
			});
			this.draggable.subscribe('end', () => this.syncOrderFromDom());
		},
		syncOrderFromDom()
		{
			const container = this.$refs.itemsContainer;
			if (!container)
			{
				return;
			}

			const folderById = new Map(this.orderedFolders.map((folder) => [folder.id, folder]));
			this.orderedFolders = [...container.querySelectorAll('[data-folder-id]')]
				.map((node) => folderById.get(Number(node.dataset.folderId)))
				.filter(Boolean);
		},
		async onSave()
		{
			const orderedIds = this.orderedFolders.map((folder) => folder.id);
			if (this.isOrderUnchanged(orderedIds))
			{
				this.$emit('close');

				return;
			}

			this.isSaving = true;
			try
			{
				await (new FolderService()).sort(orderedIds);
			}
			finally
			{
				this.isSaving = false;
			}

			this.$emit('close');
		},
		isOrderUnchanged(orderedIds: number[]): boolean
		{
			return orderedIds.length === this.initialFolderIds.length
				&& orderedIds.every((id, index) => id === this.initialFolderIds[index]);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<Teleport :to="toolbarContainer">
			<UiButton
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.FILLED_SUCCESS"
				:collapsed="true"
				:collapsedIcon="ButtonIcon.ADD_M"
				:dataset="{ testid: 'folder-list-settings-create-btn' }"
				@click="onCreateClick"
			/>
		</Teleport>
		<Teleport :to="contentContainer">
			<div class="bx-im-folder-list__container bx-im-messenger__scope" data-testid="folder-list-settings-content">
				<div class="bx-im-folder-list__image"></div>
				<div class="bx-im-folder-list__items" ref="itemsContainer" data-testid="folder-list-settings-items">
					<FolderListSettingsItem
						v-for="folder in orderedFolders"
						:key="folder.id"
						:item="folder"
						@menuClick="onItemMenuClick(folder, $event)"
					/>
				</div>
			</div>
		</Teleport>
		<Teleport :to="footerContainer">
			<div class="bx-im-folder-list__footer" data-testid="folder-list-settings-footer">
				<UiButton
					:size="ButtonSize.MEDIUM"
					:loading="isSaving"
					:text="loc('IM_MESSENGER_FOLDER_LIST_SAVE')"
					:dataset="{ testid: 'folder-list-settings-save-btn' }"
					@click="onSave"
				/>
				<UiButton
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN"
					:text="loc('IM_MESSENGER_FOLDER_LIST_CANCEL')"
					:dataset="{ testid: 'folder-list-settings-cancel-btn' }"
					@click="$emit('close')"
				/>
			</div>
		</Teleport>
	`,
};
