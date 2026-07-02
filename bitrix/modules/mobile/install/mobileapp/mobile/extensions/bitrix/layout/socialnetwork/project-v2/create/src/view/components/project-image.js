/**
 * @module layout/socialnetwork/project-v2/create/src/view/components/project-image
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/components/project-image', (require, exports, module) => {
	const { Color } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Avatar, AvatarShape, AvatarAccentGradient } = require('ui-system/blocks/avatar');
	const { createTestIdGenerator } = require('utils/test');

	const ProjectImage = ({ testId, onClick, url }) => {
		const getTestId = createTestIdGenerator({ prefix: testId });

		return Avatar({
			testId: getTestId(),
			size: 60,
			accent: true,
			onClick,
			uri: url,
			accentGradient: AvatarAccentGradient.BLUE,
			shape: AvatarShape.HEXAGON,
			backgroundColor: Color.accentSoftBlue3,
			icon: IconView({
				testId: getTestId('camera'),
				size: 40,
				color: Color.accentMainPrimary,
				icon: Icon.CAMERA,
			}),
		});
	};

	module.exports = { ProjectImage };
});
