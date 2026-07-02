/**
 * @module layout/socialnetwork/project-v2/create/src/enum/project-create-stage
 */
jn.define('layout/socialnetwork/project-v2/create/src/enum/project-create-stage', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	class ProjectCreateStage extends BaseEnum
	{
		static INTRO = new ProjectCreateStage('INTRO', 'intro');

		static EDITING = new ProjectCreateStage('EDITING', 'editing');
	}

	module.exports = {
		ProjectCreateStage: ProjectCreateStage.export(),
	};
});
