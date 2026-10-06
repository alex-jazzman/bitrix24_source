import { Loc, Type } from 'main.core';
import type { BaseEvent } from 'main.core.events';
import type { PopupOptions } from 'main.popup';

import { LiveAnnouncer } from 'ui.a11y';
import { VueUploaderComponent } from 'ui.uploader.vue';
import { TileWidgetSlot } from 'ui.uploader.tile-widget';
import type { BitrixVueComponentProps } from 'ui.vue3';

import { DragOverMixin } from '../mixins/drag-over-mixin';
import { DropArea } from './drop-area';
import { TileList } from './tile-list';
import { ErrorPopup } from './error-popup';

/**
 * @memberof BX.UI.Uploader
 * @vue/component
 */
// @vue/component
export const TileWidgetComponent: BitrixVueComponentProps = {
	name: 'TileWidget',
	components: {
		DropArea,
		TileList,
		ErrorPopup,
	},
	extends: VueUploaderComponent,
	mixins: [
		DragOverMixin,
	],
	data(): Object
	{
		return {
			isMounted: false,
			autoCollapse: false,
		};
	},
	computed: {
		errorPopupOptions(): PopupOptions
		{
			return {
				bindElement: this.$refs.container,
				closeIcon: true,
				padding: 20,
				offsetLeft: 45,
				angle: true,
				darkMode: true,
				bindOptions: {
					position: 'top',
					forceTop: true,
				},
			};
		},
		TileWidgetSlot: () => TileWidgetSlot,
		slots(): TileWidgetSlot
		{
			const slots = Type.isPlainObject(this.widgetOptions.slots) ? this.widgetOptions.slots : {};

			return {
				[TileWidgetSlot.BEFORE_TILE_LIST]: slots[TileWidgetSlot.BEFORE_TILE_LIST],
				[TileWidgetSlot.AFTER_TILE_LIST]: slots[TileWidgetSlot.AFTER_TILE_LIST],
				[TileWidgetSlot.BEFORE_DROP_AREA]: slots[TileWidgetSlot.BEFORE_DROP_AREA],
				[TileWidgetSlot.AFTER_DROP_AREA]: slots[TileWidgetSlot.AFTER_DROP_AREA],
			};
		},
		enableDropzone(): boolean
		{
			return this.widgetOptions.enableDropzone !== false;
		},
	},
	created(): void
	{
		this.autoCollapse = (
			Type.isBoolean(this.widgetOptions.autoCollapse)
				? this.widgetOptions.autoCollapse
				: this.items.length > 0
		);

		this.adapter.subscribe('Item:onAdd', this.clearError);
		this.adapter.subscribe('Item:onRemove', this.clearError);

		this.adapter.subscribe('Item:onAdd', this.announceItemAdd);
		this.adapter.subscribe('Item:onRemove', this.announceItemRemove);
		this.adapter.subscribe('Item:onError', this.announceItemError);
		this.adapter.subscribe('Uploader:onError', this.announceUploaderError);
	},
	mounted(): void
	{
		if (this.enableDropzone)
		{
			this.uploader.assignDropzone(this.$refs.container);
		}

		this.isMounted = true;
	},
	beforeUnmount(): void
	{
		this.adapter.unsubscribe('Item:onAdd', this.clearError);
		this.adapter.unsubscribe('Item:onRemove', this.clearError);

		this.adapter.unsubscribe('Item:onAdd', this.announceItemAdd);
		this.adapter.unsubscribe('Item:onRemove', this.announceItemRemove);
		this.adapter.unsubscribe('Item:onError', this.announceItemError);
		this.adapter.unsubscribe('Uploader:onError', this.announceUploaderError);
	},
	methods: {
		announceItemAdd(event: BaseEvent): void
		{
			const { item } = event.getData();

			LiveAnnouncer.announce(
				Loc.getMessage('TILE_UPLOADER_FILE_ADDED_ANNOUNCE', { '#FILENAME#': item.name }),
			);
		},
		announceItemRemove(event: BaseEvent): void
		{
			const { item } = event.getData();

			LiveAnnouncer.announce(
				Loc.getMessage('TILE_UPLOADER_FILE_REMOVED_ANNOUNCE', { '#FILENAME#': item.name }),
			);
		},
		announceItemError(event: BaseEvent): void
		{
			const { item } = event.getData();

			LiveAnnouncer.announce(
				Loc.getMessage('TILE_UPLOADER_FILE_ERROR_ANNOUNCE', { '#FILENAME#': item.name }),
				'assertive',
			);
		},
		announceUploaderError(): void
		{
			LiveAnnouncer.announce(Loc.getMessage('TILE_UPLOADER_ERROR_ANNOUNCE'), 'assertive');
		},
		enableAutoCollapse(): void
		{
			this.autoCollapse = true;
		},
		disableAutoCollapse(): void
		{
			this.autoCollapse = false;
		},
		handlePopupDestroy(error): void
		{
			if (this.uploaderError === error)
			{
				this.uploaderError = null;
			}
		},
		clearError(): void
		{
			this.uploaderError = null;
		},
	},
	template: `
		<div
			class="ui-tile-uploader"
			:class="[
				widgetOptions.contextClass ?? '--ui-context-content-light',
				{
					'--compact': widgetOptions.compact,
				},
			]"
			ref="container"
			v-drop="enableDropzone"
		>
			<component :is="slots[TileWidgetSlot.BEFORE_TILE_LIST]"></component>
			<TileList 
				v-if="items.length !== 0"
				:items="items"
				:autoCollapse="autoCollapse"
				:readonly="widgetOptions.readonly"
				:removeFromServer="widgetOptions.removeFromServer"
				:forceDisableSelection="widgetOptions.forceDisableSelection"
				@onUnmount="autoCollapse = false"
			/>
			<component :is="slots[TileWidgetSlot.AFTER_TILE_LIST]"></component>
			<component :is="slots[TileWidgetSlot.BEFORE_DROP_AREA]"></component>
			<DropArea v-if="!widgetOptions.hideDropArea"/>
			<component :is="slots[TileWidgetSlot.AFTER_DROP_AREA]"></component>
		</div>
		<ErrorPopup
			v-if="uploaderError && isMounted"
			:alignArrow="false"
			:error="uploaderError"
			:popupOptions="errorPopupOptions"
			@onDestroy="handlePopupDestroy"
		/>
	`,
};
