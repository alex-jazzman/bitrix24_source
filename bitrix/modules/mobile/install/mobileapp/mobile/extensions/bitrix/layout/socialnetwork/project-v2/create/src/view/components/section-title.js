/**
 * @module layout/socialnetwork/project-v2/create/src/view/components/section-title
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/components/section-title', (require, exports, module) => {
	const { Indent, Color } = require('tokens');
	const { Text5 } = require('ui-system/typography/text');

	const ProjectCreateSectionTitle = ({ text, testId }) => Text5({
		text,
		testId,
		color: Color.base4,
		style: {
			marginBottom: Indent.M.toNumber(),
			textTransform: 'uppercase',
		},
	});

	module.exports = { ProjectCreateSectionTitle };
});
