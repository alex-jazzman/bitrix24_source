/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
(function (exports, main_core, sign_type, ui_notification, ui_sidepanelContent) {
	'use strict';

	function isFilledMessage(message) {
		return main_core.Type.isString(message) && message.trim() !== '';
	}
	function getErrorMessage(sortedErrors, ...fallbacks) {
		const messages = [...sortedErrors.map(error => error.message), ...fallbacks];
		return messages.find(message => isFilledMessage(message)) ?? '';
	}

	function getErrorSortCode(error, connectionErrorCode) {
		const {
			code
		} = error;
		if (code === connectionErrorCode) {
			return 0;
		}
		if (main_core.Type.isString(code) && code !== '') {
			return 1;
		}
		return 2;
	}
	function getSortedErrors(errors, connectionErrorCode) {
		return [...errors].sort((firstError, secondError) => getErrorSortCode(firstError, connectionErrorCode) - getErrorSortCode(secondError, connectionErrorCode));
	}

	const SIGN_CLIENT_CONNECTION_ERROR_CODE = 'SIGN_CLIENT_CONNECTION_ERROR';
	async function request(method, endpoint, data, notifyError = true) {
		const config = {
			method
		};
		{
			Object.assign(config, {
				data
			}, {
				preparePost: false,
				headers: [{
					name: 'Content-Type',
					value: 'application/json'
				}]
			});
		}
		try {
			const response = await main_core.ajax.runAction(endpoint, config);
			if (response.errors?.length > 0) {
				throw new Error(response.errors[0].message);
			}
			return response.data;
		} catch (ex) {
			if (!notifyError) {
				return ex;
			}
			const {
				message = `Error in ${endpoint}`,
				errors = []
			} = ex;
			const sortedErrors = getSortedErrors(errors, SIGN_CLIENT_CONNECTION_ERROR_CODE);
			const errorCode = sortedErrors[0]?.code ?? '';
			if (errorCode === SIGN_CLIENT_CONNECTION_ERROR_CODE) {
				const stub = new ui_sidepanelContent.StubNotAvailable({
					title: main_core.Loc.getMessage('SIGN_JS_V2_API_ERROR_CLIENT_CONNECTION_TITLE'),
					desc: main_core.Loc.getMessage('SIGN_JS_V2_API_ERROR_CLIENT_CONNECTION_DESC'),
					type: ui_sidepanelContent.StubType.noConnection,
					link: {
						text: main_core.Loc.getMessage('SIGN_JS_V2_API_ERROR_CLIENT_CONNECTION_LINK_TEXT'),
						value: '18740976',
						type: ui_sidepanelContent.StubLinkType.helpdesk
					}
				});
				stub.openSlider();
				throw ex;
			}
			if (errorCode === 'LICENSE_LIMITATIONS') {
				top.BX.UI.InfoHelper.show('limit_office_e_signature_box');
				throw ex;
			}
			if (errorCode === 'SIGN_DOCUMENT_INCORRECT_STATUS') {
				const stub = new ui_sidepanelContent.StubNotAvailable({
					title: main_core.Loc.getMessage('SIGN_DOCUMENT_INCORRECT_STATUS_STUB_TITLE'),
					desc: main_core.Loc.getMessage('SIGN_DOCUMENT_INCORRECT_STATUS_STUB_DESC'),
					type: ui_sidepanelContent.StubType.notAvailable
				});
				stub.openSlider();

				//close previous slider (with editor)
				const slider = BX.SidePanel.Instance.getTopSlider();
				const onSliderCloseHandler = e => {
					if (slider !== e.getSlider()) {
						return;
					}
					window.top.BX.removeCustomEvent(slider.getWindow(), 'SidePanel.Slider:onClose', onSliderCloseHandler);
					const sliders = window.top.BX.SidePanel.Instance.getOpenSliders();
					for (let i = sliders.length - 2; i >= 0; i--) {
						if (sliders[i].getUrl().startsWith('/sign/doc/')) {
							sliders[i].close();
							return;
						}
					}
				};
				window.top.BX.addCustomEvent(slider.getWindow(), 'SidePanel.Slider:onClose', onSliderCloseHandler);
				throw ex;
			}
			if (errorCode === 'B2E_RESTRICTED_ON_TARIFF' || errorCode === 'B2E_SIGNERS_LIMIT_REACHED_ON_TARIFF') {
				top.BX.UI.InfoHelper.show('limit_office_e_signature');
				throw ex;
			}
			const content = getErrorMessage(sortedErrors, main_core.Loc.getMessage('SIGN_JS_V2_API_ERROR_COMMON'), message);
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Text.encode(content),
				autoHideDelay: 4000
			});
			throw ex;
		}
	}
	function post(endpoint, data = null, notifyError = true) {
		return request('POST', endpoint, data, notifyError);
	}

	class TemplateApi {
		getList() {
			return post('sign.api_v1.b2e.document.template.list');
		}
		completeTemplate(templateUid, folderId) {
			return post('sign.api_v1.b2e.document.template.complete', {
				uid: templateUid,
				folderId
			});
		}
		send(templateUid, fields, isOnboarding = false, externalId = null, externalDate = null) {
			return post('sign.api_v1.b2e.document.template.send', {
				uid: templateUid,
				fields,
				isOnboarding,
				externalId,
				externalDate
			});
		}
		getFields(templateUid) {
			return post('sign.api_v1.b2e.document.template.getFields', {
				uid: templateUid
			});
		}
		exportBlank(templateId) {
			return post('sign.api_v1.b2e.document.template.export', {
				templateId
			}, true);
		}
		importBlank(serializedTemplate) {
			return post('sign.api_v1.b2e.document.template.import', {
				serializedTemplate
			}, true);
		}
		changeVisibility(templateId, visibility) {
			return post('sign.api_v1.b2e.document.template.changeVisibility', {
				templateId,
				visibility
			});
		}
		copy(templateId, folderId) {
			return post('sign.api_v1.b2e.document.template.copy', {
				templateId,
				folderId
			});
		}
		moveToFolder(entities, folderId) {
			return post('sign.api_v1.b2e.document.template.moveToFolder', {
				entities,
				folderId
			});
		}
		delete(templateId) {
			return post('sign.api_v1.b2e.document.template.delete', {
				templateId
			});
		}
		deleteEntities(entities) {
			return post('sign.api_v1.b2e.document.template.deleteEntities', {
				entities
			});
		}
		registerDocuments(templateIds, excludeRejected = true) {
			return post('sign.api_v1.b2e.document.template.registerDocuments', {
				templateIds,
				excludeRejected
			});
		}
		setupSigners(documentIds, signers, excludeRejected) {
			return post('sign.api_v1.b2e.document.template.setupSigners', {
				documentIds,
				signers,
				excludeRejected
			});
		}
		installOnboardingTemplate() {
			return post('sign.api_v1.b2e.document.template.installOnboardingTemplate', {});
		}
	}

	class TemplateFolderApi {
		create(title) {
			return post('sign.api_v1.b2e.document.templateFolder.create', {
				title
			});
		}
		rename(folderId, newTitle) {
			return post('sign.api_v1.b2e.document.templateFolder.rename', {
				folderId,
				newTitle
			});
		}
		delete(folderId) {
			return post('sign.api_v1.b2e.document.templateFolder.delete', {
				folderId
			});
		}
		changeVisibility(folderId, visibility) {
			return post('sign.api_v1.b2e.document.templateFolder.changeVisibility', {
				folderId,
				visibility
			});
		}
		getListByDepthLevel(depthLevel) {
			return post('sign.api_v1.b2e.document.templateFolder.listByDepthLevel', {
				depthLevel
			});
		}
	}

	class SignersListApi {
		deleteSignersList(listId, notifyError = true) {
			return post('sign.api_v1.b2e.signers.deleteList', {
				listId
			}, notifyError);
		}
		copySignersList(listId, notifyError = true) {
			return post('sign.api_v1.b2e.signers.copyList', {
				listId
			}, notifyError);
		}
		deleteSignersFromList(listId, userIds, notifyError = true) {
			return post('sign.api_v1.b2e.signers.deleteSignersFromList', {
				listId,
				userIds
			}, notifyError);
		}
		createList(title, notifyError = true) {
			return post('sign.api_v1.b2e.signers.createList', {
				title
			}, notifyError);
		}
		renameList(listId, title, notifyError = true) {
			return post('sign.api_v1.b2e.signers.renameList', {
				listId,
				title
			}, notifyError);
		}
		addSignersToList(listId, members, excludeRejected = true, notifyError = true) {
			return post('sign.api_v1.b2e.signers.addSignersToList', {
				listId,
				members,
				excludeRejected
			}, notifyError);
		}
		pinList(listId, notifyError = true) {
			return post('sign.api_v1.b2e.signers.pinList', {
				listId
			}, notifyError);
		}
		unpinList(listId, notifyError = true) {
			return post('sign.api_v1.b2e.signers.unpinList', {
				listId
			}, notifyError);
		}
		getFeedRecipients(listId, notifyError = true) {
			return post('sign.api_v1.b2e.signers.getFeedRecipients', {
				listId
			}, notifyError);
		}
		createChat(listId, notifyError = true) {
			return post('sign.api_v1.integration.im.groupChat.createSignersListChat', {
				listId
			}, notifyError);
		}
	}

	/**
	 * Personal state of the placeholder panel as the server keeps it: the codes of the recently copied
	 * fields, the most recent one first.
	 */

	class PlaceholderApi {
		list(clearCache = false) {
			return post('sign.api_v1.b2e.document.placeholder.list', {
				clearCache
			});
		}
		listByHcmLinkCompanyId(hcmLinkCompanyId) {
			return post('sign.api_v1.b2e.document.placeholder.listByHcmLinkId', {
				hcmLinkCompanyId
			});
		}
		saveLastSelectionBySelectorType(selectorType, value) {
			return post('sign.api_v1.b2e.document.placeholder.saveLastSelectionBySelectorType', {
				selectorType,
				value
			});
		}
		getLastSelectionBySelectorType(selectorType) {
			return post('sign.api_v1.b2e.document.placeholder.getLastSelectionBySelectorType', {
				selectorType
			});
		}

		/**
		 * Personal state is a convenience, so a refusal must stay silent: `notifyError = false` keeps the
		 * common toast away and makes `request()` resolve with the error object instead of rejecting.
		 */
		getPersonalSettings() {
			return post('sign.api_v1.b2e.document.placeholder.getPersonalSettings', {}, false);
		}

		/**
		 * A refusal stays silent here as well, for the same reason as in `getPersonalSettings()`.
		 *
		 * @param hcmLinkCompanyId the tab of the external human resources system sends the chosen company:
		 *   the server validates the field code against the collection the user really sees
		 */
		saveFieldUsage(code, hcmLinkCompanyId = null) {
			return post('sign.api_v1.b2e.document.placeholder.saveFieldUsage', {
				code,
				hcmLinkCompanyId
			}, false);
		}

		/**
		 * The server checks the permission again, and its refusal must reach the user: unlike the personal
		 * state, this request keeps the common error toast.
		 *
		 * @param category the field category the panel got with the item: `PROFILE` or `DYNAMIC_MEMBER`
		 */
		deleteField(fieldId, category) {
			return post('sign.api_v1.b2e.document.placeholder.deleteField', {
				fieldId,
				category
			});
		}
	}

	const BulkActionType = Object.freeze({
		approve: 'approve',
		reject: 'reject'
	});
	class MyDocumentsApi {
		getBulkActionProcessOptions({
			actionType,
			memberIds
		}) {
			return {
				controller: 'sign.api_v1.b2e.document.member',
				action: 'processBulk',
				params: {
					data: {
						actionType,
						memberIds: [...memberIds]
					}
				}
			};
		}
	}

	class SafeFolderApi {
		create(title) {
			return post('sign.api_v1.b2e.document.safeFolder.create', {
				title
			});
		}
		rename(folderId, newTitle) {
			return post('sign.api_v1.b2e.document.safeFolder.rename', {
				folderId,
				newTitle
			});
		}

		// `targetFolderId` is `null` to move the folder content to the root ("no folder");
		// the backend requires it when the folder is not empty.
		delete(folderId, targetFolderId = null) {
			return post('sign.api_v1.b2e.document.safeFolder.delete', {
				folderId,
				targetFolderId
			});
		}
		getListByDepthLevel(depthLevel, limit = 50, offset = 0) {
			return post('sign.api_v1.b2e.document.safeFolder.listByDepthLevel', {
				depthLevel,
				limit,
				offset
			});
		}

		// `targetFolderId` is `null` for the root ("no folder").
		moveDocuments(documentIds, targetFolderId) {
			return post('sign.api_v1.b2e.document.safeFolder.moveDocuments', {
				documentIds,
				targetFolderId
			});
		}
		listPeople(folderId, category, limit, afterUserId) {
			return post('sign.api_v1.b2e.document.safeFolder.listPeople', {
				folderId,
				category,
				limit,
				afterUserId
			});
		}
	}

	/**
	 * Transport of the processes of the KEDO section. The catalog of the section answers what may be started,
	 * so the list, the fields of the form and the start itself all speak about the same process.
	 */
	class ProcessApi {
		/**
		 * Processes the employee may start. `limit` narrows the set for the submenu; the grid of the section
		 * asks for the same set without one.
		 */
		getAvailableList(limit = null, searchQuery = null) {
			return post('sign.api_v1.b2e.process.listAvailable', {
				limit,
				searchQuery
			});
		}

		/**
		 * Start fields of the process. An empty `fields` means the step of the parameters is skipped.
		 */
		getStartFields(processId) {
			return post('sign.api_v1.b2e.process.startFields', {
				processId
			});
		}

		/**
		 * The answer comes back before the processes do: the selection turns into a launch group served by a
		 * queue. A field the backend refused carries the name of the field in `customData.parameter`.
		 */
		start(processId, members, parameters = {}, excludeRefused = true) {
			return post('sign.api_v1.b2e.process.start', {
				processId,
				members,
				parameters,
				excludeRefused
			});
		}

		/**
		 * The top level of the list of what is already running - the launch groups. `limit` and `offset` are
		 * named by the caller: the backend types them as plain integers and its own page size is not a value
		 * the client may keep a copy of.
		 */
		getGroups(filter, limit, offset) {
			return post('sign.api_v1.b2e.process.list', {
				filter,
				limit,
				offset
			});
		}

		/**
		 * The composition of one launch group; asked for separately so a launch on thirty employees does not
		 * drag thirty rows into the first answer.
		 */
		getGroupProcesses(launchId, limit, offset) {
			return post('sign.api_v1.b2e.process.list', {
				launchId,
				limit,
				offset
			});
		}

		/**
		 * Rows that did not start in the term of their group go back into the queue. Without `itemId` the whole
		 * group is retried, with it - the named row alone.
		 */
		retry(launchId, itemId = null) {
			return post('sign.api_v1.b2e.process.retry', {
				launchId,
				itemId
			});
		}

		/**
		 * The process a document was created by - the same link as the cell of the documents, read backwards. A
		 * document created by no process is the ordinary case and answers with an empty `process`.
		 */
		getByDocument(documentId) {
			return post('sign.api_v1.b2e.process.getByDocument', {
				documentId
			});
		}
	}

	class Api {
		template = new TemplateApi();
		templateFolder = new TemplateFolderApi();
		signersList = new SignersListApi();
		placeholder = new PlaceholderApi();
		myDocuments = new MyDocumentsApi();
		safeFolder = new SafeFolderApi();
		process = new ProcessApi();
		#post(endpoint, data = null, notifyError = true) {
			return post(endpoint, data, notifyError);
		}
		register(blankId, scenarioType = null, asTemplate = false, chatId = 0, templateFolderId = 0, initiatedByType = null) {
			return this.#post('sign.api_v1.document.register', {
				blankId,
				scenarioType,
				asTemplate,
				chatId,
				templateFolderId,
				initiatedByType
			});
		}
		upload(uid) {
			return this.#post('sign.api_v1.document.upload', {
				uid
			});
		}
		getEditUrl(uid) {
			return this.#post('sign.api_v1.document.getEditUrl', {
				uid
			});
		}
		applyEditedFile(uid, diskFileId) {
			return this.#post('sign.api_v1.document.applyEditedFile', {
				uid,
				diskFileId
			});
		}
		discardEditedFile(uid, diskFileId) {
			return this.#post('sign.api_v1.document.discardEditedFile', {
				uid,
				diskFileId
			});
		}
		getPages(uid) {
			return this.#post('sign.api_v1.document.pages.list', {
				uid
			}, false);
		}
		loadBlanks(page, scenario = null, countPerPage = null) {
			return this.#post('sign.api_v1.document.blank.list', {
				page,
				scenario,
				countPerPage
			});
		}
		createBlank(files, scenario = null, forTemplate = false, hasPlaceholders = false) {
			return this.#post('sign.api_v1.document.blank.create', {
				files,
				scenario,
				forTemplate,
				hasPlaceholders
			});
		}
		saveBlank(documentUid, blocks) {
			return this.#post('sign.api_v1.document.blank.block.save', {
				documentUid,
				blocks
			}, false);
		}
		loadBlocksData(documentUid, blocks) {
			return this.#post('sign.api_v1.document.blank.block.loadData', {
				documentUid,
				blocks
			});
		}
		changeBlank(uid, blankId, copyBlocksFromPreviousBlank = false) {
			return this.#post('sign.api_v1.document.changeBlank', {
				uid,
				blankId,
				copyBlocksFromPreviousBlank
			});
		}
		changeDocumentLanguages(uid, lang) {
			return this.#post('sign.api_v1.document.changeDocumentLanguages', {
				uid,
				lang
			});
		}
		changeRegionDocumentType(uid, type) {
			return this.#post('sign.api_v1.document.modifyRegionDocumentType', {
				uid,
				type
			});
		}
		changeSenderDocumentType(uid, initiatedByType) {
			return this.#post('sign.api_v1.document.modifyInitiatedByType', {
				uid,
				initiatedByType
			});
		}
		changeExternalId(uid, id, sourceType, hcmLinkSettingId) {
			return this.#post('sign.api_v1.document.modifyExternalId', {
				uid,
				id,
				sourceType,
				hcmLinkSettingId
			});
		}
		changeExternalDate(uid, externalDate, sourceType, hcmLinkSettingId) {
			return this.#post('sign.api_v1.document.modifyExternalDate', {
				uid,
				externalDate,
				sourceType,
				hcmLinkSettingId
			});
		}
		changeIntegrationId(uid, integrationId = null) {
			return this.#post('sign.api_v1.document.modifyIntegrationId', {
				uid,
				integrationId
			});
		}
		loadDocument(uid) {
			return this.#post('sign.api_v1.document.load', {
				uid
			});
		}
		loadDocumentsByTemplateIds(templateIds) {
			return this.#post('sign.api_v1.document.loadByTemplateIds', {
				templateIds
			});
		}
		getDocumentPreviewUrl(uid) {
			return this.#post('sign.api_v1.document.getDocumentPreviewUrl', {
				uid
			});
		}
		loadDocumentById(id) {
			return this.#post('sign.api_v1.document.loadById', {
				id
			});
		}
		configureDocument(uid) {
			return this.#post('sign.api_v1.document.configure', {
				uid
			});
		}
		configureDocumentGroup(groupId) {
			return this.#post('sign.api_v1.b2e.document.group.configure', {
				groupId
			});
		}
		loadBlocksByDocument(documentUid) {
			return this.#post('sign.api_v1.document.blank.block.loadByDocument', {
				documentUid
			});
		}
		startSigning(uid) {
			return this.#post('sign.api_v1.document.signing.start', {
				uid
			});
		}
		addMember(documentUid, entityType, entityId, party, presetId) {
			return this.#post('sign.api_v1.document.member.add', {
				documentUid,
				entityType,
				entityId,
				party,
				presetId
			});
		}
		removeMember(uid) {
			return this.#post('sign.api_v1.document.member.remove', {
				uid
			});
		}
		loadMembers(documentUid) {
			return this.#post('sign.api_v1.document.member.load', {
				documentUid
			});
		}
		modifyCommunicationChannel(uid, channelType, channelValue) {
			return this.#post('sign.api_v1.document.member.modifyCommunicationChannel', {
				uid,
				channelType,
				channelValue
			});
		}
		loadCommunications(uid) {
			return this.#post('sign.api_v1.document.member.loadCommunications', {
				uid
			});
		}
		modifyTitle(uid, title) {
			return this.#post('sign.api_v1.document.modifyTitle', {
				uid,
				title
			});
		}
		modifyInitiator(uid, initiator) {
			return this.#post('sign.api_v1.document.modifyInitiator', {
				uid,
				initiator
			});
		}
		modifyInviteMessage(uid, message) {
			const data = {
				uid,
				message
			};
			return this.#post('sign.api_v1.document.modifyInviteMessage', data);
		}
		modifyInviteMessageForDocuments(documentIds, message) {
			const data = {
				documentIds,
				message
			};
			return this.#post('sign.api_v1.b2e.document.group.modifyInviteMessage', data);
		}
		modifyLanguageId(uid, langId) {
			return this.#post('sign.api_v1.document.modifyLangId', {
				uid,
				langId
			});
		}
		modifyDateSignUntil(uid, timestamp) {
			return this.#post('sign.api_v1.document.modifyDateSignUntil', {
				uid,
				dateSignUntilTs: timestamp
			});
		}
		modifyReminderTypeForMemberRole(documentUid, memberRole, reminderType) {
			return this.#post('sign.api_v1.b2e.member.reminder.set', {
				documentUid,
				memberRole,
				type: reminderType
			});
		}
		loadLanguages() {
			return this.#post('sign.api_v1.document.loadLanguage');
		}
		refreshEntityNumber(documentUid) {
			return this.#post('sign.api_v1.document.refreshEntityNumber', {
				documentUid
			});
		}
		changeDomain() {
			return this.#post('sign.api_v1.portal.changeDomain');
		}
		loadRestrictions() {
			return this.#post('sign.api_v1.portal.hasRestrictions');
		}
		saveStamp(memberUid, fileId) {
			return this.#post('sign.api_v1.document.member.saveStamp', {
				memberUid,
				fileId
			});
		}
		setupB2eParties(documentUid, representativeId, members, excludeRejected = true) {
			return this.#post('sign.api_v1.document.member.setupB2eParties', {
				documentUid,
				representativeId,
				members,
				excludeRejected
			});
		}

		/**
		 * Whether the chosen signing method may be used by the chosen representative. Asked on the step of
		 * the wizard where both are chosen, so that a refusal is shown while the person is on the screen;
		 * the action that stores the parties makes the same check on its own.
		 */
		checkRepresentativeSigningMethod(documentUid, representativeId, signingMethod, representativeEntityType) {
			return this.#post('sign.api_v1.document.member.checkRepresentativeSigningMethod', {
				documentUid,
				representativeId,
				signingMethod,
				representativeEntityType
			});
		}
		syncB2eMembersWithDepartments(documentUid, currentParty, excludeRejected = true) {
			return this.#post('sign.api_v1.document.member.syncB2eMembersWithDepartments', {
				documentUid,
				currentParty,
				excludeRejected
			});
		}
		getUniqUserCountForMembers(members, excludeRejected = true) {
			return this.#post('sign.api_v1.document.member.getUniqSignersCount', {
				members,
				excludeRejected
			});
		}
		getUniqUserCountForDocument(documentUid, excludeRejected = true) {
			return this.#post('sign.api_v1.document.member.getUniqSignersCountForDocument', {
				documentUid,
				excludeRejected
			});
		}
		getDepartmentsForDocument(documentUid, page, pageSize) {
			return this.#post('sign.api_v1.document.member.getDepartmentsForDocument', {
				documentUid,
				page,
				pageSize
			});
		}
		getMembersForDocument(documentUid, page, pageSize, role = sign_type.MemberRole.signer) {
			return this.#post('sign.api_v1.document.member.getMembersForDocument', {
				documentUid,
				role,
				page,
				pageSize
			});
		}
		updateChannelTypeToB2eMembers(membersUids, channelType) {
			return this.#post('sign.api_v1.b2e.member.communication.updateMembersChannelType', {
				members: membersUids,
				channelType
			});
		}
		loadB2eCompanyList(forDocumentInitiatedByType = null) {
			return this.#post('sign.api_v1.integration.crm.b2ecompany.list', {
				forDocumentInitiatedByType
			});
		}
		modifyB2eCompany(documentUid, companyUid, companyEntityId) {
			return this.#post('sign.api_v1.document.modifyCompany', {
				documentUid,
				companyUid,
				companyEntityId
			});
		}
		modifyB2eDocumentScheme(uid, scheme) {
			return this.#post('sign.api_v1.document.modifyScheme', {
				uid,
				scheme
			});
		}
		loadB2eAvaialbleSchemes(documentUid) {
			return this.#post('sign.api_v1.b2e.scheme.load', {
				documentUid
			});
		}
		deleteB2eCompany(id) {
			return this.#post('sign.api_v1.integration.crm.b2ecompany.delete', {
				id
			});
		}
		getLinkForSigning(memberId, notifyError = true) {
			return this.#post('sign.api_v1.b2e.member.link.getLinkForSigning', {
				memberId
			}, notifyError);
		}
		memberLoadReadyForMessageStatus(memberIds) {
			return this.#post('sign.api_v1.document.send.getMembersForResend', {
				memberIds
			});
		}
		memberResendMessage(memberIds) {
			return this.#post('sign.api_v1.document.send.resendMessage', {
				memberIds
			});
		}
		getBlankById(id) {
			return this.#post('sign.api_v1.document.blank.getById', {
				id
			});
		}
		getBlankDownloadUrlByDocument(documentId) {
			return `/bitrix/services/main/ajax.php?action=sign.api_v1.document.blank.downloadByDocument&documentId=${documentId}`;
		}
		registerB2eCompany(providerCode, taxId, companyId, externalProviderId) {
			return this.#post('sign.api_v1.integration.crm.b2ecompany.register', {
				providerCode,
				taxId,
				companyId,
				externalProviderId
			});
		}
		setDecisionToSesB2eAgreement() {
			return this.#post('sign.api_v1.b2e.member.communication.setAgreementDecision', {});
		}
		createDocumentChat(chatType, documentId) {
			return this.#post('sign.api_v1.integration.im.groupChat.createDocumentChat', {
				chatType,
				documentId
			});
		}
		createDocumentChatByEntity(chatType, entityId) {
			return this.#post('sign.api_v1.integration.im.groupChat.createDocumentChatByEntity', {
				chatType,
				entityId
			});
		}
		getDocumentFillAndStartProgress(uid) {
			return this.#post('sign.api_v1.document.getFillAndStartProgress', {
				uid
			});
		}
		getDocumentGroupFillAndStartProgress(groupId) {
			return this.#post('sign.api_v1.b2e.document.group.getFillAndStartProgress', {
				groupId
			});
		}
		async getDocumentGroupPlaceholderValidationStatus(groupId) {
			const result = await this.#post('sign.api_v1.b2e.document.group.getPlaceholderValidationStatus', {
				groupId
			}, false);
			if (!main_core.Type.isBoolean(result?.ready)) {
				throw result;
			}
			return result;
		}
		getMember(uid) {
			return this.#post('sign.api_v1.document.member.get', {
				uid
			});
		}
		createDocumentsGroup() {
			return this.#post('sign.api_v1.b2e.document.group.create');
		}

		/**
		 * Creates one document per uploaded file and attaches all of them to the group.
		 * Partial success is a regular answer: check `items[].success`, not the whole call.
		 * `hasPlaceholders` belongs to the whole batch: every blank of the call is created with it.
		 * `initiatedByType` left as null means a document initiated by the company.
		 */
		addDocumentsToGroup(files, groupId = 0, hasPlaceholders = false, initiatedByType = null) {
			return this.#post('sign.api_v1.b2e.document.group.addDocuments', {
				files,
				groupId,
				hasPlaceholders,
				initiatedByType
			});
		}
		removeDocument(uid) {
			return this.#post('sign.api_v1.document.remove', {
				uid
			});
		}
		annulMember(uid, annul) {
			return this.#post('sign.api_v1.document.member.annul', {
				uid,
				annul
			});
		}
		annulMembersBatch(uids, annul) {
			return this.#post('sign.api_v1.document.member.annulBatch', {
				uids,
				annul
			});
		}
		attachGroupToDocument(documentUid, groupId) {
			return this.#post('sign.api_v1.b2e.document.group.attach', {
				documentUid,
				groupId
			});
		}
		getDocumentListInGroup(groupId, notifyError = true) {
			return this.#post('sign.api_v1.b2e.document.group.documentList', {
				groupId
			}, notifyError);
		}
		changeTemplateVisibility(templateId, visibility) {
			return this.#post('sign.api_v1.b2e.document.template.changeVisibility', {
				templateId,
				visibility
			});
		}
		deleteTemplate(templateId) {
			return this.#post('sign.api_v1.b2e.document.template.delete', {
				templateId
			});
		}
		copyTemplate(templateId) {
			return this.#post('sign.api_v1.b2e.document.template.copy', {
				templateId
			});
		}
		checkCompanyHrIntegration(id) {
			return this.#post('sign.api_v1.integration.humanresources.hcmLink.checkCompany', {
				id
			});
		}
		checkNotMappedMembersHrIntegration(documentUid) {
			return this.#post('sign.api_v1.integration.humanresources.hcmLink.loadNotMappedMembers', {
				documentUid
			});
		}
		getMultipleVacancyMemberHrIntegration(documentUid) {
			return this.#post('sign.api_v1.integration.humanresources.hcmLink.loadMultipleVacancyEmployee', {
				documentUid
			});
		}
		saveEmployeesForSignProcess(data) {
			return this.#post('sign.api_v1.integration.humanresources.hcmLink.saveSelectedEmployees', data);
		}
		changeEditorStepVisibility(isSkipEditStep) {
			return this.#post('sign.api_v1.b2e.wizardOptions.changeEditorStepVisibility', {
				isSkipEditStep
			});
		}
		changeHcmLinkDocumentType(uid, hcmLinkSettingId) {
			return this.#post('sign.api_v1.document.modifyHcmLinkDocumentType', {
				uid,
				hcmLinkSettingId
			});
		}
		getManyDocumentFillAndStartProgress(ids) {
			return this.#post('sign.api_v1.document.getManyFillAndStartProgress', {
				ids
			});
		}
		checkNotMappedMembersHrIntegrationByDocuments(documentUids) {
			return this.#post('sign.api_v1.integration.humanresources.hcmLink.loadBulkNotMappedMembers', {
				documentUids
			});
		}
		loadBulkMultipleVacancyMemberHrIntegrations(documentUids) {
			return this.#post('sign.api_v1.integration.humanresources.hcmLink.loadBulkMultipleVacancyEmployee', {
				documentUids
			});
		}
		hasSignedDocuments() {
			return this.#post('sign.api_v1.b2e.onboarding.hasSignedDocuments', {});
		}
		hideOnboardingSigningBanner() {
			return this.#post('sign.api_v1.b2e.onboarding.hideOnboardingSigningBanner', {});
		}
	}

	exports.Api = Api;
	exports.BulkActionType = BulkActionType;

})(this.BX.Sign.V2 = this.BX.Sign.V2 || {}, BX, BX.Sign, BX.UI.Notification, BX.UI.Sidepanel.Content);
//# sourceMappingURL=api.bundle.js.map
