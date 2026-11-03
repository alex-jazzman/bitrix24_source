/**
 * @module crm/document/details/error-panel
 */
jn.define('crm/document/details/error-panel', (require, exports, module) => {
	const { Text1, Text4 } = require('ui-system/typography/text');
	const AppTheme = require('apptheme');
	const CrmDocumentDetailsErrorPanel = ({ title, subtitle }) => View(
		{
			style: {
				backgroundColor: AppTheme.colors.bgContentPrimary,
				borderRadius: 12,
				marginHorizontal: 16,
				paddingVertical: 27,
				paddingHorizontal: 16,
				alignItems: 'center',
			},
		},
		title && Text1({
			text: title,
			style: {
				color: AppTheme.colors.base1,
				textAlign: 'center',
				marginBottom: 12,
			},
		}),
		subtitle && Text4({
			text: subtitle,
			style: {
				color: AppTheme.colors.base4,
				textAlign: 'center',
			},
		}),
	);

	module.exports = { CrmDocumentDetailsErrorPanel };
});
