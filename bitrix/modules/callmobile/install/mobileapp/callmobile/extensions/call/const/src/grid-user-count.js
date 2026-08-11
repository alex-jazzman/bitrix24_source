/**
 * @module call/const/grid-user-count
 */
jn.define('call/const/grid-user-count', (require, exports, module) => {
	const GridUserCount = Object.freeze({
		minimalGrid: 3,
		bottomSplittedRow: 4,
		middleSplittedRow: 5,
		equalTiles: 6,
		fullFirstPageIndex: 7,
		fullFirstPageCount: 8,
	});

	module.exports = { GridUserCount };
});
