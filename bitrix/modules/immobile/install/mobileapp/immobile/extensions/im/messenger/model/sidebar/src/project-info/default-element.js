/**
 * @module im/messenger/model/sidebar/src/project-info/default-element
 */

jn.define('im/messenger/model/sidebar/src/project-info/default-element', (require, exports, module) => {
	/**
	 * @return {SidebarProjectInfoItem}
	 */
	function projectInfoDefaultElement()
	{
		return {
			description: '',
			goal: '',
			dateStart: null,
			dateFinish: null,
			tags: [],
		};
	}

	module.exports = { projectInfoDefaultElement };
});
