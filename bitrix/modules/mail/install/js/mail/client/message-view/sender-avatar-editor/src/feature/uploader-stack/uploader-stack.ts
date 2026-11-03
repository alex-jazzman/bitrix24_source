import { Runtime } from 'main.core';

type UploaderCoreExports = typeof import('ui.uploader.core');
type UploaderVueExports = typeof import('ui.uploader.vue');
type UploaderTileWidgetExports = typeof import('ui.uploader.tile-widget');

export type UploaderStack = {
	FileStatus: UploaderCoreExports['FileStatus'];
	Filter: UploaderCoreExports['Filter'];
	FilterType: UploaderCoreExports['FilterType'];
	Uploader: UploaderCoreExports['Uploader'];
	UploaderError: UploaderCoreExports['UploaderError'];
	UploaderEvent: UploaderCoreExports['UploaderEvent'];
	VueUploaderAdapter: UploaderVueExports['VueUploaderAdapter'];
	TileWidgetComponent: UploaderTileWidgetExports['TileWidgetComponent'];
};

type ExtensionLoader = (...extensions: string[]) => Promise<UploaderStack>;

export function createUploaderStackLoader(
	loadExtensions: ExtensionLoader = (...extensions) => {
		return Runtime.loadExtension(...extensions) as unknown as Promise<UploaderStack>;
	},
): () => Promise<UploaderStack>
{
	let stackPromise: Promise<UploaderStack> | null = null;

	return (): Promise<UploaderStack> => {
		stackPromise ??= loadExtensions(
			'ui.uploader.core',
			'ui.uploader.vue',
			'ui.uploader.tile-widget',
		);

		return stackPromise;
	};
}

export const loadUploaderStack = createUploaderStackLoader();
