/**
 * @module mail/message/tools/connector
 */
jn.define('mail/message/tools/connector', (require, exports, module) => {
	const { AjaxMethod } = require('mail/const');

	function buildSender(email, senders)
	{
		let name = email;

		Object.entries(senders).some(([, value]) => {
			if (value.email === email && value.name)
			{
				name = value.name;

				return true;
			}
		});

		return `${name} <${email}>`;
	}

	function buildContactData(contact = {}, ownerType = '')
	{
		return contact.fields.map((item) => {
			const {
				email = [
					{
						value: '',
					},
				],
				type = '',
				id = 0,
				title = '',
				customData = {},
				selectedEmailId,
			} = item;

			let emailValue = '';

			if (email.length > 0)
			{
				if (email[selectedEmailId] && email[selectedEmailId].value)
				{
					emailValue = email[selectedEmailId].value;
				}
				else if (email[0].value)
				{
					emailValue = email[0].value;
				}
			}

			if (!emailValue && customData && customData.email)
			{
				emailValue = customData.email;
			}

			const entity = fieldToEntity(type, id, ownerType);
			const recipient = {
				email: emailValue,
				entityId: entity.entityId ?? id,
				name: title,
				entityType: entity.entityType,
			};

			// A restored draft recipient absent from the preloaded bindings arrives as a plain
			// e-mail field, but its CRM identity survives in customData. Keep that identity so the
			// activity communication is bound to the real entity instead of the address string.
			const customEntityType = customData?.entityType;
			const customEntityId = Number(customData?.entityId) || 0;
			const fieldHasCrmIdentity = type === 'contact' || type === 'company';
			if (!fieldHasCrmIdentity && customEntityType && customEntityType !== 'email' && customEntityId > 0)
			{
				recipient.entityType = normalizeRecipientEntityType(customEntityType);
				recipient.entityId = customEntityId;
			}

			return JSON.stringify(recipient);
		}).filter(Boolean);
	}

	function buildFieldValue(data)
	{
		if (data)
		{
			if (data.fields[0] && data.fields[0].value)
			{
				return data.fields[0].value;
			}

			if (typeof data.fields === 'string')
			{
				return data.fields;
			}

			if (typeof data === 'string')
			{
				return data;
			}
		}

		return '';
	}

	function normalizeRecipientEntityType(entityType)
	{
		switch (entityType)
		{
			case 'contact':
				return 'contacts';
			case 'company':
				return 'companies';
			default:
				return entityType;
		}
	}

	function fieldToEntity(type, id, ownerType)
	{
		const entity = {
			entityType: 'contacts',
		};

		switch (type)
		{
			case 'contact':
				entity.entityType = 'contacts';
				break;
			case 'company':
				entity.entityType = 'companies';
				break;
			case 'user':
				entity.entityType = 'contacts';
				entity.entityId = 0;
				break;
			default:
				entity.entityType = ownerType;
				break;
		}

		if (id === 0)
		{
			entity.entityType = 'contacts';
		}

		return entity;
	}

	/**
	 * @function sendMessage
	 */
	function sendMessage(props, runAction = (action, config) => BX.ajax.runAction(action, config))
	{
		const {
			senders,
			fileTokens,
			message,
			messageHtml,
			from,
			to,
			ownerType,
			ownerId,
			inResponseToMessage,
			isForward = 0,
			isCrmMessage = true,
			draftId = null,
			draftRevision = null,
			draftClientId = null,
			largeAttachments = null,
			saveAsTemplate = false,
		} = props;

		const subject = buildFieldValue(props.subject);
		const body = typeof messageHtml === 'string' && messageHtml.length > 0
			? messageHtml
			: buildFieldValue(message)
		;

		const HTML_CONTENT_TYPE = 3;
		const CRM_ACTIVITY_STORAGE_TYPE = 3;

		const data = {
			fileTokens,
			from: buildSender(buildFieldValue(from), senders),
			to: buildContactData(to, ownerType),
			subject,
			ownerType,
			ownerId,
			storageTypeID: CRM_ACTIVITY_STORAGE_TYPE,
			message: isCrmMessage ? body : buildFieldValue(message),
			content_type: HTML_CONTENT_TYPE,
			bindings: [{
				entityType: ownerType,
				entityId: ownerId,
			}],
		};

		if (!isCrmMessage && messageHtml)
		{
			data.htmlMessage = messageHtml;
		}

		if (!isCrmMessage && saveAsTemplate === true)
		{
			data.saveAsTemplate = true;
		}

		const cc = buildContactData(props.cc, ownerType);
		const bcc = buildContactData(props.bcc, ownerType);

		if (cc)
		{
			data.cc = cc;
		}

		if (bcc)
		{
			data.bcc = bcc;
		}

		if (inResponseToMessage)
		{
			data.REPLIED_ID = inResponseToMessage;
		}

		if (draftId)
		{
			data.draftId = draftId;

			if (draftRevision !== null && draftRevision !== undefined)
			{
				data.draftRevision = draftRevision;
			}

			// The identity of this compose form: the draft of the context may have been taken over by
			// another device, and its attachments must not leave with this message.
			if (draftClientId)
			{
				data.draftClientId = draftClientId;
			}
		}

		// The converted sets extend the contract instead of replacing it: a request without them is handled
		// the way it always was, so attachments of an older build keep working.
		if (Array.isArray(largeAttachments) && largeAttachments.length > 0)
		{
			data.largeAttachments = largeAttachments;
		}

		if (isForward === 1)
		{
			data.IS_FORWARD = 1;
		}
		else
		{
			data.IS_FORWARD = 0;
		}

		const action = isCrmMessage
			? 'crm.api.mail.message.sendMessage'
			: 'mailmobile.api.Message.sendMessage'
		;

		const config = { data: { data } };

		return runAction(action, config);
	}

	/**
	 * @function deleteMessage
	 */
	function deleteMessage(props)
	{
		const {
			id,
			ownerType,
			ownerId,
			successAction,
			failureAction,
		} = props;

		let {
			excludeFromCrm = false,
			markAsSpam = false,
		} = props;

		excludeFromCrm = excludeFromCrm === true ? 'Y' : 'N';

		markAsSpam = markAsSpam === true ? 'Y' : 'N';

		const data = {
			OWNER_ID: ownerId,
			OWNER_TYPE: ownerType,
			IS_SKIP: excludeFromCrm,
			IS_SPAM: markAsSpam,
			ITEM_ID: id,
		};

		return BX.ajax.runAction('crm.api.mail.message.deleteMessage', {
			data: {
				data,
			},
		}).then((response) => {
			if (Number(id) === Number(response.data.DELETED_ITEM_ID))
			{
				successAction();
			}
			else
			{
				failureAction();
			}
		}).catch((response) => {
			failureAction();
		});
	}

	/**
	 * @function getContactDeal
	 */
	function getContactsPromise(ownerId, ownerTypeName, uploadClients = true, uploadSenders = true, isCrmMessage = true)
	{
		if (uploadClients === false && uploadSenders === false)
		{
			return Promise.resolve({ data: {} });
		}

		if (isCrmMessage)
		{
			return BX.ajax.runAction('crm.api.mail.message.getEntityContacts', {
				data: {
					ownerId,
					ownerTypeName,
					uploadClients: (uploadClients ? 1 : 0),
					uploadSenders: (uploadClients ? 1 : 0),
				},
			});
		}

		return BX.ajax.runAction('mailmobile.api.Message.getUserContacts', { json: {} });
	}

	/**
	 * @function getChainPromise
	 * @param {number|string} id
	 * @param {number} [isCrmMessage]
	 * @param {string} [act]
	 * @param {string} [mailUfMessageToken]
	 * @param {MessageThemeRequestParams} [themeRequestParams] Appearance to prepare the bodies for; see
	 *     `mail/message/theme-request`. An empty object leaves the bodies as they are stored.
	 * @return {Promise}
	 */
	function getChainPromise(id, isCrmMessage = 1, act = '', mailUfMessageToken = '', themeRequestParams = {})
	{
		const data = {
			id,
			messageType: isCrmMessage,
			...themeRequestParams,
		};

		if (isCrmMessage)
		{
			data.act = act;
		}
		else
		{
			data.mailUfMessageToken = mailUfMessageToken;
		}

		return BX.ajax.runAction(AjaxMethod.getMessageChain, {
			data,
		});
	}

	/**
	 * @function getMessageNeighbors
	 */
	function getMessageNeighbors(ownerId, ownerTypeId, elementId)
	{
		return BX.ajax.runAction('crm.api.mail.message.getNeighbors', {
			data: {
				ownerId,
				ownerTypeId,
				elementId,
			},
		});
	}

	/**
	 * @function getMessagePromise
	 * @param {number|string} id
	 * @param {boolean} [takeBody]
	 * @param {boolean} [takeFiles]
	 * @param {number} [isCrmMessage]
	 * @param {string} [act]
	 * @param {string} [mailUfMessageToken]
	 * @param {MessageThemeRequestParams} [themeRequestParams] Appearance to prepare the body for; see
	 *     `mail/message/theme-request`. An empty object leaves the body as it is stored.
	 * @return {Promise}
	 */
	function getMessagePromise(
		id,
		takeBody = false,
		takeFiles = false,
		isCrmMessage = 1,
		act = '',
		mailUfMessageToken = '',
		themeRequestParams = {},
	)
	{
		const data = {
			id,
			takeBody,
			takeFiles,
			messageType: isCrmMessage,
			...themeRequestParams,
		};

		if (isCrmMessage)
		{
			data.act = act;
		}
		else
		{
			data.mailUfMessageToken = mailUfMessageToken;
		}

		return BX.ajax.runAction('mailmobile.api.Message.getMessage', {
			data,
		});
	}

	/**
	 * Queues an AI request that generates an e-mail subject from the compose body.
	 * The generated text is delivered asynchronously via the `ai` PULL channel;
	 * the resolved response carries only `{ queueHash }`.
	 *
	 * The CRM entity is what tells the server this is a CRM composition, so it is
	 * sent only when there really is one.
	 *
	 * @function generateSubject
	 * @param {Object} params
	 * @param {string} params.body
	 * @param {string} [params.currentSubject] Subject to improve, if already entered.
	 * @param {string} params.mode One of "new" / "reply" / "forward".
	 * @param {string|number} [params.ownerType] CRM entity type of the composition.
	 * @param {?number} [params.ownerId] CRM entity id of the composition.
	 * @param {?number} [params.originalMessageId]
	 * @return {Promise}
	 */
	function generateSubject({
		body,
		currentSubject = '',
		mode,
		ownerType = '',
		ownerId = 0,
		originalMessageId = null,
	})
	{
		const data = {
			body,
			currentSubject,
			mode,
		};

		if (Number(ownerId) > 0)
		{
			data.ownerType = String(ownerType);
			data.ownerId = Number(ownerId);
		}

		if (Number(originalMessageId) > 0)
		{
			data.originalMessageId = Number(originalMessageId);
		}

		return BX.ajax.runAction(AjaxMethod.generateSubject, { data });
	}

	/**
	 * Asks the server whether AI subject generation is available for the given
	 * composition context. The decision is made entirely on the server; the
	 * resolved response carries `{ subjectGenerationAvailable: boolean }`.
	 *
	 * @function getSubjectGenerationAvailablePromise
	 * @param {boolean} [isCrm=false] Whether availability is queried for CRM composition.
	 * @return {Promise}
	 */
	function getSubjectGenerationAvailablePromise(isCrm = false)
	{
		return BX.ajax.runAction(AjaxMethod.getSubjectGenerationAvailable, {
			data: { isCrm },
		});
	}

	module.exports = {
		getContactsPromise,
		getMessagePromise,
		getChainPromise,
		getMessageNeighbors,
		sendMessage,
		deleteMessage,
		generateSubject,
		getSubjectGenerationAvailablePromise,
	};
});
