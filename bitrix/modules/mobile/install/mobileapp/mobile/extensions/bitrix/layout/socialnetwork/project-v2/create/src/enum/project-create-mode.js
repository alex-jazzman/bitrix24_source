/**
 * @module layout/socialnetwork/project-v2/create/src/enum/project-create-mode
 */
jn.define('layout/socialnetwork/project-v2/create/src/enum/project-create-mode', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	class ProjectCreateMode extends BaseEnum
	{
		static CREATE = new ProjectCreateMode('CREATE', 'create');

		static EDIT = new ProjectCreateMode('EDIT', 'edit');
	}

	module.exports = {
		ProjectCreateMode: ProjectCreateMode.export(),
	};
});
