/**
 * @module im/messenger/lib/params
 */

jn.define('im/messenger/lib/params', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');

	/**
	 * @type {ImFeatures}
	 */
	const DefaultImFeatures = {
		chatDepartments: false,
		chatV2: false,
		collabAvailable: false,
		collabCreationAvailable: false,
		copilotActive: false,
		copilotAvailable: false,
		giphyAvailable: false,
		sidebarBriefs: false,
		sidebarFiles: false,
		sidebarLinks: false,
		zoomActive: false,
		zoomAvailable: false,
		intranetInviteAvailable: false,
		messagesAutoDeleteEnabled: false,
		voteCreationAvailable: false,
		aiFileTranscriptionAvailable: false,
		mentionAllAvailable: false,
		isCopilotMentionAvailable: false,
		isCopilotReasoningAvailable: false,
		videoNoteTranscriptionAvailable: false,
		aiAssistantMcpSelectorAvailable: false,
	};

	/**
	 * @class MessengerParams
	 */
	class MessengerParams
	{
		/** @type {ImFeatures} */
		#imFeatures;

		constructor()
		{
			this.setAiAssistantStatusMessages();
		}

		setAiAssistantStatusMessages()
		{
			const configMessages = this.get('MESSAGES', {});
			if ('AI_ASSISTANT' in configMessages)
			{
				Object.entries(configMessages.AI_ASSISTANT).forEach(([code, phase]) => {
					Loc.setMessage(code, phase);
				});
			}
		}

		/**
		 * @param {string} key
		 * @param defaultValue
		 * @returns {*}
		 */
		get(key, defaultValue)
		{
			return BX.componentParameters.get(key, defaultValue);
		}

		/**
		 * @param {string} key
		 * @param {*} value
		 */
		set(key, value)
		{
			BX.componentParameters.set(key, value);
		}

		getSiteDir()
		{
			return this.get('SITE_DIR', '/');
		}

		getUserId()
		{
			return Number(this.get('USER_ID', 0));
		}

		getGeneralChatId()
		{
			return Number(this.get('IM_GENERAL_CHAT_ID', 0));
		}

		/**
		 *
		 * @return {string || ''}
		 */
		getComponentCode()
		{
			return this.get('COMPONENT_CODE', '');
		}

		setGeneralChatId(id)
		{
			this.set('IM_GENERAL_CHAT_ID', id);
		}

		isOpenlinesOperator()
		{
			return this.get('OPENLINES_USER_IS_OPERATOR', false);
		}

		isBetaAvailable()
		{
			return this.get('IS_BETA_AVAILABLE', false);
		}

		isChatLocalStorageAvailable()
		{
			return this.get('IS_CHAT_LOCAL_STORAGE_AVAILABLE', false);
		}

		shouldShowChatV2UpdateHint()
		{
			return this.get('SHOULD_SHOW_CHAT_V2_UPDATE_HINT', false);
		}

		isCloud()
		{
			return this.get('IS_CLOUD', false);
		}

		hasActiveCloudStorageBucket()
		{
			return this.get('HAS_ACTIVE_CLOUD_STORAGE_BUCKET', false);
		}

		/**
		 * @return boolean
		 */
		canUseTelephony()
		{
			return this.get('CAN_USE_TELEPHONY', false);
		}

		/**
		 * @return boolean
		 */
		isAiAssistantMcpSelectorAvailable()
		{
			return this.get('IS_AI_ASSISTANT_MCP_SELECTOR_AVAILABLE', false);
		}

		/**
		 * @return {PlanLimits}
		 */
		getPlanLimits()
		{
			return this.get('PLAN_LIMITS', {});
		}

		/**
		 * @param {PlanLimits} limits
		 * @return void
		 */
		setPlanLimits(limits)
		{
			this.set('PLAN_LIMITS', limits);
		}

		/**
		 * @return {boolean}
		 */
		isFullChatHistoryAvailable()
		{
			const limits = this.getPlanLimits();
			// TODO: MessengerV2 Channel history should always be available.

			if (limits?.fullChatHistory)
			{
				return limits?.fullChatHistory?.isAvailable;
			}

			return true;
		}

		/**
		 * @return ImFeatures
		 */
		getImFeatures()
		{
			if (Type.isPlainObject(this.#imFeatures))
			{
				return this.#imFeatures;
			}

			/** @type {ImFeatures} */
			const imFeatures = this.get('IM_FEATURES', {});
			this.#imFeatures = { ...DefaultImFeatures, ...imFeatures };

			return this.#imFeatures;
		}

		/**
		 * @param {Partial<ImFeatures>} features
		 */
		updateExistingImFeatures(features)
		{
			const actualFeatures = this.getImFeatures();

			Object.entries(features).forEach(([key, value]) => {
				if (!Type.isNil(actualFeatures[key]))
				{
					actualFeatures[key] = value;
				}
			});

			this.set('IM_FEATURES', actualFeatures);
		}

		/**
		 * @return UserInfo
		 */
		getUserInfo()
		{
			return this.get('USER_INFO', {
				id: 0,
				type: 'user',
			});
		}

		/**
		 * @return {MessengerPermissions}
		 */
		getPermissions()
		{
			return this.get('PERMISSIONS', {});
		}

		/**
		 * @return {number}
		 */
		getMultipleActionMessageLimit()
		{
			return this.get('MULTIPLE_ACTION_MESSAGE_LIMIT', 20);
		}

		getCopilotSelectModelEnabled()
		{
			return this.get('IS_COPILOT_SELECT_MODEL_ENABLED', false);
		}

		getCopilotAvailableEngines()
		{
			return this.get('COPILOT_AVAILABLE_ENGINES', []);
		}

		getTasksRecentListAvailable()
		{
			return this.get('IS_TASKS_RECENT_LIST_AVAILABLE', false);
		}

		canUseAudioPanel()
		{
			return Boolean(this.get('CAN_USE_AUDIO_PANEL', false));
		}

		/**
		 * @returns {string}
		 */
		getServiceHealthUrl()
		{
			return this.get('SERVICE_HEALTH_URL', '');
		}

		/**
		 * @returns {string}
		 */
		isAutoTasksEnabled()
		{
			return this.get('IS_AUTO_TASKS_ENABLED', false);
		}

		/**
		 * @returns {string}
		 */
		isAiTaskCreationUIAvailable()
		{
			return this.get('IS_AUTO_TASKS_UI_AVAILABLE', false);
		}
	}

	module.exports = {
		MessengerParams: new MessengerParams(),
	};
});
