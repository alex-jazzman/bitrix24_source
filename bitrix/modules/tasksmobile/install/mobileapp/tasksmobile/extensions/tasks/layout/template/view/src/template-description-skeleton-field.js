/**
 * @module tasks/layout/template/view/src/template-description-skeleton-field
 */
jn.define('tasks/layout/template/view/src/template-description-skeleton-field', (require, exports, module) => {
	const { Indent } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { Line } = require('utils/skeleton');

	const TemplateDescriptionSkeletonField = (props) => {
		const { testId } = props;
		const getTestId = createTestIdGenerator({
			prefix: testId,
		});

		return View(
			{
				testId: getTestId('field'),
				style: {
					marginTop: Indent.XL3.toNumber(),
				},
			},
			Line('100%', 8, 0, Indent.S.toNumber()),
			Line('76%', 8),
		);
	};

	module.exports = {
		TemplateDescriptionSkeletonField,
	};
});
