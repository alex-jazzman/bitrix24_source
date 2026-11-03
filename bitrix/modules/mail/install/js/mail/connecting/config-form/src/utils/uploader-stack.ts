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

/**
 * The uploader stack is the heaviest part of the form and serves the avatar editor alone, which only
 * an edit session with an avatar-capable mailbox ever opens. Keeping these names out of the static
 * imports keeps them out of the extension dependencies, so creating a mailbox never pays for them.
 *
 * All three extensions publish into BX.UI.Uploader, so a single request answers with the whole stack.
 * Runtime.loadExtension already shares one request between callers and remembers the result.
 */
export function loadUploaderStack(): Promise<UploaderStack>
{
	return Runtime.loadExtension(
		'ui.uploader.core',
		'ui.uploader.vue',
		'ui.uploader.tile-widget',
	) as unknown as Promise<UploaderStack>;
}
