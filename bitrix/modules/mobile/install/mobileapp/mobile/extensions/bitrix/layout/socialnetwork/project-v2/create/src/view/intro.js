/**
 * @module layout/socialnetwork/project-v2/create/src/view/intro
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/intro', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { InfoScreen } = require('layout/ui/info-screen');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');
	const { createTestIdGenerator } = require('utils/test');

	const getTestId = createTestIdGenerator({
		prefix: 'project-create-intro',
	});

	const ProjectCreateIntro = ({ onContinue }) => InfoScreen({
		testId: getTestId(),
		testIds: {
			box: getTestId(),
			content: getTestId('content'),
			footer: getTestId('footer'),
			primaryButton: getTestId('continue-btn'),
		},
		safeArea: { bottom: true },
		withScroll: true,
		backgroundColor: Color.bgContentPrimary,
		image: {
			uri: makeLibraryImagePath('zefir-banner.png', 'projects-v2'),
			resizeMode: 'contain',
			width: 180,
			height: 130,
		},
		title: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_TITLE'),
		titleColor: Color.base2,
		items: [
			{
				text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_FEATURE_1'),
				icon: Icon.PERSON_CHECKS,
			},
			{
				text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_FEATURE_2'),
				icon: Icon.CHATS,
			},
			{
				text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_FEATURE_3'),
				icon: Icon.BITRIX_GPT,
			},
		],
		footnote: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_INVITE'),
		footnoteColor: Color.base3,
		footer: true,
		contentMaxWidth: 340,
		accentColor: Color.accentMainPrimary,
		primaryButton: {
			testId: getTestId('continue-btn'),
			text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_CONTINUE'),
			backgroundColor: Color.accentMainPrimary,
			onClick: onContinue,
		},
	});

	module.exports = { ProjectCreateIntro };
});
