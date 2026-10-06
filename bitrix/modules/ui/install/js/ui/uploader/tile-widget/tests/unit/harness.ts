/**
 * Shared setup for the tile-widget unit tests.
 *
 * Localization phrases are seeded with marker values instead of the real translations:
 * the tests then assert that an element takes its accessible name from the RIGHT phrase
 * key, and stay green on a portal with any language installed.
 */
import { mount, type VueWrapper } from '@vue/test-utils';
import { Dom, Loc } from 'main.core';
import { FileOrigin, FileStatus } from 'ui.uploader.core';

// The extension entry goes first on purpose: components import `ui.uploader.tile-widget`
// back (for TileWidgetSlot), and only initializing the entry first keeps that cycle from
// hitting an uninitialized binding.
import '../../src/index';

import { DropArea } from '../../src/components/drop-area';
import { InsertIntoTextButton } from '../../src/components/insert-into-text-button';
import { SettingsButton } from '../../src/components/settings-button';
import { TileItem } from '../../src/components/tile-item';
import { TileList } from '../../src/components/tile-list';
import { TileMoreItem } from '../../src/components/tile-more-item';

export { DropArea, InsertIntoTextButton, SettingsButton, TileItem, TileList, TileMoreItem };

export const HIDDEN_CLASS = 'ui-tile-uploader-visually-hidden';

export const MESSAGES: Record<string, string> = {
	TILE_UPLOADER_ERROR_STATUS: '[error-status]',
	TILE_UPLOADER_WAITING_STATUS: '[waiting-status]',
	TILE_UPLOADER_MENU_DOWNLOAD: '[menu-download]',
	TILE_UPLOADER_MENU_REMOVE: '[menu-remove]',
	TILE_UPLOADER_DROP_FILES_HERE: '[drop-files-here]',
	TILE_UPLOADER_DROP_KEYBOARD_HINT: '[drop-keyboard-hint]',
	TILE_UPLOADER_MORE_BUTTON_CAPTION: '[more] #COUNT#',
	TILE_UPLOADER_INSERT_INTO_THE_TEXT: '[insert-into-text]',
	TILE_UPLOADER_FILE_SIZE: '[file-size] #filesize#',
	TILE_UPLOADER_FILE_LIST_LABEL: '[file-list]',
	TILE_UPLOADER_REMOVE_FILE_LABEL: '[remove-file]',
	TILE_UPLOADER_CANCEL_UPLOAD_LABEL: '[cancel-upload]',
	TILE_UPLOADER_ITEM_MENU_LABEL: '[item-menu]',
	TILE_UPLOADER_OPEN_FILE_LABEL: '[open-file] #FILENAME#',
	TILE_UPLOADER_UPLOAD_PROGRESS_LABEL: '[upload-progress]',
	TILE_UPLOADER_SETTINGS_LABEL: '[settings]',
	TILE_UPLOADER_FILE_INSERTED_STATUS: '[file-inserted]',
	TILE_UPLOADER_FILE_ADDED_ANNOUNCE: '[file-added] #FILENAME#',
	TILE_UPLOADER_FILE_REMOVED_ANNOUNCE: '[file-removed] #FILENAME#',
	TILE_UPLOADER_FILE_ERROR_ANNOUNCE: '[file-error] #FILENAME#',
	TILE_UPLOADER_ERROR_ANNOUNCE: '[uploader-error]',
};

export function seedMessages(): void
{
	Loc.setMessage(MESSAGES);
}

export type TestItem = Record<string, any>;

export function createItem(overrides: TestItem = {}): TestItem
{
	return {
		id: 'file-1',
		serverFileId: 101,
		status: FileStatus.COMPLETE,
		name: 'Договор.pdf',
		size: 2048,
		sizeFormatted: '2 КБ',
		type: 'application/pdf',
		extension: 'pdf',
		origin: FileOrigin.SERVER,
		isImage: false,
		isVideo: false,
		failed: false,
		width: null,
		height: null,
		progress: 0,
		error: null,
		previewUrl: null,
		previewWidth: null,
		previewHeight: null,
		clientPreviewUrl: null,
		clientPreviewWidth: null,
		clientPreviewHeight: null,
		serverPreviewUrl: null,
		serverPreviewWidth: null,
		serverPreviewHeight: null,
		downloadUrl: null,
		customData: {},
		viewerAttrs: null,
		...overrides,
	};
}

