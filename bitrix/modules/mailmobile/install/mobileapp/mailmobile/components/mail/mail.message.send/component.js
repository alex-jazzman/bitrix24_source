(() => {
	const require = (ext) => jn.require(ext);
	const { SendingForm, getReplyMessageBodyParams } = require('mail/sending-form');
	const { resolveRestoredDraft } = require('mail/compose-context');
	const { buildRestoredDraftLargeAttachments } = require('mail/draft/compose-state');

	const EMPTY_CONTACT = { value: '' };

	function buildContactSetForFields(contacts)
	{
		const isOldFormat = !contacts?.[0]?.customData;

		if (isOldFormat)
		{
			return contacts.map((item) => ({ value: item.email, isEmailHidden: item.isEmailHidden }));
		}

		return contacts.map((item) => ({
			value: item?.customData?.email,
			isEmailHidden: item?.customData?.isEmailHidden,
			customData: item?.customData,
		}));
	}

	function buildContactListForBindings(contacts)
	{
		const bindingsList = [];
		Object.entries(contacts).forEach(([key, item]) => {
			const {
				typeName = 'contacts',
				id = '',
				name = '',
			} = item;

			let {
				email = [],
			} = item;

			if (!Array.isArray(email))
			{
				email = [
					{
						value: email,
					},
				];
			}

			bindingsList.push({
				email,
				typeName,
				id,
				name,
			});
		});

		return bindingsList;
	}

	function buildDraftContacts(recipients = [])
	{
		return recipients.map((recipient) => ({
			customData: {
				email: recipient.email,
				name: recipient.name,
				entityType: recipient.entityType,
				entityId: recipient.entityId,
			},
		}));
	}

	/**
	 * The attachments of a restored draft. Each of them is stored as a disk object, but it is reported to the
	 * send by that object only while the server marks the large attachment scenario as available: with it off
	 * the module storage holds no placement for such an object and the send is refused, so the attachment
	 * travels the way it did before the scenario existed: by the claim the send makes for its own draft.
	 *
	 * @param {?Object} draft
	 * @param {boolean} largeAttachmentEnabled availability mark of the server
	 * @return {Array}
	 */
	function buildDraftFiles(draft, largeAttachmentEnabled)
	{
		const attachments = draft?.attachments ?? [];
		const sources = draft?.snapshot?.attachments ?? [];
		const sourcesAligned = sources.length === attachments.length;

		return attachments.map((file, index) => {
			const source = sourcesAligned ? sources[index] : null;
			const diskObjectId = Number(file.id);
			const isStoredObject = largeAttachmentEnabled === true
				&& Number.isInteger(diskObjectId)
				&& diskObjectId > 0
			;

			// The object this copy was made from, when the draft made a copy of one. A set of the large
			// attachment scenario is signed over the source objects, so a form that only knows the copies
			// asks the server for an independent set and the draft drops it on the next autosave. A mail
			// module released before the field simply reports none, and then a copy stands for itself
			// exactly as it did before.
			const sourceObjectId = Number(file.sourceObjectId);

			return {
				id: file.id,
				serverFileId: isStoredObject ? `n${diskObjectId}` : null,
				sourceObjectId: Number.isInteger(sourceObjectId) && sourceObjectId > 0 ? sourceObjectId : null,
				name: file.name,
				size: file.size,
				type: file.contentType,
				url: file.url ?? null,
				previewUrl: file.previewUrl ?? null,
				previewWidth: file.previewWidth ?? null,
				previewHeight: file.previewHeight ?? null,
				isUploading: false,
				isDiskFile: true,
				draftSourceId: source?.source === 'draft' ? source.id : null,
			};
		});
	}

	BX.onViewLoaded(() => {
		let isForward = BX.componentParameters.get('isForward', 0);
		const startEmailSender = BX.componentParameters.get('startEmailSender', null);
		const isCrmMessage = BX.componentParameters.get('isCrmMessage', 1);
		const replyMessageBodyParams = getReplyMessageBodyParams(BX.componentParameters);
		const subject = BX.componentParameters.get('subject', '');
		const body = BX.componentParameters.get('body', '');
		const files = BX.componentParameters.get('files', []);
		const isSendFiles = BX.componentParameters.get('isSendFiles', false);
		const senders = BX.componentParameters.get('senders', []);
		const clients = BX.componentParameters.get('clients', []);
		const source = BX.componentParameters.get('source', 'mail');
		const element = BX.componentParameters.get('element', 'compose_button');
		const draftAvailable = BX.componentParameters.get('draftAvailable', false);
		const draft = BX.componentParameters.get('draft', null);
		const draftSnapshot = draft?.snapshot ?? null;
		const recipientLimits = BX.componentParameters.get('recipientLimits', undefined);
		const deviceContactsAvailable = BX.componentParameters.get('deviceContactsAvailable', false);
		const mailTemplatesEnabled = BX.componentParameters.get('mailTemplatesEnabled', false);
		const mailTemplateSaveAvailable = BX.componentParameters.get('mailTemplateSaveAvailable', false);
		const mailTemplateManagePath = BX.componentParameters.get('mailTemplateManagePath', '');
		const subjectGenerationAvailable = BX.componentParameters.get('subjectGenerationAvailable', false);
		const signaturesAvailable = BX.componentParameters.get('signaturesAvailable', false);
		const signatureContext = BX.componentParameters.get('signatureContext', null);
		// The scenario of the large attachment is decided by the server: the threshold, the tariff and the
		// one-time guides all come from the mail module, and the form must not recompute any of them.
		const largeAttachmentInfo = {
			largeAttachmentEnabled: BX.componentParameters.get('largeAttachmentEnabled', false),
			largeAttachmentTariffAvailable: BX.componentParameters.get('largeAttachmentTariffAvailable', false),
			largeAttachmentMaxSize: BX.componentParameters.get('largeAttachmentMaxSize', 0),
			largeAttachmentShowAha: BX.componentParameters.get('largeAttachmentShowAha', false),
			largeAttachmentAhaOptionName: BX.componentParameters.get('largeAttachmentAhaOptionName', ''),
			largeAttachmentShowStorageNotice: BX.componentParameters.get('largeAttachmentShowStorageNotice', false),
			largeAttachmentStorageNoticeOptionName: BX.componentParameters.get(
				'largeAttachmentStorageNoticeOptionName',
				'',
			),
			largeAttachmentPostSendPromptSuppressed: BX.componentParameters.get(
				'largeAttachmentPostSendPromptSuppressed',
				false,
			),
			largeAttachmentPostSendPromptOptionName: BX.componentParameters.get(
				'largeAttachmentPostSendPromptOptionName',
				'',
			),
		};
		const restoredDraft = resolveRestoredDraft(
			BX.componentParameters.get('restoredDraft', undefined),
			body,
			true,
		) || Boolean(draftSnapshot);
		const clientIdsByType = BX.componentParameters.get('clientIdsByType', {
			contacts: [],
			company: [],
		});

		let to = BX.componentParameters.get('contacts', []);
		let cc = BX.componentParameters.get('cc', []);
		let bcc = BX.componentParameters.get('bcc', []);

		if (draftSnapshot)
		{
			to = buildDraftContacts(draftSnapshot.to);
			cc = buildDraftContacts(draftSnapshot.cc);
			bcc = buildDraftContacts(draftSnapshot.bcc);
		}

		const bindingsData = buildContactListForBindings(clients);

		to = to.length > 0 ? buildContactSetForFields(to) : [EMPTY_CONTACT];
		cc = cc.length > 0 ? buildContactSetForFields(cc) : [EMPTY_CONTACT];
		bcc = bcc.length > 0 ? buildContactSetForFields(bcc) : [EMPTY_CONTACT];

		const ownerEntity = BX.componentParameters.get('owner', {
			inResponseToMessage: 0,
			ownerType: 0,
			ownerId: 0,
		});
		if (draftSnapshot)
		{
			ownerEntity.inResponseToMessage = draftSnapshot.parentMessageId ?? 0;
			isForward = draftSnapshot.mode === 'forward' ? 1 : 0;
		}

		const sendingFormParams = {
			...largeAttachmentInfo,
			bindingsData,
			senders,
			clientIdsByType,
			clients,
			...replyMessageBodyParams,
			to,
			cc,
			bcc,
			subject: draftSnapshot?.subject ?? subject,
			body: draftSnapshot?.body ?? body,
			files: draft ? buildDraftFiles(draft, largeAttachmentInfo.largeAttachmentEnabled) : files,
			isSendFiles: draft ? true : isSendFiles,
			isCrmMessage,
			ownerEntity,
			isForward,
			source,
			element,
			draftAvailable,
			draftId: draft?.id ?? null,
			draftRevision: draft?.revision ?? null,
			draftSnapshot,
			clientId: draftSnapshot?.clientId ?? null,
			isRestoredDraft: Boolean(draftSnapshot),
			draftLargeAttachments: buildRestoredDraftLargeAttachments(draftSnapshot?.largeAttachments),
			recipientLimits,
			deviceContactsAvailable,
			mailTemplatesEnabled,
			mailTemplateSaveAvailable,
			mailTemplateManagePath,
			subjectGenerationAvailable,
			signaturesAvailable,
			signatureContext,
			restoredDraft,
			widget: this.layout,
		};

		if (draftSnapshot?.sender?.email)
		{
			sendingFormParams.startEmailSender = draftSnapshot.sender.email;
		}
		else if (startEmailSender)
		{
			sendingFormParams.startEmailSender = startEmailSender;
		}

		const sendingForm = new SendingForm(sendingFormParams);
		layout.showComponent(sendingForm);
		if (signatureContext === null)
		{
			sendingForm.refreshSignatureContext();
		}
	});
})();
