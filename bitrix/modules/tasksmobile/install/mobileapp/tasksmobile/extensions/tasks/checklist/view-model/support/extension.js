/** @module tasks/checklist/view-model/support */
jn.define('tasks/checklist/view-model/support', (require, exports, module) => {
	const {
		computeVisible,
		shouldShowMine,
		shouldShowCompleted,
	} = require('tasks/checklist/view-model/support/src/filter');
	const {
		collectDescendants,
		computeDepth,
	} = require('tasks/checklist/view-model/support/src/tree-nav');
	const {
		canAdd,
		canEdit,
		canRemove,
		canToggle,
		canIndent,
		canOutdent,
	} = require('tasks/checklist/view-model/support/src/rights');
	const {
		getAccomplices,
		getAuditors,
		getMembers,
		countMembers,
	} = require('tasks/checklist/view-model/support/src/members');
	const {
		normalizeAttachments,
		upsertAttachment,
		removeAttachmentById,
	} = require('tasks/checklist/view-model/support/src/attachments');
	const { makeNoopFocusController } = require('tasks/checklist/view-model/support/src/focus');
	const { createRefKeyer } = require('tasks/checklist/view-model/support/src/memo');

	module.exports = {
		computeVisible,
		shouldShowMine,
		shouldShowCompleted,
		collectDescendants,
		computeDepth,
		canAdd,
		canEdit,
		canRemove,
		canToggle,
		canIndent,
		canOutdent,
		getAccomplices,
		getAuditors,
		getMembers,
		countMembers,
		normalizeAttachments,
		upsertAttachment,
		removeAttachmentById,
		makeNoopFocusController,
		createRefKeyer,
	};
});
