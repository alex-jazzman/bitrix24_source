/**
 * @module layout/socialnetwork/project-v2/create/src/enum/project-avatar-mode
 */
jn.define('layout/socialnetwork/project-v2/create/src/enum/project-avatar-mode', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	class ProjectAvatarMode extends BaseEnum
	{
		static UNCHANGED = new ProjectAvatarMode('UNCHANGED', 'unchanged');

		static UPLOAD = new ProjectAvatarMode('UPLOAD', 'upload');

		static REMOVE = new ProjectAvatarMode('REMOVE', 'remove');
	}

	module.exports = {
		ProjectAvatarMode: ProjectAvatarMode.export(),
	};
});
