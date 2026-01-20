/**
 * @module im/messenger/controller/dialog/lib/sticker/src/const
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/const', (require, exports, module) => {

	const StickerEventType = {
		grid: {
			scrollTo: 'grid:scroll-to',
			scrollToBegin: 'grid:scroll-to-begin',
		},
		navigation: {
			setActiveRecent: 'navigation:set-active-recent',
			setActivePack: 'navigation:set-active-pack',
		},
		action: {
			deleteRecentSticker: 'action:delete-recent-sticker',
			clearHistory: 'action:clear-history',
			send: 'action:send',
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
		recent: 'recentButton',
		pack: 'pack',
	};

	module.exports = {
		StickerEventType,
		GridSection,
		RowType,
		NavigationButtonType,
	};
});
