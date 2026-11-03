/** @module tasks/checklist/view-model/support/src/members */
jn.define('tasks/checklist/view-model/support/src/members', (require, exports, module) => {
	const ROLE_ACCOMPLICE = 'accomplice';
	const ROLE_AUDITOR = 'auditor';

	/**
	 * @param {ChecklistMemberV2[]} [members]
	 * @param {string} role
	 * @return {ChecklistMember[]}
	 */
	const withRole = (members, role) => (members ?? []).map((member) => ({ ...member, role }));

	/**
	 * @param {ChecklistItemReduxModel} [model]
	 * @return {ChecklistMember[]}
	 */
	const getAccomplices = (model) => withRole(model?.accomplices, ROLE_ACCOMPLICE);

	/**
	 * @param {ChecklistItemReduxModel} [model]
	 * @return {ChecklistMember[]}
	 */
	const getAuditors = (model) => withRole(model?.auditors, ROLE_AUDITOR);

	/**
	 * @param {ChecklistItemReduxModel} [model]
	 * @return {ChecklistMember[]}
	 */
	const getMembers = (model) => [...getAccomplices(model), ...getAuditors(model)];

	/**
	 * @param {ChecklistItemReduxModel} [model]
	 * @return {number}
	 */
	const countMembers = (model) => (model?.accomplices ?? []).length + (model?.auditors ?? []).length;

	module.exports = { getAccomplices, getAuditors, getMembers, countMembers };
});
