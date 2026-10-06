/* eslint-disable */
this.BX = this.BX || {};
(function (exports) {
	'use strict';

	const LIST_SECTION_PARAM = 'list_section';
	const FAVORITES_SECTION = 'favorites';
	function parse(url) {
		return new URL(url, window.location.origin);
	}
	function serialize(url) {
		return `${url.pathname}${url.search}${url.hash}`;
	}
	function isFavoritesSectionUrl(url) {
		return parse(url).searchParams.get(LIST_SECTION_PARAM) === FAVORITES_SECTION;
	}
	function withFavoritesSection(url) {
		const parsed = parse(url);
		parsed.searchParams.set(LIST_SECTION_PARAM, FAVORITES_SECTION);
		return serialize(parsed);
	}
	function withoutFavoritesSection(url) {
		const parsed = parse(url);
		parsed.searchParams.delete(LIST_SECTION_PARAM);
		return serialize(parsed);
	}

	exports.FAVORITES_SECTION = FAVORITES_SECTION;
	exports.LIST_SECTION_PARAM = LIST_SECTION_PARAM;
	exports.isFavoritesSectionUrl = isFavoritesSectionUrl;
	exports.withFavoritesSection = withFavoritesSection;
	exports.withoutFavoritesSection = withoutFavoritesSection;

})(this.BX.Mail = this.BX.Mail || {});
//# sourceMappingURL=favorites-filter-state.bundle.js.map