export function createItems(count: number, overrides: TestItem = {}): TestItem[]
{
	return Array.from({ length: count }, (unused, index: number) => createItem({
		id: `file-${index + 1}`,
		name: `Файл-${index + 1}.pdf`,
		...overrides,
	}));
}

export type Provides = {
	uploader: Record<string, any>,
	adapter: Record<string, any>,
	widgetOptions: Record<string, any>,
	emitter: Record<string, any>,
	events: Array<{ event: string, data: any }>,
	removed: string[],
	browseElements: HTMLElement[],
};

export function createProvides(widgetOptions: Record<string, any> = {}): Provides
{
	const events: Array<{ event: string, data: any }> = [];
	const removed: string[] = [];
	const browseElements: HTMLElement[] = [];
	const itemStates: Map<string, Record<string, any>> = new Map();

	return {
		uploader: {
			removeFile: (id: string): void => {
				removed.push(id);
			},
			assignBrowse: (element: HTMLElement): void => {
				browseElements.push(element);
			},
			assignDropzone: (): void => {},
		},
		adapter: {
			getItem: (id: string): Record<string, any> => {
				if (!itemStates.has(id))
				{
					itemStates.set(id, { isMenuShown: false });
				}

				return itemStates.get(id) as Record<string, any>;
			},
		},
		widgetOptions,
		emitter: {
			emit: (event: string, data: any): void => {
				events.push({ event, data });
			},
		},
		events,
		removed,
		browseElements,
	};
}

type MountOptions = {
	item?: TestItem,
	items?: TestItem[],
	props?: Record<string, any>,
	widgetOptions?: Record<string, any>,
	provides?: Provides,
	attachTo?: HTMLElement | null,
	insideTileList?: boolean,
	insertedStatusId?: ?string,
};

function mountComponent(component: any, props: Record<string, any>, options: MountOptions): VueWrapper
{
	const provides: Provides = options.provides ?? createProvides(options.widgetOptions ?? {});

	return mount(component, {
		props,
		attachTo: options.attachTo ?? undefined,
		global: {
			provide: {
				uploader: provides.uploader,
				adapter: provides.adapter,
				widgetOptions: provides.widgetOptions,
				emitter: provides.emitter,
				// TileList provides it itself; a standalone tile is mounted as if it were inside a list
				insideTileList: options.insideTileList ?? true,
				// TileItem provides it to its extra action; a standalone button gets it from the test
				tileInsertedStatus: {
					getId: (): ?string => options.insertedStatusId ?? null,
				},
			},
		},
	});
}

export function mountTile(options: MountOptions = {}): VueWrapper
{
	return mountComponent(
		TileItem,
		{ item: options.item ?? createItem(), ...options.props },
		options,
	);
}

export function mountList(options: MountOptions = {}): VueWrapper
{
	return mountComponent(
		TileList,
		{ items: options.items ?? createItems(3), ...options.props },
		options,
	);
}

export function mountDropArea(options: MountOptions = {}): VueWrapper
{
	return mountComponent(DropArea, { ...options.props }, options);
}

export function mountSettingsButton(options: MountOptions = {}): VueWrapper
{
	return mountComponent(SettingsButton, { ...options.props }, options);
}

export function mountInsertIntoTextButton(options: MountOptions = {}): VueWrapper
{
	return mountComponent(
		InsertIntoTextButton,
		{ item: options.item ?? createItem(), ...options.props },
		options,
	);
}

export function mountMoreItem(options: MountOptions = {}): VueWrapper
{
	return mountComponent(TileMoreItem, { hiddenFilesCount: 4, ...options.props }, options);
}

/**
 * A container attached to the document: focus and `:focus-visible` only work for elements
 * that are actually in the page, so focus tests cannot use a detached wrapper.
 */
export function createContainer(): HTMLElement
{
	const container = document.createElement('div');
	Dom.append(container, document.body);

	return container;
}

/* eslint-disable no-console -- intercepting the console is what this helper is for: Vue reports
   template problems (an unresolved component, for one) only through console.warn/error */
export function collectVueWarnings(run: () => void): string[]
{
	const warnings: string[] = [];
	const originalWarn = console.warn;
	const originalError = console.error;

	const collect = (...args: any[]): void => {
		warnings.push(args.map(String).join(' '));
	};

	console.warn = collect;
	console.error = collect;

	try
	{
		run();
	}
	finally
	{
		console.warn = originalWarn;
		console.error = originalError;
	}

	return warnings;
}
/* eslint-enable no-console */
