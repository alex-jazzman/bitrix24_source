/**
 * @module more-menu/block/company/bitrix-answers/screen/src/const
 */
jn.define('more-menu/block/company/bitrix-answers/screen/src/const', (require, exports, module) => {
	// The page paints itself in the theme of the app, and the address is the only channel it reads the
	// theme from: the same parameter name the market opener already sends to portal pages.
	const THEME_QUERY_PARAM = 'mobileThemeId';

	// One list for both halves of the bridge: direction comes from the white list there, not from the order here.
	const AnswersScreenEvent = Object.freeze({
		PAGE_READY: 'answers:page:ready',
		TITLE_SET: 'answers:title:set',
		TITLE_RESET: 'answers:title:reset',
		SEARCH_SHOW: 'answers:search:show',
		SEARCH_HIDE: 'answers:search:hide',
		SEARCH_COLLAPSE: 'answers:search:collapse',
		SUPPORT_OPEN: 'answers:support:open',
		CHAT_OPEN: 'answers:chat:open',
		NAV_STATE: 'answers:nav:state',
		SEARCH_CHANGE: 'answers:search:change',
		SEARCH_APPLY: 'answers:search:apply',
		SEARCH_CANCEL: 'answers:search:cancel',
		NAVIGATION_BACK: 'answers:navigation:back',
	});

	// The bar shows one line of a heading, and the page is free to send whatever it likes: a text past
	// this length is an article that came instead of a title, and the screen keeps the one it has.
	const MAX_TITLE_LENGTH = 100;

	// The app knows its components by name, and the container is handed the address of this one.
	const ANSWERS_COMPONENT_NAME = 'bitrix-answers';

	// Tab key of the container: opening the section again switches to the tab it already holds.
	const ANSWERS_COMPONENT_CODE = 'bitrix-answers';

	module.exports = {
		THEME_QUERY_PARAM,
		AnswersScreenEvent,
		MAX_TITLE_LENGTH,
		ANSWERS_COMPONENT_NAME,
		ANSWERS_COMPONENT_CODE,
	};
});
