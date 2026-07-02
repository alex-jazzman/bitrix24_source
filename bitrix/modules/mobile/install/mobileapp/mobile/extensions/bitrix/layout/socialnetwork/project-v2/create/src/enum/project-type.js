/**
 * @module layout/socialnetwork/project-v2/create/src/enum/project-type
 */
jn.define('layout/socialnetwork/project-v2/create/src/enum/project-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	class ProjectType extends BaseEnum
	{
		static PUBLIC = new ProjectType(
			'PUBLIC',
			'public',
			'MOBILE_LAYOUT_PROJECT_V2_CREATE_TYPE_PUBLIC',
			'MOBILE_LAYOUT_PROJECT_V2_CREATE_TYPE_PUBLIC_SUBTITLE',
		);

		static PRIVATE = new ProjectType(
			'PRIVATE',
			'private',
			'MOBILE_LAYOUT_PROJECT_V2_CREATE_TYPE_PRIVATE',
			'MOBILE_LAYOUT_PROJECT_V2_CREATE_TYPE_PRIVATE_SUBTITLE',
		);

		constructor(name, value, titleCode, subtitleCode)
		{
			super(name, value);

			this.titleCode = titleCode;
			this.subtitleCode = subtitleCode;
		}

		getTitleCode()
		{
			return this.titleCode;
		}

		getSubtitleCode()
		{
			return this.subtitleCode;
		}
	}

	module.exports = {
		ProjectType: ProjectType.export(),
	};
});
