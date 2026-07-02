/**
 * @module selector/widget/entity/socialnetwork/project-tag
 */
jn.define('selector/widget/entity/socialnetwork/project-tag', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseSelectorEntity } = require('selector/widget/entity');

	/**
	 * @class ProjectTagSelector
	 */
	class ProjectTagSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'project-tag';
		}

		static getContext()
		{
			return 'PROJECT_TAG';
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_SEARCH_PROJECT_TAG_MSGVER_1');
		}

		static isCreationEnabled()
		{
			return true;
		}

		static getCreateText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATE_PROJECT_TAG');
		}

		static getCreatingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATING_PROJECT_TAG');
		}

		static getCreateEntityHandler(providerOptions)
		{
			return (text) => {
				return new Promise((resolve) => {
					resolve({
						id: text.toLowerCase(),
						entityId: this.getEntityId(),
						title: text.toLowerCase(),
					});
				});
			};
		}

		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_PICK_PROJECT_TAG_2');
		}
	}

	module.exports = {
		ProjectTagSelector,
	};
});

(() => {
	const require = (ext) => jn.require(ext);
	const { ProjectTagSelector } = require('selector/widget/entity/socialnetwork/project-tag');

	this.ProjectTagSelector = ProjectTagSelector;
})();
