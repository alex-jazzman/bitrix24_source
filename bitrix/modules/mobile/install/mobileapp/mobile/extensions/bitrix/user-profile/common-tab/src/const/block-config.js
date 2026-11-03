/**
 * @module user-profile/common-tab/src/const/block-config
 */
jn.define('user-profile/common-tab/src/const/block-config', (require, exports, module) => {
	const { GratitudeBlock } = require('user-profile/common-tab/src/block/gratitude/block');
	const { HeaderBlock } = require('user-profile/common-tab/src/block/header/block');
	const { TagsBlock } = require('user-profile/common-tab/src/block/tags/block');
	const { EfficiencyBlock } = require('user-profile/common-tab/src/block/efficiency/block');
	const { AboutMeBlock } = require('user-profile/common-tab/src/block/about-me/block');
	const { DepartmentBlock } = require('user-profile/common-tab/src/block/department/block');
	const { CommonFieldsBlock } = require('user-profile/common-tab/src/block/common-fields/block');
	const { AboutSystemUserBlock } = require('user-profile/common-tab/src/block/about-system-user/block');
	const { OfficeBlock } = require('user-profile/common-tab/src/block/office/block');

	const Section = {
		HEADER: 'HEADER',
		MAIN: 'MAIN',
	};

	const SectionRegistry = {
		[Section.HEADER]: { order: 1 },
		[Section.MAIN]: { order: 2 },
	};

	const BlockRegistry = {
		HEADER: HeaderBlock,
		ABOUT_SYSTEM_USER: AboutSystemUserBlock,
		COMMON_FIELDS: CommonFieldsBlock,
		OFFICE: OfficeBlock,
		DEPARTMENT: DepartmentBlock,
		GRATITUDE: GratitudeBlock,
		EFFICIENCY: EfficiencyBlock,
		TAGS: TagsBlock,
		ABOUT_ME: AboutMeBlock,
	};

	const BlockOrderRegistry = {
		HEADER: { order: 100, section: Section.HEADER },
		ABOUT_SYSTEM_USER: { order: 100, section: Section.MAIN },
		COMMON_FIELDS: { order: 200, section: Section.MAIN },
		OFFICE: { order: 250, section: Section.MAIN },
		DEPARTMENT: { order: 300, section: Section.MAIN },
		GRATITUDE: { order: 400, section: Section.MAIN },
		EFFICIENCY: { order: 500, section: Section.MAIN },
		TAGS: { order: 600, section: Section.MAIN },
		ABOUT_ME: { order: 700, section: Section.MAIN },
	};

	module.exports = {
		Section,
		SectionRegistry,
		BlockRegistry,
		BlockOrderRegistry,
	};
});
