/**
 * @module im/messenger/controller/dialog/lib/sticker/src/const
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/const', (require, exports, module) => {

	const StickerEventType = {
		selector: {
			loadNextPage: 'selector:load-next-page',
		},
		widget: {
			reload: 'widget:reload',
			preventDismiss: 'widget:prevent-dismiss',
		},
		grid: {
			scrollTo: 'grid:scroll-to',
			scrollToSmoothly: 'grid:scroll-to-smoothly',
			scrollToBegin: 'grid:scroll-to-begin',
			scrollToBeginSmoothly: 'grid:scroll-to-begin-smoothly',
			rename: 'grid:rename',
		},
		navigation: {
			setActiveRecent: 'navigation:set-active-recent',
			setActivePack: 'navigation:set-active-pack',
			deletePack: 'navigation:delete-pack',
		},
		action: {
			deleteRecentSticker: 'action:delete-recent-sticker',
			clearHistory: 'action:clear-history',
			send: 'action:send',
			createPack: 'action:create-pack',
			createStickers: 'action:create-stickers',
			deletePack: 'action:delete-pack',
			deleteSticker: 'action:delete-sticker',
			linkPack: 'action:link-pack',
			unlinkPack: 'action:unlink-pack',
			cancelUpload: 'action:cancel-upload',
			rename: 'action:rename',
			edit: 'action:edit',
		},
		uploader: {
			setProgress: 'uploader:set-progress',
			complete: 'uploader:complete',
			error: 'uploader:error',
		},
		sticker: {
			click: 'sticker:click',
			updateState: 'sticker:updateState',
		},
	};

	const GridSection = {
		recent: 'recent',
		pack: 'pack',
	};

	const RowType = {
		shimmerHeader: 'shimmer-header',
		shimmerStickers: 'shimmer-stickers',
		stickerHeader: 'header',
		stickers: 'stickers',
	};

	const NavigationButtonType = {
		create: 'create',
		recent: 'recentButton',
		shimmer: 'shimmer',
		pack: 'pack',
	};

	const UploadStatus = {
		progress: 'progress',
		complete: 'complete',
		error: 'error',
	};

	const EditableElementType = {
		sticker: 'sticker',
		uploadingSticker: 'uploadingSticker',
		create: 'create',
	};

	const MAX_STICKER_PACK_SIZE = 50;

	const NAVIGATION_BUTTON_WIDTH = 52;

	const DEVICE_WIDTH = device.screen.width;

	module.exports = {
		StickerEventType,
		GridSection,
		RowType,
		NavigationButtonType,
		UploadStatus,
		EditableElementType,
		MAX_STICKER_PACK_SIZE,
		NAVIGATION_BUTTON_WIDTH,
		DEVICE_WIDTH,
	};
});
