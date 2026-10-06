import { Text, Runtime } from 'main.core';
import type { BitrixVueComponentProps } from 'ui.vue3';
import type { UploaderFileInfo } from 'ui.uploader.core';

import { FileListItem } from './file-list-item';

import './css/file-list.css';

// @vue/component
export const FileList: BitrixVueComponentProps = {
	name: 'DiskUserFieldFileList',
	components: {
		FileListItem,
	},
	props: {
		items: {
			type: Array,
			required: true,
		},
		showMenuButton: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['menuClick'],
	computed: {
		// One stable group id per list render so ui.viewer opens all list files as a single
		// navigable gallery — identical to ui.uploader.tile-widget TileList.groupBy.
		groupBy(): string
		{
			return Text.getRandom(16);
		},
	},
	mounted(): void
	{
		// The list opens files through the global ui.viewer click delegation (like tiles do);
		// make sure the extension — and thus its document click handler — is loaded.
		Runtime.loadExtension('ui.viewer');
	},
	methods: {
		handleMenuClick(payload: { item: UploaderFileInfo, bindElement: HTMLElement }): void
		{
			this.$emit('menuClick', payload);
		},
	},
	template: `
		<div class="disk-user-field-file-list" data-testid="disk-file-list">
			<FileListItem
				v-for="item in items"
				:key="item.id"
				:item="item"
				:groupBy="groupBy"
				:showMenuButton="showMenuButton"
				@menuClick="handleMenuClick"
			/>
		</div>
	`,
};
