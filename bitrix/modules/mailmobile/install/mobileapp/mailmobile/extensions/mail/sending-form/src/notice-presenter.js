/**
 * @module mail/sending-form/src/notice-presenter
 */
jn.define('mail/sending-form/src/notice-presenter', (require, exports, module) => {
	const { Loc } = require('loc');
	const { NoticeKind } = require('mail/ai-subject');
	const { showToast, showErrorToast, Position } = require('toast');

	class SubjectNoticePresenter
	{
		constructor({ layout = null, onLimit = null } = {})
		{
			this.layout = layout;
			this.onLimit = onLimit;
		}

		show(kind)
		{
			if (kind === NoticeKind.ERROR)
			{
				return showErrorToast(
					{
						message: Loc.getMessage('MAILMOBILE_AI_SUBJECT_ERROR'),
						position: Position.TOP,
					},
					this.layout,
				);
			}

			if (kind === NoticeKind.HINT)
			{
				return showToast(
					{
						message: Loc.getMessage('MAILMOBILE_AI_SUBJECT_EMPTY_BODY_HINT'),
						position: Position.TOP,
					},
					this.layout,
				);
			}

			if (kind === NoticeKind.LIMIT)
			{
				const toast = showToast(
					{
						message: [
							Loc.getMessage('MAILMOBILE_AI_SUBJECT_LIMIT_TITLE'),
							Loc.getMessage('MAILMOBILE_AI_SUBJECT_LIMIT_TEXT'),
						].join('\n'),
						position: Position.TOP,
						onTap: () => this.onLimit?.(),
					},
					this.layout,
				);

				return toast ?? this.onLimit?.();
			}

			return null;
		}
	}

	module.exports = { SubjectNoticePresenter };
});
