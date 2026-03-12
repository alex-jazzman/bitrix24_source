/**
 * @module intranet/fire-admin/src/strategy
 */
jn.define('intranet/fire-admin/src/strategy', (require, exports, module) => {
	const { Loc } = require('loc');

	const AdminHintType = {
		CURRENT: 'current',
		NEXT: 'next',
	};

	/**
	 * @abstract
	 */
	class ConfirmationStrategy
	{
		/**
		 * @abstract
		 * @returns {String}
		 */
		getTitle()
		{
			throw new Error('method getTitle must be overridden');
		}

		/**
		 * @abstract
		 * @returns {String}
		 */
		getHintPhraseId()
		{
			throw new Error('method getHintPhraseId must be overridden');
		}

		/**
		 * @abstract
		 * @returns {String}
		 */
		getAdminHintType()
		{
			throw new Error('method getAdminHintType must be overridden');
		}

		/**
		 * @param {Number} nextAdminId
		 * @param {String} nextAdminName
		 * @param {Number} currentAdminId
		 * @param {String} currentAdminName
		 * @returns {String|null}
		 */
		getHint(nextAdminId, nextAdminName, currentAdminId, currentAdminName)
		{
			const {
				adminId,
				adminName,
			} = this.#resolveHintParams(nextAdminId, nextAdminName, currentAdminId, currentAdminName);

			if (!adminId || !adminName)
			{
				return null;
			}

			const messageId = this.getHintPhraseId();

			return Loc.getMessage(
				messageId,
				{
					'#USER_ID#': adminId,
					'#USER_NAME#': adminName,
				},
			);
		}

		/**
		 * @abstract
		 * @returns {String}
		 */
		getDescription()
		{
			throw new Error('method getDescription must be overridden');
		}

		/**
		 * @returns {String|null}
		 */
		getConfirmWord()
		{
			return Loc.getMessage('M_INTRANET_TRANSFER_ADMIN_RIGHTS_CONFIRM_WORD');
		}

		/**
		 * @returns {String}
		 */
		getInstruction()
		{
			return Loc.getMessage(
				'M_INTRANET_TRANSFER_ADMIN_RIGHTS_CONSENT_INSTRUCTION',
				{
					'#CONFIRM_WORD#': this.getConfirmWord(),
				},
			);
		}

		/**
		 * @returns {Boolean}
		 */
		hasInput()
		{
			return false;
		}

		/**
		 * @param {String} value
		 * @returns {Boolean}
		 */
		validateInput(value = '')
		{
			if (!this.hasInput())
			{
				return false;
			}

			return value === this.getConfirmWord();
		}

		/**
		 * @returns {String}
		 */
		getAcceptButtonText()
		{
			return Loc.getMessage('M_INTRANET_TRANSFER_ADMIN_RIGHTS_CONFIRM_BUTTON');
		}

		/**
		 * @returns {String}
		 */
		getCancelButtonText()
		{
			return Loc.getMessage('M_INTRANET_TRANSFER_ADMIN_RIGHTS_REJECT_BUTTON');
		}

		/**
		 * @returns {String}
		 */
		getInputErrorText()
		{
			return Loc.getMessage(
				'M_INTRANET_TRANSFER_ADMIN_RIGHTS_ERROR_INPUT_TEXT',
				{
					'#CONFIRM_WORD#': this.getConfirmWord(),
				},
			);
		}

		/**
		 * @abstract
		 * @param {Object} params
		 * @returns {function(): void}
		 */
		executeAcceptCallback(params)
		{
			return () => {
				throw new Error('method executeAcceptCallback must be overridden');
			};
		}

		/**
		 * @abstract
		 * @param {Object} params
		 * @param {Object} params.layoutWidget
		 * @param {number} params.currentAdminId
		 * @param {number} params.initiatorId
		 * @returns {function(): void}
		 */
		executeCancelCallback(params)
		{
			return () => {
				throw new Error('method executeCancelCallback must be overridden');
			};
		}

		#resolveHintParams(nextAdminId, nextAdminName, currentAdminId, currentAdminName)
		{
			const adminHintType = this.getAdminHintType();

			let adminId = null;
			let adminName = null;

			if (adminHintType === AdminHintType.CURRENT)
			{
				adminId = currentAdminId;
				adminName = currentAdminName;
			}
			else
			{
				adminId = nextAdminId;
				adminName = nextAdminName;
			}

			return { adminId, adminName };
		}
	}

	module.exports = {
		AdminHintType,
		ConfirmationStrategy,
	};
});
