/**
 * @module mail/templates/src/template-apply-dialog
 */
jn.define('mail/templates/src/template-apply-dialog', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Alert, ButtonType } = require('alert');

	const showTemplateApplyDialog = () => new Promise((resolve) => {
		let completed = false;
		const complete = (decision) => {
			if (completed)
			{
				return;
			}

			completed = true;
			resolve(decision);
		};

		Alert.confirm(
			Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_APPLY_TITLE'),
			Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_APPLY_DESCRIPTION'),
			[
				{
					type: ButtonType.DEFAULT,
					text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_INSERT'),
					onPress: () => complete('insert'),
				},
				{
					type: ButtonType.DESTRUCTIVE,
					text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_REPLACE'),
					onPress: () => complete('replace'),
				},
				{
					type: ButtonType.CANCEL,
					text: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_CANCEL'),
					onPress: () => complete('cancel'),
				},
			],
		);
	});

	module.exports = { showTemplateApplyDialog };
});
