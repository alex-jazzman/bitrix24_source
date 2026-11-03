/**
 * @module mail/sending-form
 */
jn.define('mail/sending-form', (require, exports, module) => {
	const { WarningBlock } = require('layout/ui/warning-block');
	const { Alert, ButtonType } = require('alert');
	const { Haptics } = require('haptics');
	const { MailContactField, MailContactType } = require('layout/ui/fields/mail-contact');
	const { MenuSelectField, MenuSelectType } = require('layout/ui/fields/menu-select');
	const { FileField } = require('layout/ui/fields/file');
	const { MultipleField } = require('layout/ui/fields/multiple-field');
	const { TextAreaField, TextAreaType } = require('layout/ui/fields/textarea');
	const { WidgetHeaderButton } = require('layout/ui/widget-header-button');
	const { Loc } = require('loc');
	const { NotifyManager } = require('notify-manager');
	const { Type } = require('type');
	const { contacts } = require('native/contacts');
	const { useCallback } = require('utils/function');
	const { clone } = require('utils/object');
	const { stringify } = require('utils/string');
	const { MessageBody } = require('mail/message/elements/messagebody');
	const {
		sendMessage,
		getContactsPromise,
	} = require('mail/message/tools/connector');
	const { ActionPanel, SaveTemplateToggle } = require('mail/chain/action-panel');
	const { Color, Indent, Typography } = require('tokens');
	const { Text3, Text5, Capital } = require('ui-system/typography/text');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { showErrorToast, showSafeToast } = require('toast');
	const allMarginsWidthInField = 155;
	const { MailDialog } = require('mail/dialog');
	const {
		AjaxMethod,
		getRemainingRecipientLimit: calculateRemainingRecipientLimit,
		normalizeIsCrmMessage,
		isCrmDealEntity,
	} = require('mail/const');
	const { AnalyticsEvent } = require('analytics');
	const { DraftConnector } = require('mail/draft/connector');
	const { DraftCoordinator } = require('mail/draft/coordinator');
	const { rememberFirstMailDraftCreated } = require('mail/draft/aha');
	const {
		hasSavableDraftContent,
		buildDraftAttachmentPlan,
		buildRestoredDraftAttachmentBindings,
		buildSavableDraftLargeAttachments,
		mapSavedDraftAttachmentBindings,
		canonicalHtmlToPlainText,
		DraftComposeState,
	} = require('mail/draft/compose-state');
	const { LargeAttachmentAha } = require('mail/large-attachment/aha');
	const { LargeAttachmentConnector } = require('mail/large-attachment/connector');
	const { LargeAttachmentCoordinator } = require('mail/large-attachment/coordinator');
	const { LargeAttachmentPostSend } = require('mail/large-attachment/post-send');
	const {
		buildForwardAttachments,
		buildLargeAttachmentSendContracts,
		buildServiceLinkedHtml,
		getAttachmentObjectId,
		removePublicUrlFromBody,
	} = require('mail/large-attachment/compose-state');
	const { Uuid } = require('utils/uuid');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { AiSubjectController, SubjectGenerationMode } = require('mail/ai-subject');
	const { getSubjectGenerationIconUri } = require('mail/sending-form/src/subject-generation-icon');
	const {
		getSubjectGenerationFieldProps,
		renderSubjectGenerationText,
		renderSubjectGenerationLoader,
	} = require('mail/sending-form/src/subject-generation-view');
	const { AiSubjectAhaMomentController } = require('mail/sending-form/src/ai-subject-aha');
	const { SubjectNoticePresenter } = require('mail/sending-form/src/notice-presenter');
	const { DeviceContactsSelector } = require('mail/device-contacts');
	const { requireLazy } = require('require-lazy');
	const {
		TemplateApi,
		MailTemplateSession,
		TemplateApplicationController,
	} = require('mail/templates/compose');
	const {
		MailTemplateFormAdapter,
		planMailTemplateBodyReplacement,
	} = require('mail/sending-form/src/mail-template-form-adapter');
	const { MailTemplateOpener, getMailTemplateAction } = require('mail/sending-form/src/mail-template-opener');
	const { getFeatureRestriction, tariffPlanRestrictionsReady } = require('tariff-plan-restriction');
	const store = require('statemanager/redux/store');
	const {
		selectIsLoaded: selectTariffPlanRestrictionsLoaded,
	} = require('statemanager/redux/slices/tariff-plan-restrictions');
	const {
		ComposeSenderIdentity,
		ComposeSignatureState,
		extractSignatureText,
		findSignatureSuffixRange,
		replaceOrAppendSignature,
		SignatureApi,
		SignatureChoiceQueue,
		SignatureModel,
		SignaturePicker,
		transformEditableSignatureRange,
		replaceSignatureRange,
		stripSignatureRange,
		transformSignatureRange,
	} = require('mail/signatures/compose');

	function getReplyMessageBodyParams(componentParameters)
	{
		return {
			replyMessageBody: componentParameters.get('reply_message_body', null),
			isBodyThemed: componentParameters.get('isBodyThemed', false) === true,
		};
	}

	/**
	 * The tariff feature of the mail module the auto upload of a heavy set belongs to. The restriction the
	 * mobile module publishes into the channel of tariff restrictions carries the very same code, so the
	 * name is a mirror of the server and never a rule of its own.
	 */
	const LARGE_ATTACHMENT_TARIFF_FEATURE_ID = 'mail_large_attachment_disk_upload';

	// Serves both as the autotest locator and as the native anchor the aha moment is measured against.
	const SUBJECT_GENERATION_BUTTON_ID = 'message-sending-form-subject-generation-btn';

	// The invisible target the one-time messages are measured against. The aha moment centres its ear on
	// the width of its target and lifts its bubble above the top of it, so pointing at the whole
	// attachments block (tall, with the name labels below the tiles) drops the bubble under the block and
	// its ear to the middle. This square sits over the first tile in the top-left corner of the block and
	// gives the ear a narrow, left target and a high bubble. Its side mirrors the tile preview of the file
	// field (FILE_PREVIEW_MEASURE = 66 in layout/ui/fields/file); it never draws and never takes a touch.
	const LARGE_ATTACHMENT_AHA_ANCHOR_SIZE = 66;

	const fieldTypographyStyles = {
		base: Typography.text3.getStyle(),
		emptyValue: Typography.text3.getStyle(),
		value: Typography.text3.getStyle(),
		editableValue: Typography.text3.getStyle(),
		tagTitle: Typography.text5.getStyle(),
	};

	/**
	 * The identifier of an object of the Disk, the way the receiver of the files reports it back and the way
	 * the draft channel reads it: the prefix of a new object plus the object id. A token of an upload session
	 * looks different, so the form never mistakes one for the other.
	 *
	 * @param {*} id
	 * @return {boolean}
	 */
	function isDiskObjectReference(id)
	{
		return typeof id === 'string' && /^n[1-9]\d*$/.test(id);
	}

	function shouldConfirmDraftClose({ isChanged, messageIsSent, hasDraftCoordinator })
	{
		return isChanged && !messageIsSent && hasDraftCoordinator;
	}

	// drafts are off or their config failed: the message can only be sent or dropped
	function shouldConfirmUnsavedExit({ isChanged, messageIsSent, hasDraftCoordinator })
	{
		return isChanged && !messageIsSent && !hasDraftCoordinator;
	}

	/**
	 * Whether a draft is still there to be written into. A draft that another compose attempt has taken
	 * over is gone for this form: it is neither saved into, nor deleted, nor completed here, and the
	 * form falls back to what it does where drafts are unavailable — offer to send the text or drop it.
	 */
	function hasWritableDraft({ hasCoordinator, isDraftAbandoned })
	{
		return Boolean(hasCoordinator) && !isDraftAbandoned;
	}

	/**
	 * A CRM draft is addressed by the numeric entity type. Without it the composition has no draft
	 * context at all: saving it as a mail draft would put a CRM letter into the mail draft list and
	 * leave it uncompleted after the send.
	 *
	 * @return {?DraftContext}
	 */
	function resolveDraftContext({ isCrmMessage, ownerEntity })
	{
		if (!isCrmMessage)
		{
			return { type: 'mail' };
		}

		const entityTypeId = Number(ownerEntity?.ownerTypeId);
		const entityId = Number(ownerEntity?.ownerId);

		if (!Number.isInteger(entityTypeId) || entityTypeId <= 0 || !Number.isInteger(entityId) || entityId <= 0)
		{
			return null;
		}

		return { type: 'crm', entityTypeId, entityId };
	}

	class SendingForm extends LayoutComponent
	{
		replaceLegacySignatureByRange(string, newSignature)
		{
			if (this.legacySignatureRangeUnknown)
			{
				return { text: string, range: null, replaced: false };
			}

			return replaceSignatureRange(string, this.legacySignatureRange, newSignature);
		}

		buildSignature(signature)
		{
			return `\n--\n${stringify(signature)}`;
		}

		setCurrentSignature(signature = false, start = null)
		{
			this.currentSignature = signature;
			this.legacySignatureRange = signature && Number.isInteger(start)
				? { start, end: start + signature.length }
				: null
			;
			this.legacySignatureRangeUnknown = false;
		}

		getCurrentSignature()
		{
			return this.currentSignature;
		}

		getSignature(emailOfSender)
		{
			const signature = this.signatures[emailOfSender];

			if (!signature || signature.trim() === '')
			{
				return '';
			}

			return this.buildSignature(signature);
		}

		/**
		 * If you just need to add a signature to any text,
		 * for example on first launch.
		 *
		 * @param string
		 * @param emailOfSender
		 * @param setCurrentSignature
		 * @returns {string}
		 */
		getStringWithSignature(string, emailOfSender, setCurrentSignature = false)
		{
			const signature = this.getSignature(emailOfSender);

			if (!signature)
			{
				return String(string);
			}

			if (setCurrentSignature)
			{
				this.setCurrentSignature(signature, String(string).length);
			}

			return String(string + signature);
		}

		setCursorBeforeSignature(fieldName = 'message', signature = '')
		{
			const compositeFields = this.state.compositeFields;
			const fullText = compositeFields[fieldName].fields[0].value;

			if (fullText)
			{
				const position = fullText.length - signature.length;
				this.saveCursorPosition(fieldName, position);
			}
			else
			{
				this.saveCursorPosition(fieldName);
			}
		}

		placeCursorPosition()
		{
			const {
				fieldName,
				position = 0,
			} = this.cursorPosition;

			if (fieldName !== undefined)
			{
				this.fieldRefs.message.setCursorPositionTo(position, position);
				this.cursorPosition.fieldName = undefined;
			}
		}

		saveCursorPosition(fieldName = 'message', position = 0)
		{
			this.cursorPosition = {
				fieldName,
				position,
			};
		}

		setSignatureInField(keyField, emailOfSender)
		{
			if (this.legacySignatureRangeUnknown)
			{
				return;
			}
			const compositeFields = clone(this.state.compositeFields);
			const signature = this.applySignatureToCompositeFields(compositeFields, keyField, emailOfSender);

			this.setState({ compositeFields }, () => this.setCursorBeforeSignature('message', signature));
		}

		applySignatureToCompositeFields(compositeFields, keyField, emailOfSender)
		{
			const signature = this.getSignature(emailOfSender);
			const fullText = compositeFields[keyField].fields[0].value;

			if (signature)
			{
				if (this.getCurrentSignature())
				{
					const replacement = this.replaceLegacySignatureByRange(fullText, signature);
					if (!replacement.replaced)
					{
						this.legacySignatureRangeUnknown = true;

						return;
					}
					compositeFields[keyField].fields = [{
						value: replacement.text,
					}];
					this.currentSignature = signature;
					this.legacySignatureRange = replacement.range;
				}
				else
				{
					compositeFields[keyField].fields = [{
						value: String(fullText + signature),
					}];
					this.setCurrentSignature(signature, fullText.length);
				}
			}
			else
			{
				const replacement = this.replaceLegacySignatureByRange(fullText, '');
				if (!replacement.replaced && this.getCurrentSignature())
				{
					this.legacySignatureRangeUnknown = true;

					return;
				}
				compositeFields[keyField].fields = [{
					value: replacement.text,
				}];
				if (replacement.replaced)
				{
					this.setCurrentSignature();
				}
			}

			return signature;
		}

		setSignatures(senderList)
		{
			senderList.forEach((item) => {
				const {
					signature = '',
					email,
				} = item;

				if (email)
				{
					this.signatures[email] = signature;
				}
			});
		}

		setSenders(senderList, selectedEmail)
		{
			this.senders = senderList;
			this.setSignatures(senderList);
			return this.refreshSignatureContext().finally(() => {
				this.constants.compositeFields.from.items = this.buildItemListForSelectField(senderList);
				const selectedMenuId = this.senderIdentity.findMenuId(selectedEmail)
					?? this.senderIdentity.entries[0]?.menuId
				;
				this.onChangeField('from', selectedMenuId, { type: MenuSelectType });
			});
		}

		refreshSignatureContext()
		{
			// A portal with the flag off must not even ask for the context: an applied one would
			// raise signatureCapabilityAvailable and drop the legacy mailbox signature.
			if (!this.signaturesAvailable)
			{
				return Promise.resolve();
			}

			return this.signatureApi.loadContext()
				.then((context) => this.applySignatureContext(context))
				.catch((failure) => {
					if (SignatureApi.isUnavailableFailure(failure) && this.signatureModel === null)
					{
						this.signatureCapabilityAvailable = false;
					}
				})
			;
		}

		applySignatureContext(context)
		{
			if (!context || !this.signaturesAvailable)
			{
				return;
			}

			this.signatureCapabilityAvailable = true;
			this.signatureApi ??= new SignatureApi();
			this.signatureModel = new SignatureModel(context);
			this.signatureChoiceQueue ??= new SignatureChoiceQueue(
				(senderKey, signatureId) => this.signatureApi.setChoice(senderKey, signatureId),
			);
			const currentMenuId = this.state?.compositeFields?.from?.fields?.[0]?.value
				?? this.senderIdentity?.entries?.[0]?.menuId
			;
			const previousIdentity = this.senderIdentity;
			this.constants.compositeFields.from.items = this.buildItemListForSelectField(this.senders);
			const remappedMenuId = this.senderIdentity.remapMenuId(previousIdentity, currentMenuId)
				?? this.senderIdentity.entries[0]?.menuId
				?? null
			;
			this.signatureSender = this.findSignatureSender(remappedMenuId);
			if (!this.composeSignatureRange)
			{
				const currentBody = this.getCompositeFieldValue(this.state.compositeFields.message);
				const legacySignature = this.getSignature(this.senderIdentity.toTransportEmail(remappedMenuId));
				this.composeSignatureRange = findSignatureSuffixRange(
					currentBody,
					legacySignature.startsWith('\n--\n') ? legacySignature.slice(4) : legacySignature,
				);
			}

			if (remappedMenuId !== currentMenuId)
			{
				const compositeFields = clone(this.state.compositeFields);
				compositeFields.from.fields = remappedMenuId;
				this.setState({ compositeFields }, () => this.applyResolvedSignature(this.signatureSender));

				return;
			}

			this.applyResolvedSignature(this.signatureSender);
		}

		findSignatureSender(menuId)
		{
			if (!this.signatureModel || !Type.isStringFilled(menuId))
			{
				return null;
			}

			const senderKey = this.senderIdentity.resolve(menuId)?.senderKey;

			return senderKey ? this.signatureModel.findSender(senderKey) : null;
		}

		getResolvedSignature(sender)
		{
			if (!sender || sender.selectedSignatureId === null)
			{
				return null;
			}

			return this.signatureModel.resolveSignature(sender.selectedSignatureId, sender.key);
		}

		applyResolvedSignature(sender)
		{
			const signature = this.getResolvedSignature(sender);
			const changed = this.composeSignature.transition(signature);
			if (changed && this.state)
			{
				this.updateSignatureInMessageBody();
			}

			return changed;
		}

		updateSignatureInMessageBody()
		{
			const compositeFields = clone(this.state.compositeFields);
			const currentBody = this.getCompositeFieldValue(compositeFields.message);
			const updated = replaceOrAppendSignature(
				currentBody,
				this.composeSignatureRange,
				this.composeSignature.isEnabled ? this.composeSignature.text : '',
			);
			this.composeSignatureRange = updated.range;
			if (updated.text === currentBody)
			{
				this.setState((state) => ({ signatureRevision: state.signatureRevision + 1 }));

				return;
			}

			compositeFields.message.fields = [{ value: updated.text }];
			this.setState((state) => ({
				compositeFields,
				signatureRevision: state.signatureRevision + 1,
			}));
		}

		getAvailableSignaturesForCurrentSender()
		{
			return this.signatureSender
				? this.signatureModel.getAvailableSignatures(this.signatureSender.key)
				: []
			;
		}

		getSignatureCreateSenders()
		{
			const senders = this.signatureModel?.senders ?? [];
			if (senders.length > 0)
			{
				return senders;
			}

			return this.signatureSender ? [this.signatureSender] : [];
		}

		selectCreatedSignature(signature)
		{
			const available = this.getAvailableSignaturesForCurrentSender()
				.find((item) => Number(item?.id) === Number(signature?.id))
			;

			if (available)
			{
				this.selectSignature(available);
			}
		}

		onSignatureSenderChange(email)
		{
			this.signatureSender = this.findSignatureSender(email);
			this.applyResolvedSignature(this.signatureSender);
		}

		selectSignature = (signature) => {
			if (!this.signatureSender || !this.composeSignature.select(signature))
			{
				return;
			}

			this.signatureModel.setSelectedSignature(this.signatureSender.key, signature.id);
			this.isChanged = true;
			this.updateSignatureInMessageBody();
			this.persistSignatureChoice(signature.id);
		};

		clearSignature = () => {
			if (!this.signatureSender)
			{
				return;
			}

			this.composeSignature.clearExplicitly();
			this.signatureModel.setSelectedSignature(this.signatureSender.key, null);
			this.isChanged = true;
			this.updateSignatureInMessageBody();
			this.persistSignatureChoice(null);
		};

		persistSignatureChoice(signatureId)
		{
			const senderKey = this.signatureSender?.key;
			if (!senderKey)
			{
				return;
			}

			this.signatureChoiceQueue.enqueue(senderKey, signatureId)
				.catch(() => {
					showErrorToast(
						{ message: Loc.getMessage('MESSAGE_SEND_SIGNATURE_CHOICE_ERROR') },
						this.layout,
					);
				})
			;
		}

		openSignaturePicker = () => {
			SignaturePicker.show({
				target: this.signaturePickerRef,
				signatures: this.getAvailableSignaturesForCurrentSender(),
				selectedSignatureId: this.composeSignature.selectedSignatureId,
				withoutSignatureText: Loc.getMessage('MESSAGE_SEND_SIGNATURE_WITHOUT_SIGNATURE'),
				createText: Loc.getMessage('MESSAGE_SEND_SIGNATURE_CREATE_ACTION'),
				onSelect: this.selectSignature,
				onClear: this.clearSignature,
				onCreate: this.openSignatureCreate,
			});
		};

		openSignatureCreate = async () => {
			if (!this.signatureSender)
			{
				return;
			}

			const { SignatureCreate } = await requireLazy('mail:signatures', false) ?? {};
			if (!SignatureCreate)
			{
				return;
			}

			PageManager.openWidget('layout', {
				modal: true,
				backdrop: {
					horizontalSwipeAllowed: false,
					mediumPositionPercent: 90,
					adoptHeightByKeyboard: true,
				},
				titleParams: {
					text: Loc.getMessage('MESSAGE_SEND_SIGNATURE_CREATE_TITLE'),
					type: 'dialog',
				},
				onReady: (layoutWidget) => {
					layoutWidget.showComponent(new SignatureCreate({
						layoutWidget,
						api: this.signatureApi,
						senders: this.getSignatureCreateSenders(),
						initialSenderKey: this.signatureSender.key,
						onCreated: (signature) => {
							this.signatureModel.addOwner(signature);
							this.selectCreatedSignature(signature);
						},
					}));
				},
			});
		};

		getRemainingRecipientLimit(fieldName)
		{
			return calculateRemainingRecipientLimit(
				this.state.compositeFields,
				fieldName,
				this.recipientLimits,
			);
		}

		isDeviceContactsSupported()
		{
			return (
				Type.isFunction(contacts?.hasContactListAccess)
				&& Type.isFunction(contacts?.requestContactsAccess)
			);
		}

		getDeviceContactsConfig(fieldName)
		{
			return {
				deviceContactsMode: this.deviceContactsAvailable && this.isDeviceContactsSupported(),
				openDeviceContacts: () => this.openDeviceContacts(fieldName),
				getRecipientsLimitLeft: () => this.getRemainingRecipientLimit(fieldName),
				getRecipientsEmails: () => this.getRecipientEmails(fieldName),
			};
		}

		getRecipientEmails(excludedFieldName)
		{
			return ['to', 'cc', 'bcc'].flatMap((fieldName) => {
				if (fieldName === excludedFieldName)
				{
					return [];
				}

				const recipients = this.state.compositeFields[fieldName]?.fields;
				if (!Array.isArray(recipients))
				{
					return [];
				}

				return recipients
					.map((recipient) => (
						recipient.email?.[recipient.selectedEmailId ?? 0]?.value
						?? recipient.customData?.email
						?? recipient.value
						?? ''
					))
					.filter((email) => Type.isStringFilled(email))
				;
			});
		}

		async openDeviceContacts(fieldName)
		{
			const remainingLimit = this.getRemainingRecipientLimit(fieldName);
			if (remainingLimit <= 0)
			{
				NotifyManager.showError(Loc.getMessage('MESSAGE_SEND_RECIPIENT_LIMIT_REACHED'));

				return;
			}

			const recipients = await new DeviceContactsSelector({
				parentLayout: this.layout,
				remainingLimit,
			}).open();

			this.fieldRefs[fieldName]?.addRecipients(recipients);
		}

		entityTypeToFiledType(type)
		{
			switch (type)
			{
				case 'contacts':
					return 'contact';
				case 'companies':
					return 'company';
				default:
					return 'email';
			}
		}

		findRecipientByEmail(recipients, email)
		{
			for (const recipient of recipients)
			{
				for (let idInList = 0; idInList < recipient.email.length; idInList++)
				{
					const data = recipient.email[idInList];
					if (data.value === email)
					{
						return {
							recipient,
							idInList,
						};
					}
				}
			}

			return null;
		}

		buildContact(contact, bindingsData = {})
		{
			return contact.map((item) => {
				const {
					value = false,
					customData = {},
					isEmailHidden,
				} = item;

				if (value)
				{
					let augmentedContact = {};

					let additionalData = {};

					const foundRecipient = this.findRecipientByEmail(bindingsData, value);

					if (foundRecipient)
					{
						const {
							recipient,
							idInList,
						} = foundRecipient;

						const {
							typeName = 'email',
							id,
							name,
							email,
						} = recipient;

						additionalData = {
							selectedEmailId: idInList,
							email,
							type: this.entityTypeToFiledType(typeName),
							id,
							name: name || value,
						};
					}

					let name = null;

					if (customData.name)
					{
						name = customData.name;
					}

					augmentedContact = {
						customData,
						selectedEmailId: 0,
						email: [
							{
								value,
							},
						],
						id: value,
						name: name || value,
						type: 'email',
						isEmailHidden,
						...additionalData,
					};

					return augmentedContact;
				}
			}).filter(Boolean);
		}

		#removeSendersEmailsFromRecipients(recipients, senders)
		{
			// @todo: cache the result
			const senderEmails = new Set(
				(Array.isArray(senders) ? senders : [])
					.map((sender) => sender?.email)
					.filter(Boolean),
			);

			if (senderEmails.size === 0)
			{
				return Array.isArray(recipients) ? recipients : [];
			}

			return (Array.isArray(recipients) ? recipients : []).filter((recipient) => {
				const emailField = recipient?.customData?.email;

				if (!emailField)
				{
					return false;
				}

				return !senderEmails.has(emailField);
			});
		}

		constructor(props)
		{
			super(props);

			let {
				files = [],
				to = [],
				cc = [],
				bcc = [],
				from = [],
			} = props;

			const {
				bindingsData = {},
				isSendFiles,
				subject = '',
				body = '',
				replyMessageBody,
				isBodyThemed = false,
				isForward = 0,
				senders = [],
				clients,
				clientIdsByType,
				widget,
				ownerEntity,
				recipientLimits,
				deviceContactsAvailable = false,
				mailTemplatesEnabled = false,
				mailTemplateSaveAvailable = false,
				mailTemplateManagePath = '',
				isCrmMessage,
				draftAvailable = false,
				draftId = null,
				draftRevision = null,
				draftSnapshot = null,
				clientId = null,
				isRestoredDraft = false,
				source,
				element = 'compose_button',
				subjectGenerationAvailable = false,
				signaturesAvailable = false,
				signatureContext = null,
				restoredDraft = false,
				largeAttachmentEnabled = false,
				largeAttachmentTariffAvailable = false,
				largeAttachmentMaxSize = 0,
				largeAttachmentShowAha = false,
				largeAttachmentAhaOptionName = '',
				largeAttachmentShowStorageNotice = false,
				largeAttachmentStorageNoticeOptionName = '',
				largeAttachmentPostSendPromptSuppressed = false,
				largeAttachmentPostSendPromptOptionName = '',
				draftLargeAttachments = [],
			} = props;

			// The attachments that leave with the letter are reported by their disk object only while the
			// server marks the scenario as available: with it off the module storage holds no placement for
			// such an object, the send is refused, and a forward has to attach its files by file id the way
			// it did before the scenario existed. The CRM timeline sends through its own controller, which
			// speaks a different attachment language, so its files are handed over untouched as well.
			if (isSendFiles && largeAttachmentEnabled === true && !normalizeIsCrmMessage(isCrmMessage))
			{
				files = buildForwardAttachments(files);
			}

			this.isForward = isForward;
			this.subjectGenerationAvailable = Boolean(subjectGenerationAvailable);
			this.subjectGenerator = null;
			this.subjectNoticePresenter = null;
			this.aiSubjectAhaMomentController = this.subjectGenerationAvailable
				? new AiSubjectAhaMomentController({ canShow: () => this.canShowAiSubjectAhaMoment() })
				: null
			;

			const clientIdsByTypeForContactField = {
				idsForFilterCompany: clientIdsByType.company.length > 0 ? clientIdsByType.company : [0],
				idsForFilterContact: clientIdsByType.contacts.length > 0 ? clientIdsByType.contacts : [0],
			};

			this.signatures = {};
			this.signaturesAvailable = signaturesAvailable === true;
			this.signatureCapabilityAvailable = this.signaturesAvailable && signatureContext !== null;
			this.signatureApi = new SignatureApi();
			this.signatureModel = this.signatureCapabilityAvailable ? new SignatureModel(signatureContext) : null;
			this.composeSignature = new ComposeSignatureState(null, {
				restoredDraft: Boolean(restoredDraft || isRestoredDraft),
			});
			this.composeSignatureRange = null;
			this.signatureSender = null;
			this.signaturePickerRef = null;
			this.signatureChoiceQueue = null;

			if (!isSendFiles)
			{
				this.files = files;
				files = [];
			}

			this.draftAttachmentBindings = buildRestoredDraftAttachmentBindings(files);
			// keyed by the snapshot object, so the keys live exactly as long as the save that carries them
			this.draftAttachmentKeys = new WeakMap();

			const galleryInfo = {};
			const galleryValue = files.map((file) => {
				// A legacy attachment of a reply or a forward is known by its stored file, so the value of
				// the field carries the bare number and the gallery keeps the rest of it aside. An attachment
				// stored as an object of the Disk is known by that object instead: the binding of a draft,
				// the scenario of the large attachment and the send all speak in it, so such a file stays
				// whole. Reduced to a bare number it would lose the object together with its size, and the
				// letter would lose the binding of its draft and the set it was restored with.
				if (getAttachmentObjectId(file) === null && file.id && Number.isInteger(parseInt(file.id, 10)))
				{
					galleryInfo[file.id] = clone(file);

					return file.id;
				}

				return clone(file);
			});

			this.senders = senders;

			to = this.#removeSendersEmailsFromRecipients(to, senders);
			cc = this.#removeSendersEmailsFromRecipients(cc, senders);
			bcc = this.#removeSendersEmailsFromRecipients(bcc, senders);

			this.setSignatures(senders);

			this.forwardedFiles = galleryInfo;
			this.layout = widget;
			this.replyMessageBody = replyMessageBody;
			this.isBodyThemed = isBodyThemed === true;
			this.recipientLimits = recipientLimits;
			this.deviceContactsAvailable = deviceContactsAvailable === true;
			this.isCrmMessage = normalizeIsCrmMessage(isCrmMessage);
			this.mailTemplatesEnabled = !this.isCrmMessage && mailTemplatesEnabled === true;
			this.mailTemplateSaveAvailable = this.mailTemplatesEnabled && mailTemplateSaveAvailable === true;
			this.mailTemplateManagePath = String(mailTemplateManagePath ?? '');
			this.source = source;
			this.element = element;
			this.calendarSlotsLinks = [];
			this.calendarEnums = null;
			this.largeAttachmentEnabled = largeAttachmentEnabled === true;
			this.largeAttachmentTariffAvailable = largeAttachmentTariffAvailable === true;
			this.largeAttachmentPostSendPromptSuppressed = largeAttachmentPostSendPromptSuppressed === true;
			this.largeAttachmentPostSendPromptOptionName = String(largeAttachmentPostSendPromptOptionName ?? '');
			this.draftLargeAttachments = Array.isArray(draftLargeAttachments) ? draftLargeAttachments : [];
			this.largeAttachmentConnector = null;
			this.largeAttachmentCoordinator = null;
			this.largeAttachmentAha = null;
			this.attachmentsRef = null;
			this.largeAttachmentAhaAnchorRef = null;
			// the form does not touch the scenario while the availability mark of the server is not true
			if (this.largeAttachmentEnabled)
			{
				this.largeAttachmentConnector = new LargeAttachmentConnector({
					context: this.isCrmMessage ? 'crm' : 'mail',
				});
				this.largeAttachmentCoordinator = new LargeAttachmentCoordinator({
					connector: this.largeAttachmentConnector,
					maxSize: Number(largeAttachmentMaxSize) || 0,
					tariffAvailable: this.largeAttachmentTariffAvailable,
					getFiles: () => this.getFiles(),
					insertAddress: (publicUrl) => this.insertTextToMessage(publicUrl),
					removeAddress: (publicUrl) => this.removeTextFromMessage(publicUrl),
					onSetsChanged: () => this.onLargeAttachmentSetsChanged(),
					onRestoredSetsDropped: (dropped) => this.onLargeAttachmentSetsDropped(dropped),
					onError: (error) => this.showLargeAttachmentError(error),
					onTariffUnavailable: () => this.showLargeAttachmentTariffRestriction(),
				});
				this.largeAttachmentAha = new LargeAttachmentAha({
					connector: this.largeAttachmentConnector,
					available: this.largeAttachmentTariffAvailable,
					showHeavyFileHint: largeAttachmentShowAha === true,
					heavyFileOptionName: String(largeAttachmentAhaOptionName ?? ''),
					showStorageNotice: largeAttachmentShowStorageNotice === true,
					storageNoticeOptionName: String(largeAttachmentStorageNoticeOptionName ?? ''),
				});
			}
			this.clientId = clientId ?? Uuid.getV4();
			this.isRestoredDraft = isRestoredDraft;
			this.draftCoordinator = null;
			this.draftConnector = null;
			this.rememberFirstMailDraftCreated = rememberFirstMailDraftCreated;
			const context = draftAvailable
				? resolveDraftContext({ isCrmMessage: this.isCrmMessage, ownerEntity })
				: null
			;
			if (context)
			{
				this.draftConnector = new DraftConnector({ context });
				this.draftCoordinator = new DraftCoordinator({
					connector: this.draftConnector,
					draftId,
					revision: draftRevision,
					clientId: this.clientId,
					acceptedSnapshot: draftSnapshot,
					onForeignConflict: () => this.showDraftForeignConflict(),
					onSaved: (draft, snapshot, metadata) => this.handleDraftSaved(draft, snapshot, metadata),
				});
			}

			if (this.isEmptyFieldValue(to) && clients && clients.length > 0)
			{
				const client = clients[0];
				if (Array.isArray(client.email) && client.email.length > 0)
				{
					const emailData = client.email[0];
					if (emailData.value)
					{
						to = [{
							value: emailData.value,
						}];
					}
				}
			}

			if (
				this.isEmptyFieldValue(to)
				&& this.isEmptyFieldValue(cc)
				&& this.isEmptyFieldValue(bcc)
				&& (!clients || clients.length === 0)
			)
			{
				this.emptyRecipients = true;
			}

			to = this.buildContact(to, bindingsData);
			cc = this.buildContact(cc, bindingsData);
			bcc = this.buildContact(bcc, bindingsData);

			if (this.isEmptyFieldValue(from) && senders && senders.length > 0)
			{
				from = senders;
			}

			from = this.buildItemListForSelectField(from);

			const {
				startEmailSender = null,
			} = props;
			const startSenderMenuId = this.senderIdentity.findMenuId(startEmailSender)
				?? this.senderIdentity.entries[0]?.menuId
				?? null
			;
			if (this.signatureCapabilityAvailable)
			{
				this.signatureSender = this.findSignatureSender(startSenderMenuId);
				this.applyResolvedSignature(this.signatureSender);
			}
			const initialMessage = this.signatureCapabilityAvailable
				? replaceOrAppendSignature(
					String(body ?? ''),
					null,
					this.composeSignature.isEnabled ? this.composeSignature.text : '',
				)
				: null
			;
			this.composeSignatureRange = initialMessage?.range ?? null;

			this.ownerEntity = ownerEntity;

			this.fieldRefs = {};

			this.cursorPosition = {
				fieldName: undefined,
				position: 0,
			};

			this.recipientsFieldPresetsFromField = {
				companyMode: (clientIdsByType.company.length > 0),
				contactMode: (clientIdsByType.contacts.length > 0),
				crmMode: !this.isCrmMessage,
				addressBookMode: !this.isCrmMessage,
			};

			this.constants = {
				fieldsOutputFormatFull: 'full',
				fieldsOutputFormatLittle: 'little',
				compositeFields: {
					to: {
						config: {
							...clientIdsByTypeForContactField,
							...this.recipientsFieldPresetsFromField,
							userMode: !this.isCrmMessage,
							...this.getDeviceContactsConfig('to'),
						},
						testId: 'message-sending-form-to-field',
						ref: (ref) => {
							this.fieldRefs.to = ref;
						},
						required: true,
						isComposite: false,
						type: MailContactType,
						title: Loc.getMessage('MESSAGE_SEND_FIELD_TO'),
						placeholder: Loc.getMessage('MESSAGE_SEND_CONTACT_PLACEHOLDER'),
						collapsible: false,
						parentWidget: this.layout,
					},
					cc: {
						config: {
							...clientIdsByTypeForContactField,
							...this.recipientsFieldPresetsFromField,
							userMode: true,
							...this.getDeviceContactsConfig('cc'),
						},
						testId: 'message-sending-form-cc-field',
						ref: (ref) => {
							this.fieldRefs.cc = ref;
						},
						required: false,
						isComposite: false,
						type: MailContactType,
						title: Loc.getMessage('MESSAGE_SEND_FIELD_CC'),
						placeholder: Loc.getMessage('MESSAGE_SEND_CONTACT_PLACEHOLDER'),
						collapsible: true,
						parentWidget: this.layout,
					},
					bcc: {
						config: {
							...clientIdsByTypeForContactField,
							...this.recipientsFieldPresetsFromField,
							userMode: true,
							...this.getDeviceContactsConfig('bcc'),
						},
						testId: 'message-sending-form-bcc-field',
						ref: (ref) => {
							this.fieldRefs.bcc = ref;
						},
						required: false,
						isComposite: false,
						type: MailContactType,
						title: Loc.getMessage('MESSAGE_SEND_FIELD_BCC'),
						placeholder: Loc.getMessage('MESSAGE_SEND_CONTACT_PLACEHOLDER'),
						collapsible: true,
						parentWidget: this.layout,
					},
					from: {
						testId: 'message-sending-form-from-field',
						ref: (ref) => {
							this.fieldRefs.from = ref;
						},
						items: from,
						required: true,
						isShowMoreButton: true,
						showMoreAction: this.expandFormFields.bind(this),
						isComposite: false,
						type: MenuSelectType,
						title: Loc.getMessage('MESSAGE_SEND_FIELD_FROM'),
						placeholder: Loc.getMessage('MESSAGE_SEND_CONTACT_PLACEHOLDER'),
						collapsible: false,
					},
					subject: {
						testId: 'message-sending-form-subject-field',
						ref: (ref) => {
							this.fieldRefs.subject = ref;
						},
						required: false,
						isComposite: false,
						type: TextAreaType,
						title: Loc.getMessage('MESSAGE_SEND_FIELD_SUBJECT'),
						placeholder: Loc.getMessage('MESSAGE_SEND_FIELD_SUBJECT_PLACEHOLDER'),
						collapsible: false,
					},
				},
			};

			this.messageIsSent = false;
			this.isChanged = false;

			this.state = {
				files: galleryValue,
				fieldsOutputFormat: this.constants.fieldsOutputFormatLittle,
				subjectGenerationInProgress: false,
				signatureRevision: 0,
				compositeFields: {
					to: {
						fields: to,
					},
					cc: {
						fields: cc,
					},
					bcc: {
						fields: bcc,
					},
					from: {
						fields: startSenderMenuId,
					},
					subject: {
						fields: [{ value: subject }],
					},
					message: {
						fields: [{
							value: isRestoredDraft
								? canonicalHtmlToPlainText(body)
								: (this.signatureCapabilityAvailable
									? initialMessage.text
									: (body
										? `${body} `
										: this.getStringWithSignature(
											'',
											this.senderIdentity.toTransportEmail(startSenderMenuId),
											true,
										)
									)
								),
						}],
					},
				},
				isCalendarSharingRestricted: false,
				saveAsTemplate: false,
			};
			this.draftComposeState = new DraftComposeState(galleryValue, this.draftLargeAttachments);
			this.restoredMessageBody = null;
			this.sentMessageBody = null;
			this.mailTemplateApi = new TemplateApi();
			this.mailTemplateSession = new MailTemplateSession({ api: this.mailTemplateApi });
			this.mailTemplateFormAdapter = new MailTemplateFormAdapter(this);
			this.mailTemplateController = new TemplateApplicationController({
				api: this.mailTemplateApi,
				host: this.mailTemplateFormAdapter,
				session: this.mailTemplateSession,
			});
			this.mailTemplateModule = null;
			this.mailTemplateOpener = new MailTemplateOpener({
				loadModule: () => requireLazy('mail:templates', false),
				onModule: (templatesModule) => {
					this.mailTemplateModule = templatesModule;
				},
				onError: () => {
					showErrorToast({ message: Loc.getMessage('MESSAGE_SEND_MAIL_TEMPLATE_LOAD_ERROR') });
				},
			});
			this.mailTemplateUnmounted = false;
			this.mailTemplateMutationInProgress = false;

			this.focusedFieldName = this.getInitialFocusedFieldName();

			this.handleExitClick = this.handleExitClick.bind(this);

			this.bindFileRef = this.bindFileRef.bind(this);
			this.bindAttachmentsRef = this.bindAttachmentsRef.bind(this);
			this.bindLargeAttachmentAhaAnchorRef = this.bindLargeAttachmentAhaAnchorRef.bind(this);
			this.onFileChange = this.onFileChange.bind(this);

			this.bindMessageBodyRef = this.bindMessageBodyRef.bind(this);
			this.onChangeMessageBody = this.onChangeMessageBody.bind(this);

			this.onAttachmentsButton = this.onAttachmentsButton.bind(this);
			this.onTemplatesButton = this.onTemplatesButton.bind(this);
			this.onMailTemplateSelect = this.onMailTemplateSelect.bind(this);
			this.handleLifecycleSave = this.handleLifecycleSave.bind(this);
			this.handlePreventDismiss = this.handlePreventDismiss.bind(this);

			this.onCalendarSlotsButton = this.onCalendarSlotsButton.bind(this);
			this.insertCalendarSlotsLink = this.insertCalendarSlotsLink.bind(this);
		}

		buildItemListForSelectField(list)
		{
			const icon = '<svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M1.7386 0.5L8.94327 5.73976L16.1479 0.5H1.7386ZM17.4574 1.80991V2.07942L8.94284 8.7286L0.428223 2.07939V11.8097C0.428223 12.4372 0.976701 12.9444 1.65279 12.9444H16.2328C16.9106 12.9444 17.4574 12.4365 17.4574 11.8097V2.07942L17.4575 2.07939L17.4574 1.80991Z" fill="#6A737F"/> </svg>';
			this.senderIdentity = new ComposeSenderIdentity(list, this.signatureModel?.senders ?? []);
			const result = this.senderIdentity.getMenuItems(icon);

			result.push(
				{
					id: 'add-new-mailbox',
					title: Loc.getMessage('MESSAGE_SEND_CONNECT_NEW_MAILBOX'),
					icon: '<svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M9.25 0H6.75V6.25H0.5V8.75H6.75V15H9.25V8.75H15.5V6.25H9.25V0Z" fill="#6A737F"/> </svg>',
				},
			);

			return result;
		}

		componentDidUpdate(prevProps, prevState)
		{
			this.placeCursorPosition();
			if (this.focusedFieldName)
			{
				const focusedFieldName = this.focusedFieldName;
				this.focusedFieldName = undefined;
				this.setFocusField(focusedFieldName);
			}

			this.refreshSaveButton();
		}

		componentDidMount()
		{
			this.saveButton = new WidgetHeaderButton({
				widget: this.layout,
				text: Loc.getMessage('MESSAGE_SEND_BUTTON_SEND'),
				loadingText: Loc.getMessage('MESSAGE_SEND_BUTTON_SENDING'),
				onClick: () => this.sendEmail(),
				onDisabledClick: () => this.checkSendEmail(),
				disabled: () => this.hasInvalidFields(),
			});

			if (this.subjectGenerationAvailable)
			{
				this.subjectNoticePresenter = new SubjectNoticePresenter({
					layout: this.layout,
					onLimit: () => this.openSubjectLimitRestriction(),
				});
				this.subjectGenerator = new AiSubjectController({
					onNotice: (kind) => this.showSubjectNotice(kind),
				});
				this.aiSubjectAhaMomentController.mount();
			}

			this.layout.setLeftButtons(this.getLeftButtons());
			BX.addCustomEvent('onAppPaused', this.handleLifecycleSave);
			this.layout?.on?.('onViewHidden', this.handleLifecycleSave);
			this.layout?.on?.('onViewRemoved', this.handleLifecycleSave);
			this.layout?.on?.('preventDismiss', this.handlePreventDismiss);

			void this.preloadCalendarSharingRestriction();
			this.largeAttachmentCoordinator?.restore(this.draftLargeAttachments);
			this.maybeConvertForwardAttachments();
		}

		/**
		 * A forwarded message arrives with its attachments already reported by their disk objects and sizes, the
		 * way the web reports them. A heavy forward is therefore an over-limit set the moment the form opens, so
		 * the scenario is asked to convert it right away instead of waiting for the send. A light forward, a
		 * reply, a new letter or a restored draft (whose sets the coordinator has already restored) leave this a
		 * no-op: the plan finds nothing over the limit that a set does not already cover.
		 */
		maybeConvertForwardAttachments()
		{
			if (this.isForward !== 1 || this.isRestoredDraft || !this.largeAttachmentCoordinator)
			{
				return;
			}

			void this.largeAttachmentCoordinator.handleFilesChanged();
		}

		async preloadCalendarSharingRestriction()
		{
			const isRestrictionLoaded = await this.loadCalendarSharingRestriction();
			if (isRestrictionLoaded)
			{
				this.setState({
					isCalendarSharingRestricted: this.isCalendarSharingRestricted(),
				});
			}
		}

		async ensureCalendarEnums()
		{
			if (this.calendarEnums)
			{
				return this.calendarEnums;
			}

			const enumsModule = await requireLazy('calendar:enums', false);
			if (enumsModule?.FeatureId)
			{
				this.calendarEnums = enumsModule;
			}

			return this.calendarEnums;
		}

		async loadCalendarSharingRestriction()
		{
			const enums = await this.ensureCalendarEnums();
			if (!enums)
			{
				return false;
			}

			try
			{
				await tariffPlanRestrictionsReady();
			}
			catch (error)
			{
				console.error(error);
			}

			return this.areTariffPlanRestrictionsLoaded();
		}

		areTariffPlanRestrictionsLoaded()
		{
			return selectTariffPlanRestrictionsLoaded(store.getState());
		}

		getCalendarSharingRestriction()
		{
			return getFeatureRestriction(this.getCalendarSharingFeatureId());
		}

		getCalendarSharingFeatureId()
		{
			const { FeatureId } = this.calendarEnums || {};
			if (!FeatureId)
			{
				return null;
			}

			return this.isCrmDeal()
				? FeatureId.CRM_EVENT_SHARING
				: FeatureId.CALENDAR_SHARING
			;
		}

		isCalendarSharingRestricted()
		{
			return this.getCalendarSharingRestriction().isRestricted();
		}

		isCrmDeal()
		{
			const { ownerType, ownerId } = this.getOwnerEntity();

			return isCrmDealEntity({
				isCrmMessage: this.isCrmMessage,
				ownerType,
				ownerId,
			});
		}

		componentWillUnmount()
		{
			this.mailTemplateUnmounted = true;
			this.mailTemplateController.destroy();
			this.mailTemplateSession.destroy();
			this.mailTemplateOpener.destroy();
			this.subjectGenerator?.destroy();
			// A hint left on screen keeps the app-wide AhaMoment.isShown flag raised and mutes
			// every other aha moment, so the form takes its own hint down as it goes away.
			this.hideAiSubjectAhaMoment();
			BX.removeCustomEvent('onAppPaused', this.handleLifecycleSave);
			this.layout?.removeEventListener?.('onViewHidden', this.handleLifecycleSave);
			this.layout?.removeEventListener?.('onViewRemoved', this.handleLifecycleSave);
			this.layout?.removeEventListener?.('preventDismiss', this.handlePreventDismiss);
			// a conversion that is already running outlives the form, and the draft has to be written after
			// it: a replacement invalidates the token of the set the draft would otherwise keep
			const conversionSettled = this.largeAttachmentCoordinator?.hasPendingConversion()
				? this.largeAttachmentCoordinator.whenSettled()
				: null
			;
			// the upload of a heavy file lasts long: a coordinator left alive would keep handling the files
			// of a form that is already closed
			this.largeAttachmentCoordinator?.destroy();
			// a message scheduled to appear next to a field that is already gone has nothing to point at
			this.largeAttachmentAha?.destroy();
			const hasSavableContent = this.prepareDraftSave();
			if (hasSavableContent && conversionSettled)
			{
				void this.saveDraftAfterConversion(conversionSettled);

				return;
			}

			// An autosave may still be in flight. Only its completion is awaited when the current form
			// is empty; a pending empty snapshot has already been removed.
			this.draftCoordinator?.saveAndDestroy();
		}

		/**
		 * The letter is written twice when a conversion was still running as the form went away: now, so
		 * that nothing is lost if the application goes away as well, and once more with the sets the
		 * settled conversion left behind. Without the second write the draft would keep the token of the
		 * set the replacement has invalidated, and the restored letter would lose its heavy attachment.
		 * The form is only read here: it is gone, so neither its body nor its callbacks are touched.
		 *
		 * @param {Promise<void>} conversionSettled
		 * @return {Promise<void>}
		 */
		saveDraftAfterConversion(conversionSettled)
		{
			const draftCoordinator = this.draftCoordinator;
			if (!draftCoordinator)
			{
				return Promise.resolve();
			}

			draftCoordinator.saveBestEffort();

			return conversionSettled.then(() => {
				// the snapshot is built by the save itself, so it refers to the attachment bindings the
				// first save has just renewed instead of the sources it was built from
				draftCoordinator.markChanged(() => this.buildDraftSnapshot());

				return draftCoordinator.saveAndDestroy();
			// the form is closed, so a failure of the second write has nobody left to be reported to
			}).then(() => {}, () => {});
		}

		hasActiveDraft()
		{
			return hasWritableDraft({
				hasCoordinator: Boolean(this.draftCoordinator),
				isDraftAbandoned: this.draftCoordinator?.isAbandoned(),
			});
		}

		/**
		 * Whether the form shows attachments it can only get out of its draft. They travel with the send
		 * through the draft itself, so a form that has lost the draft cannot carry them any more.
		 */
		hasRestoredDraftAttachments()
		{
			return Object.keys(this.draftAttachmentBindings ?? {}).length > 0;
		}

		/**
		 * What the send tells the server about the draft it was built from. A form whose draft belongs to
		 * another compose attempt reports none: neither the files of that draft nor its completion may be
		 * claimed under an identity that is not ours.
		 */
		getDraftSendParams()
		{
			if (!this.hasActiveDraft())
			{
				return { draftId: null, draftRevision: null, draftClientId: null };
			}

			return {
				draftId: this.draftCoordinator.getDraftId(),
				draftRevision: this.draftCoordinator.getRevision(),
				draftClientId: this.clientId,
			};
		}

		getLeftButtons()
		{
			return [
				{
					type: Icon.CHEVRON_DOWN.getIconName(),
					color: Color.base4.toHex(),
					callback: this.handleExitClick,
				},
			];
		}

		handleExitClick()
		{
			if (this.isClosing)
			{
				return;
			}

			this.requestClose();
		}

		handlePreventDismiss()
		{
			this.requestClose();
		}

		handleLifecycleSave()
		{
			const hasSavableContent = this.prepareDraftSave();
			if (this.isChanged && !this.messageIsSent && hasSavableContent)
			{
				this.draftCoordinator?.saveBestEffort();
			}
		}

		requestClose()
		{
			const hasSavableContent = this.prepareDraftSave();
			if (!hasSavableContent && !this.messageIsSent)
			{
				if (this.hasActiveDraft() && this.draftCoordinator?.getDraftId())
				{
					this.showConfirmClearedDraftClose();
				}
				else if (this.hasActiveDraft() && this.draftCoordinator?.hasInFlightSave?.())
				{
					this.discardClearedDraftAndClose();
				}
				else
				{
					this.close();
				}

				return;
			}

			const closeState = {
				isChanged: this.isChanged,
				messageIsSent: this.messageIsSent,
				// without a draft of its own the form has nothing to offer saving into, so the exit
				// asks the same question it asks where drafts are unavailable: send or lose the text
				hasDraftCoordinator: this.hasActiveDraft(),
			};

			if (shouldConfirmDraftClose(closeState))
			{
				this.showConfirmDraftClose();

				return;
			}

			if (shouldConfirmUnsavedExit(closeState))
			{
				this.showConfirmExitEntity();

				return;
			}

			this.close();
		}

		showConfirmDraftClose()
		{
			Alert.confirm(
				Loc.getMessage('MESSAGE_DRAFT_CLOSE_TITLE'),
				Loc.getMessage('MESSAGE_DRAFT_CLOSE_TEXT'),
				[
					{
						type: ButtonType.DEFAULT,
						text: Loc.getMessage('MESSAGE_DRAFT_CLOSE_SAVE'),
						onPress: () => this.saveDraftAndClose(),
					},
					{
						type: ButtonType.DESTRUCTIVE,
						text: Loc.getMessage('MESSAGE_DRAFT_CLOSE_DISCARD'),
						onPress: () => this.discardDraftAndClose(),
					},
					{
						type: ButtonType.CANCEL,
						text: Loc.getMessage('MESSAGE_DRAFT_CLOSE_CANCEL'),
					},
				],
			);
		}

		showConfirmClearedDraftClose()
		{
			Alert.confirm(
				Loc.getMessage('MESSAGE_DRAFT_CLEARED_CLOSE_TITLE'),
				Loc.getMessage('MESSAGE_DRAFT_CLEARED_CLOSE_TEXT'),
				[
					{
						type: ButtonType.DESTRUCTIVE,
						text: Loc.getMessage('MESSAGE_DRAFT_CLEARED_CLOSE_DELETE'),
						onPress: () => this.discardClearedDraftAndClose(),
					},
					{
						type: ButtonType.CANCEL,
						text: Loc.getMessage('MESSAGE_DRAFT_CONTINUE_EDITING'),
					},
				],
			);
		}

		showConfirmExitEntity()
		{
			Haptics.impactLight();

			// the shared helper takes no button labels and calls the first one "save", while here it
			// sends: the exit of a form with no draft offers to send the text or to lose it
			Alert.confirm(
				Loc.getMessage('MESSAGE_SEND_EXIT_ALERT_TITLE'),
				Loc.getMessage('MESSAGE_SEND_EXIT_ALERT_TEXT'),
				[
					{
						type: ButtonType.DEFAULT,
						text: Loc.getMessage('MESSAGE_SEND_EXIT_ALERT_SAVE'),
						onPress: () => this.sendEmail(),
					},
					{
						type: ButtonType.DESTRUCTIVE,
						text: Loc.getMessage('MESSAGE_SEND_EXIT_ALERT_DISCARD'),
						onPress: () => this.close(),
					},
					{
						type: ButtonType.CANCEL,
						text: Loc.getMessage('MESSAGE_SEND_EXIT_ALERT_CANCEL'),
					},
				],
			);
		}

		saveDraftAndClose()
		{
			if (this.isClosing)
			{
				return;
			}

			this.isClosing = true;
			NotifyManager.showLoadingIndicator();
			this.draftCoordinator.flush()
				.then(() => {
					if (!this.hasActiveDraft())
					{
						// the draft was taken over while this save was on its way: the text was never
						// written, so the form stays open instead of closing on a save that never was
						this.isClosing = false;

						return;
					}

					this.close();
				})
				.catch(() => {
					this.isClosing = false;
					this.showDraftSaveError();
				})
				.finally(() => NotifyManager.hideLoadingIndicatorWithoutFallback())
			;
		}

		discardDraftAndClose()
		{
			if (this.isClosing)
			{
				return;
			}

			this.isClosing = true;
			NotifyManager.showLoadingIndicator();
			// the draft is being dropped, so a queued save is only awaited, never required to succeed
			this.draftCoordinator.flush()
				.catch(() => {})
				.then(() => this.deleteCurrentDraft())
				.then(() => {
					this.draftCoordinator.destroy();
					this.close();
				})
				.catch(() => {
					this.isClosing = false;
					this.showDraftDiscardError();
				})
				.finally(() => NotifyManager.hideLoadingIndicatorWithoutFallback())
			;
		}

		discardClearedDraftAndClose()
		{
			this.draftCoordinator?.cancelPending();
			this.discardDraftAndClose();
		}

		deleteCurrentDraft()
		{
			if (!this.hasActiveDraft())
			{
				// the draft of this context belongs to another compose attempt now: dropping the text
				// of this form must not drop the draft of that one
				return Promise.resolve();
			}

			if (this.draftConnector.context.type === 'crm')
			{
				return this.draftConnector.deleteCurrent();
			}

			const draftId = this.draftCoordinator.getDraftId();
			if (!draftId)
			{
				return Promise.resolve();
			}

			// the draft is dropped under the identity the form was showing: work another form has written
			// into it since was never on this screen, so this exit has no answer about it and keeps it
			return this.draftConnector.delete(
				{
					draftId,
					revision: this.draftCoordinator.getRevision(),
					clientId: this.clientId,
				},
				{ handleErrors: false },
			);
		}

		showDraftSaveError()
		{
			Haptics.impactLight();
			Alert.confirm(
				Loc.getMessage('MESSAGE_DRAFT_SAVE_ERROR_TITLE'),
				Loc.getMessage('MESSAGE_DRAFT_SAVE_ERROR_TEXT'),
				[
					{
						type: ButtonType.DEFAULT,
						text: Loc.getMessage('MESSAGE_DRAFT_SAVE_RETRY'),
						onPress: () => this.saveDraftAndClose(),
					},
					{
						type: ButtonType.CANCEL,
						text: Loc.getMessage('MESSAGE_DRAFT_CONTINUE_EDITING'),
					},
				],
			);
		}

		/**
		 * The draft of this context was taken over by another compose attempt, so this form has stopped
		 * writing into it. The text is still here and nothing is dropped behind the user's back: he is
		 * told the draft is no longer his and offered the way out that still keeps the text — sending it.
		 */
		showDraftForeignConflict()
		{
			Haptics.notifyWarning();
			Alert.confirm(
				Loc.getMessage('MESSAGE_DRAFT_FOREIGN_CONFLICT_TITLE'),
				// files restored from that draft cannot leave it any more, so a form that shows them says so
				Loc.getMessage(
					this.hasRestoredDraftAttachments()
						? 'MESSAGE_DRAFT_FOREIGN_CONFLICT_TEXT_WITH_FILES'
						: 'MESSAGE_DRAFT_FOREIGN_CONFLICT_TEXT',
				),
				[
					{
						type: ButtonType.DEFAULT,
						text: Loc.getMessage('MESSAGE_DRAFT_FOREIGN_CONFLICT_SEND'),
						onPress: () => this.sendEmail(),
					},
					{
						type: ButtonType.CANCEL,
						text: Loc.getMessage('MESSAGE_DRAFT_CONTINUE_EDITING'),
					},
				],
			);
		}

		showDraftDiscardError()
		{
			Haptics.impactLight();
			Alert.confirm(
				Loc.getMessage('MESSAGE_DRAFT_DISCARD_ERROR_TITLE'),
				Loc.getMessage('MESSAGE_DRAFT_DISCARD_ERROR_TEXT'),
				[
					{
						type: ButtonType.DEFAULT,
						text: Loc.getMessage('MESSAGE_DRAFT_SAVE_RETRY'),
						onPress: () => this.discardDraftAndClose(),
					},
					{
						type: ButtonType.CANCEL,
						text: Loc.getMessage('MESSAGE_DRAFT_CONTINUE_EDITING'),
					},
				],
			);
		}

		close()
		{
			this.isClosing = true;
			this.layout?.preventBottomSheetDismiss?.(false);

			if (this.layout)
			{
				this.layout.back();
				this.layout.close();
			}
		}

		setFocusField(name)
		{
			if (this.fieldRefs[name])
			{
				if (name === 'message')
				{
					this.fieldRefs[name].setCursorPositionTo();
				}
				else
				{
					this.fieldRefs[name].focus();
				}
			}
		}

		refreshSaveButton()
		{
			if (this.saveButton)
			{
				this.saveButton.refresh();
			}
		}

		getInitialFocusedFieldName()
		{
			if (this.isEmptyField('subject'))
			{
				return 'subject';
			}

			return 'message';
		}

		isEmptyField(fieldType)
		{
			const { compositeFields } = this.state;
			const { [fieldType]: fieldValue } = compositeFields;

			if (!Type.isPlainObject(fieldValue) || !fieldValue.hasOwnProperty('fields'))
			{
				throw new Error(`Field ${fieldType} is not found`);
			}

			const { fields } = fieldValue;

			return this.isEmptyFieldValue(fields);
		}

		isEmptyFieldValue(fieldValue)
		{
			if (!Array.isArray(fieldValue))
			{
				return true;
			}

			return fieldValue.every((field) => !field || !Type.isStringFilled(field.value));
		}

		renderMessageBodyInput(props)
		{
			const {
				ref,
				onChangeFieldAction,
				value,
				key,
				testId = 'message-sending-form-message-body-field',
				compact = false,
			} = props;

			let { additionalParameters } = props;

			const showLeftIcon = false;

			if (additionalParameters === undefined)
			{
				additionalParameters = [];
			}

			return View(
				{
					style: {
						minHeight: compact ? 60 : 100,
						paddingTop: compact ? 0 : Indent.S.toNumber(),
						paddingBottom: 20,
						paddingLeft: Indent.XL2.toNumber(),
						paddingRight: Indent.XL2.toNumber(),
					},
				},
				TextAreaField({
					testId,
					requiredErrorMessage: Loc.getMessage('MESSAGE_SEND_FIELD_MESSAGE_BODY_ERROR'),
					ref,
					showRequired: false,
					required: this.signatureCapabilityAvailable
						? !Type.isStringFilled(this.composeSignature.text)
						: true,
					showTitle: false,
					onChange: useCallback(onChangeFieldAction, [key]),
					...additionalParameters,
					showLeftIcon,
					value,
					placeholder: Loc.getMessage('MESSAGE_SEND_FIELD_MESSAGE_BODY_PLACEHOLDER'),
					config: {
						...(additionalParameters?.config ?? {}),
						deepMergeStyles: {
							...(additionalParameters?.config?.deepMergeStyles ?? {}),
							...fieldTypographyStyles,
						},
					},
				}),
			);
		}

		getOwnerType()
		{
			const {
				ownerType,
			} = this.getOwnerEntity();

			return ownerType;
		}

		getOwnerEntity()
		{
			return this.ownerEntity;
		}

		getReplyMessageBody()
		{
			return this.replyMessageBody;
		}

		renderReplyMessageBody()
		{
			return new MessageBody({
				borderBeforeFiles: true,
				files: this.files,
				isHiddenField: true,
				content: this.getReplyMessageBody(),
				isBodyThemed: this.isBodyThemed,
			});
		}

		expandFormFields()
		{
			this.setState({
				fieldsOutputFormat: this.constants.fieldsOutputFormatFull,
			});
		}

		onChangeField(key, data, item = {})
		{
			if (key === 'from' && data === 'add-new-mailbox')
			{
				if (this.from?.length === 1)
				{
					new AnalyticsEvent({
						tool: 'mail',
						category: 'mail_general_ops',
						event: 'mailbox_types_view',
						c_section: 'crm',
					}).send();
				}

				MailDialog.show({
					type: MailDialog.CONNECTING_MAIL_CRM_TYPE,
					parentWidget: this.layout,
					successCallback: (id, email) => {
						NotifyManager.showLoadingIndicator();
						getContactsPromise(Number(this.getOwnerEntity().ownerId), this.getOwnerEntity().ownerType)
							.then(({ data: { senders } }) => {
								if (Array.isArray(senders))
								{
									this.setSenders(senders, email);
								}
							})
							.catch(console.error)
							.finally(() => NotifyManager.hideLoadingIndicatorWithoutFallback());
					},
				});
			}
			else
			{
				if (!this.mailTemplateMutationInProgress)
				{
					this.mailTemplateFormAdapter?.markUserChange();
				}
				this.isChanged = true;
				this.draftComposeState.markUserChange();

				const { type, onApplied } = item;

				if ((!type || (type !== MenuSelectType && type !== MailContactType)) && !Array.isArray(data))
				{
					data = [{
						value: stringify(data),
					}];
				}

				const compositeFields = clone(this.state.compositeFields);

				compositeFields[key].fields = data;
				const legacySignature = key === 'from' && !this.signatureCapabilityAvailable
					? this.applySignatureToCompositeFields(
						compositeFields,
						'message',
						this.senderIdentity.toTransportEmail(data),
					)
					: null
				;

				this.setState({ compositeFields }, () => {
					if (key === 'from' && this.signatureCapabilityAvailable)
					{
						this.onSignatureSenderChange(this.getCompositeFieldValue(this.state.compositeFields.from));
					}
					else if (key === 'from')
					{
						this.setCursorBeforeSignature('message', legacySignature);
					}
					this.markDraftChanged();
					onApplied?.();
				});
			}
		}

		markDraftChanged()
		{
			this.layout?.preventBottomSheetDismiss?.(true);
			if (!this.prepareDraftSave())
			{
				return;
			}

			this.draftCoordinator?.markChanged(() => this.buildDraftSnapshot());
		}

		prepareDraftSave()
		{
			if (this.hasSavableDraftContent())
			{
				return true;
			}

			this.draftCoordinator?.cancelPending();

			return false;
		}

		hasSavableDraftContent()
		{
			const { compositeFields } = this.state;
			const attachmentPlan = buildDraftAttachmentPlan(this.getFiles(), this.getDraftAttachmentBindings());

			return hasSavableDraftContent({
				subject: compositeFields.subject.fields?.[0]?.value ?? '',
				userBodyWithoutSignature: this.getDraftUserBodyWithoutSignature(),
				to: this.buildDraftRecipients(compositeFields.to.fields),
				cc: this.buildDraftRecipients(compositeFields.cc.fields),
				bcc: this.buildDraftRecipients(compositeFields.bcc.fields),
				attachments: attachmentPlan.attachments,
			});
		}

		getDraftUserBodyWithoutSignature()
		{
			if (this.signatureCapabilityAvailable)
			{
				return this.getMessageTextWithoutSignature();
			}

			const fullText = this.getCompositeFieldValue(this.state?.compositeFields?.message);

			return this.replaceLegacySignatureByRange(fullText, '').text;
		}

		buildDraftSnapshot()
		{
			const { compositeFields } = this.state;
			const senderMenuId = this.getCompositeFieldValue(compositeFields.from);
			const senderEmail = this.senderIdentity.toTransportEmail(senderMenuId);
			const sender = this.senders.find(({ email }) => email === senderEmail);
			const attachmentPlan = buildDraftAttachmentPlan(this.getFiles(), this.getDraftAttachmentBindings());

			const snapshot = {
				clientId: this.clientId,
				sender: senderEmail ? { name: sender?.name ?? senderEmail, email: senderEmail } : null,
				to: this.buildDraftRecipients(compositeFields.to.fields),
				cc: this.buildDraftRecipients(compositeFields.cc.fields),
				bcc: this.buildDraftRecipients(compositeFields.bcc.fields),
				subject: compositeFields.subject.fields?.[0]?.value ?? '',
				body: this.draftComposeState.getDraftBody(compositeFields.message.fields?.[0]?.value ?? ''),
				bodyFormat: 'html',
				mode: this.isForward === 1 ? 'forward' : (this.getOwnerEntity()?.inResponseToMessage ? 'reply' : 'new'),
				parentMessageId: Number(this.getOwnerEntity()?.inResponseToMessage) || null,
				attachments: attachmentPlan.attachments,
				largeAttachments: buildSavableDraftLargeAttachments(this.getOwnedLargeAttachments()),
			};
			this.rememberDraftAttachmentKeys(snapshot, attachmentPlan.keys);

			return snapshot;
		}

		/**
		 * The sets the letter of this form owns. While the coordinator lives it is the only source of truth:
		 * a composition the person emptied by hand owns nothing, and the copies it held leave the Disk.
		 *
		 * Without a coordinator the form learns nothing about the sets and cannot learn: the scenario was
		 * never built for it, so the sets a restored draft brought back stay owned by that draft. Answering
		 * with nothing here would untie the draft from them, and their tokens live in that record alone -
		 * neither the sentry of the send nor a cleanup could ever reach a set the record stopped naming.
		 *
		 * A set the server marked invalid is not owned: it is kept in the record as it arrived, and naming it
		 * would carry a refused contract further.
		 *
		 * @return {Array}
		 */
		getOwnedLargeAttachments()
		{
			if (this.largeAttachmentCoordinator)
			{
				return this.largeAttachmentCoordinator.getConvertedSets();
			}

			return (this.draftLargeAttachments ?? []).filter((set) => set?.valid !== false);
		}

		/**
		 * @return {Array<{ token: string, fileIds: number[] }>}
		 */
		getLargeAttachmentSendContracts()
		{
			return this.largeAttachmentCoordinator
				? this.largeAttachmentCoordinator.getSendContracts()
				: buildLargeAttachmentSendContracts(this.getOwnedLargeAttachments())
			;
		}

		/**
		 * A binding belongs to a stored draft: once its identity is gone the attachments have to be
		 * saved from their own sources again.
		 */
		getDraftAttachmentBindings()
		{
			return this.draftCoordinator?.getDraftId() ? this.draftAttachmentBindings : {};
		}

		rememberDraftAttachmentKeys(snapshot, keys)
		{
			this.draftAttachmentKeys.set(snapshot, keys);
		}

		/**
		 * Saving recreates the bindings, so an unmatchable response leaves the known ids dead. Dropping
		 * them makes the next save copy the attachments from their own sources again, which costs an extra
		 * copy but keeps saving and sending alive.
		 */
		applySavedDraftAttachmentBindings(draft, snapshot)
		{
			const keys = this.draftAttachmentKeys.get(snapshot);
			this.draftAttachmentKeys.delete(snapshot);

			this.draftAttachmentBindings = mapSavedDraftAttachmentBindings(keys, draft?.snapshot?.attachments) ?? {};
		}

		handleDraftSaved(draft, snapshot, { created = false } = {})
		{
			this.applySavedDraftAttachmentBindings(draft, snapshot);

			if (created && this.draftConnector?.context?.type === 'mail')
			{
				void this.rememberFirstMailDraftCreated();
			}
		}

		buildDraftRecipients(fields = [])
		{
			return fields.map((recipient) => {
				const selectedEmail = recipient.email?.[recipient.selectedEmailId ?? 0]?.value
					?? recipient.customData?.email
					?? null
				;
				if (!selectedEmail)
				{
					return null;
				}

				const entityType = recipient.customData?.entityType ?? recipient.type;
				const entityId = recipient.customData?.entityId ?? recipient.id;
				const result = {
					name: recipient.name ?? recipient.customData?.name ?? selectedEmail,
					email: selectedEmail,
				};
				if (entityType && entityType !== 'email')
				{
					result.entityType = entityType;
				}
				if (entityId && entityType !== 'email')
				{
					result.entityId = Number(entityId) || entityId;
				}

				return result;
			}).filter(Boolean);
		}

		checkSendEmail()
		{
			const canSendEmail = this.validateFields();

			if (!canSendEmail)
			{
				Haptics.notifyWarning();

				this.focusFirstInvalidField();
			}

			return canSendEmail;
		}

		validateFields()
		{
			if (!this.state.compositeFields.from.fields)
			{
				return false;
			}

			let validate = true;

			Object.values(this.fieldRefs).forEach((fieldRef) => {
				if (fieldRef && !fieldRef.validate())
				{
					validate = false;
				}
			});

			return validate;
		}

		focusFirstInvalidField()
		{
			const inputNames = [
				...Object.keys(this.constants.compositeFields),
				'message',
			];

			const invalidFieldName = inputNames.find((fieldName) => {
				const fieldRef = this.fieldRefs[fieldName];

				return fieldRef && !fieldRef.isValid();
			});

			if (invalidFieldName)
			{
				this.fieldRefs[invalidFieldName].focus();
			}
		}

		hasInvalidFields()
		{
			return Object.values(this.fieldRefs)
				.some((fieldRef) => fieldRef && !fieldRef.isValid());
		}

		sendEmail()
		{
			if (this.messageIsSent)
			{
				return;
			}

			if (!this.checkSendEmail())
			{
				return;
			}

			this.messageIsSent = true;

			NotifyManager.showLoadingIndicator();

			this.waitUploadingFiles()
				// the last uploaded file may only now be reaching the scenario: the send waits for the set
				// to be converted, otherwise the letter would carry neither the address nor the set
				.then(() => this.largeAttachmentCoordinator?.handleFilesChanged())
				.then(() => this.largeAttachmentCoordinator?.whenSettled())
				.then(() => {
					// a failed conversion leaves the over-limit set without a valid contract, and its reason
					// is on the screen already: sending now would carry the raw files and earn a second
					// refusal, so the send-chain stops here and the loading indicator is dropped without
					// another error over the one already shown. A composition nothing was ever shown about
					// is not stopped here at all - it goes on and the server answers it by its size
					if (this.largeAttachmentCoordinator?.hasUnresolvedOversizeSet())
					{
						return Promise.reject({ handled: true });
					}

					// the trusted address has to be in the body: without it the server refuses the send
					this.restoreLargeAttachmentAddresses();

					if (!this.draftCoordinator || !this.isChanged)
					{
						return null;
					}

					this.markDraftChanged();

					return this.draftCoordinator.flush();
				})
				.then(() => sendMessage({
					isForward: this.isForward,
					isCrmMessage: this.isCrmMessage ?? true,
					senders: this.senderIdentity.reorderForTransport(
						this.getCompositeFieldValue(this.state.compositeFields.from),
					),
					fileTokens: this.getFileIds(),
					largeAttachments: this.getLargeAttachmentSendContracts(),
					saveAsTemplate: this.mailTemplateSaveAvailable && this.state.saveAsTemplate === true,
					...this.getDraftSendParams(),
					...this.getOwnerEntity(),
					...this.getCompositeFieldsForSending(),
				}))
				.then((response) => {
					if (this.isCrmMessage === false && !Type.isStringFilled(response?.data?.MESSAGE_ID))
					{
						return Promise.reject({
							errors: response?.errors ?? [{ message: '' }],
						});
					}

					this.draftCoordinator?.destroy();
					const postSendClosesForm = this.showLargeAttachmentPostSend();
					new AnalyticsEvent({
						tool: 'mail',
						category: 'mail_general_ops',
						event: 'mail_send',
						c_section: this.isCrmMessage ? 'crm' : this.source,
						status: 'success',
						c_element: this.element,
					}).send();
					NotifyManager.hideLoadingIndicator(true);
					if (response?.data?.templateSaveWarning === true)
					{
						showSafeToast({
							message: Loc.getMessage('MESSAGE_SEND_MAIL_TEMPLATE_SAVE_WARNING'),
						});
					}

					// the sheet closes the form once it is done with it, whichever way it ended
					if (!postSendClosesForm)
					{
						setTimeout(() => this.close(), 300);
					}
				})
				.catch((failure) => {
					this.messageIsSent = false;

					// the send-chain stopped itself after showing the reason (a failed conversion): the
					// loading indicator leaves and no second error is put over the one already shown
					if (failure && failure.handled)
					{
						NotifyManager.hideLoadingIndicatorWithoutFallback();

						return;
					}

					console.error(failure);
					new AnalyticsEvent({
						tool: 'mail',
						category: 'mail_general_ops',
						event: 'mail_send',
						c_section: this.isCrmMessage ? 'crm' : this.source,
						status: 'error',
						c_element: this.element,
					}).send();

					// some file occurred error during uploading
					if (failure && failure.hasError)
					{
						NotifyManager.hideLoadingIndicatorWithoutFallback();

						return;
					}

					const { errors } = failure || {};

					NotifyManager.showErrors(errors);
				})
			;
		}

		getCompositeFieldsForSending()
		{
			const compositeFields = clone(this.state.compositeFields);
			const senderMenuId = this.getCompositeFieldValue(compositeFields.from);
			const senderEmail = this.senderIdentity.toTransportEmail(senderMenuId);
			if (senderEmail)
			{
				compositeFields.from.fields = [{ value: senderEmail }];
			}
			if (Type.isString(this.restoredMessageBody))
			{
				compositeFields.message.fields = [{ value: this.restoredMessageBody }];
				this.restoredMessageBody = null;
			}
			// the body the letter leaves with, kept for the offer after the send: what may be removed is
			// decided by this text and not by what the send meant to put into it
			this.sentMessageBody = this.getCompositeFieldValue(compositeFields.message);
			const messageHtml = this.buildMessageHtmlWithServiceLinks(compositeFields.message);

			if (Type.isStringFilled(messageHtml))
			{
				compositeFields.messageHtml = messageHtml;
			}

			return compositeFields;
		}

		/**
		 * The markup of the letter around every service address it carries. The plain text keeps the bare
		 * address, and the markup turns it into a link: a slot of the calendar shows the address itself, a
		 * set on the Disk shows a title, because the name of the folder arrives empty from the server.
		 */
		buildMessageHtmlWithServiceLinks(messageField)
		{
			return buildServiceLinkedHtml(this.getCompositeFieldValue(messageField), this.getServiceLinks());
		}

		/**
		 * @return {Array<{ url: string, title?: string }>}
		 */
		getServiceLinks()
		{
			const links = this.calendarSlotsLinks.map((url) => ({ url }));
			const linkTitle = Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_LINK_TITLE');

			(this.largeAttachmentCoordinator?.getServiceLinks() ?? []).forEach(({ url }) => {
				links.push({ url, title: linkTitle });
			});

			return links;
		}

		/**
		 * Puts back every address the person removed from the letter: without a trusted address in the body
		 * the server refuses the send, so this is a condition of the send and not a convenience.
		 */
		restoreLargeAttachmentAddresses()
		{
			if (!this.largeAttachmentCoordinator)
			{
				return;
			}

			const message = this.getCompositeFieldValue(this.state.compositeFields.message);
			const { body, restored } = this.largeAttachmentCoordinator.prepareSend(message);
			if (restored.length === 0)
			{
				return;
			}

			this.restoredMessageBody = body;
			this.onChangeMessageBody(body);
		}

		/**
		 * The offer to remove a file that stayed on the Disk without ever reaching the letter. It is asked of
		 * the body the letter left with: a set whose address that body carries is what the recipient opens,
		 * and offering to remove it would break a letter already sent. The restoration above puts every
		 * address back, so the offer is a rare one - a set that never made it into the letter that left.
		 *
		 * @return {boolean} whether the closing of the form is now up to the sheet
		 */
		showLargeAttachmentPostSend()
		{
			const sentBody = this.sentMessageBody;
			this.sentMessageBody = null;

			if (!this.largeAttachmentCoordinator || !Type.isString(sentBody))
			{
				return false;
			}

			const orphaned = this.largeAttachmentCoordinator.findOrphanedSets(sentBody);
			if (orphaned.length === 0)
			{
				return false;
			}

			return LargeAttachmentPostSend.show({
				sets: orphaned,
				connector: this.largeAttachmentConnector,
				suppressed: this.largeAttachmentPostSendPromptSuppressed,
				optionName: this.largeAttachmentPostSendPromptOptionName,
				parentWidget: this.layout,
				onComplete: () => this.close(),
			});
		}

		onLargeAttachmentSetsChanged()
		{
			const sets = this.largeAttachmentCoordinator?.getConvertedSets() ?? [];
			if (!this.draftComposeState.updateLargeAttachments(sets))
			{
				return;
			}

			this.isChanged = true;
			this.markDraftChanged();
		}

		/**
		 * A restore gave up sets the server invalidated. The record still names them, so the send stops on them
		 * and the person is told nothing until this runs. The draft is marked changed so the autosave overwrites
		 * the record without the refused sets, and the person is told the heavy file is gone and its link has
		 * left the letter - the one thing the person needs to know, which no server refusal ever names.
		 *
		 * @param {Array} dropped
		 */
		onLargeAttachmentSetsDropped(dropped)
		{
			this.draftComposeState.updateLargeAttachments(this.getOwnedLargeAttachments());
			this.isChanged = true;
			this.markDraftChanged();
			this.showLargeAttachmentDroppedNotice(dropped);
		}

		/**
		 * @param {Array} dropped
		 */
		showLargeAttachmentDroppedNotice(dropped)
		{
			if (!Array.isArray(dropped) || dropped.length === 0)
			{
				return;
			}

			NotifyManager.showError(Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_DROPPED_NOTICE'));
		}

		/**
		 * The tariff of the portal forbids the scenario, so the person gets the standard restriction screen
		 * instead of a bare failure. Two ways lead here on purpose: the channel of tariff restrictions knows
		 * the answer before any attempt, and the code of the server answers when the channel has not loaded
		 * in time. Both end on the same screen.
		 *
		 * @return {Promise<void>}
		 */
		async showLargeAttachmentTariffRestriction()
		{
			const restriction = await this.loadLargeAttachmentRestriction();
			if (restriction?.isRestricted())
			{
				restriction.showRestriction({ parentWidget: this.layout });

				return;
			}

			this.openLargeAttachmentRestrictionScreen();
		}

		/**
		 * @return {Promise<?Object>} the restriction of the channel, or null while it has not loaded
		 */
		async loadLargeAttachmentRestriction()
		{
			try
			{
				await tariffPlanRestrictionsReady();
			}
			catch (error)
			{
				console.error(error);
			}

			return this.areTariffPlanRestrictionsLoaded()
				? getFeatureRestriction(LARGE_ATTACHMENT_TARIFF_FEATURE_ID)
				: null
			;
		}

		/**
		 * The screen built from the phrases of mail: the general limit on the size of the attachments holds
		 * on every tariff, and only the upload to the Disk with a link in the letter is the paid feature.
		 */
		openLargeAttachmentRestrictionScreen()
		{
			requireLazy('layout/ui/plan-restriction')
				.then((planRestrictionModule) => {
					const { PlanRestriction } = planRestrictionModule ?? {};
					if (!PlanRestriction)
					{
						NotifyManager.showError(Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_ERROR_TARIFF'));

						return;
					}

					PlanRestriction.open(
						{
							title: Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_RESTRICTION_TITLE'),
							text: Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_RESTRICTION_TEXT'),
						},
						this.layout,
					);
				})
				.catch(console.error)
			;
		}

		showLargeAttachmentError(error)
		{
			NotifyManager.showError(LargeAttachmentPostSend.getErrorMessage(error));
		}

		/**
		 * @param {string} text
		 */
		removeTextFromMessage(text)
		{
			const message = this.getCompositeFieldValue(this.state.compositeFields.message);
			const nextMessage = removePublicUrlFromBody(message, text);
			if (nextMessage !== message)
			{
				this.onChangeMessageBody(nextMessage);
			}
		}

		getCompositeFieldValue(field)
		{
			if (Type.isPlainObject(field) && Type.isString(field.fields))
			{
				return field.fields;
			}

			if (Type.isPlainObject(field) && Array.isArray(field.fields) && Type.isString(field.fields[0]?.value))
			{
				return field.fields[0].value;
			}

			return '';
		}

		renderCompositeField(props)
		{
			const {
				testId,
				requiredErrorMessage,
				required,
				key,
				placeholder,
				title,
				isComposite,
				fieldsOutputFormat,
				collapsible,
				config = {},
				fields,
				type,
				onChangeAction,
				showMoreAction,
				isShowMoreButton,
				ref,
				items,
				readOnly = false,
				renderContent = null,
			} = props;

			const showLeftIcon = false;

			if (fieldsOutputFormat === 'little' && collapsible)
			{
				return null;
			}

			let field;

			const hideMode = isShowMoreButton && fieldsOutputFormat === 'little';

			const standardFiledProps = {
				testId,
				showTitle: false,
				requiredErrorMessage,
				ref,
				showRequired: false,
				required,
				placeholder,
				showLeftIcon,
				readOnly,
				onChange: useCallback(onChangeAction, [key]),
			};

			if (isComposite)
			{
				let renderField;
				switch (type)
				{
					case MenuSelectType:
						renderField = MenuSelectField;
						break;
					default:
						renderField = TextAreaField;
				}
				field = MultipleField({
					addField: {
						content: `
							<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect width="28" height="28" rx="14" fill="white" fill-opacity="0.01"/>
							<path d="M17.1878 16.6815L17.421 17.8691C17.488 18.2106 17.3065 18.5543 16.9795 18.6733C15.6122 19.1705 14.0705 19.4651 12.4355 19.5003H11.7728C10.1299 19.4649 8.58128 19.1676 7.20917 18.6661C6.89613 18.5517 6.71323 18.2296 6.76649 17.9006C6.81766 17.5845 6.8743 17.2812 6.93213 17.0557C7.12946 16.2864 8.23942 15.7151 9.26073 15.2757C9.52815 15.1607 9.68959 15.0689 9.85269 14.9761C10.012 14.8855 10.173 14.794 10.4358 14.679C10.4656 14.5374 10.4776 14.3927 10.4715 14.2482L10.9239 14.1945C10.9239 14.1945 10.9834 14.3026 10.8879 13.6671C10.8879 13.6671 10.3796 13.5353 10.356 12.5234C10.356 12.5234 9.97377 12.6505 9.95072 12.0373C9.94595 11.9152 9.91438 11.7977 9.88414 11.6852C9.81159 11.4152 9.74664 11.1736 10.0774 10.963L9.83876 10.3267C9.83876 10.3267 9.58774 7.86978 10.6878 8.06868C10.2415 7.36158 14.0056 6.77381 14.2556 8.93889C14.3539 9.59156 14.3539 10.2549 14.2556 10.9076C14.2556 10.9076 14.8179 10.8429 14.4425 11.912C14.4425 11.912 14.2358 12.6815 13.9184 12.5087C13.9184 12.5087 13.9698 13.4811 13.4701 13.646C13.4701 13.646 13.5058 14.1639 13.5058 14.1989L13.9235 14.2613C13.9235 14.2613 13.9108 14.6932 13.9942 14.7399C14.3752 14.9861 14.7929 15.1726 15.2323 15.2929C16.5292 15.6221 17.1878 16.187 17.1878 16.6815Z" fill="#D5D7DB"/>
							<path d="M18.6418 9.04982H20.4311V11.2496H22.7224V13.0532H20.4311V15.3624H18.6418V13.0532H16.46V11.2496H18.6418V9.04982Z" fill="#D5D7DB"/>
							</svg>
						`,
					},
					renderField,
					multiple: true,
					value: fields,
					...standardFiledProps,
				});
			}
			else
			{
				switch (type)
				{
					case MailContactType:
					{
						const selectField = MailContactField({
							value: fields.map((item) => item.id),
							readOnly: false,
							multiple: true,
							...standardFiledProps,
							config: {
								...config,
								allMarginsWidthInField,
								enableCreation: false,
								entityList: fields.map((item) => ({
									email: item.email,
									selectedEmailId: item.selectedEmailId,
									title: item.name,
									id: item.id,
									type: item.type,
									isEmailHidden: item.isEmailHidden,
								})),
								deepMergeStyles: {
									...(config?.deepMergeStyles ?? {}),
									...fieldTypographyStyles,
								},
							},
						});

						field = View(
							{
								style: {
									marginTop: 1.3,
									// Indent for tap
									width: '90%',
								},
							},
							selectField,
						);

						break;
					}

					case MenuSelectType:
					{
						const selectField = MenuSelectField({
							value: fields,
							required: true,
							...standardFiledProps,
							config: {
								showCancelButton: true,
								menuTitle: BX.message('MESSAGE_SEND_SELECT_SENDER_TITLE'),
								menuItems: items,
								parentWidget: this.props.parentWidget,
								deepMergeStyles: fieldTypographyStyles,
							},
						});

						field = View(
							{
								style: {
									width: hideMode ? '73%' : '100%',
								},
							},
							selectField,
						);
						break;
					}
					default:
					{
						if (renderContent)
						{
							field = renderContent;
						}
						else
						{
							const deepMergeStyles = fields[0]?.config?.deepMergeStyles ?? {};
							field = TextAreaField({
								...standardFiledProps,
								...fields[0],
								config: {
									...(fields[0]?.config ?? {}),
									deepMergeStyles: {
										...fieldTypographyStyles,
										...deepMergeStyles,
										value: {
											...fieldTypographyStyles.value,
											...(deepMergeStyles.value ?? {}),
										},
									},
								},
							});
						}

						const isIOS = Application.getPlatform() === 'ios';

						field = View(
							{
								style: {
									paddingTop: isIOS ? 1 : 0.5,
								},
							},
							field,
						);
						break;
					}
				}
			}

			let moreBtn = null;

			if (hideMode)
			{
				moreBtn = View(
					{
						testId: 'message-sending-form-show-copies-btn',
						style: {
							height: '100%',
							paddingRight: Indent.XL3.toNumber(),
							justifyContent: 'center',
							right: 0,
							position: 'absolute',
						},
						onClick: showMoreAction,
					},
					View(
						{
							style: {
								borderBottomWidth: 0.5,
								borderBottomColor: Color.bgSeparatorPrimary.toHex(),
								borderStyle: 'dash',
								borderDashSegmentLength: 2,
								borderDashGapLength: 2,
							},
						},
						Capital({
							testId: 'message-sending-form-show-copies-label',
							color: Color.base5,
							text: Loc.getMessage('MESSAGE_SEND_FIELD_SHOW_MORE').toLocaleUpperCase(env.languageId),
						}),
					),
				);
			}

			return View(
				{
					onClick: () => {
						if (!readOnly)
						{
							this.setFocusField(key);
						}
					},
					style: {
						paddingLeft: Indent.XL3.toNumber(),
						alignItems: 'flex-start',
						flexDirection: 'row',
						borderBottomWidth: 0.5,
						borderBottomColor: Color.accentSoftBlue3.toHex(),
					},
				},
				View(
					{
						style: {
							justifyContent: 'center',
							height: 52,
						},
					},
					Text3({
						testId: `message-sending-form-field-label-${key}`,
						color: Color.base5,
						style: {
							textAlignVertical: 'top',
							paddingRight: Indent.XS.toNumber(),
						},
						text: `${title}:`,
					}),
				),
				View(
					{
						style: {
							flex: 1,
							minHeight: 52,
						},
					},
					View(
						{
							style: {
								alignItems: 'flex-start',
								flexDirection: 'row',
							},
						},
						View(
							{
								style: {
									flex: 1,
									paddingTop: isComposite ? 1 : 7,
								},
							},
							field,
						),
						moreBtn,
					),
				),
			);
		}

		waitUploadingFiles()
		{
			/** @type {FileField} fileRef */
			const { files: fileRef } = this.fieldRefs;

			if (fileRef)
			{
				return fileRef.getValueWhileReady();
			}

			return Promise.resolve();
		}

		renderAttachments(files)
		{
			return View(
				{
					testId: 'message-sending-attachments',
					ref: this.bindAttachmentsRef,
					style: {
						paddingHorizontal: 20,
						display: this.state.files.length === 0 ? 'none' : 'flex',
						paddingBottom: Indent.XL3.toNumber(),
					},
				},
				FileField({
					testId: 'message-sending-file-field',
					ref: this.bindFileRef,
					showTitle: false,
					showAddButton: false,
					multiple: true,
					value: this.state.files,
					config: {
						fileInfo: files,
						mediaType: 'file',
						parentWidget: this.layout,
						controller: {
							options: this.getOwnerEntity(),
							endpoint: this.isCrmMessage ? AjaxMethod.crmFileUploader : AjaxMethod.mailFileUploader,
						},
					},
					readOnly: false,
					onChange: this.onFileChange,
				}),
				this.renderLargeAttachmentAhaAnchor(),
			);
		}

		// The invisible target of the one-time messages. It lies over the first tile in the top-left corner
		// of the attachments block, out of the flow so it changes no layout, transparent so it never draws,
		// and non-clickable so it never steals a touch from the tiles beneath it.
		renderLargeAttachmentAhaAnchor()
		{
			return View({
				ref: this.bindLargeAttachmentAhaAnchorRef,
				clickable: false,
				style: {
					position: 'absolute',
					top: 0,
					left: 0,
					width: LARGE_ATTACHMENT_AHA_ANCHOR_SIZE,
					height: LARGE_ATTACHMENT_AHA_ANCHOR_SIZE,
				},
			});
		}

		bindFileRef(ref)
		{
			this.fieldRefs.files = ref;
		}

		// the one-time messages of the scenario are anchored to the attachments of the letter, the same
		// place the web guide is bound to
		bindAttachmentsRef(ref)
		{
			this.attachmentsRef = ref;
		}

		bindLargeAttachmentAhaAnchorRef(ref)
		{
			this.largeAttachmentAhaAnchorRef = ref;
		}

		onFileChange(files)
		{
			files = Array.isArray(files) ? files : [];
			// a file leaving the letter explains nothing, so only an attachment that appeared may bring up
			// a one-time message
			const attachmentAdded = files.length > this.state.files.length;
			const hasMeaningfulChange = this.draftComposeState.updateFiles(files);
			if (hasMeaningfulChange)
			{
				this.mailTemplateFormAdapter.markUserChange();
				this.isChanged = true;
			}

			this.setState({ files }, () => {
				if (hasMeaningfulChange)
				{
					this.markDraftChanged();
				}

				void this.largeAttachmentCoordinator?.handleFilesChanged();

				if (attachmentAdded)
				{
					this.offerLargeAttachmentAha();
				}
			});
		}

		addMailTemplateAttachments(attachments)
		{
			if (!Array.isArray(attachments))
			{
				return Promise.resolve(false);
			}

			const files = [...this.getFiles()];
			const addedIds = [];
			const knownObjectIds = new Set(files.map((file) => {
				const value = typeof file === 'object' ? (file.serverFileId ?? file.id) : file;

				return String(value ?? '').replace(/^n/, '');
			}));
			for (const attachment of attachments)
			{
				const id = Number(attachment?.id);
				if (!Number.isInteger(id) || id <= 0 || knownObjectIds.has(String(id)))
				{
					continue;
				}

				knownObjectIds.add(String(id));
				addedIds.push(id);
				files.push({
					id,
					serverFileId: `n${id}`,
					name: String(attachment.name ?? ''),
					size: Number(attachment.size) || 0,
					type: attachment.contentType ?? null,
					isUploading: false,
					isDiskFile: true,
				});
			}

			return new Promise((resolve) => {
				this.setState({ files }, () => {
					this.draftComposeState.updateFiles(files);
					this.isChanged = true;
					this.markDraftChanged();
					resolve({ success: true, addedIds });
				});
			});
		}

		removeMailTemplateAttachments(ids)
		{
			const removableIds = new Set((Array.isArray(ids) ? ids : []).map(String));
			const files = this.getFiles().filter((file) => {
				const value = typeof file === 'object' ? (file.serverFileId ?? file.id) : file;

				return !removableIds.has(String(value ?? '').replace(/^n/, ''));
			});

			return new Promise((resolve) => {
				this.setState({ files }, () => {
					this.draftComposeState.updateFiles(files);
					resolve(true);
				});
			});
		}

		offerLargeAttachmentAha()
		{
			// the anchor is the target; the whole block is the fallback if the anchor has not mounted yet
			this.largeAttachmentAha?.handleAttachmentAdded({
				targetRef: this.largeAttachmentAhaAnchorRef ?? this.attachmentsRef,
				hasHeavyFile: this.largeAttachmentCoordinator?.isConversionExpected() === true,
			});
		}

		getFiles()
		{
			const fieldFiles = this.fieldRefs.files?.getValue?.();

			return Array.isArray(fieldFiles) ? fieldFiles : this.state.files;
		}

		getFileIds()
		{
			return this.getFiles().map((file) => {
				if (typeof file !== 'object')
				{
					return file;
				}

				// A file the receiver placed in the Disk is reported by the object it became: the send takes
				// the file from there, and the scenario of the large attachment speaks in those objects only.
				if (isDiskObjectReference(file.serverFileId))
				{
					return file.serverFileId;
				}

				return (file.token || file.id);
			});
		}

		// eslint-disable-next-line consistent-return
		renderEmptyRecipientsWarning()
		{
			if (this.emptyRecipients && this.isCrmMessage)
			{
				return new WarningBlock({
					title: Loc.getMessage('MESSAGE_SEND_WARNING_EMPTY_RECIPIENT_TITLE'),
					description: Loc.getMessage('MESSAGE_SEND_WARNING_EMPTY_RECIPIENT_TEXT'),
				});
			}
		}

		renderSignatureSection()
		{
			if (!this.signatureCapabilityAvailable || !this.signatureSender)
			{
				return null;
			}

			const signatures = this.getAvailableSignaturesForCurrentSender();
			if (signatures.length === 0 && !this.composeSignature.isEnabled)
			{
				return View(
					{
						testId: 'message-sending-form-signature-empty',
						style: {
							paddingHorizontal: Indent.XL3.toNumber(),
							paddingTop: Indent.L.toNumber(),
							paddingBottom: Indent.XL.toNumber(),
						},
					},
					Button({
						testId: 'message-sending-form-signature-create-button',
						text: Loc.getMessage('MESSAGE_SEND_SIGNATURE_CREATE_ACTION'),
						design: ButtonDesign.PLAIN,
						size: ButtonSize.M,
						stretched: false,
						onClick: this.openSignatureCreate,
					}),
				);
			}

			const pickerText = this.composeSignature.isEnabled
				? Loc.getMessage('MESSAGE_SEND_SIGNATURE_PICKER_SELECTED', {
					'#TEXT#': SignaturePicker.getPreview(this.composeSignature.originalText),
				})
				: Loc.getMessage('MESSAGE_SEND_SIGNATURE_PICKER_EMPTY')
			;

			return View(
				{
					testId: 'message-sending-form-signature-block',
					style: {
						paddingLeft: Indent.XL2.toNumber() - Indent.XS2.toNumber(),
						paddingRight: Indent.XL2.toNumber(),
						paddingTop: Indent.L.toNumber(),
						paddingBottom: Indent.XS.toNumber(),
					},
				},
				View(
					{
						testId: 'message-sending-form-signature-picker',
						ref: (ref) => {
							this.signaturePickerRef = ref;
						},
						style: {
							alignSelf: 'flex-start',
							flexDirection: 'row',
							alignItems: 'center',
						},
						onClick: this.openSignaturePicker,
					},
					Text5({
						testId: 'message-sending-form-signature-picker-value',
						text: pickerText,
						color: Color.base4,
					}),
					IconView({
						testId: 'message-sending-form-signature-picker-chevron',
						icon: Icon.CHEVRON_DOWN_SIZE_XS,
						color: Color.base4,
						size: 20,
						style: { marginLeft: Indent.XS.toNumber() },
					}),
				),
			);
		}

		getMessageTextWithoutSignature()
		{
			const message = this.getCompositeFieldValue(this.state.compositeFields.message);
			if (!this.composeSignatureRange)
			{
				return message;
			}

			return message.slice(0, this.composeSignatureRange.start);
		}

		onChangeMessageText = (value) => {
			const message = this.getCompositeFieldValue(this.state.compositeFields.message);
			const suffix = this.composeSignatureRange
				? message.slice(this.composeSignatureRange.start, this.composeSignatureRange.end)
				: ''
			;
			const nextValue = `${String(value ?? '')}${suffix}`;
			this.composeSignatureRange = suffix === ''
				? null
				: { start: nextValue.length - suffix.length, end: nextValue.length }
			;
			this.onMessageBodyChanged();
			this.onChangeField('message', nextValue);
		};

		onMessageBodyChanged()
		{
			this.subjectGenerator?.invalidate();
		}

		getMessageBodyChangeHandler()
		{
			return this.signatureCapabilityAvailable
				? this.onChangeMessageText
				: this.onChangeMessageBody
			;
		}

		renderSignatureEditor()
		{
			if (!this.composeSignature.isEnabled)
			{
				return null;
			}

			return this.renderMessageBodyInput({
				testId: 'message-sending-form-signature-body-field',
				compact: true,
				value: this.composeSignature.text,
				key: 'signature',
				onChangeFieldAction: (value) => {
					this.composeSignature.edit(value);
					this.updateSignatureInMessageBody();
				},
			});
		}

		render()
		{
			const fields = [];
			Object.entries(this.constants.compositeFields).forEach(([key, item]) => {
				if (key !== 'message')
				{
					const compositeField = this.state.compositeFields[key];
					const subjectFieldProps = key === 'subject'
						? getSubjectGenerationFieldProps({
							field: compositeField.fields[0],
							inProgress: this.state.subjectGenerationInProgress,
						})
						: null;
					const field = this.renderCompositeField({
						key,
						onChangeAction: useCallback(
							(data) => (
								key === 'subject'
									? this.onChangeSubject(data, item)
									: this.onChangeField(key, data, item)
							),
							[key],
						),
						...item,
						...compositeField,
						...(subjectFieldProps ? {
							fields: [subjectFieldProps.field],
							readOnly: subjectFieldProps.readOnly,
							renderContent: subjectFieldProps.readOnly ? renderSubjectGenerationText() : null,
						} : {}),
						fieldsOutputFormat: this.state.fieldsOutputFormat,
					});

					if (key === 'subject')
					{
						fields.push(this.renderSubjectFieldWithButton(field));
						if (this.mailTemplateSaveAvailable)
						{
							fields.push(new SaveTemplateToggle({
								checked: this.state.saveAsTemplate === true,
								text: Loc.getMessage('MESSAGE_SEND_MAIL_TEMPLATE_SAVE_SHORT'),
								onToggle: (saveAsTemplate) => this.setState({ saveAsTemplate }),
							}));
						}
					}
					else
					{
						fields.push(field);
					}
				}
			});

			return View(
				{
					resizableByKeyboard: true,
				},
				this.renderEmptyRecipientsWarning(),
				ScrollView(
					{
						style: {
							backgroundColor: Color.bgContentPrimary.toHex(),
							flex: 1,
						},
					},
					View(
						{},
						View({
							style: {
								flexDirection: 'row',
								flexWrap: 'wrap',
							},
						}),
						...fields,
						this.renderAttachments(this.forwardedFiles),
						this.renderMessageBodyInput({
							ref: this.bindMessageBodyRef,
							...this.state.compositeFields.message.fields[0],
							value: this.getMessageTextWithoutSignature(),
							key: 'message',
							onChangeFieldAction: this.getMessageBodyChangeHandler(),
						}),
						this.renderSignatureSection(),
						this.renderSignatureEditor(),
						this.renderReplyMessageBody(),
						new ActionPanel({
							indentStub: true,
						}),
					),
				),
				new ActionPanel({
					withoutStyles: true,
					actions: this.getActionPanelActions(),
				}),
			);
		}

		getActionPanelActions()
		{
			const calendarSlotsButtonKey = this.state.isCalendarSharingRestricted
				? 'calendarSlotsRestrictedButton'
				: 'calendarSlotsButton'
			;

			return {
				...getMailTemplateAction(this.mailTemplatesEnabled, this.onTemplatesButton),
				[calendarSlotsButtonKey]: this.onCalendarSlotsButton,
				attachmentsButton: this.onAttachmentsButton,
			};
		}

		onTemplatesButton()
		{
			if (!this.mailTemplatesEnabled)
			{
				return;
			}

			void this.mailTemplateOpener.open({
				parentWidget: this.layout,
				session: this.mailTemplateSession,
				managePath: this.mailTemplateManagePath,
				emailFrom: this.senderIdentity.toTransportEmail(
					this.getCompositeFieldValue(this.constants.compositeFields.from),
				),
				onSelect: this.onMailTemplateSelect,
				onReturnFocus: () => {
					if (!this.mailTemplateUnmounted)
					{
						this.setFocusField('message');
					}
				},
			});
		}

		async onMailTemplateSelect(reference)
		{
			const selection = await this.mailTemplateController.select(reference);
			if (selection.status === 'needsDecision')
			{
				if (!this.mailTemplateModule?.showTemplateApplyDialog || this.mailTemplateUnmounted)
				{
					showErrorToast({ message: Loc.getMessage('MESSAGE_SEND_MAIL_TEMPLATE_LOAD_ERROR') });

					return;
				}

				const decision = await this.mailTemplateModule.showTemplateApplyDialog();
				const result = await this.mailTemplateController.complete(decision, selection.generation);
				if (result.status === 'failed')
				{
					showErrorToast({ message: Loc.getMessage('MESSAGE_SEND_MAIL_TEMPLATE_APPLY_ERROR') });
				}

				return;
			}

			if (selection.status === 'failed')
			{
				showErrorToast({ message: Loc.getMessage('MESSAGE_SEND_MAIL_TEMPLATE_APPLY_ERROR') });
			}
		}

		bindMessageBodyRef(ref)
		{
			this.fieldRefs.message = ref;
		}

		onChangeMessageBody(data)
		{
			this.onMessageBodyChanged();
			if (this.signatureCapabilityAvailable)
			{
				this.updateComposeSignatureRange(data);
			}
			else
			{
				this.updateLegacySignatureRange(data);
			}
			this.onChangeField('message', data);
		}

		updateComposeSignatureRange(nextValue)
		{
			if (!this.composeSignatureRange || !Type.isString(nextValue))
			{
				return;
			}

			const previousValue = this.getCompositeFieldValue(this.state.compositeFields.message);
			const transformedRange = transformEditableSignatureRange(
				previousValue,
				nextValue,
				this.composeSignatureRange,
			);
			this.composeSignatureRange = transformedRange;
			const signatureText = extractSignatureText(nextValue, transformedRange);
			if (signatureText === null)
			{
				this.composeSignature.edit('');

				return;
			}

			this.composeSignature.edit(signatureText);
		}

		updateLegacySignatureRange(nextValue)
		{
			if (this.signatureCapabilityAvailable || !this.legacySignatureRange || !Type.isString(nextValue))
			{
				return;
			}

			const previousValue = this.getCompositeFieldValue(this.state.compositeFields.message);
			const transformedRange = transformSignatureRange(previousValue, nextValue, this.legacySignatureRange);
			if (transformedRange)
			{
				this.legacySignatureRange = transformedRange;

				return;
			}

			this.legacySignatureRange = null;
			this.legacySignatureRangeUnknown = true;
		}

		onChangeSubject(data, item)
		{
			// A subject entered by the user must win over an in-flight generation.
			// Generated subjects are applied directly in applyGeneratedSubject(),
			// so they do not pass through this user-input handler.
			this.subjectGenerator?.invalidate();
			this.onChangeField('subject', data, item);
		}

		/**
		 * Whether the generation button is there to be pointed at. Geometry is not part of it:
		 * whether the button is behind the keyboard or scrolled out of view is measured natively,
		 * after this predicate has been asked.
		 *
		 * @return {boolean}
		 */
		canShowAiSubjectAhaMoment()
		{
			return this.subjectGenerationAvailable && !this.state.subjectGenerationInProgress;
		}

		hideAiSubjectAhaMoment()
		{
			void this.aiSubjectAhaMomentController?.hide();
		}

		/**
		 * @param {string} kind one of NoticeKind
		 */
		showSubjectNotice(kind)
		{
			// The first-time hint and the banner must not share the screen. The hint goes first: its
			// one-time flag is already written, it has done its explaining, and an answer to the tap
			// the user has just made matters more than an explanation left on screen.
			this.hideAiSubjectAhaMoment();
			this.subjectNoticePresenter?.show(kind);
		}

		async openSubjectLimitRestriction()
		{
			try
			{
				const { PlanRestriction } = await requireLazy('layout/ui/plan-restriction');
				await PlanRestriction.open(
					{ title: Loc.getMessage('MAILMOBILE_AI_SUBJECT_LIMIT_TITLE') },
					this.layout,
				);
			}
			catch (error)
			{
				console.error(error);
			}
		}

		onGenerateSubject()
		{
			if (!this.subjectGenerator)
			{
				return;
			}

			/* The entity is what makes the server treat this as a CRM composition,
			so regular mail must not send one at all. */
			const ownerEntity = this.isCrmMessage ? (this.getOwnerEntity() ?? {}) : {};

			this.subjectGenerator.generate({
				body: this.getBodyForSubjectGeneration(),
				currentSubject: this.getCurrentSubjectForGeneration(),
				mode: this.getSubjectGenerationMode(),
				ownerType: ownerEntity.ownerType ?? '',
				ownerId: ownerEntity.ownerId ?? 0,
				originalMessageId: this.getOriginalMessageId(),
				onLoadingChange: (inProgress) => this.setState({ subjectGenerationInProgress: inProgress }),
				onSuccess: (subject) => this.applyGeneratedSubject(subject),
			});
		}

		getBodyForSubjectGeneration()
		{
			const message = this.state.compositeFields.message.fields[0];
			const fullText = message && message.value ? message.value : '';
			if (this.signatureCapabilityAvailable)
			{
				return stripSignatureRange(fullText, this.composeSignatureRange);
			}

			// Strip the signature so it is neither treated as body nor sent to the model.
			return this.replaceLegacySignatureByRange(fullText, '').text;
		}

		getCurrentSubjectForGeneration()
		{
			const subject = this.state.compositeFields.subject.fields[0];

			return subject && typeof subject.value === 'string' ? subject.value : '';
		}

		getSubjectGenerationMode()
		{
			if (this.isForward)
			{
				return SubjectGenerationMode.FORWARD;
			}

			if (this.getOriginalMessageId() !== null)
			{
				return SubjectGenerationMode.REPLY;
			}

			return SubjectGenerationMode.NEW;
		}

		getOriginalMessageId()
		{
			const owner = this.getOwnerEntity();
			const id = owner ? Number(owner.inResponseToMessage) : 0;

			return id > 0 ? id : null;
		}

		applyGeneratedSubject(subject)
		{
			const compositeFields = clone(this.state.compositeFields);
			compositeFields.subject.fields = [{ value: subject }];

			this.isChanged = true;
			this.setState({ compositeFields });
		}

		renderSubjectFieldWithButton(field)
		{
			if (!this.subjectGenerationAvailable)
			{
				return field;
			}

			return View(
				{},
				field,
				this.renderSubjectGenerationButton(),
			);
		}

		renderSubjectGenerationButton()
		{
			return View(
				{
					id: SUBJECT_GENERATION_BUTTON_ID,
					testId: SUBJECT_GENERATION_BUTTON_ID,
					ref: (ref) => this.aiSubjectAhaMomentController?.setTargetRef(ref),
					onLayout: () => this.aiSubjectAhaMomentController?.markTargetAsLaidOut(),
					onClick: () => this.onGenerateSubject(),
					style: {
						position: 'absolute',
						right: 0,
						top: 0,
						bottom: 0,
						paddingLeft: 8,
						paddingRight: 16,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				this.state.subjectGenerationInProgress
					? renderSubjectGenerationLoader()
					: Image({
						testId: 'message-sending-form-subject-generation-icon',
						uri: getSubjectGenerationIconUri(),
						resizeMode: 'contain',
						style: {
							width: 24,
							height: 24,
						},
					}),
			);
		}

		async onCalendarSlotsButton()
		{
			const enums = await this.ensureCalendarEnums();
			if (!enums)
			{
				NotifyManager.showError(Loc.getMessage('MESSAGE_SEND_CALENDAR_SLOTS_RESTRICTION_ERROR'));

				return;
			}

			const isRestrictionLoaded = await this.loadCalendarSharingRestriction();
			if (!isRestrictionLoaded)
			{
				NotifyManager.showError(Loc.getMessage('MESSAGE_SEND_CALENDAR_SLOTS_RESTRICTION_ERROR'));

				return;
			}

			const restriction = this.getCalendarSharingRestriction();
			const isRestricted = restriction.isRestricted();
			if (this.state.isCalendarSharingRestricted !== isRestricted)
			{
				this.setState({ isCalendarSharingRestricted: isRestricted });
			}

			if (isRestricted)
			{
				restriction.showRestriction({
					parentWidget: this.layout,
				});

				return;
			}

			const slotsModule = await requireLazy('mail:calendar-slots');
			if (!slotsModule?.MailCalendarSlots)
			{
				NotifyManager.showError(Loc.getMessage('MESSAGE_SEND_CALENDAR_SLOTS_RESTRICTION_ERROR'));

				return;
			}

			slotsModule.MailCalendarSlots.open({
				parentWidget: this.layout,
				onInsertLink: this.insertCalendarSlotsLink,
				ownerEntity: this.getOwnerEntity(),
				isCrmMessage: this.isCrmMessage,
			});
		}

		insertCalendarSlotsLink(publicShortUrl)
		{
			const text = Loc.getMessage('MESSAGE_SEND_CALENDAR_SLOTS_LINK_TEMPLATE', {
				'#LINK#': publicShortUrl,
			});

			return this.insertTextToMessage(text)
				.then(() => this.rememberCalendarSlotsLink(publicShortUrl))
			;
		}

		rememberCalendarSlotsLink(publicShortUrl)
		{
			if (Type.isStringFilled(publicShortUrl) && !this.calendarSlotsLinks.includes(publicShortUrl))
			{
				this.calendarSlotsLinks.push(publicShortUrl);
			}
		}

		getMailTemplateMode()
		{
			if (this.isForward === 1)
			{
				return 'forward';
			}

			return this.getOwnerEntity()?.inResponseToMessage ? 'reply' : 'new';
		}

		isMailTemplateRestoredDraft()
		{
			return Boolean(this.isRestoredDraft);
		}

		getMailTemplateSubject()
		{
			return this.getCompositeFieldValue(this.state.compositeFields.subject);
		}

		canApplyMailTemplateContent(decision)
		{
			if (decision === 'insert')
			{
				return Type.isFunction(this.fieldRefs.message?.inputRef?.insert)
					|| this.canSafelyReplaceMailTemplateBody()
				;
			}

			return decision === 'replace' && this.canSafelyReplaceMailTemplateBody();
		}

		insertMailTemplateBody(body)
		{
			const hasNativeInsert = Type.isFunction(this.fieldRefs.message?.inputRef?.insert);
			if (!hasNativeInsert && !this.canSafelyReplaceMailTemplateBody())
			{
				return Promise.resolve(false);
			}

			this.onMessageBodyChanged();

			return this.insertTextToMessage(body)
				.then(() => true)
				.catch(() => false)
			;
		}

		replaceMailTemplateContent({ subject, body })
		{
			if (!this.canSafelyReplaceMailTemplateBody())
			{
				return false;
			}

			const currentMessage = this.getCompositeFieldValue(this.state.compositeFields.message);
			const signatureRange = this.signatureCapabilityAvailable
				? this.composeSignatureRange
				: this.legacySignatureRange
			;
			const replacement = planMailTemplateBodyReplacement({
				body,
				currentMessage,
				signatureRange,
				signatureRequired: this.signatureCapabilityAvailable
					? this.composeSignature.isEnabled && Type.isStringFilled(this.composeSignature.text)
					: Type.isStringFilled(this.currentSignature),
				rangeUnknown: !this.signatureCapabilityAvailable && this.legacySignatureRangeUnknown,
			});
			if (!replacement.success)
			{
				return false;
			}

			if (this.signatureCapabilityAvailable)
			{
				this.composeSignatureRange = replacement.range;
			}
			else
			{
				this.legacySignatureRange = replacement.range;
			}

			this.onMessageBodyChanged();
			this.mailTemplateMutationInProgress = true;

			return new Promise((resolve) => {
				this.onChangeField('message', replacement.text, {
					onApplied: () => {
						this.onChangeField('subject', String(subject ?? ''), {
							onApplied: () => {
								this.mailTemplateMutationInProgress = false;
								resolve(true);
							},
						});
					},
				});
			});
		}

		canSafelyReplaceMailTemplateBody()
		{
			const message = this.getCompositeFieldValue(this.state.compositeFields.message);
			if (this.signatureCapabilityAvailable)
			{
				if (!this.composeSignatureRange)
				{
					return !this.composeSignature.isEnabled || !Type.isStringFilled(this.composeSignature.text);
				}

				return this.isValidMailTemplateSignatureRange(this.composeSignatureRange, message);
			}

			if (this.legacySignatureRangeUnknown)
			{
				return false;
			}

			if (!this.legacySignatureRange)
			{
				return !Type.isStringFilled(this.currentSignature);
			}

			return this.isValidMailTemplateSignatureRange(this.legacySignatureRange, message);
		}

		isValidMailTemplateSignatureRange(range, message)
		{
			return Number.isInteger(range?.start)
				&& Number.isInteger(range?.end)
				&& range.start >= 0
				&& range.end >= range.start
				&& range.end <= message.length
			;
		}

		insertTextToMessage(text)
		{
			const messageField = this.fieldRefs.message;
			if (!messageField || !Type.isString(text))
			{
				return Promise.reject(new Error('Message field insert is unavailable'));
			}

			if (Type.isFunction(messageField.inputRef?.insert))
			{
				messageField.inputRef.insert(text);
				this.isChanged = true;

				return Promise.resolve();
			}

			// Older app versions have no native insert, so append the text to the body.
			if (this.signatureCapabilityAvailable)
			{
				const currentValue = this.getMessageTextWithoutSignature();
				const separator = Type.isStringFilled(currentValue) ? '\n' : '';
				const nextValue = `${currentValue}${separator}${text}`;
				this.onChangeMessageText(nextValue);
			}
			else
			{
				const currentValue = this.getCompositeFieldValue(this.state.compositeFields.message);
				const knownRange = this.replaceLegacySignatureByRange(currentValue, '').replaced
					? this.legacySignatureRange
					: null
				;
				const insertionPosition = knownRange?.start ?? currentValue.length;
				const beforeSignature = currentValue.slice(0, insertionPosition);
				const separator = Type.isStringFilled(beforeSignature) ? '\n' : '';
				const nextValue = `${beforeSignature}${separator}${text}${currentValue.slice(insertionPosition)}`;
				if (knownRange)
				{
					const offset = separator.length + text.length;
					this.legacySignatureRange = {
						start: knownRange.start + offset,
						end: knownRange.end + offset,
					};
					this.onMessageBodyChanged();
					this.onChangeField('message', nextValue);
				}
				else
				{
					this.onChangeMessageBody(nextValue);
				}
			}

			return Promise.resolve();
		}

		onAttachmentsButton()
		{
			const { files } = this.fieldRefs;

			if (files)
			{
				files.openFilePicker();
			}
		}
	}

	module.exports = {
		SendingForm,
		getReplyMessageBodyParams,
		shouldConfirmDraftClose,
		shouldConfirmUnsavedExit,
		hasWritableDraft,
		resolveDraftContext,
	};
});
