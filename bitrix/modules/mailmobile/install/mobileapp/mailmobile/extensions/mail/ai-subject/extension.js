/**
 * @module mail/ai-subject
 */
jn.define('mail/ai-subject', (require, exports, module) => {
	const { AiSubjectController, SubjectGenerationMode } = require('mail/ai-subject/src/controller');
	const { NoticeKind } = require('mail/ai-subject/src/notice-kind');

	module.exports = { AiSubjectController, SubjectGenerationMode, NoticeKind };
});
