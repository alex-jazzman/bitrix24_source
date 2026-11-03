/** @module tasks/checklist/view-model/support/src/attachments */
jn.define('tasks/checklist/view-model/support/src/attachments', (require, exports, module) => {
	/**
	 * @param {ChecklistAttachmentV2[]|Object<string, ChecklistAttachmentV2>} [attachments]
	 * @return {ChecklistAttachmentV2[]}
	 */
	const normalizeAttachments = (attachments) => {
		const list = Array.isArray(attachments) ? attachments : Object.values(attachments ?? {});

		return list.filter(Boolean);
	};

	/**
	 * @param {ChecklistAttachmentV2[]} [attachments]
	 * @param {ChecklistAttachmentV2} attachment
	 * @return {ChecklistAttachmentV2[]}
	 */
	const upsertAttachment = (attachments, attachment) => {
		const merged = (attachments ?? []).filter((existing) => existing.id !== attachment.id);
		merged.push(attachment);

		return merged;
	};

	/**
	 * @param {ChecklistAttachmentV2[]} [attachments]
	 * @param {ChecklistItemId} id
	 * @return {ChecklistAttachmentV2[]}
	 */
	const removeAttachmentById = (attachments, id) => (attachments ?? [])
		.filter((attachment) => attachment.id !== id);

	module.exports = { normalizeAttachments, upsertAttachment, removeAttachmentById };
});
