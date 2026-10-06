/* eslint-disable */
declare namespace BX.Mail {
	function isFavoritesSectionUrl(url: string): boolean;

	function withFavoritesSection(url: string): string;

	function withoutFavoritesSection(url: string): string;

	const LIST_SECTION_PARAM = "list_section";

	const FAVORITES_SECTION = "favorites";
}
