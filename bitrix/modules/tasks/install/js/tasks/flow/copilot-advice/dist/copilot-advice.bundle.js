/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, ai_copilotChat_ui, tasks_flow_editForm, ui_iconSet_api_core) {
	'use strict';

	const getDefaultChatOptions = () => {
		const popupWidth = 420;
		const avatarSrc = '/bitrix/js/tasks/flow/copilot-advice/images/copilot-advice-avatar.png';
		const copilotName = CopilotAdvice.getCopilotName();
		return {
			popupOptions: {
				fixed: true,
				width: popupWidth,
				bindElement: {
					left: window.innerWidth - popupWidth - 85,
					top: 50
				},
				cacheable: false,
				className: 'tasks-flow__copilot-chat-popup',
				animation: {
					showClassName: 'tasks-flow__copilot-chat-popup-show',
					closeClassName: 'tasks-flow__copilot-chat-popup-close',
					closeAnimationType: 'animation'
				}
			},
			loaderText: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_LOADER_TEXT'),
			header: {
				title: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_TITLE_MSGVER_1', {
					'#COPILOT_NAME#': copilotName
				}),
				avatar: avatarSrc,
				useCloseIcon: true
			},
			botOptions: {
				avatar: avatarSrc,
				messageTitle: copilotName,
				messageMenuItems: []
			},
			useInput: false,
			useChatStatus: false,
			scrollToTheEndAfterFirstShow: false,
			showCopilotWarningMessage: true
		};
	};

	class Chat {
		#flowData;
		#copilotChat;
		#ifFirstShow;
		constructor(flowData) {
			this.#flowData = flowData;
			this.#copilotChat = new ai_copilotChat_ui.CopilotChat(this.#getChatOptions());
			this.#ifFirstShow = true;
		}
		show() {
			if (this.#ifFirstShow) {
				this.#copilotChat.showLoader();
				void this.#fetchAdvices();
				this.#ifFirstShow = false;
			}
			this.#copilotChat.show();
			void this.#sendAnalytics();
		}
		async #sendAnalytics() {
			const {
				sendData
			} = await main_core.Runtime.loadExtension('ui.analytics');
			sendData({
				tool: 'tasks',
				category: 'flows',
				event: 'copilot_advice_view',
				c_section: 'tasks',
				c_sub_section: 'flows_grid'
			});
		}
		#getChatOptions() {
			const chatOptions = getDefaultChatOptions();
			chatOptions.botOptions.messageMenuItems = [{
				id: 'create-task',
				text: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_CREATE_TASK'),
				html: this.#getContextMenuItemHtml(main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_CREATE_TASK'), ui_iconSet_api_core.Main.TASKS),
				onclick: (event, menuItem, data) => {
					BX.SidePanel.Instance.open(this.#flowData.createTaskUrl, {
						requestMethod: 'post',
						requestParams: {
							DESCRIPTION: `[QUOTE]${data.message.content}[/QUOTE]`
						},
						cacheable: false
					});
				}
			}, {
				id: 'create-meeting',
				html: this.#getContextMenuItemHtml(main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_CREATE_MEETING'), ui_iconSet_api_core.Main.CALENDAR_1),
				onclick: (event, menuItem, data) => {
					const quotedMessage = `[QUOTE]${data.message.content}[/QUOTE]`;
					const sliderLoader = new BX.Calendar.SliderLoader('NEW', {
						entryDescription: quotedMessage
					});
					sliderLoader.show();
				}
			}];
			if (this.#flowData.canEditFlow) {
				chatOptions.header.menu = {
					items: [{
						id: 'edit-flow',
						text: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_EDIT_FLOW'),
						onclick: (event, menuItem) => {
							menuItem?.menuWindow.close?.();
							tasks_flow_editForm.EditForm.createInstance({
								isFeatureTrialable: this.#flowData.isFeatureTrialable,
								flowId: this.#flowData.flowId,
								context: 'copilot_advice'
							});
						}
					}]
				};
			}
			return chatOptions;
		}
		#getContextMenuItemHtml(text, icon) {
			return main_core.Tag.render`
			<div class="tasks-flow__copilot-chat-context-menu-item">
				<span>${text}</span>
				<span class="ui-icon-set --${icon}"></span>
			</div>
		`;
		}
		async #fetchAdvices() {
			const result = await main_core.ajax.runAction('tasks.flow.Copilot.Advice.get', {
				data: {
					flowId: this.#flowData.flowId
				}
			});
			if (result.status !== 'success') {
				return;
			}
			const advices = result.data?.advices ?? [];
			const createDate = new Date(result.data?.createDateTime ?? new Date());
			this.#copilotChat.addBotMessage(this.#getFirstMessageByEfficiency(this.#flowData.flowEfficiency, createDate));
			advices.forEach(advice => {
				this.#copilotChat.addBotMessage({
					content: advice,
					status: 'delivered',
					dateCreated: createDate.toString(),
					viewed: true
				});
			});
			this.#copilotChat.hideLoader();
		}
		#getFirstMessageByEfficiency(efficiency, dateCreated) {
			const subtitle = efficiency > 80 ? main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_SYSTEM_MESSAGE_SUBTITLE_HIGH', {
				'#EFFICIENCY#': efficiency
			}) : main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_SYSTEM_MESSAGE_SUBTITLE_LOW', {
				'#EFFICIENCY#': efficiency
			});
			const content = efficiency > 80 ? main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_SYSTEM_MESSAGE_HIGH') : main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_SYSTEM_MESSAGE_LOW');
			return {
				content: '',
				status: 'delivered',
				type: ai_copilotChat_ui.CopilotChatMessageType.WELCOME_FLOWS,
				dateCreated: dateCreated.toString(),
				viewed: true,
				params: {
					subtitle,
					content,
					title: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_SYSTEM_MESSAGE_TITLE_MSGVER_1', {
						'#COPILOT_NAME#': CopilotAdvice.getCopilotName()
					})
				}
			};
		}
		hide() {
			this.#copilotChat.hide();
		}
	}

	class ExampleChat {
		#copilotChat;
		constructor() {
			this.#copilotChat = this.#createCopilotChat();
		}
		#createCopilotChat() {
			const chat = new ai_copilotChat_ui.CopilotChat(getDefaultChatOptions());
			const copilotName = CopilotAdvice.getCopilotName();
			chat.addBotMessage({
				content: '',
				status: 'delivered',
				type: ai_copilotChat_ui.CopilotChatMessageType.WELCOME_FLOWS,
				dateCreated: new Date().toString(),
				viewed: true,
				params: {
					title: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_SYSTEM_MESSAGE_TITLE_MSGVER_1', {
						'#COPILOT_NAME#': copilotName
					}),
					subtitle: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_SYSTEM_MESSAGE_SUBTITLE_EXAMPLE'),
					content: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_SYSTEM_MESSAGE_EXAMPLE')
				}
			});
			chat.addBotMessage({
				content: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_MESSAGE_EXAMPLE_1'),
				status: 'delivered',
				dateCreated: new Date().toString(),
				viewed: true
			});
			chat.addBotMessage({
				content: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_MESSAGE_EXAMPLE_2'),
				status: 'delivered',
				dateCreated: new Date().toString(),
				viewed: true
			});
			chat.addBotMessage({
				content: main_core.Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_MESSAGE_EXAMPLE_3'),
				status: 'delivered',
				dateCreated: new Date().toString(),
				viewed: true
			});
			return chat;
		}
		show() {
			this.#copilotChat.show();
			void this.#sendAnalytics();
		}
		async #sendAnalytics() {
			const {
				sendData
			} = await main_core.Runtime.loadExtension('ui.analytics');
			sendData({
				tool: 'tasks',
				category: 'flows',
				event: 'copilot_example_view',
				c_section: 'tasks',
				c_sub_section: 'flows_grid'
			});
		}
		hide() {
			this.#copilotChat.hide();
		}
	}

	class CopilotAdvice {
		static currentChat = null;
		static showExample() {
			if (CopilotAdvice.currentChat) {
				CopilotAdvice.currentChat.hide();
			}
			CopilotAdvice.currentChat = new ExampleChat();
			CopilotAdvice.currentChat.show();
		}
		static show(flowData) {
			if (CopilotAdvice.currentChat) {
				CopilotAdvice.currentChat.hide();
			}
			CopilotAdvice.currentChat = new Chat(flowData);
			CopilotAdvice.currentChat.show();
		}
		static getCopilotName() {
			return main_core.Extension.getSettings('tasks.flow.copilot-advice').copilotName;
		}
	}

	exports.CopilotAdvice = CopilotAdvice;

})(this.BX.Tasks.Flow = this.BX.Tasks.Flow || {}, BX, BX.AI.CopilotChat.UI, BX.Tasks.Flow, BX.UI.IconSet);
//# sourceMappingURL=copilot-advice.bundle.js.map
