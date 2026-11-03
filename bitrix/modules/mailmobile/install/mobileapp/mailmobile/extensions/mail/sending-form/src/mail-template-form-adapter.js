/**
 * @module mail/sending-form/src/mail-template-form-adapter
 */
jn.define('mail/sending-form/src/mail-template-form-adapter', (require, exports, module) => {
	const { canonicalHtmlToPlainText } = require('mail/draft/compose-state');

	function planMailTemplateBodyReplacement({
		body,
		currentMessage,
		signatureRange = null,
		signatureRequired = false,
		rangeUnknown = false,
	})
	{
		const message = String(currentMessage ?? '');
		if (rangeUnknown || (signatureRequired && !signatureRange))
		{
			return { success: false };
		}

		if (!signatureRange)
		{
			return { success: true, text: String(body ?? ''), range: null };
		}

		if (
			!Number.isInteger(signatureRange.start)
			|| !Number.isInteger(signatureRange.end)
			|| signatureRange.start < 0
			|| signatureRange.end < signatureRange.start
			|| signatureRange.end > message.length
		)
		{
			return { success: false };
		}

		const signature = message.slice(signatureRange.start, signatureRange.end);
		const text = `${String(body ?? '')}${signature}`;

		return {
			success: true,
			text,
			range: signature === '' ? null : { start: text.length - signature.length, end: text.length },
		};
	}

	class MailTemplateFormAdapter
	{
		constructor(form)
		{
			this.form = form;
			this.revision = 0;
		}

		getRevision()
		{
			return this.revision;
		}

		markUserChange()
		{
			this.revision += 1;
		}

		hasUserContent()
		{
			return !MailTemplateFormAdapter.isEmpty(this.form.getMailTemplateSubject())
				|| !MailTemplateFormAdapter.isEmpty(this.form.getDraftUserBodyWithoutSignature())
			;
		}

		isCleanNewCompose()
		{
			return this.form.getMailTemplateMode() === 'new'
				&& !this.form.isMailTemplateRestoredDraft()
				&& !this.hasUserContent()
			;
		}

		async applyTemplate(template, decision)
		{
			if (!template || (decision !== 'insert' && decision !== 'replace'))
			{
				return false;
			}
			if (this.form.canApplyMailTemplateContent(decision) !== true)
			{
				return false;
			}

			const attachments = Array.isArray(template.attachments) ? template.attachments : [];
			let attachmentTransaction = null;
			if (attachments.length > 0)
			{
				attachmentTransaction = await this.form.addMailTemplateAttachments(attachments);
				if (attachmentTransaction?.success !== true)
				{
					return false;
				}
			}

			const body = canonicalHtmlToPlainText(template.bodyHtml);
			let applied = false;
			if (decision === 'insert')
			{
				applied = (await this.form.insertMailTemplateBody(body)) === true;
			}
			else
			{
				applied = (await this.form.replaceMailTemplateContent({
					subject: String(template.subject ?? ''),
					body,
				})) === true;
			}

			if (!applied && attachmentTransaction?.addedIds?.length > 0)
			{
				await this.form.removeMailTemplateAttachments(attachmentTransaction.addedIds);
			}

			return applied;
		}

		static isEmpty(value)
		{
			return String(value ?? '').trim() === '';
		}
	}

	module.exports = { MailTemplateFormAdapter, planMailTemplateBodyReplacement };
});
