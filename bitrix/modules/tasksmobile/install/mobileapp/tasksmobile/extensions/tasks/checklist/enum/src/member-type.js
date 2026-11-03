/**
 * @module tasks/checklist/enum/src/member-type
 */
jn.define('tasks/checklist/enum/src/member-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/** @class ChecklistMemberType */
	class ChecklistMemberType extends BaseEnum
	{
		static ACCOMPLICE = new ChecklistMemberType(
			'ACCOMPLICE',
			{ code: 'A', role: 'accomplice', storeKey: 'accomplices' },
		);

		static AUDITOR = new ChecklistMemberType('AUDITOR', { code: 'U', role: 'auditor', storeKey: 'auditors' });

		/** @return {string} */
		getCode()
		{
			return this.getValue().code;
		}

		/** @return {string} */
		getRole()
		{
			return this.getValue().role;
		}

		/** @return {string} */
		getStoreKey()
		{
			return this.getValue().storeKey;
		}

		/**
		 * @param {string} code
		 * @return {ChecklistMemberType|null}
		 */
		static byCode(code)
		{
			return this.getEnums().find((type) => type.getCode() === code) ?? null;
		}

		/**
		 * @param {string} role
		 * @return {ChecklistMemberType|null}
		 */
		static byRole(role)
		{
			return this.getEnums().find((type) => type.getRole() === role) ?? null;
		}

		/**
		 * @param {string} value
		 * @return {boolean}
		 */
		static isStoreKey(value)
		{
			return this.getEnums().some((type) => type.getStoreKey() === value);
		}

		/** @return {string[]} */
		static getStoreKeys()
		{
			return this.getEnums().map((type) => type.getStoreKey());
		}
	}

	module.exports = { ChecklistMemberType };
});
