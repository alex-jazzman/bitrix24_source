/**
 * @module crm/entity-tab/events
 */
jn.define('crm/entity-tab/events', (require, exports, module) => {
	/**
	 * Events of the application the tab listens to. Every one of them is subscribed on mount and
	 * dropped on unmount, so the name stands in two places at once - and a name misspelled in one of
	 * them leaves a live handler behind on a screen that is gone.
	 *
	 * A plain frozen map and not an enum: the names go to `BX.addCustomEvent()` as strings, and the
	 * mobile typing rules keep a runtime-only set of constants in exactly this shape.
	 *
	 * @type {Readonly<Record<string, string>>}
	 */
	const EntityTabEvent = Object.freeze({
		SEARCH: 'UI.SearchBar::onSearch',
		SEARCH_HIDE: 'UI.SearchBar::onSearchHide',
		CATEGORY_SELECTED: 'Crm.CategoryList::onSelectedCategory',
		CATEGORY_DELETED: 'Crm.CategoryDetail::onDeleteCategory',
		CATEGORY_CLOSED: 'Crm.CategoryDetail::onClose',
	});

	module.exports = { EntityTabEvent };
});
