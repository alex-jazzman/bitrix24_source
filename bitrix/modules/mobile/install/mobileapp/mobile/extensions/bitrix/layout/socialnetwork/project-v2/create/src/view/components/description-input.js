/**
 * @module layout/socialnetwork/project-v2/create/src/view/components/description-input
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/components/description-input', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { Loc } = require('loc');
	const { TextAreaInput } = require('ui-system/form/inputs/textarea');
	const { InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');

	const ProjectCreateDescriptionInput = ({ testId, value, onChange }) => {
		return Area(
			{
				excludePaddingSide: {
					bottom: true,
				},
			},
			TextAreaInput({
				testId: testId ?? 'project-create-description-input',
				value,
				size: InputSize.M,
				placeholder: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_DESCRIPTION_PLACEHOLDER'),
				label: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_DESCRIPTION_LABEL'),
				onChange,
				design: InputDesign.LIGHT_GREY,
				mode: InputMode.STROKE,
				showCharacterCount: false,
				height: 102,
			}),
		);
	};

	module.exports = { ProjectCreateDescriptionInput };
});
