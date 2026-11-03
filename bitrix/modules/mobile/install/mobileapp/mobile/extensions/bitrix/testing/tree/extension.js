/**
 * @module testing/tree
 */
jn.define('testing/tree', (require, exports, module) => {
	/**
	 * Children of a rendered node. Native elements and design-system component instances alike
	 * carry them in `children`.
	 *
	 * @param {Object} node
	 * @return {Array<Object>}
	 */
	const childrenOf = (node) => (Array.isArray(node?.children) ? node.children.filter(Boolean) : []);

	/**
	 * The first node of a rendered tree the predicate accepts, depth first.
	 *
	 * @param {Object} node
	 * @param {function(Object): boolean} predicate
	 * @return {?Object}
	 */
	const findNode = (node, predicate) => {
		if (!node || typeof node !== 'object')
		{
			return null;
		}

		if (predicate(node))
		{
			return node;
		}

		return childrenOf(node).reduce((found, child) => found || findNode(child, predicate), null);
	};

	/**
	 * @param {Object} node
	 * @param {string} testId
	 * @return {?Object}
	 */
	const findByTestId = (node, testId) => findNode(node, (candidate) => candidate?.props?.testId === testId);

	module.exports = { childrenOf, findNode, findByTestId };
});
