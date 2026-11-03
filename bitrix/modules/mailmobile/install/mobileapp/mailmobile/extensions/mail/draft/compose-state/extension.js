/**
 * @module mail/draft/compose-state
 */
jn.define('mail/draft/compose-state', (require, exports, module) => {
	const { stringify } = require('utils/string');
	const safeLinkPattern = /^(?:https?:\/\/|mailto:|tel:)/i;

	function getSafeAnchorUrl(attributes)
	{
		const match = stringify(attributes).match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
		const url = jnComponent.convertHtmlEntities(match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim();

		return safeLinkPattern.test(url) && !/[\s\u0000-\u001F\u007F]/.test(url) ? url : '';
	}

	function escapeHtmlText(value)
	{
		return stringify(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
		;
	}

	function preserveAnchorDestination(attributes, content)
	{
		const url = getSafeAnchorUrl(attributes);
		if (!url)
		{
			return content;
		}

		const label = jnComponent.convertHtmlEntities(stringify(content).replace(/<[^>]*>/g, '')).trim();

		return label === url ? content : `${content} (${escapeHtmlText(url)})`;
	}

	function canonicalHtmlToPlainText(value)
	{
		const html = stringify(value)
			.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
			.replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi, (anchor, attributes, content) => (
				preserveAnchorDestination(attributes, content)
			))
			.replace(/<br\s*\/?\s*>/gi, '\n')
			.replace(/<\/(?:div|h[1-6]|li|p|pre|tr)\s*>/gi, '\n')
			.replace(/<[^>]*>/g, '')
		;

		return jnComponent.convertHtmlEntities(html)
			.replace(/\u00A0/g, ' ')
			.replace(/\r\n?/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
			.replace(/^\n+|\n+$/g, '')
		;
	}

	function plainTextToCanonicalHtml(value)
	{
		return stringify(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;')
			.replace(/\r\n?|\n/g, '<br>')
		;
	}

	function hasSavableDraftContent({
		subject = '',
		userBodyWithoutSignature = '',
		to = [],
		cc = [],
		bcc = [],
		attachments = [],
	} = {})
	{
		return stringify(subject).trim() !== ''
			|| stringify(userBodyWithoutSignature).trim() !== ''
			|| (Array.isArray(to) && to.length > 0)
			|| (Array.isArray(cc) && cc.length > 0)
			|| (Array.isArray(bcc) && bcc.length > 0)
			|| (Array.isArray(attachments) && attachments.length > 0)
		;
	}

	/**
	 * A file field value keeps either a bare identifier or the whole file object, so the key must be
	 * derived the same way for both to survive a rerender of the attachments field.
	 */
	function getDraftAttachmentKey(file)
	{
		const key = (file !== null && typeof file === 'object')
			? (file.serverFileId ?? file.id)
			: file
		;

		return key ? String(key) : '';
	}

	/**
	 * The binding of a stored draft is taken from the bindings map only: it is the map that is renewed by
	 * every save response and dropped together with the draft identity.
	 */
	function buildDraftAttachmentSource(file, bindingId)
	{
		if (bindingId)
		{
			return { source: 'draft', id: String(bindingId) };
		}

		const id = getDraftAttachmentKey(file);
		if (!id)
		{
			return null;
		}

		return { source: file?.isDiskFile ? 'disk' : 'upload', id };
	}

	/**
	 * @param {Array} files file field value
	 * @param {Object} bindings draft attachment binding id by attachment key
	 * @return {{ attachments: Array, keys: string[] }} snapshot sources and the file key behind each of them
	 */
	function buildDraftAttachmentPlan(files = [], bindings = {})
	{
		const attachments = [];
		const keys = [];
		const takenSources = {};

		files
			.filter((file) => !file?.isUploading && !file?.hasError)
			.forEach((file) => {
				const key = getDraftAttachmentKey(file);
				const attachment = buildDraftAttachmentSource(file, bindings[key]);
				if (!attachment)
				{
					return;
				}

				// the server keeps the first of the repeated sources, the plan has to stay aligned with it
				const sourceKey = `${attachment.source}:${attachment.id}`;
				if (takenSources[sourceKey])
				{
					return;
				}

				takenSources[sourceKey] = true;
				attachments.push(attachment);
				keys.push(key);
			})
		;

		return { attachments, keys };
	}

	function buildSavableDraftAttachments(files = [], bindings = {})
	{
		return buildDraftAttachmentPlan(files, bindings).attachments;
	}

	function buildRestoredDraftAttachmentBindings(files = [])
	{
		const bindings = {};
		files.forEach((file) => {
			const key = getDraftAttachmentKey(file);
			if (key && file?.draftSourceId)
			{
				bindings[key] = String(file.draftSourceId);
			}
		});

		return bindings;
	}

	/**
	 * Saving recreates the attachment bindings as soon as their composition changes, so the ids the next
	 * save reuses are taken from the response, matched to the plan the saved snapshot was built from.
	 *
	 * @return {?Object} bindings by attachment key, null when the response cannot be matched
	 */
	function mapSavedDraftAttachmentBindings(keys = [], savedAttachments = [])
	{
		if (!Array.isArray(keys) || !Array.isArray(savedAttachments) || keys.length !== savedAttachments.length)
		{
			return null;
		}

		const bindings = {};
		savedAttachments.forEach(({ source, id } = {}, index) => {
			if (source === 'draft' && id && keys[index])
			{
				bindings[keys[index]] = String(id);
			}
		});

		return bindings;
	}

	function getSavableAttachmentsFingerprint(files = [])
	{
		return JSON.stringify(buildSavableDraftAttachments(files));
	}

	/**
	 * The converted large attachment sets as the draft stores them. The source objects the set was built
	 * from are what the mail module matches a restored set against, and for a mobile letter they are the
	 * very objects of the Disk the set holds.
	 *
	 * @param {Array} sets
	 * @return {Array}
	 */
	function buildSavableDraftLargeAttachments(sets = [])
	{
		return (Array.isArray(sets) ? sets : [])
			.filter((set) => String(set?.token ?? '') !== '')
			.map((set) => {
				const fileIds = (Array.isArray(set.fileIds) ? set.fileIds : []).map(Number);

				return {
					token: String(set.token),
					publicUrl: String(set.publicUrl ?? ''),
					fileIds,
					sourceFileIds: Array.isArray(set.sourceFileIds) ? set.sourceFileIds.map(Number) : fileIds,
				};
			})
		;
	}

	/**
	 * The fingerprint the draft state watches the sets by. It counts a set by its address, not its token:
	 * a set the server invalidated arrives with an address but an empty token, and only the address tells it
	 * apart. Keying by the token instead - the way the savable snapshot does - would filter such a set out of
	 * both the baseline and the sets after the drop, and dropping it would register as no change at all.
	 *
	 * @param {Array} sets
	 * @return {Array}
	 */
	function buildDraftLargeAttachmentFingerprint(sets = [])
	{
		return (Array.isArray(sets) ? sets : [])
			.filter((set) => String(set?.publicUrl ?? '') !== '')
			.map((set) => ({
				publicUrl: String(set.publicUrl),
				fileIds: (Array.isArray(set.fileIds) ? set.fileIds : []).map(Number),
			}))
		;
	}

	/**
	 * The sets a restored draft brings back. A set the server marked invalid is handed over as it is: the
	 * client does not decide the validity of a set by its presence, the server revalidates it.
	 *
	 * @param {Array} sets
	 * @return {Array}
	 */
	function buildRestoredDraftLargeAttachments(sets = [])
	{
		return (Array.isArray(sets) ? sets : [])
			.filter((set) => String(set?.publicUrl ?? '') !== '')
			.map((set) => ({
				token: String(set.token ?? ''),
				publicUrl: String(set.publicUrl),
				fileIds: (Array.isArray(set.fileIds) ? set.fileIds : []).map(Number),
				sourceFileIds: Array.isArray(set.sourceFileIds) ? set.sourceFileIds.map(Number) : [],
				valid: set.valid !== false,
			}))
		;
	}

	class DraftComposeState
	{
		constructor(files = [], largeAttachments = [])
		{
			this.attachmentsFingerprint = getSavableAttachmentsFingerprint(files);
			this.largeAttachmentsFingerprint = JSON.stringify(
				buildDraftLargeAttachmentFingerprint(largeAttachments),
			);
			this.meaningfulChange = false;
		}

		markUserChange()
		{
			this.meaningfulChange = true;
		}

		updateFiles(files)
		{
			const nextFingerprint = getSavableAttachmentsFingerprint(files);
			const changed = nextFingerprint !== this.attachmentsFingerprint;
			this.attachmentsFingerprint = nextFingerprint;
			if (changed)
			{
				this.markUserChange();
			}

			return changed;
		}

		/**
		 * The sets take part in the fingerprint of the state of the draft: without it the autosave would
		 * not notice that a set has appeared, and a heavy file would be lost on a restore.
		 *
		 * @param {Array} largeAttachments
		 * @return {boolean}
		 */
		updateLargeAttachments(largeAttachments)
		{
			const nextFingerprint = JSON.stringify(buildDraftLargeAttachmentFingerprint(largeAttachments));
			const changed = nextFingerprint !== this.largeAttachmentsFingerprint;
			this.largeAttachmentsFingerprint = nextFingerprint;
			if (changed)
			{
				this.markUserChange();
			}

			return changed;
		}

		hasMeaningfulChange()
		{
			return this.meaningfulChange;
		}

		getDraftBody(value)
		{
			return plainTextToCanonicalHtml(value);
		}
	}

	module.exports = {
		hasSavableDraftContent,
		getDraftAttachmentKey,
		buildDraftAttachmentPlan,
		buildSavableDraftAttachments,
		buildRestoredDraftAttachmentBindings,
		buildSavableDraftLargeAttachments,
		buildDraftLargeAttachmentFingerprint,
		buildRestoredDraftLargeAttachments,
		mapSavedDraftAttachmentBindings,
		getSavableAttachmentsFingerprint,
		canonicalHtmlToPlainText,
		plainTextToCanonicalHtml,
		DraftComposeState,
	};
});
