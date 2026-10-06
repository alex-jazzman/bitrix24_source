import { Type, Loc, Text } from 'main.core';
import { MenuManager, type Menu } from 'main.popup';
import type { BaseEvent } from 'main.core.events';

import { VueUploaderComponent } from 'ui.uploader.vue';
import { TileWidgetComponent, TileWidgetSlot, TileWidgetOptions, TileWidgetItem } from 'ui.uploader.tile-widget';
import type { BitrixVueComponentProps } from 'ui.vue3';
import type { UploaderOptions } from 'ui.uploader.core';

import UserFieldWidget from './user-field-widget';
import UserFieldControl from './user-field-control';
import ItemMenu from './item-menu';
import SettingsMenu from './settings-menu';
import { ControlPanel } from './components/control-panel';
import { DocumentPanel } from './components/document-panel';
import { FileList } from './components/file-list';
import type { UserFieldWidgetOptions, UserFieldWidgetViewMode } from './user-field-widget-options';

import './css/user-field-widget-component.css';

/**
 * @memberof BX.Disk.Uploader
 * @vue/component
 */
export const UserFieldWidgetComponent: BitrixVueComponentProps = {
	name: 'UserFieldWidget',
	components: {
		TileWidgetComponent,
		DocumentPanel,
		FileList,
	},
	extends: VueUploaderComponent,
	provide(): Object
	{
		return {
			userFieldControl: this.userFieldControl,
			postForm: this.userFieldControl.getMainPostForm(),
			getMessage: this.getMessage,
		};
	},
	props: {
		visibility: {
			type: String,
			default(props): string
			{
				const mainPostFormContext = Type.isElementNode(props.widgetOptions.eventObject);

				return mainPostFormContext ? 'hidden' : 'both';
			},
		},
	},
	setup(): Object
	{
		return {
			customUploaderOptions: UserFieldWidget.getDefaultUploaderOptions(),
		};
	},
	data(): Object
	{
		return {
			documentsCollapsed: this.visibility === 'both',
			priorityVisibility: null,
		};
	},
	computed: {
		viewMode(): UserFieldWidgetViewMode
		{
			return this.widgetOptions.viewMode === 'list' ? 'list' : 'tile';
		},
		insertIntoTextEnabled(): boolean
		{
			return (
				Type.isBoolean(this.widgetOptions.insertIntoText)
					? this.widgetOptions.insertIntoText
					: this.userFieldControl.getMainPostForm() !== null
			);
		},
		menuContext(): Object
		{
			return {
				readonly: this.widgetOptions.readonly === true || this.widgetOptions.tileWidgetOptions?.readonly === true,
				removeFromServer: this.widgetOptions.tileWidgetOptions?.removeFromServer !== false,
				insertIntoText: this.insertIntoTextEnabled,
			};
		},
		tileWidgetOptions(): TileWidgetOptions {
			const widgetOptions: UserFieldWidgetOptions = this.widgetOptions;
			const tileWidgetOptions: TileWidgetOptions = (
				Type.isPlainObject(widgetOptions.tileWidgetOptions)
					? { ...widgetOptions.tileWidgetOptions }
					: {}
			);

			tileWidgetOptions.slots = Type.isPlainObject(tileWidgetOptions.slots) ? tileWidgetOptions.slots : {};

			if (widgetOptions.withControlPanel !== false)
			{
				tileWidgetOptions.slots[TileWidgetSlot.AFTER_TILE_LIST] = ControlPanel;
			}
			tileWidgetOptions.insertIntoText = this.insertIntoTextEnabled;

			tileWidgetOptions.showItemMenuButton = true;

			tileWidgetOptions.events = tileWidgetOptions.events || {};
			tileWidgetOptions.events['TileItem:onMenuCreate'] = (event: BaseEvent): void => {
				const { item, menu }: { item: TileWidgetItem, menu: Menu } = event.getData();
				const itemMenu: ItemMenu = new ItemMenu(this.userFieldControl, item, menu, this.menuContext);
				itemMenu.build();
			};

			if (this.userFieldControl.getMainPostForm() !== null)
			{
				tileWidgetOptions.events.onInsertIntoText = (event: BaseEvent): void => {
					const { item }: { item: TileWidgetItem } = event.getData();
					this.userFieldControl.getMainPostForm().insertIntoText(item);
				};

				tileWidgetOptions.enableDropzone = false;
			}

			const settingsMenu: SettingsMenu = new SettingsMenu(this.userFieldControl);
			if (settingsMenu.hasItems())
			{
				tileWidgetOptions.showSettingsButton = true;
				tileWidgetOptions.events['SettingsButton:onClick'] = (event: BaseEvent): void => {
					const { button } = event.getData();
					settingsMenu.toggle(button);
				};
			}

			return tileWidgetOptions;
		},
		shouldShowCreateDocumentLink(): boolean
		{
			return (
				this.userFieldControl.canCreateDocuments()
				&& this.documentsCollapsed
				&& this.finalVisibility === 'both'
			);
		},
		shouldShowDocuments(): boolean
		{
			return (
				this.userFieldControl.canCreateDocuments()
				&& (
					this.finalVisibility === 'documents'
					|| (this.finalVisibility === 'both' && !this.documentsCollapsed)
				)
			);
		},
		finalVisibility(): string
		{
			if (this.priorityVisibility !== null)
			{
				return this.priorityVisibility;
			}

			return this.visibility;
		},
	},
	beforeCreate(): void
	{
		this.userFieldControl = new UserFieldControl(this);
		this.listMenu = null;
	},
	beforeUnmount(): void
	{
		this.userFieldControl.destroy();
		if (this.listMenu)
		{
			this.listMenu.destroy();
			this.listMenu = null;
		}
	},
	methods: {
		getMessage(code: string, replacements?: Object<string, string>): ?string
		{
			return Loc.getMessage(code, replacements);
		},

		enableAutoCollapse(): void
		{
			this.$refs.tileWidget.enableAutoCollapse();
		},

		getUploaderOptions(): UploaderOptions
		{
			return UserFieldWidget.prepareUploaderOptions(this.uploaderOptions);
		},
		getUserFieldControl(): UserFieldControl
		{
			return this.userFieldControl;
		},

		handleListMenuClick(payload: {
			item: TileWidgetItem,
			bindElement: HTMLElement,
			onMenuShow?: () => void,
			onMenuClose?: () => void,
		}): void
		{
			const { item, bindElement, onMenuShow, onMenuClose } = payload;
			if (!Type.isElementNode(bindElement))
			{
				return;
			}

			if (this.listMenu)
			{
				this.listMenu.destroy();
			}

			this.listMenu = MenuManager.create({
				id: `disk-user-field-list-item-menu-${Text.getRandom().toLowerCase()}`,
				bindElement,
				targetContainer: document.body,
				angle: true,
				offsetLeft: 13,
				cacheable: false,
				items: [],
				events: {
					onShow: (): void => {
						// The child owns aria-expanded reactively; toggle its flag instead
						// of mutating the DOM, so a rerender cannot reset the attribute.
						onMenuShow?.();
					},
					onClose: (): void => {
						onMenuClose?.();
						bindElement.focus();
					},
					onDestroy: (): void => {
						// destroy() fires only onDestroy (not onClose), so reset the item's flag here too,
						// otherwise switching to another file's menu leaves the previous "..." button visible.
						onMenuClose?.();
						this.listMenu = null;
					},
				},
			});

			const itemMenu: ItemMenu = new ItemMenu(this.userFieldControl, item, this.listMenu, this.menuContext);
			itemMenu.buildAll();

			this.listMenu.show();
		},
	},
	template: `
		<div
			class="disk-user-field-control"
			:class="{ '--has-files': items.length > 0, '--embedded': widgetOptions.isEmbedded }"
			:style="{ display: finalVisibility === 'hidden' ? 'none' : 'block' }"
			ref="container"
		>
			<div 
				class="disk-user-field-uploader-panel"
				:class="[{ '--hidden': finalVisibility !== 'uploader' && finalVisibility !== 'both' }]"
				ref="uploader-container"
			>
				<FileList
					v-if="viewMode === 'list'"
					:items="items"
					@menuClick="handleListMenuClick"
				/>
				<TileWidgetComponent
					v-else
					:widgetOptions="tileWidgetOptions"
					:uploader-adapter="adapter"
					ref="tileWidget"
				/>
			</div>
			<div
				class="disk-user-field-create-document"
				v-if="shouldShowCreateDocumentLink"
				@click="documentsCollapsed = false"
			>{{ getMessage('DISK_UF_WIDGET_CREATE_DOCUMENT') }}</div>
			<div
				class="disk-user-field-document-panel"
				:class="{ '--single': finalVisibility !== 'both' }"
				ref="document-container"
				v-if="shouldShowDocuments"
			>
				<DocumentPanel />
			</div>
		</div>
	`,
};
