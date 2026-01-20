/**
 * @module mail/message/tools/connector
 */
jn.define('mail/message/tools/connector', (require, exports, module) => {
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

			return JSON.stringify({
				email: emailValue,
				entityId: id,
				name: title,
				...fieldToEntity(type, id, ownerType),
			});
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
	function sendMessage(props)
	{
		const {
			senders,
			fileTokens,
			message,
			from,
			to,
			ownerType,
			ownerId,
			inResponseToMessage,
			isForward = 0,
			isCrmMessage = true,
		} = props;

		const subject = buildFieldValue(props.subject);

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
			message: buildFieldValue(message),
			content_type: HTML_CONTENT_TYPE,
			bindings: [{
				entityType: ownerType,
				entityId: ownerId,
			}],
		};

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

		return BX.ajax.runAction(action, config);
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
	 */
	function getChainPromise(id, isCrmMessage = 1)
	{
		return BX.ajax.runAction('mailmobile.api.Message.getChain', {
			data: {
				id,
				messageType: isCrmMessage,
			},
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
	 */
	function getMessagePromise(id, takeBody = false, takeFiles = false, isCrmMessage = 1)
	{
		return BX.ajax.runAction('mailmobile.api.Message.getMessage', {
			data: {
				id,
				takeBody,
				takeFiles,
				messageType: isCrmMessage,
			},
		});
	}

	module.exports = {
		getContactsPromise,
		getMessagePromise,
		getChainPromise,
		getMessageNeighbors,
		sendMessage,
		deleteMessage,
	};
});
