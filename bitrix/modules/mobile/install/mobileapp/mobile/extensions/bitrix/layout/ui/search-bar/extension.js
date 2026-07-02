/**
 * @module layout/ui/search-bar
 */
jn.define('layout/ui/search-bar', (require, exports, module) => {
	const { SearchBar } = require('layout/ui/search-bar/search-bar');
	const { SearchLayout } = require('layout/ui/search-bar/search-layout');
	const { PresetType } = require('layout/ui/search-bar/preset');

	module.exports = { SearchBar, SearchLayout, PresetType };
});
