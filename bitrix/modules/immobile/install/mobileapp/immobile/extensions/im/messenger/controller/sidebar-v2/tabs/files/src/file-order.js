/**
 * @module im/messenger/controller/sidebar-v2/tabs/files/src/file-order
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/files/src/file-order', (require, exports, module) => {
	/**
	 * @desc The list repeats the order the server pages by: the date descending, ties resolved by the
	 * record number in the same direction. The date is not unique, and without the tie-break the order
	 * of equal dates follows the insertion order of the collection - so a record that arrived through a
	 * pull event sits in one place now and in another after a reload, and differs from the web.
	 * @param {SidebarFile} a
	 * @param {SidebarFile} b
	 * @return {number}
	 */
	function compareByDateCreate(a, b)
	{
		const dateDiff = new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime();

		if (dateDiff !== 0)
		{
			return dateDiff;
		}

		return b.id - a.id;
	}

	module.exports = { compareByDateCreate };
});
