/**
 * @module mail/opener
 */
jn.define('mail/opener', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Loc } = require('loc');
	const { NotifyManager } = require('notify-manager');
	const { PerfPoint } = require('debug/prism');
	const { mergeImmutable } = require('utils/object');
	const { Alert, ButtonType } = require('alert');
	const { requireLazy } = require('require-lazy');
	const { ComponentHelper } = require('helpers/component');
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');
	const { DraftConnector } = require('mail/draft/connector');
	const { getContactsPromise } = require('mail/message/tools/connector');
	const { MailDialog } = require('mail/dialog');
	const { resolveRestoredDraft } = require('mail/compose-context');

	const CACHE_TTL = 60 * 60 * 4; // 4 hours
	const NOT_ACTIVE_ERROR = 'mail_not_active';
	const COMPOSE_COMPONENT_NAME = 'mail:mail.message.send';

	/**
	 * Large attachment fields of the compose preload. The whitelist is what makes them reach the form at
	 * all: a field it does not name is dropped on the way without a word.
	 */
	const LARGE_ATTACHMENT_FLAG_FIELDS = [
		'largeAttachmentEnabled',
		'largeAttachmentTariffAvailable',
		'largeAttachmentShowAha',
		'largeAttachmentShowStorageNotice',
		'largeAttachmentPostSendPromptSuppressed',
	];

	const LARGE_ATTACHMENT_OPTION_NAME_FIELDS = [
		'largeAttachmentAhaOptionName',
		'largeAttachmentStorageNoticeOptionName',
		'largeAttachmentPostSendPromptOptionName',
	];

	/**
	 * @param {Object} data
	 * @return {Object}
	 */
	function pickLargeAttachmentInfo(data)
	{
		const picked = {};

		LARGE_ATTACHMENT_FLAG_FIELDS.forEach((field) => {
			if (typeof data[field] === 'boolean')
			{
				picked[field] = data[field];
			}
		});

		LARGE_ATTACHMENT_OPTION_NAME_FIELDS.forEach((field) => {
			if (typeof data[field] === 'string')
			{
				picked[field] = data[field];
			}
		});

		if (typeof data.largeAttachmentMaxSize === 'number')
		{
			picked.largeAttachmentMaxSize = data.largeAttachmentMaxSize;
		}

		return picked;
	}

	let storage;
	let imMemoryIsActive = null;
	let inMemoryTtl = null;
	let presenterModules = null;
	/**
	 * @class MailOpener
	 */
	class MailOpener
	{
		/**
		 * @public
		 * @param {Object} componentParams
		 * @param {?Object} componentParams.owner
		 * @param {?Number} componentParams.owner.ownerId
		 * @param {?String} componentParams.owner.ownerType
		 * @param {?Number} componentParams.owner.ownerTypeId
		 * @param {Object} widgetParams
		 * @param {Object} widgetParams.titleParams
		 * @param {String} widgetParams.titleParams.text
		 * @param {String} widgetParams.title
		 * @param parentWidget
		 */
		static openSend(
			componentParams,
			widgetParams = {},
			parentWidget = null,
		)
		{
			const perfPoint = new PerfPoint('Mail Compose Preload', 'openSend').start();
			let preloadPointEnded = false;
			const endPreloadPoint = () => {
				if (!preloadPointEnded)
				{
					perfPoint.endPoint('Preload Info');
					preloadPointEnded = true;
				}
			};
			perfPoint.startPoint('Preload Info');
			// the presenter bundle downloads alongside the preload instead of after it
			void this.loadPresenter();
			componentParams = this.applyRestoredDraft(componentParams);
			return this.resolveOwnerTypeId(componentParams)
				.then((paramsWithOwnerTypeId) => {
					componentParams = paramsWithOwnerTypeId;

					return this.collectComposeParams(componentParams, parentWidget);
				})
				.then((params) => {
					if (!params)
					{
						return null;
					}

					const { draftParams, preloadedParams = {} } = params;

					componentParams = mergeImmutable(draftParams, preloadedParams);
					endPreloadPoint();

					widgetParams = {
						...widgetParams,
						titleParams: this.prepareTitleParams(componentParams, widgetParams.titleParams),
					};

					return this.openComposeWidget(componentParams, widgetParams, parentWidget);
				})
				.catch((error) => {
					if (error === NOT_ACTIVE_ERROR)
					{
						MailDialog.show({
							type: MailDialog.CONNECTING_MAIL_TYPE,
							parentWidget,
							successCallback: this.openSend.bind(this, componentParams, widgetParams, parentWidget, true),
						});
					}
					else
					{
						console.error(error);
					}
				})
				.finally(() => {
					endPreloadPoint();
					perfPoint.end();
				})
			;
		}

		/**
		 * The compose screen is a component of its own shown in a modal stack. How that stack is
		 * shown - the modal flag and the close button - belongs to Presentation, so the screen
		 * closes with the same button as every other modal screen of the app and follows the theme
		 * together with them.
		 *
		 * @private
		 * @internal
		 * @param {Object} componentParams
		 * @param {Object} widgetParams
		 * @param {?Object} parentWidget
		 * @return {Promise<void>}
		 */
		static async openComposeWidget(componentParams, widgetParams = {}, parentWidget = null)
		{
			const { WidgetPresenter, Presentation } = await this.loadPresenter();

			if (!WidgetPresenter || !Presentation)
			{
				ComponentHelper.openLayout(
					{
						name: COMPOSE_COMPONENT_NAME,
						componentParams,
						widgetParams: mergeImmutable(this.getLegacyModalWidgetParams(), widgetParams),
					},
					parentWidget,
				);

				return;
			}

			const { titleParams = {}, ...widgetSettings } = widgetParams;

			await WidgetPresenter
				.fromContext({ presentation: Presentation.MODAL, parentWidget })
				.setComponentName(COMPOSE_COMPONENT_NAME, { componentParams })
				.setTitleParams(titleParams)
				.setWidgetSettings(widgetSettings)
				.open()
			;
		}

		/**
		 * Presentation arrived with mobile later than this opener, and modules of a portal are
		 * updated apart from each other, so its absence is a normal state, not an error. The lookup
		 * is made once per session: a failed import is not remembered by the module map, and a
		 * portal without the presenter would otherwise pay for the request on every open.
		 *
		 * @private
		 * @internal
		 * @return {Promise<{WidgetPresenter: ?Function, Presentation: ?Function}>}
		 */
		static loadPresenter()
		{
			presenterModules ??= (async () => {
				// the presenter bundle already carries presentation, so it is asked for second and
				// comes out of the module map instead of the network
				const presenter = await requireLazy('in-app-url/widget-presenter', false);
				const presentation = presenter ? await requireLazy('in-app-url/presentation', false) : undefined;

				return {
					WidgetPresenter: presenter?.WidgetPresenter,
					Presentation: presentation?.Presentation,
				};
			})();

			return presenterModules;
		}

		static applyRestoredDraft(componentParams)
		{
			return mergeImmutable(componentParams, {
				restoredDraft: resolveRestoredDraft(
					componentParams.restoredDraft,
					componentParams.body,
					false,
				),
			});
		}

		/**
		 * Everything the compose form opens with. The contacts of the form depend on the owner alone, so
		 * their request is fired next to the draft probe instead of after it: the form waits for the slower
		 * of the two, and a restore dialog no longer holds the contacts back.
		 *
		 * @private
		 * @internal
		 * @param {Object} componentParams
		 * @param {?Object} parentWidget
		 * @param {Function} waitForPreloadedInfo
		 * @param {Function} probeDraftParams
		 * @return {Promise<?{draftParams: Object, preloadedParams: Object}>}
		 */
		static async collectComposeParams(
			componentParams,
			parentWidget = null,
			waitForPreloadedInfo = this.startPreloadInfo(componentParams),
			probeDraftParams = (params) => this.prepareDraftParams(params, parentWidget),
		)
		{
			const draftParams = await probeDraftParams(componentParams);
			if (!draftParams)
			{
				return null;
			}

			return {
				draftParams: this.applySubjectGenerationAvailability(draftParams),
				preloadedParams: await waitForPreloadedInfo(),
			};
		}

		/**
		 * Starts the contacts request and returns the wait for its result. The loading indicator belongs to
		 * the wait, not to the request: a draft dialog may come up while the contacts are still in flight,
		 * and it must not get an indicator of its own behind it.
		 *
		 * @private
		 * @internal
		 * @param {Object} componentParams
		 * @param {Function} fetchContacts
		 * @return {Function}
		 */
		static startPreloadInfo(componentParams, fetchContacts = getContactsPromise)
		{
			const { showLoadingIndicator = true } = componentParams;
			let isRequested = false;
			let isPending = true;
			const preloaded = this
				.preloadInfo({ ...componentParams, showLoadingIndicator: false }, (...args) => {
					isRequested = true;

					return fetchContacts(...args);
				})
				.then((preloadedInfo) => {
					isPending = false;

					return preloadedInfo;
				})
			;

			return () => {
				if (!isRequested || !isPending || !showLoadingIndicator)
				{
					return preloaded;
				}

				NotifyManager.showLoadingIndicator();

				return preloaded.finally(() => NotifyManager.hideLoadingIndicatorWithoutFallback());
			};
		}

		/**
		 * The CRM draft context is addressed by the numeric entity type, while entry points
		 * from a CRM card know the owner by its type name only.
		 *
		 * @private
		 * @internal
		 * @param {Object} componentParams
		 * @return {Promise<Object>}
		 */
		static async resolveOwnerTypeId(componentParams)
		{
			const { owner } = componentParams;

			if (!owner?.ownerType || owner.ownerTypeId)
			{
				return componentParams;
			}

			const { Type: CrmType } = await requireLazy('crm:type', false) || {};
			const ownerTypeId = CrmType?.resolveIdByName(owner.ownerType);

			if (!ownerTypeId)
			{
				return componentParams;
			}

			return { ...componentParams, owner: { ...owner, ownerTypeId } };
		}

		static async prepareDraftParams(componentParams, parentWidget = null)
		{
			const configConnector = new DraftConnector();
			let configResponse;
			try
			{
				configResponse = await configConnector.getConfig();
			}
			catch (error)
			{
				if (componentParams.draftId)
				{
					return this.retryOpenDraftOnError(componentParams, parentWidget);
				}

				return { ...componentParams, draftAvailable: false };
			}

			if (configResponse?.data?.available !== true)
			{
				return { ...componentParams, draftAvailable: false };
			}

			if (componentParams.draftId)
			{
				return this.prepareExistingDraftParams(componentParams, parentWidget);
			}

			const context = this.getCrmDraftContext(componentParams);
			if (!context)
			{
				return { ...componentParams, draftAvailable: true };
			}

			return this.prepareCrmDraftParams(componentParams, context);
		}

		static async prepareExistingDraftParams(componentParams, parentWidget)
		{
			let response;
			try
			{
				response = await new DraftConnector().get({ draftId: componentParams.draftId });
			}
			catch (error)
			{
				return this.retryOpenDraftOnError(componentParams, parentWidget);
			}

			return {
				...componentParams,
				draftAvailable: true,
				draft: response?.data?.draft ?? null,
			};
		}

		static async retryOpenDraftOnError(componentParams, parentWidget)
		{
			const retry = await this.showLookupRetryDialog();

			return retry
				? this.prepareDraftParams(componentParams, parentWidget)
				: null
			;
		}

		static getCrmDraftContext(componentParams)
		{
			const { owner = {}, isCrmMessage = true } = componentParams;
			if (!isCrmMessage || !owner.ownerId || !owner.ownerTypeId)
			{
				return null;
			}

			return {
				type: 'crm',
				entityTypeId: Number(owner.ownerTypeId),
				entityId: Number(owner.ownerId),
			};
		}

		/**
		 * The user came to write a letter, not for a particular draft: a CRM module without the draft API
		 * simply has no draft to restore, so composition opens without drafts instead of failing.
		 *
		 * @private
		 * @internal
		 */
		static async prepareCrmDraftParams(componentParams, context, connector = new DraftConnector({ context }))
		{
			let response;
			try
			{
				response = await connector.getByContext({ handleErrors: false });
			}
			catch (error)
			{
				return { ...componentParams, draftAvailable: false };
			}

			const draft = response?.data?.draft ?? null;
			if (!draft)
			{
				return { ...componentParams, draftAvailable: true };
			}

			const decision = await this.showRestoreDialog();

			return this.applyCrmDraftDecision(componentParams, draft, decision, connector);
		}

		static async applyCrmDraftDecision(componentParams, draft, decision, connector)
		{
			if (decision === 'continue')
			{
				return { ...componentParams, draftAvailable: true, draft };
			}

			if (decision === 'start-new')
			{
				await connector.deleteCurrent();

				return { ...componentParams, draftAvailable: true };
			}

			return null;
		}

		static showRestoreDialog()
		{
			return new Promise((resolve) => {
				Alert.confirm(
					Loc.getMessage('MAIL_DRAFT_RESTORE_TITLE'),
					Loc.getMessage('MAIL_DRAFT_RESTORE_DESCRIPTION'),
					[
						{
							type: ButtonType.DEFAULT,
							text: Loc.getMessage('MAIL_DRAFT_RESTORE_CONTINUE'),
							onPress: () => resolve('continue'),
						},
						{
							type: ButtonType.DESTRUCTIVE,
							text: Loc.getMessage('MAIL_DRAFT_RESTORE_START_NEW'),
							onPress: () => resolve('start-new'),
						},
						{
							type: ButtonType.CANCEL,
							text: Loc.getMessage('MAIL_DRAFT_RESTORE_CANCEL'),
							onPress: () => resolve('cancel'),
						},
					],
				);
			});
		}

		static showLookupRetryDialog()
		{
			return new Promise((resolve) => {
				Alert.confirm(
					Loc.getMessage('MAIL_DRAFT_LOOKUP_ERROR_TITLE'),
					Loc.getMessage('MAIL_DRAFT_LOOKUP_ERROR_DESCRIPTION'),
					[
						{
							type: ButtonType.DEFAULT,
							text: Loc.getMessage('MAIL_DRAFT_LOOKUP_RETRY'),
							onPress: () => resolve(true),
						},
						{
							type: ButtonType.CANCEL,
							text: Loc.getMessage('MAIL_DRAFT_RESTORE_CANCEL'),
							onPress: () => resolve(false),
						},
					],
				);
			});
		}

		/**
		 * Adds the AI subject generation availability flag to the compose params.
		 * Both regular and CRM composition receive their independent value in the
		 * existing contacts preload. Keep a disabled default for entry points that
		 * intentionally provide preloaded data without an availability decision.
		 * An explicitly provided value is always respected.
		 *
		 * @private
		 * @internal
		 * @param {Object} componentParams
		 * @return {Object}
		 */
		static applySubjectGenerationAvailability(componentParams)
		{
			// Mirror preloadInfo default: absence of the flag means CRM composition.
			const isCrmMessage = componentParams.isCrmMessage ?? true;

			if (isCrmMessage || 'subjectGenerationAvailable' in componentParams)
			{
				return componentParams;
			}

			return mergeImmutable(componentParams, {
				subjectGenerationAvailable: false,
			});
		}

		/**
		 * @public
		 * @param {Object} params
		 * @param {Number|String} params.activityId
		 * @param {String} params.act
		 */
		static openCrmSharedMessage({ activityId, act })
		{
			ComponentHelper.openLayout({
				canOpenInDefault: true,
				name: 'mail:mail.message.view',
				object: 'layout',
				widgetParams: {
					title: '',
				},
				componentParams: {
					isCrmMessage: 1,
					threadId: activityId,
					source: 'crm',
					act,
				},
			});
		}

		/**
		 * @private
		 * @internal
		 *
		 * @return {KeyValueStorage}
		 */
		static getStorage()
		{
			if (!storage)
			{
				storage = Application.storageById(`mail/opener/${env.languageId}`);
			}

			return storage;
		}

		/**
		 * @private
		 * @internal
		 */
		static updateStorage(isActive)
		{
			this.setIsActiveMail(isActive);
			this.setTtlValue(this.getCurrentTimeInSeconds());
		}

		/**
		 * @public
		 * @internal
		 */
		static isActiveMail()
		{
			if (imMemoryIsActive === null)
			{
				imMemoryIsActive = this.getStorage().getBoolean('isActive');
			}

			return imMemoryIsActive;
		}

		/**
		 * @private
		 * @internal
		 */
		static setIsActiveMail(isActive)
		{
			imMemoryIsActive = Boolean(isActive);

			return this.getStorage().setBoolean('isActive', imMemoryIsActive);
		}

		/**
		 * @private
		 * @internal
		 */
		static getTtlValue()
		{
			if (inMemoryTtl === null)
			{
				inMemoryTtl = this.getStorage().getNumber('ttl', 0);
			}

			return inMemoryTtl;
		}

		/**
		 * @private
		 * @internal
		 */
		static setTtlValue(ttl)
		{
			inMemoryTtl = ttl;

			return this.getStorage().setNumber('ttl', ttl);
		}

		/**
		 * @private
		 * @internal
		 */
		static cacheExpired(ttl = CACHE_TTL)
		{
			const cacheTime = this.getTtlValue();
			const currentTime = this.getCurrentTimeInSeconds();

			return currentTime > cacheTime + ttl;
		}

		/**
		 * @private
		 * @internal
		 */
		static getCurrentTimeInSeconds()
		{
			return Math.floor(Date.now() / 1000);
		}

		/**
		 * @public
		 * @param {Object} componentParams
		 * @param {Function} fetchContacts
		 * @return {Promise|*}
		 */
		static preloadInfo(componentParams, fetchContacts = getContactsPromise)
		{
			const {
				owner: {
					ownerId,
					ownerType,
				} = {},
				uploadSenders = true,
				isCrmMessage = true,
				preloadedInfo = null,
				showLoadingIndicator = true,
			} = componentParams;
			if (preloadedInfo)
			{
				return Promise.resolve(preloadedInfo);
			}

			if ((ownerId && ownerType) || !isCrmMessage)
			{
				if (showLoadingIndicator)
				{
					NotifyManager.showLoadingIndicator();
				}

				const contactsPromise = fetchContacts(ownerId, ownerType, true, uploadSenders, isCrmMessage)
					.then(({ data }) => {
						const preloadInfo = {};

						const {
							clients,
							clientIdsByType,
							deviceContactsAvailable,
							mailTemplatesEnabled,
							mailTemplateManagePath,
							mailTemplateSaveAvailable,
							recipientLimits,
							senders,
							signaturesAvailable,
							subjectGenerationAvailable: isSubjectGenerationAvailable,
						} = data;

						Object.assign(preloadInfo, pickLargeAttachmentInfo(data));

						if (Array.isArray(clients))
						{
							preloadInfo.clients = clients;
						}

						if (typeof clientIdsByType === 'object'
							&& clientIdsByType !== null
							&& clientIdsByType !== undefined
							&& 'contacts' in clientIdsByType
							&& 'company' in clientIdsByType
						)
						{
							preloadInfo.clientIdsByType = clientIdsByType;
						}

						if (Array.isArray(senders))
						{
							preloadInfo.senders = senders;
						}

						if (typeof recipientLimits === 'object' && recipientLimits !== null)
						{
							preloadInfo.recipientLimits = recipientLimits;
						}

						if (typeof deviceContactsAvailable === 'boolean')
						{
							preloadInfo.deviceContactsAvailable = deviceContactsAvailable;
						}

						if (typeof mailTemplatesEnabled === 'boolean')
						{
							preloadInfo.mailTemplatesEnabled = mailTemplatesEnabled;
						}

						if (typeof mailTemplateSaveAvailable === 'boolean')
						{
							preloadInfo.mailTemplateSaveAvailable = mailTemplateSaveAvailable;
						}

						if (typeof mailTemplateManagePath === 'string')
						{
							preloadInfo.mailTemplateManagePath = mailTemplateManagePath;
						}

						if (typeof signaturesAvailable === 'boolean')
						{
							preloadInfo.signaturesAvailable = signaturesAvailable;
						}

						if (typeof isSubjectGenerationAvailable === 'boolean')
						{
							preloadInfo.subjectGenerationAvailable = isSubjectGenerationAvailable;
						}

						return preloadInfo;
					})
					.catch((error) => {
						console.error(error);

						return {};
					})
				;

				return contactsPromise
					.finally(() => {
						if (showLoadingIndicator)
						{
							NotifyManager.hideLoadingIndicatorWithoutFallback();
						}
					});
			}

			return Promise.resolve({});
		}

		/**
		 * Modal settings for a mobile without Presentation - the same ones it would have supplied.
		 * Goes away together with the fallback in openComposeWidget().
		 *
		 * @private
		 * @internal
		 */
		static getLegacyModalWidgetParams()
		{
			return {
				modal: true,
				leftButtons: [{
					type: Icon.CHEVRON_DOWN.getIconName(),
					color: Color.base4.toHex(),
					isCloseButton: true,
				}],
			};
		}

		/**
		 * @private
		 * @internal
		 */
		static prepareTitleParams(componentParams, titleParams = {})
		{
			const defaultTitleParams = {
				useLargeTitleMode: false,
				detailTextColor: AppTheme.colors.base4,
				text: Loc.getMessage('MCRM_MAIL_OPENER_TITLE_NEW'),
			};

			return mergeImmutable(defaultTitleParams, titleParams);
		}
	}

	module.exports = { MailOpener };
});
