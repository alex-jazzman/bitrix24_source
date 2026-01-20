/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/model/dialogues/ai-assistant/model
 */
jn.define('im/messenger/model/dialogues/ai-assistant/model', (require, exports, module) => {
	const {
		validateNotifyPanel,
		validateMCP,
	} = require('im/messenger/model/dialogues/ai-assistant/validator');
	const {
		aiAssistantNotifyPanelDefaultElement,
		aiAssistantMCPDefaultElement,
	} = require('im/messenger/model/dialogues/ai-assistant/default-element');

	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('model--dialogues-ai-assistant');

	/** @type {AiAssistantModel} */
	const aiAssistantModel = {
		namespaced: true,
		state: () => ({
			notifyPanel: aiAssistantNotifyPanelDefaultElement,
			mcp: aiAssistantMCPDefaultElement,
		}),
		getters: {
			/**
			 * @function dialoguesModel/aiAssistantModel/isClosedNotifyPanel
			 * @return () => boolean
			 */
			isClosedNotifyPanel: (state) => () => state.notifyPanel.isClosedNotifyPanel,

			/**
			 * @function dialoguesModel/aiAssistantModel/getMCPSelectedAuthId
			 * @return () => AiAssistantMCPModelState['selectedAuthId']
			 */
			getMCPSelectedAuthId: (state) => () => state.mcp.selectedAuthId,
		},
		actions: {
			/**
			 * @function dialoguesModel/aiAssistantModel/setIsClosedNotifyPanel
			 * @param {boolean} payload
			 */
			setIsClosedNotifyPanel: (store, payload) => {
				const data = {
					isClosedNotifyPanel: payload,
				};

				store.commit('updateNotifyPanel', {
					actionName: 'setIsClosedNotifyPanel',
					data: {
						...aiAssistantNotifyPanelDefaultElement,
						...validateNotifyPanel(data),
					},
				});
			},

			/**
			 * @function dialoguesModel/aiAssistantModel/setMCP
			 * @param {AiAssistantMCPModelState} payload
			 */
			setMCP: (store, payload) => {
				const data = { ...payload };

				store.commit('updateMCP', {
					actionName: 'setMCP',
					data: {
						...aiAssistantMCPDefaultElement,
						...validateMCP(data),
					},
				});
			},

			/**
			 * @function dialoguesModel/aiAssistantModel/resetMCP
			 */
			resetMCP: (store) => {
				store.commit('updateMCP', {
					actionName: 'resetMCP',
					data: {
						...aiAssistantMCPDefaultElement,
					},
				});
			},
		},
		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload<AiAssistantMCPUpdateData, AiAssistantModelActions>} payload
			 */
			updateMCP: (state, payload) => {
				logger.log('aiAssistantModel: updateMCP mutation', payload);

				state.mcp = { ...payload.data };
			},

			/**
			 * @param state
			 * @param {MutationPayload<AiAssistantNotifyPanelUpdateData, AiAssistantModelActions>} payload
			 */
			updateNotifyPanel: (state, payload) => {
				logger.log('aiAssistantModel: updateNotifyPanel mutation', payload);

				state.notifyPanel = { ...payload.data };
			},
		},
	};

	module.exports = { aiAssistantModel };
});
