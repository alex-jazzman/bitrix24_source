/**
 * @module layout/socialnetwork/project-v2/create/src/view/components/name-input
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/components/name-input', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { Indent } = require('tokens');
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { StringInput, InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');
	const { ProjectImage } = require('layout/socialnetwork/project-v2/create/src/view/components/project-image');

	const ProjectCreateNameInput = ({ testId, avatar, value, onChange, onImageClick, bindNameFieldRef }) => {
		const getTestId = createTestIdGenerator({ prefix: testId });

		return Area(
			{
				isFirst: true,
				excludePaddingSide: {
					bottom: true,
				},
				style: {
					flexDirection: 'row',
					alignItems: 'flex-start',
				},
			},
			ProjectImage({
				testId: getTestId('image'),
				onClick: onImageClick,
				url: avatar?.previewUrl,
			}),
			View(
				{
					style: {
						height: 60,
						flex: 1,
						paddingLeft: Indent.XL2.getValue(),
					},
				},
				StringInput({
					testId: getTestId('field'),
					forwardRef: bindNameFieldRef,
					size: InputSize.L,
					value,
					placeholder: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_NAME_PLACEHOLDER'),
					design: InputDesign.LIGHT_GREY,
					mode: InputMode.STROKE,
					onChange,
				}),
			),
		);
	};

	module.exports = { ProjectCreateNameInput };
});
