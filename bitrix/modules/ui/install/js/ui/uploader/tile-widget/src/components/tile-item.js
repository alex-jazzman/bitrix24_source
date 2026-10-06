import { Dom, Loc, Text, Type } from 'main.core';
import { MenuManager, type PopupOptions } from 'main.popup';

import { FocusNavigator, InteractivityChecker } from 'ui.a11y';
import { FileOrigin, FileStatus } from 'ui.uploader.core';
import { TileWidgetSlot } from 'ui.uploader.tile-widget';
import { BIcon } from 'ui.icon-set.api.vue';
import { Actions, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.actions';
import 'ui.icon-set.outline';
import type { BitrixVueComponentProps } from 'ui.vue3';

import { ErrorPopup } from './error-popup';
import { FileIconComponent } from './file-icon';
import { InsertIntoTextButton } from './insert-into-text-button';
import { UploadLoader } from './upload-loader';

// @vue/component
export const TileItem: BitrixVueComponentProps = {
	components: {
		BIcon,
		UploadLoader,
		ErrorPopup,
		FileIconComponent,
	},
	inject: {
		uploader: {},
		adapter: {},
		widgetOptions: {},
		emitter: {},
		insideTileList: {
			default: false,
		},
		tileZone: {
			default: null,
		},
	},
	/**
	 * The hidden status "file is in the text" is rendered here, and the extra action of the tile
	 * refers to it through `aria-describedby`. Only the tile knows both the flag and whether the
	 * highlight is allowed at all, so the id is resolved in one place: a second computation of the
	 * same condition once left the reference pointing at an element that was not rendered.
	 */
	provide(): Object
	{
		return {
			tileInsertedStatus: {
				getId: (): ?string => (this.isSelected ? this.insertedStatusId : null),
			},
		};
	},
	props: {
		item: {
			type: Object,
			default: () => {},
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		viewerGroupBy: {
			type: [String, null],
			default: null,
		},
		removeFromServer: {
			type: Boolean,
			default: true,
		},
		forceDisableSelection: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			Actions,
			Outline,
			FileStatus,
			menuId: `ui-tile-uploader-item-menu-${Text.getRandom().toLowerCase()}`,
			errorTextId: `ui-tile-uploader-item-error-${Text.getRandom().toLowerCase()}`,
		};
	},
	data(): Object
	{
		return {
			showError: false,
			isMenuShown: false,
		};
	},
	computed: {
		status(): string
		{
			if (this.item.status === FileStatus.UPLOADING)
			{
				return `${this.item.progress}%`;
			}

			if (this.item.status === FileStatus.LOAD_FAILED || this.item.status === FileStatus.UPLOAD_FAILED)
			{
				return Loc.getMessage('TILE_UPLOADER_ERROR_STATUS');
			}

			return Loc.getMessage('TILE_UPLOADER_WAITING_STATUS');
		},
		fileSize(): string
		{
			if (
				[FileStatus.LOADING, FileStatus.LOAD_FAILED].includes(this.item.status)
				&& this.item.origin === FileOrigin.SERVER
			)
			{
				return '';
			}

			return this.item.sizeFormatted;
		},
		errorPopupOptions(): PopupOptions
		{
			const targetNode = this.$refs.container;
			const targetNodeWidth = targetNode.offsetWidth;

			return {
				bindElement: targetNode,
				darkMode: true,
				offsetTop: 6,
				minWidth: targetNodeWidth,
				maxWidth: 500,
				closeByEsc: true,
			};
		},
		clampedFileName(): string
		{
			const nameParts = this.item.name.split('.');
			if (nameParts.length > 1)
			{
				nameParts.pop();
			}

			const nameWithoutExtension = nameParts.join('.');
			const maxLength = this.widgetOptions.compact ? 22 : 27;
			if (nameWithoutExtension.length > maxLength)
			{
				return `${nameWithoutExtension.slice(0, maxLength - 10)}...${nameWithoutExtension.slice(-5)}`;
			}

			return nameWithoutExtension;
		},
		showItemMenuButton(): boolean
		{
			if (Type.isBoolean(this.widgetOptions.showItemMenuButton))
			{
				return this.widgetOptions.showItemMenuButton;
			}

			return this.menuItems.length > 0;
		},
		menuItems(): Array
		{
			const items = [];
			items.push(
				{
					id: 'filesize',
					text: Loc.getMessage('TILE_UPLOADER_FILE_SIZE', { '#filesize#': this.item.sizeFormatted }),
					disabled: true,
				},
				{ delimiter: true },
			);

			if (this.widgetOptions.insertIntoText === true)
			{
				items.push({
					id: 'insert-into-text',
					text: Loc.getMessage('TILE_UPLOADER_INSERT_INTO_THE_TEXT'),
					onclick: (): void => {
						if (this.menu)
						{
							this.menu.close();
						}

						this.emitter.emit('onInsertIntoText', { item: this.item });
					},
				});
			}

			if (Type.isStringFilled(this.item.downloadUrl))
			{
				items.push(
					{
						id: 'download',
						text: Loc.getMessage('TILE_UPLOADER_MENU_DOWNLOAD'),
						href: this.item.downloadUrl,
						onclick: (): void => this.menu?.close(),
					},
				);
			}

			if (!this.readonly)
			{
				const removeItem = {
					id: 'remove',
					text: Loc.getMessage('TILE_UPLOADER_MENU_REMOVE'),
					onclick: this.removeFromMenu,
				};

				items.push(removeItem);
			}

			return items;
		},
		extraAction(): ?BitrixVueComponentProps
		{
			return (
				this.widgetOptions.slots && this.widgetOptions.slots[TileWidgetSlot.ITEM_EXTRA_ACTION]
					? this.widgetOptions.slots[TileWidgetSlot.ITEM_EXTRA_ACTION]
					: (this.widgetOptions.insertIntoText === true ? InsertIntoTextButton : null)
			);
		},
		isSelected(): boolean
		{
			if (this.forceDisableSelection)
			{
				return false;
			}

			return this.item.customData.tileSelected === true;
		},
		fileIconSize(): number
		{
			return this.widgetOptions.compact ? 24 : 36;
		},
		viewerAttrs(): Object
		{
			const { viewerAttrs, previewUrl } = this.item;

			if (!viewerAttrs)
			{
				return {};
			}

			const params = {};

			for (const [key, value] of Object.entries(viewerAttrs))
			{
				params[`data-${Text.toKebabCase(key)}`] = value;
			}

			params['data-viewer'] = true;

			if (previewUrl)
			{
				params['data-viewer-preview'] = previewUrl;
			}

			if (this.viewerGroupBy && Type.isUndefined(viewerAttrs.viewerSeparateItem))
			{
				params['data-viewer-group-by'] = this.viewerGroupBy;
			}

			return params;
		},
		isUploading(): boolean
		{
			return this.item.status === FileStatus.UPLOADING;
		},
		isViewerAvailable(): boolean
		{
			return Object.keys(this.viewerAttrs).length > 0;
		},
		errorText(): string
		{
			const { error } = this.item;
			if (!error)
			{
				return '';
			}

			return [error.message, error.description].filter(Boolean).join('. ');
		},
		errorDescribedBy(): ?string
		{
			return this.item.error ? this.errorTextId : null;
		},
		insertedStatusId(): string
		{
			return `ui-tile-uploader-item-inserted-status-${this.item.id}`;
		},
		insertedStatusText(): string
		{
			return Loc.getMessage('TILE_UPLOADER_FILE_INSERTED_STATUS');
		},
		removeFileLabel(): string
		{
			return Loc.getMessage('TILE_UPLOADER_REMOVE_FILE_LABEL');
		},
		cancelUploadLabel(): string
		{
			return Loc.getMessage('TILE_UPLOADER_CANCEL_UPLOAD_LABEL');
		},
		itemMenuLabel(): string
		{
			return Loc.getMessage('TILE_UPLOADER_ITEM_MENU_LABEL');
		},
		openFileLabel(): string
		{
			return Loc.getMessage('TILE_UPLOADER_OPEN_FILE_LABEL', { '#FILENAME#': this.item.name });
		},
		uploadProgressLabel(): string
		{
			return Loc.getMessage('TILE_UPLOADER_UPLOAD_PROGRESS_LABEL');
		},
	},
	created(): void
	{
		this.menu = null;
	},
	beforeUnmount(): void
	{
		if (this.menu)
		{
			this.menu.destroy();
			this.menu = null;
		}
	},
	methods: {
		/**
		 * Removal from the menu waits for the menu to close first. The menu keeps a focus trap, and
		 * on close the trap returns the focus to the element it was opened from - the menu button of
		 * this very tile. Removing the file before that put our focus target in place only for the
		 * trap to override it, and the tile then took the focus with it to the body.
		 */
		removeFromMenu(): void
		{
			if (!this.menu)
			{
				this.remove();

				return;
			}

			this.menu.getPopupWindow().subscribeOnce('onAfterClose', () => {
				this.remove();
			});

			this.menu.close();
		},

		remove(): void
		{
			if (this.readonly)
			{
				return;
			}

			const focusTarget: ?HTMLElement = this.getFocusTargetAfterRemove();

			this.uploader.removeFile(this.item.id, { removeFromServer: this.removeFromServer });

			if (!focusTarget)
			{
				return;
			}

			// an action of a neighbouring tile belongs to the zone, so it has to learn about the move
			if (this.tileZone && focusTarget.closest('.ui-tile-uploader-items') !== null)
			{
				this.tileZone.focusAction(focusTarget);

				return;
			}

			if (InteractivityChecker.isFocusable(focusTarget))
			{
				FocusNavigator.focusTarget(focusTarget, { preventScroll: true });
			}
			else
			{
				// the widget root is the last resort: it gets tabindex="-1" to accept the focus
				FocusNavigator.focusContainer(focusTarget, { preventScroll: true });
			}
		},

		/**
		 * The focus is moved while the tile is still in the DOM: the leave animation of
		 * transition-group keeps the node alive, and waiting for it would drop focus to the body.
		 * Order of targets: next tile, previous tile, file input of the drop area.
		 */
		getFocusTargetAfterRemove(): ?HTMLElement
		{
			const tile: HTMLElement = this.$refs.container;
			const activeElement: ?HTMLElement = FocusNavigator.getActiveElement();
			const focusIsInside = (activeElement !== null && tile.contains(activeElement)) || this.isMenuShown;
			if (!focusIsInside)
			{
				return null;
			}

			const target: ?HTMLElement = (
				this.findTargetInNeighbours(tile, 'nextElementSibling')
				?? this.findTargetInNeighbours(tile, 'previousElementSibling')
			);
			if (target)
			{
				return target;
			}

			const widget: ?HTMLElement = tile.closest('.ui-tile-uploader');

			return widget?.querySelector('.ui-tile-uploader-drop-input') ?? widget;
		},

		findTargetInNeighbours(tile: HTMLElement, direction: string): ?HTMLElement
		{
			for (let node = tile[direction]; node; node = node[direction])
			{
				// tiles being removed stay in the DOM until the leave animation ends,
				// and focusing one of them would drop the focus to the body a moment later
				if (node.className.includes('ui-tile-uploader-item-leave'))
				{
					continue;
				}

				const target: ?HTMLElement = FocusNavigator.getFirst(node, { tabbableOnly: false });
				if (target)
				{
					return target;
				}
			}

			return null;
		},

		handleMouseEnter(item): void
		{
			if (item.error)
			{
				this.showError = true;
			}
		},
		handleMouseLeave(): void
		{
			this.showError = false;
		},
		hideError(): void
		{
			this.showError = false;
		},
		toggleMenu(): void
		{
			setTimeout(() => {
				if (this.menu)
				{
					if (this.menu.getPopupWindow().isShown())
					{
						this.menu.close();

						return;
					}

					this.menu.destroy();
				}

				this.menu = MenuManager.create({
					id: this.menuId,
					bindElement: this.$refs.menu,
					ariaLabel: this.itemMenuLabel,
					targetContainer: document.body,
					angle: true,
					offsetLeft: 13,
					minWidth: 100,
					cacheable: false,
					items: this.menuItems,
					bindOptions: {
						forceBindPosition: true,
					},
					events: {
						onShow: (): void => {
							this.isMenuShown = true;
							this.adapter.getItem(this.item.id).isMenuShown = true;
						},
						onClose: (): void => {
							this.isMenuShown = false;
							this.adapter.getItem(this.item.id).isMenuShown = false;
						},
						onDestroy: (): void => {
							this.menu = null;
						},
					},
				});

				const downloadItem = this.menu.getMenuItem('download');
				if (downloadItem)
				{
					Dom.attr(downloadItem.getContainer(), 'download', true);
				}

				this.emitter.emit('TileItem:onMenuCreate', {
					menu: this.menu,
					item: this.item,
				});

				// closing the menu returns the focus to this button, and it arrives from the popup, that
				// is from outside the focus zone - the zone has to be told where to land, or it resolves
				// the entry point itself and throws the focus to the first action of the first file
				this.tileZone?.holdEntry(this.$refs.menu);

				// main.popup fires onShow before it positions the popup (popup.js:1708 then :1715), and
				// the menu focuses its first item on onShow with scrolling allowed - the browser then
				// scrolls the page to a popup that still sits at the top of the document. Placing it at
				// the button beforehand keeps the page still; show() positions it precisely afterwards.
				this.menu.getPopupWindow().adjustPosition();
				this.menu.show();
			});
		},
	},
	/**
	 * DOM order inside the tile is the keyboard order: the file itself, then the actions on it in
	 * their visual order - removal on the left, then the extra action, then the menu on the right.
	 * The overlays are positioned absolutely, so the order does not affect the layout: entering the
	 * list does not start on an irreversible action, and the actions are still walked left to right.
	 */
	template: `
		<div
			class="ui-tile-uploader-item"
			data-testid="ui-tile-uploader-item"
			:class="[
				'ui-tile-uploader-item--' + item.status,
				{
					'--image': item.isImage,
					'--selected': (isMenuShown && widgetOptions.compact) || isSelected,
				},
			]"
			:role="insideTileList ? 'group' : null"
			:aria-label="insideTileList ? item.name : null"
			ref="container"
		>
			<ErrorPopup
				v-if="item.error && showError"
				:error="item.error"
				:popup-options="errorPopupOptions"
				@onDestroy="hideError"
			/>
			<span v-if="item.error" class="ui-tile-uploader-visually-hidden" :id="errorTextId">{{errorText}}</span>
			<div
				class="ui-tile-uploader-item-content"
				@mouseenter="handleMouseEnter(item)"
				@mouseleave="handleMouseLeave"
			>
				<component
					:is="isViewerAvailable ? 'button' : 'div'"
					:type="isViewerAvailable ? 'button' : null"
					class="ui-tile-uploader-item-preview-content"
					data-testid="ui-tile-uploader-item-preview"
					:aria-label="isViewerAvailable ? openFileLabel : null"
					:aria-describedby="isViewerAvailable ? errorDescribedBy : null"
					v-bind="viewerAttrs"
				>
					<span class="ui-tile-uploader-item-preview">
						<span
							v-if="item.previewUrl"
							class="ui-tile-uploader-item-image"
							:class="{ 'ui-tile-uploader-item-image-default': item.previewUrl === null }"
							:style="{ backgroundImage: item.previewUrl !== null ? 'url(' + item.previewUrl + ')' : '' }">
						</span>
						<FileIconComponent
							v-else
							:name="item.extension || '...'"
							:size="fileIconSize"
							aria-hidden="true"
						/>
					</span>
					<span
						v-if="item.name"
						class="ui-tile-uploader-item-name-box"
						:title="item.name"
					>
						<span class="ui-tile-uploader-item-name">
							<span class="ui-tile-uploader-item-name-title">{{clampedFileName}}</span>
							<span v-if="item.extension" class="ui-tile-uploader-item-name-extension">.{{item.extension}}</span>
						</span>
					</span>
					<span
						v-if="isSelected"
						class="ui-tile-uploader-visually-hidden"
						:id="insertedStatusId"
					>{{insertedStatusText}}</span>
				</component>
				<div v-if="item.status !== FileStatus.COMPLETE" class="ui-tile-uploader-item-state">
					<div class="ui-tile-uploader-item-loader" v-if="item.status === FileStatus.UPLOADING">
						<UploadLoader
							:progress="item.progress"
							:width="20"
							colorTrack="#73d8f8"
							colorBar="#fff"
							aria-hidden="true"
						/>
					</div>
					<div v-else class="ui-tile-uploader-item-state-icon"></div>
					<div
						class="ui-tile-uploader-item-status"
						:role="isUploading ? 'progressbar' : null"
						:aria-label="isUploading ? uploadProgressLabel : null"
						:aria-valuemin="isUploading ? 0 : null"
						:aria-valuemax="isUploading ? 100 : null"
						:aria-valuenow="isUploading ? item.progress : null"
					>
						<div class="ui-tile-uploader-item-status-name">{{status}}</div>
						<div v-if="fileSize" class="ui-tile-uploader-item-state-desc">{{fileSize}}</div>
					</div>
					<button
						v-if="!readonly"
						type="button"
						class="ui-tile-uploader-item-state-remove"
						data-testid="ui-tile-uploader-item-cancel-btn"
						:aria-label="cancelUploadLabel"
						:aria-describedby="errorDescribedBy"
						@click="remove"
						key="aaa"
					></button>
				</div>
				<template v-else>
					<button
						v-if="!readonly"
						type="button"
						class="ui-tile-uploader-item-remove"
						data-testid="ui-tile-uploader-item-remove-btn"
						:aria-label="removeFileLabel"
						:aria-describedby="errorDescribedBy"
						key="remove"
						@click="remove"
					>
						<BIcon :name="Outline.CROSS_L" aria-hidden="true"/>
					</button>
					<div class="ui-tile-uploader-item-actions" key="actions">
						<div class="ui-tile-uploader-item-actions-pad">
							<div v-if="extraAction" class="ui-tile-uploader-item-extra-actions">
								<component :is="extraAction" :item="item"></component>
							</div>
							<button
								v-if="showItemMenuButton"
								type="button"
								class="ui-tile-uploader-item-menu"
								data-testid="ui-tile-uploader-item-menu-btn"
								:aria-label="itemMenuLabel"
								:aria-describedby="errorDescribedBy"
								aria-haspopup="menu"
								:aria-expanded="isMenuShown ? 'true' : 'false'"
								ref="menu"
								@click="toggleMenu"
							>
								<BIcon :name="Actions.MORE" aria-hidden="true"/>
							</button>
						</div>
					</div>
				</template>
			</div>
		</div>
	`,
};
