/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ai_engine, main_core, main_core_events, main_popup, ui_feedback_form, ui_iconSet_api_core, ui_notification, ai_ajaxErrorHandler) {
	'use strict';

	class CopilotTextControllerEngine {
		#engine;
		#category;
		#context;
		#useResultStack = true;
		#selectedText;
		#userMessage;
		#commandCode;
		#selectedEngineCode;
		#currentGenerateRequestId;
		#resultStack = [];
		static #toolingDataByCategory = {};
		constructor(options) {
			this.#category = options.category;
			this.#useResultStack = options.useResultStack ?? this.#useResultStack;
			this.#initEngine({
				moduleId: options.moduleId,
				category: options.category,
				contextId: options.contextId,
				contextParameters: options.contextParameters
			});
		}
		async init() {
			if (CopilotTextControllerEngine.#toolingDataByCategory[this.#category] === undefined) {
				CopilotTextControllerEngine.#toolingDataByCategory[this.#category] = this.#engine.getTooling('text');
			}
			const res = await CopilotTextControllerEngine.#toolingDataByCategory[this.#category];
			CopilotTextControllerEngine.#toolingDataByCategory[this.#category] = res;
			this.#excludeZeroPromptFromPrompts();
			this.#selectedEngineCode = this.#getSelectedEngineCode(res.data.engines);
		}
		async completions() {
			this.#setEnginePayload();
			const id = Math.round(Math.random() * 10000);
			this.#currentGenerateRequestId = id;
			try {
				const res = await this.#engine.textCompletions();
				const result = res.data.result || res.data.last.data;
				if (this.#currentGenerateRequestId !== id) {
					return null;
				}
				if (this.#useResultStack) {
					this.#addResultToStack(result);
				}
				return result;
			} catch (res) {
				if (this.#currentGenerateRequestId !== id) {
					return null;
				}
				throw getBaseErrorFromResponse(res);
			}
		}
		getPrompts() {
			return this.#getTooling().promptsSystem;
		}
		getPermissions() {
			return this.#getTooling().permissions;
		}
		getEngines() {
			return this.#getTooling().engines;
		}
		setSelectedEngineCode(code) {
			this.#selectedEngineCode = code;
		}
		getSelectedEngineCode() {
			return this.#selectedEngineCode;
		}
		getCategory() {
			return this.#category;
		}
		getContextId() {
			return this.#engine.getContextId();
		}
		setContext(context) {
			this.#context = context;
		}
		setSelectedText(selectedText) {
			this.#selectedText = selectedText;
		}
		getOriginalMessage() {
			return this.#selectedText || this.#context || '';
		}
		setUserMessage(userMessage) {
			this.#userMessage = userMessage;
		}
		getCommandCode() {
			return this.#commandCode;
		}
		setCommandCode(commandCode) {
			this.#commandCode = commandCode;
		}
		cancelCompletion() {
			this.#currentGenerateRequestId = -1;
		}
		isCopilotFirstLaunch() {
			return Boolean(this.#getTooling().first_launch);
		}
		setCopilotBannerLaunchedFlag() {
			this.#engine.setBannerLaunched();
		}
		setAnalyticParameters(parameters) {
			this.#engine.setAnalyticParameters(parameters);
		}
		async getDataForFeedbackForm() {
			try {
				const feedDataResult = await this.#engine.getFeedbackData();
				const messages = feedDataResult.data.context_messages;
				const authorMessage = feedDataResult.data.original_message;
				const payload = this.#engine.getPayload();
				return payload ? {
					context_messages: messages,
					author_message: authorMessage,
					...payload.getRawData(),
					...payload.getMarkers()
				} : {};
			} catch (error) {
				console.error(error);
				const payload = this.#engine.getPayload();
				return payload ? {
					...payload.getRawData(),
					...payload.getMarkers()
				} : {};
			}
		}
		#addResultToStack(result) {
			const stackSize = 3;
			this.#resultStack.unshift(result);
			if (this.#resultStack.length > stackSize) {
				this.#resultStack.pop();
			}
		}
		#getSelectedEngineCode(engines) {
			const selectedEngine = engines.find(engine => engine.selected);
			return selectedEngine?.code || engines[0]?.code;
		}
		#getTooling() {
			return CopilotTextControllerEngine.#toolingDataByCategory[this.#category]?.data;
		}
		#setEnginePayload() {
			const command = this.#commandCode;
			const userMessage = this.#userMessage || undefined;
			const originalMessage = this.getOriginalMessage();
			const payload = new ai_engine.Text({
				prompt: {
					code: command
				},
				engineCode: this.#selectedEngineCode
			});
			payload.setMarkers({
				original_message: this.#isCommandRequiredContextMessage(command) ? originalMessage : undefined,
				user_message: this.#isCommandRequiredUserMessage(command) ? userMessage : undefined,
				current_result: this.#resultStack
			});
			this.#engine.setPayload(payload);
		}
		#isCommandRequiredUserMessage(commandCode) {
			const prompts = this.#getTooling().promptsSystem;
			const searchPrompt = this.#getPromptByCode(prompts, commandCode);
			if (!searchPrompt) {
				return false;
			}
			return searchPrompt.required.user_message;
		}
		#isCommandRequiredContextMessage(commandCode) {
			const prompts = this.#getTooling().promptsSystem;
			const searchPrompt = this.#getPromptByCode(prompts, commandCode);
			if (!searchPrompt) {
				return false;
			}
			return searchPrompt.required.context_message;
		}
		#getPromptByCode(prompts, commandCode) {
			let searchPrompt = null;
			prompts.some(prompt => {
				if (prompt.code === commandCode) {
					searchPrompt = prompt;
					return true;
				}
				return prompt.children?.some(childrenPrompt => {
					if (childrenPrompt.code === commandCode) {
						searchPrompt = childrenPrompt;
						return true;
					}
					return false;
				});
			});
			return searchPrompt;
		}
		#initEngine(initEngineOptions) {
			this.#engine = new ai_engine.Engine();
			this.#engine.setModuleId(initEngineOptions.moduleId).setContextId(initEngineOptions.contextId).setContextParameters(initEngineOptions.contextParameters).setParameters({
				promptCategory: initEngineOptions.category
			});
		}
		#excludeZeroPromptFromPrompts() {
			const zeroPromptIndex = CopilotTextControllerEngine.#toolingDataByCategory[this.#category].data.promptsSystem.findIndex(prompt => {
				return prompt.code === 'zero_prompt';
			});
			if (zeroPromptIndex > -1) {
				CopilotTextControllerEngine.#toolingDataByCategory[this.#category].data.promptsSystem.splice(zeroPromptIndex, 1);
			}
		}
	}
	function getBaseErrorFromResponse(res) {
		if (res instanceof Error) {
			return new main_core.BaseError(res.message, 'undefined', {});
		}
		if (main_core.Type.isString(res)) {
			return new main_core.BaseError(res, 'undefined', {});
		}
		const firstErrorData = res.errors[0];
		if (!firstErrorData) {
			return null;
		}
		const {
			message,
			code,
			customData
		} = firstErrorData;
		return new main_core.BaseError(message, code, customData);
	}

	class BaseCommand {
		constructor(options) {
			this.copilotTextController = options?.copilotTextController;
		}
	}

	class AddBelowCommand extends BaseCommand {
		execute() {
			this.copilotTextController.emit('add_below', {
				result: this.copilotTextController.getAiResultText(),
				code: this.copilotTextController.getLastCommandCode()
			});
		}
	}

	class CancelCommand extends BaseCommand {
		#copilotContainer;
		#inputField;
		constructor(options) {
			super(options);
			this.#copilotContainer = options.copilotContainer;
			this.#inputField = options.inputField;
		}
		execute() {
			this.copilotTextController.destroyAllMenus();
			this.copilotTextController.openGeneralMenu();
			this.copilotTextController.clearResultStack();
			this.#inputField.clearErrors();
			this.#inputField.clear();
			if (this.copilotTextController.isReadonly() === false) {
				this.#inputField.enable();
			}
			this.copilotTextController.clearResultField();
			main_core.Dom.removeClass(this.#copilotContainer, '--error');
			// this.#selectedCommand = null;
			this.copilotTextController.emit('cancel');
			this.#inputField.focus();
			this.copilotTextController.getAnalytics().sendEventCancel();
		}
	}

	class EditResultCommand extends BaseCommand {
		#inputField;
		#copilotContainer;
		constructor(options) {
			super(options);
			this.#inputField = options.inputField;
			this.#copilotContainer = options.copilotContainer;
		}
		execute() {
			this.copilotTextController.destroyAllMenus();
			this.#inputField.enable();
			this.#inputField.clearErrors();
			main_core.Dom.removeClass(this.#copilotContainer, '--error');
			// this.#resultField.clearResult();
			this.copilotTextController.openGeneralMenu();
			this.#inputField.focus();
			this.copilotTextController.getAnalytics().sendEventEditResult();
			// this.#selectedCommand = null;
		}
	}

	class GenerateWithRequiredUserMessageCommand extends BaseCommand {
		#commandCode;
		constructor(options) {
			super(options);
			this.#commandCode = options.commandCode;
		}
		async execute() {
			const data = new FormData();
			data.append('promptCode', this.#commandCode);
			try {
				const res = await main_core.ajax.runAction('ai.prompt.getTextByCode', {
					data
				});
				this.copilotTextController.generateWithRequiredUserMessage(this.#commandCode, res.data.text);
			} catch (e) {
				console.error(e);
			}
		}
	}

	class GenerateWithoutRequiredUserMessage extends BaseCommand {
		#commandCode;
		#prompts = [];
		constructor(options) {
			super(options);
			this.#prompts = options.prompts;
			this.#commandCode = options.commandCode;
		}
		execute() {
			this.copilotTextController.generateWithoutRequiredUserMessage(this.#commandCode, this.#prompts);
		}
	}

	class OpenAboutCopilot extends BaseCommand {
		execute() {
			const articleCode = '19092894';
			const Helper = main_core.Reflection.getClass('top.BX.Helper');
			if (Helper) {
				Helper.show(`redirect=detail&code=${articleCode}`);
			}
		}
	}

	class OpenFeedbackFormCommand extends BaseCommand {
		#category;
		#isBeforeGeneration;
		constructor(options) {
			super(options);
			this.#category = options.category;
			this.#isBeforeGeneration = options.isBeforeGeneration;
		}
		async execute() {
			await this.#openFeedbackForm();
		}
		async #openFeedbackForm() {
			const senderPagePreset = `${this.#category},${this.#isBeforeGeneration ? 'before' : 'after'}`;
			let data = null;
			if (this.#isBeforeGeneration === false) {
				data = await this.copilotTextController.getDataForFeedbackForm();
			}
			const contextMessages = data?.context_messages?.length > 0 ? JSON.stringify(data?.context_messages) : undefined;
			const authorMessage = data?.author_message ?? undefined;
			const formIdNumber = Math.round(Math.random() * 1000);
			main_core.Runtime.loadExtension(['ui.feedback.form']).then(() => {
				BX.UI.Feedback.Form.open({
					id: `ai.copilot.feedback-${formIdNumber}`,
					forms: [{
						zones: ['es'],
						id: 684,
						lang: 'es',
						sec: 'svvq1x'
					}, {
						zones: ['en'],
						id: 686,
						lang: 'en',
						sec: 'tjwodz'
					}, {
						zones: ['de'],
						id: 688,
						lang: 'de',
						sec: 'nrwksg'
					}, {
						zones: ['com.br'],
						id: 690,
						lang: 'com.br',
						sec: 'kpte6m'
					}, {
						zones: ['ru', 'by', 'kz'],
						id: 692,
						lang: 'ru',
						sec: 'jbujn0'
					}],
					presets: {
						sender_page: senderPagePreset,
						prompt_code: data?.prompt?.code,
						user_message: data?.user_message,
						original_message: data?.original_message,
						author_message: authorMessage,
						context_messages: contextMessages,
						last_result0: data?.current_result?.[1],
						language: main_core.Loc.getMessage('LANGUAGE_ID'),
						cp_answer: data?.current_result?.[0]
					}
				});
			}).catch(err => {
				console.err(err);
			});
		}
	}

	class RepeatCommand extends BaseCommand {
		execute() {
			this.copilotTextController.generate();
		}
	}

	class RepeatGenerateCommand extends BaseCommand {
		execute() {
			this.copilotTextController.adjustMenusPosition();
			this.copilotTextController.generate();
		}
	}

	class SaveCommand extends BaseCommand {
		execute() {
			this.copilotTextController.emit('save', new main_core_events.BaseEvent({
				data: {
					result: this.copilotTextController.getAiResultText(),
					code: this.copilotTextController.getLastCommandCode()
				}
			}));
			this.copilotTextController.getAnalytics().sendEventSave();
		}
	}

	class SetEngineCommand extends BaseCommand {
		#engineCode;
		constructor(options) {
			super(options);
			this.#engineCode = options.engineCode;
		}
		execute() {
			this.copilotTextController.setSelectedEngine(this.#engineCode);
		}
	}

	class CloseCommand extends BaseCommand {
		execute() {
			this.copilotTextController.emit('close');
		}
	}

	class OpenImageConfigurator extends BaseCommand {
		execute() {
			this.copilotTextController.emit('show-image-configurator');
		}
	}

	class CopilotErrorMenuItems {
		static getMenuItems(options) {
			const {
				inputField,
				copilotTextController,
				copilotContainer
			} = options;
			return [{
				code: 'repeat',
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_REPEAT'),
				icon: 'left-semicircular-anticlockwise-arrow-1',
				command: new RepeatCommand({
					copilotTextController
				}),
				notHighlight: true
			}, {
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_EDIT'),
				code: 'edit',
				icon: 'pencil-60',
				command: new EditResultCommand({
					inputField,
					copilotTextController,
					copilotContainer
				}),
				notHighlight: true
			}, {
				code: 'cancel',
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_CANCEL'),
				icon: 'cross-45',
				command: new CancelCommand({
					copilotTextController,
					inputField,
					copilotContainer
				}),
				notHighlight: true
			}];
		}
	}

	class CopilotProvidersMenuItems {
		static getMenuItems(options) {
			const {
				engines,
				selectedEngineCode,
				canEditSettings = false,
				copilotTextController
			} = options;
			const connectAiMenuItem = {
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_CONNECT_AI'),
				disabled: true,
				icon: ui_iconSet_api_core.Actions.PLUS_50
			};
			const isLibraryAvailable = main_core.Extension.getSettings('ai.copilot').get('isLibraryVisible');
			let result = [...getMenuItemsFromEngines(engines, selectedEngineCode, copilotTextController)];
			if (isLibraryAvailable) {
				result.push(connectAiMenuItem, {
					separator: true
				}, getMarketMenuItem());
			}
			if (canEditSettings) {
				const settingsPageLink = main_core.Extension.getSettings('ai.copilot.copilot-text-controller').settingsPageLink;
				result = [...result, {
					code: 'ai_settings',
					text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_AI_SETTINGS'),
					icon: ui_iconSet_api_core.Actions.SETTINGS_4,
					href: settingsPageLink
				}];
			}
			return result;
		}
	}
	function getMenuItemsFromEngines(engines, selectedEngineCode, copilotTextController) {
		return engines.map(engine => {
			return {
				code: engine.code,
				text: engine.title,
				icon: ui_iconSet_api_core.Main.ROBOT,
				selected: selectedEngineCode === engine.code,
				command: new SetEngineCommand({
					engines,
					copilotTextController,
					engineCode: engine.code
				})
			};
		});
	}
	function getMarketMenuItem() {
		return {
			code: 'market',
			href: '/market/collection/ai_provider_partner_crm/',
			text: main_core.Loc.getMessage('AI_COPILOT_SEARCH_IN_MARKET_MSGVER_1'),
			icon: ui_iconSet_api_core.Main.MARKET_1,
			arrow: false
		};
	}

	class CopilotMenuItems {
		static getMenuItems(options) {
			throw new Error('You must override method: getMenuItems');
		}
	}

	class CopilotResultMenuItems extends CopilotMenuItems {
		static getMenuItems(options, category) {
			const {
				prompts,
				selectedText,
				copilotContainer = null
			} = options;
			const inputField = options.inputField ?? null;
			const copilotTextController = options.copilotTextController ?? null;
			const saveMenuItemText = selectedText ? 'AI_COPILOT_COMMAND_REPLACE' : 'AI_COPILOT_COMMAND_SAVE';
			const saveMenuItem = {
				text: main_core.Loc.getMessage(saveMenuItemText),
				code: 'save',
				icon: 'check',
				command: new SaveCommand({
					copilotTextController
				}),
				notHighlight: true
			};
			const promptMasterMenuItem = isPromptMasterAvailable(copilotTextController) ? {
				code: 'prompt-master',
				text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_CREATE_PROMPT'),
				icon: ui_iconSet_api_core.Main.BOOKMARK_1,
				notHighlight: true,
				command: async () => {
					await copilotTextController.showPromptMasterPopup();
				}
			} : null;
			const editMenuItem = {
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_EDIT'),
				code: 'edit',
				icon: 'pencil-60',
				command: new EditResultCommand({
					inputField,
					copilotTextController,
					copilotContainer
				}),
				notHighlight: true
			};
			const addBelowMenuItem = selectedText ? {
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_ADD_BELOW'),
				code: 'add_below',
				icon: 'download',
				command: new AddBelowCommand({
					copilotTextController
				}),
				notHighlight: true
			} : null;
			return [promptMasterMenuItem, {
				separator: true
			}, saveMenuItem, addBelowMenuItem, editMenuItem, ...getResultMenuPromptItems(prompts), {
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_REPEAT'),
				code: 'repeat',
				icon: 'left-semicircular-anticlockwise-arrow-1',
				command: new RepeatGenerateCommand({
					copilotTextController
				}),
				notHighlight: true
			}, {
				separator: true
			}, getFeedbackMenuItem(category, copilotTextController), {
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_CANCEL'),
				code: 'cancel',
				icon: 'cross-45',
				notHighlight: true,
				command: new CancelCommand({
					inputField,
					copilotTextController
				})
			}].filter(item => item);
		}
		static getMenuItemsForReadonlyResult(category, copilotTextController, inputField, copilotContainer) {
			return [{
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_COPY'),
				code: 'copy',
				icon: ui_iconSet_api_core.Actions.COPY_PLATES,
				notHighlight: true,
				command: {
					execute() {
						BX.clipboard.copy(copilotTextController.getAiResultText());
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('AI_COPILOT_TEXT_IS_COPIED')
						});
						copilotTextController.getAnalytics().sendEventCopyResult();
					}
				}
			}, {
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_EDIT'),
				code: 'cancel',
				icon: ui_iconSet_api_core.Actions.PENCIL_60,
				command: new CancelCommand({
					inputField,
					copilotTextController,
					copilotContainer
				}),
				notHighlight: true
			}, {
				separator: true
			}, getFeedbackMenuItem(category, copilotTextController), {
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_CLOSE'),
				code: 'close',
				icon: ui_iconSet_api_core.Actions.CROSS_45,
				notHighlight: true,
				command: new CloseCommand({
					copilotTextController
				})
			}];
		}
	}
	function getResultMenuPromptItems(prompts) {
		const workWithResultPrompts = prompts.filter(prompt => {
			return prompt.workWithResult;
		});
		return workWithResultPrompts.map(prompt => {
			return {
				text: prompt.title,
				code: prompt.code,
				icon: prompt.icon
			};
		});
	}
	function getFeedbackMenuItem(category, copilotTextController) {
		return {
			code: 'feedback',
			text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_AI_FEEDBACK'),
			icon: ui_iconSet_api_core.Main.FEEDBACK,
			notHighlight: true,
			command: new OpenFeedbackFormCommand({
				category,
				isBeforeGeneration: false,
				copilotTextController
			})
		};
	}
	function isPromptMasterAvailable(copilotTextController) {
		const isLibraryAvailable = main_core.Extension.getSettings('ai.copilot').get('isLibraryVisible');
		return copilotTextController.getLastCommandCode() === 'zero_prompt' && copilotTextController.isReadonly() === false && copilotTextController.getSelectedPromptCodeWithSimpleTemplate() === null && isLibraryAvailable;
	}

	class CopilotGeneralMenuItems extends CopilotMenuItems {
		static getMenuItems(options) {
			const {
				engines,
				selectedEngineCode,
				canEditSettings = false,
				copilotTextController,
				addImageMenuItem = false,
				userPrompts,
				systemPrompts,
				favouritePrompts
			} = options;
			const favouriteSectionSeparator = favouritePrompts.length > 0 ? CopilotGeneralMenuItems.getFavouritePromptsSeparatorMenuItem() : null;
			const imageMenuItem = addImageMenuItem ? [{
				code: 'image',
				text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_AI_IMAGE'),
				icon: ui_iconSet_api_core.Main.MAGIC_IMAGE,
				command: new OpenImageConfigurator({
					copilotTextController
				}),
				labelText: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_LABEL_NEW')
			}] : [];
			const promptLibraryItem = getPromptLibraryItem(copilotTextController);
			return [...imageMenuItem, favouriteSectionSeparator, ...getGeneralMenuItemsFromPrompts(favouritePrompts, copilotTextController, true), ...(shouldDisplayCustomPromptSection(copilotTextController, userPrompts) ? [{
				code: 'user-prompt-separator',
				separator: true,
				title: main_core.Loc.getMessage('AI_COPILOT_USER_PROMPTS_MENU_SECTION'),
				text: main_core.Loc.getMessage('AI_COPILOT_USER_PROMPTS_MENU_SECTION'),
				isNew: true
			}, ...getGeneralMenuItemsFromPrompts(userPrompts, copilotTextController, false), promptLibraryItem] : []), ...getGeneralMenuItemsFromPrompts(systemPrompts, copilotTextController), ...getSelectedEngineMenuItem(engines, selectedEngineCode, copilotTextController, canEditSettings), {
				code: 'about_open_copilot',
				text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_ABOUT_COPILOT_MSGVER_1', {
					'#COPILOT_NAME#': main_core.Extension.getSettings('ai.copilot').get('copilotName')
				}),
				icon: ui_iconSet_api_core.Main.INFO,
				command: new OpenAboutCopilot()
			}, {
				code: 'feedback',
				text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_AI_FEEDBACK'),
				icon: ui_iconSet_api_core.Main.FEEDBACK,
				command: new OpenFeedbackFormCommand({
					copilotTextController,
					category: copilotTextController.getCategory(),
					isBeforeGeneration: false
				})
			}].filter(item => item);
		}
		static getMenuItem(prompt, prompts, copilotTextController, isFavouriteSection = false) {
			let command = null;
			if (prompt.required) {
				command = prompt.type === 'simpleTemplate' ? new GenerateWithRequiredUserMessageCommand({
					copilotTextController,
					commandCode: prompt.code
				}) : new GenerateWithoutRequiredUserMessage({
					copilotTextController,
					prompts,
					commandCode: copilotTextController.getMenuItemCodeFromPrompt(prompt.code)
				});
			}
			const code = isFavouriteSection ? copilotTextController.getMenuItemCodeFromFavouritePrompt(prompt.code) : prompt.code;
			return {
				id: code,
				command,
				code: prompt.code,
				text: prompt.title,
				children: getGeneralMenuItemsFromPrompts(prompt.children || [], copilotTextController),
				separator: prompt.separator,
				title: prompt.title,
				icon: prompt.icon,
				section: prompt.section,
				isFavourite: copilotTextController.isReadonly() === true ? null : prompt.isFavorite,
				isShowFavouriteIconOnHover: isFavouriteSection && copilotTextController.isReadonly() === false
			};
		}
		static getFavouritePromptsSeparatorMenuItem() {
			return {
				code: 'favourite-prompts-items-separator',
				separator: true,
				title: main_core.Loc.getMessage('AI_COPILOT_FAVOURITE_PROMPTS_MENU_SECTION'),
				text: main_core.Loc.getMessage('AI_COPILOT_FAVOURITE_PROMPTS_MENU_SECTION')
			};
		}
	}
	function getGeneralMenuItemsFromPrompts(prompts, copilotTextController, isFavouriteSection = false) {
		return prompts.map(prompt => {
			return CopilotGeneralMenuItems.getMenuItem(prompt, prompts, copilotTextController, isFavouriteSection);
		}).filter(item => item.code !== 'zero_prompt');
	}
	function getSelectedEngineMenuItem(engines, selectedEngineCode, copilotTextController, canEditSettings = false) {
		return [{
			separator: true,
			title: main_core.Loc.getMessage('AI_COPILOT_PROVIDER_MENU_SECTION'),
			text: main_core.Loc.getMessage('AI_COPILOT_PROVIDER_MENU_SECTION')
		}, {
			id: 'provider',
			code: 'provider',
			text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_OPEN_COPILOT_MSGVER_1', {
				'#COPILOT_NAME#': main_core.Extension.getSettings('ai.copilot').get('copilotName')
			}),
			children: CopilotProvidersMenuItems.getMenuItems({
				engines,
				selectedEngineCode,
				canEditSettings,
				copilotTextController
			}),
			icon: ui_iconSet_api_core.Main.COPILOT_AI
		}];
	}
	function getPromptLibraryItem(copilotTextController) {
		const isLibraryVisible = main_core.Extension.getSettings('ai.copilot').get('isLibraryVisible');
		if (isLibraryVisible) {
			return {
				code: 'promptLib',
				text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_AI_PROMPT_LIB'),
				icon: ui_iconSet_api_core.Main.PROMPTS_LIBRARY,
				highlightText: true,
				command: async () => {
					if (BX.SidePanel) {
						copilotTextController.getAnalytics().setCategoryPromptSaving();
						copilotTextController.getAnalytics().sendEventOpenPromptLibrary();
						BX.SidePanel.Instance.open('/bitrix/components/bitrix/ai.prompt.library.grid/slider.php', {
							cacheable: false,
							events: {
								onCloseStart: () => {
									copilotTextController.getAnalytics().setCategoryText();
									copilotTextController.updateGeneralMenuPrompts();
								}
							}
						});
					} else {
						window.location.href = '/bitrix/components/bitrix/ai.prompt.library.grid/slider.php';
					}
				}
			};
		}
		return null;
	}
	function shouldDisplayCustomPromptSection(copilotTextController, userPrompt) {
		const isLibraryAvailable = main_core.Extension.getSettings('ai.copilot').get('isLibraryVisible');
		return copilotTextController.isReadonly() === false && isLibraryAvailable || userPrompt.length > 0;
	}

	class BaseMenuItem extends main_core_events.EventEmitter {
		id = '';
		constructor(options) {
			super();
			this.setEventNamespace('AI.CopilotMenuItem');
			if (options.id) {
				this.id = options.id;
			}
			this.code = options.code;
			this.text = options.text;
			this.icon = options.icon;
			this.href = options.href;
			this.children = options.children ?? [];
			this.onClick = options.onClick;
			this.disabled = options.disabled;
		}
		getOptions() {
			return {
				id: this.id,
				code: this.code,
				text: this.text,
				icon: this.icon,
				href: this.href,
				command: this.onClick,
				disabled: this.disabled,
				children: this.children.map(childrenMenuItem => {
					if (childrenMenuItem instanceof BaseMenuItem) {
						return childrenMenuItem.getOptions();
					}
					return childrenMenuItem;
				})
			};
		}
	}

	class AboutCopilotMenuItem extends BaseMenuItem {
		constructor(options) {
			super({
				text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_ABOUT_COPILOT_MSGVER_1', {
					'#COPILOT_NAME#': main_core.Extension.getSettings('ai.copilot').get('copilotName')
				}),
				icon: ui_iconSet_api_core.Main.INFO,
				onClick: () => {
					const articleCode = '19092894';
					const Helper = main_core.Reflection.getClass('top.BX.Helper');
					if (Helper) {
						Helper.show(`redirect=detail&code=${articleCode}`);
					}
				},
				...options
			});
		}
	}

	class ChangeRequestMenuItem extends BaseMenuItem {
		constructor(options) {
			super({
				text: main_core.Loc.getMessage('AI_COPILOT_READONLY_COMMAND_EDIT'),
				icon: ui_iconSet_api_core.Main.EDIT_PENCIL,
				...options
			});
		}
	}

	class CopyResultMenuItem extends BaseMenuItem {
		#getText;
		constructor(options) {
			super({
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_COPY'),
				onClick: (event, menuItem, menu) => {
					const isCopyingSuccess = BX.clipboard.copy(this.#getText());
					if (isCopyingSuccess === false) {
						return;
					}
					menu.markMenuItemSelected(menuItem.getId());
					setTimeout(() => {
						menu.unmarkMenuItemSelected(menuItem.getId());
					}, 800);
				},
				...options
			});
			this.#getText = options.getText;
		}
	}

	class FeedbackMenuItem extends BaseMenuItem {
		#isOpenBeforeGeneration;
		#engine;
		constructor(options) {
			super({
				code: 'feedback',
				icon: ui_iconSet_api_core.Main.FEEDBACK,
				text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_AI_FEEDBACK'),
				onClick: async () => {
					return this.#openFeedbackForm();
				},
				...options
			});
			this.#isOpenBeforeGeneration = options.isBeforeGeneration;
			this.#engine = options.engine;
		}
		async #openFeedbackForm() {
			const senderPagePreset = `${this.#engine.getCategory()},${this.#isOpenBeforeGeneration ? 'before' : 'after'}`;
			let data = null;
			if (this.#isOpenBeforeGeneration === false) {
				data = await this.#engine.getDataForFeedbackForm();
			}
			const contextMessages = data?.context_messages?.length > 0 ? data?.context_messages : undefined;
			const authorMessage = data?.author_message ?? undefined;
			try {
				await main_core.Runtime.loadExtension(['ui.feedback.form']);
				BX.UI.Feedback.Form.open({
					id: 'ai.copilot.feedback',
					forms: [{
						zones: ['es'],
						id: 684,
						lang: 'es',
						sec: 'svvq1x'
					}, {
						zones: ['en'],
						id: 686,
						lang: 'en',
						sec: 'tjwodz'
					}, {
						zones: ['de'],
						id: 688,
						lang: 'de',
						sec: 'nrwksg'
					}, {
						zones: ['com.br'],
						id: 690,
						lang: 'com.br',
						sec: 'kpte6m'
					}, {
						zones: ['ru', 'by', 'kz'],
						id: 692,
						lang: 'ru',
						sec: 'jbujn0'
					}],
					presets: {
						sender_page: senderPagePreset,
						prompt_code: data?.prompt?.code,
						user_message: data?.user_message,
						original_message: data?.original_message,
						author_message: authorMessage,
						context_messages: contextMessages,
						last_result0: data?.current_result?.[1],
						language: main_core.Loc.getMessage('LANGUAGE_ID'),
						cp_answer: data?.current_result?.[0]
					}
				});
			} catch (err) {
				console.error(err);
			}
		}
	}

	class MarketMenuItem extends BaseMenuItem {
		constructor(options) {
			super({
				icon: ui_iconSet_api_core.Main.MARKET_1,
				text: main_core.Loc.getMessage('AI_COPILOT_SEARCH_IN_MARKET_MSGVER_1'),
				href: '/market/collection/ai_provider_partner_crm/',
				...options
			});
		}
	}

	class OpenCopilotMenuItem extends BaseMenuItem {
		constructor(options) {
			super({
				id: 'open-copilot',
				code: 'open-copilot',
				icon: ui_iconSet_api_core.Main.COPILOT_AI,
				text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_OPEN_COPILOT_MSGVER_1', {
					'#COPILOT_NAME#': main_core.Extension.getSettings('ai.copilot').get('copilotName')
				}),
				...options
			});
		}
	}

	class ProviderMenuItem extends BaseMenuItem {
		constructor(options) {
			super({
				icon: ui_iconSet_api_core.Main.ROBOT,
				...options
			});
			this.selected = options.selected === true;
		}
		getOptions() {
			return {
				...super.getOptions(),
				selected: this.selected
			};
		}
	}

	class RepeatCopilotMenuItem extends BaseMenuItem {
		constructor(options) {
			super({
				icon: ui_iconSet_api_core.Actions.LEFT_SEMICIRCULAR_ANTICLOCKWISE_ARROW_1,
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_REPEAT'),
				...options
			});
		}
	}

	class SettingsMenuItem extends BaseMenuItem {
		constructor(options) {
			const settingsPageLink = main_core.Extension.getSettings('ai.copilot.copilot-text-controller').settingsPageLink;
			super({
				text: main_core.Loc.getMessage('AI_COPILOT_MENU_ITEM_AI_SETTINGS'),
				icon: ui_iconSet_api_core.Main.SETTINGS,
				href: settingsPageLink,
				...options
			});
		}
	}

	class CancelCopilotMenuItem extends BaseMenuItem {
		constructor(options) {
			super({
				icon: ui_iconSet_api_core.Actions.CROSS_45,
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_CANCEL'),
				...options
			});
		}
	}

	class ConnectModelMenuItem extends BaseMenuItem {
		constructor(options) {
			super({
				icon: ui_iconSet_api_core.Actions.PLUS_50,
				text: main_core.Loc.getMessage('AI_COPILOT_COMMAND_CONNECT_AI'),
				disabled: true,
				...options
			});
		}
	}

	class CopilotTextController extends main_core_events.EventEmitter {
		#engine;
		#inputField;
		#resultField;
		#copilotContainer;
		#category;
		#readonly;
		#selectedEngineCode;
		#selectedPromptCodeWithSimpleTemplate = null;
		#generalMenu;
		#resultMenu;
		#errorMenu;
		#selectedText;
		#context;
		#resultStack = [];
		#currentGenerateRequestId;
		#errorsCount = 0;
		#generationResultText = null;
		#warningField;
		#addImageMenuItem;
		#copilotInputEvents;
		#CopilotMenu;
		#copilotMenuEvents;
		#analytics;
		#currentRole;
		#rolesDialog;
		#showResultInCopilot;
		#menuForceTop = true;
		#responseFormat;
		#inputFieldContainerClickEventHandler;
		#inputFieldSubmitEventHandler;
		#inputFieldInputEventHandler;
		#inputFieldGoOutFromBottomEventHandler;
		#inputFieldStartRecordingEventHandler;
		#inputFieldStopRecordingEventHandler;
		#inputFieldCancelLoadingEventHandler;
		#inputFieldAdjustHeightEventHandler;
		static #toolingDataByCategory = {};
		constructor(options) {
			super();
			this.#engine = options.engine;
			this.#inputField = options.inputField;
			this.#category = options.category;
			this.#resultField = options.resultField;
			this.#readonly = options.readonly === true;
			this.#warningField = options.warningField;
			this.#context = options.context;
			this.#selectedText = options.selectedText;
			this.#addImageMenuItem = options.addImageMenuItem === true;
			this.#copilotInputEvents = options.copilotInputEvents;
			this.#CopilotMenu = options.copilotMenu;
			this.#copilotMenuEvents = options.copilotMenuEvents;
			this.#analytics = options.analytics;
			this.#showResultInCopilot = options.showResultInCopilot;
			this.#menuForceTop = options.menuForceTop ?? true;
			this.#responseFormat = options.responseFormat;
			this.#inputFieldContainerClickEventHandler = this.#handleInputContainerClickEvent.bind(this);
			this.#inputFieldSubmitEventHandler = this.#handleInputFieldSubmitEvent.bind(this);
			this.#inputFieldInputEventHandler = this.#handleInputFieldInputEvent.bind(this);
			this.#inputFieldGoOutFromBottomEventHandler = this.#handleInputFieldGoOutFromBottomEvent.bind(this);
			this.#inputFieldStartRecordingEventHandler = this.#handleInputFieldStartRecordingEvent.bind(this);
			this.#inputFieldStopRecordingEventHandler = this.#handleInputFieldStopRecordingEvent.bind(this);
			this.#inputFieldCancelLoadingEventHandler = this.#handleInputFieldCancelLoadingEvent.bind(this);
			this.#inputFieldAdjustHeightEventHandler = this.#handleInputFieldAdjustHeightEvent.bind(this);
			this.setEventNamespace('AI.Copilot.TextController');
		}
		setSelectedPromptCodeWithSimpleTemplate(code) {
			this.#selectedPromptCodeWithSimpleTemplate = code;
		}
		getSelectedPromptCodeWithSimpleTemplate() {
			return this.#selectedPromptCodeWithSimpleTemplate;
		}
		setCopilotContainer(copilotContainer) {
			this.#copilotContainer = copilotContainer;
		}
		setSelectedText(text) {
			if (main_core.Type.isString(text)) {
				this.#selectedText = text;
			}
		}
		getSelectedText() {
			return this.#selectedText;
		}
		setContext(text) {
			this.#context = text;
		}
		getContext() {
			return this.#context;
		}
		setSelectedEngine(engineCode) {
			this.#setSelectedEngine(engineCode);
		}
		setExtraMarkers(extraMarkers = {}) {
			const payload = this.#engine?.getPayload() || new ai_engine.Text();
			payload.setMarkers({
				...payload.getMarkers(),
				...extraMarkers
			});
			this.#engine.setPayload(payload);
		}
		async init() {
			if (CopilotTextController.#toolingDataByCategory[this.#category] === undefined) {
				CopilotTextController.#toolingDataByCategory[this.#category] = this.#engine.getTooling('text');
			}
			const res = await CopilotTextController.#toolingDataByCategory[this.#category];
			CopilotTextController.#toolingDataByCategory[this.#category] = res;
			this.#selectedEngineCode = this.#getSelectedEngineCode(res.data.engines);
			this.#currentRole = res.data.role;
		}
		openGeneralMenu() {
			if (!this.#generalMenu) {
				this.#initGeneralMenu();
			}
			this.#generalMenu.getPopup().subscribeFromOptions({
				onBeforeShow: () => {
					if (this.#readonly) {
						this.#inputField.disable();
					}
				},
				onAfterShow: () => {
					if (this.#readonly === false) {
						this.#inputField.enable();
						this.#inputField.focus();
					}
				}
			});
			this.#generalMenu.setBindElement(this.#copilotContainer, {
				top: 8
			});
			this.#generalMenu.open();
			this.#generalMenu.show();
		}
		clearResultStack() {
			this.#resultStack = [];
		}
		showMenu() {
			this.#resultMenu?.show();
			this.#errorMenu?.show();
			this.#generalMenu?.show();
		}
		getOpenMenu() {
			if (this.#generalMenu?.isShown()) {
				return this.#generalMenu;
			}
			if (this.#errorMenu?.isShown()) {
				return this.#errorMenu;
			}
			if (this.#resultMenu?.isShown()) {
				return this.#resultMenu;
			}
			return null;
		}
		getAiResultText() {
			return this.#generationResultText;
		}
		getCategory() {
			return this.#category;
		}
		getLastCommandCode() {
			return this.#engine.getPayload().getRawData()?.prompt?.code || '';
		}
		isContainsElem(elem) {
			return this.#generalMenu?.contains(elem) || this.#errorMenu?.contains(elem) || this.#resultMenu?.contains(elem);
		}
		generateWithRequiredUserMessage(commandCode, promptText) {
			if (promptText) {
				this.#inputField.setHtmlContent(promptText);
			}
			this.setSelectedPromptCodeWithSimpleTemplate(commandCode);
			this.#inputField.focus(true);
		}
		generateWithoutRequiredUserMessage(commandCode, prompts) {
			this.#setEnginePayload({
				command: commandCode,
				markers: {
					originalMessage: this.#selectedText || this.#context,
					userMessage: this.#inputField.getValue()
				}
			});
			const commandTextForInputField = this.#getPromptTitleByCommandFromPrompts(prompts, commandCode);
			this.#inputField.setValue(commandTextForInputField);
			this.generate();
		}
		hideAllMenus() {
			this.#rolesDialog?.hide();
			this.#rolesDialog = null;
			this.#generalMenu?.hide();
			this.#errorMenu?.hide();
			this.#resultMenu?.hide();
		}
		destroyAllMenus() {
			this.#rolesDialog?.hide();
			this.#rolesDialog = null;
			this.#generalMenu?.close();
			this.#errorMenu?.close();
			this.#resultMenu?.close();
			this.#generalMenu = null;
			this.#errorMenu = null;
			this.#resultMenu = null;
		}
		start() {
			this.openGeneralMenu();
			this.#subscribeToInputFieldEvents();
		}
		async updateGeneralMenuPrompts() {
			try {
				this.#generalMenu?.setLoader();
				const res = await this.#engine.getTooling('text');
				CopilotTextController.#toolingDataByCategory[this.#category] = res;
				const {
					promptsOther,
					promptsSystem,
					promptsFavorite,
					engines,
					permissions
				} = res.data;
				const items = CopilotGeneralMenuItems.getMenuItems({
					userPrompts: promptsOther,
					systemPrompts: promptsSystem,
					favouritePrompts: promptsFavorite,
					engines,
					selectedEngineCode: this.#selectedEngineCode,
					canEditSettings: permissions.can_edit_settings === true,
					copilotTextController: this,
					addImageMenuItem: this.#addImageMenuItem
				});
				this.#generalMenu?.updateMenuItemsExceptRoleItem(items);
			} catch (e) {
				console.error(e);
				ui_notification.UI.Notification.Center.notify({
					id: 'update-copilot-menu-error',
					content: main_core.Loc.getMessage('AI_COPILOT_UPDATE_MENU_ERROR')
				});
			} finally {
				this.#generalMenu?.removeLoader();
			}
		}
		isFirstLaunch() {
			return this.#getTooling().first_launch;
		}
		finish() {
			this.reset();
			this.destroyAllMenus();
			this.#unsubscribeToInputFieldEvents();
		}
		reset() {
			this.#selectedText = '';
			this.#selectedPromptCodeWithSimpleTemplate = null;
			this.#context = '';
			this.#currentGenerateRequestId = -1;
			this.#resultStack = [];
			this.#inputField?.clear();
		}
		isInitFinished() {
			return Boolean(this.#getTooling());
		}
		isPromptsLoaded() {
			return Boolean(this.#getTooling()?.promptsOther);
		}
		clearResultField() {
			this.#resultField.clearResult();
			this.#adjustMenus();
		}
		isReadonly() {
			return this.#readonly === true;
		}
		#subscribeToInputFieldEvents() {
			this.#inputField.subscribe(this.#copilotInputEvents.containerClick, this.#inputFieldContainerClickEventHandler);
			this.#inputField.subscribe(this.#copilotInputEvents.submit, this.#inputFieldSubmitEventHandler);
			this.#inputField.subscribe(this.#copilotInputEvents.input, this.#inputFieldInputEventHandler);
			this.#inputField.subscribe(this.#copilotInputEvents.goOutFromBottom, this.#inputFieldGoOutFromBottomEventHandler);
			this.#inputField.subscribe(this.#copilotInputEvents.startRecording, this.#inputFieldStartRecordingEventHandler);
			this.#inputField.subscribe(this.#copilotInputEvents.stopRecording, this.#inputFieldStopRecordingEventHandler);
			this.#inputField.subscribe(this.#copilotInputEvents.cancelLoading, this.#inputFieldCancelLoadingEventHandler);
			this.#inputField.subscribe(this.#copilotInputEvents.adjustHeight, this.#inputFieldAdjustHeightEventHandler);
		}
		#unsubscribeToInputFieldEvents() {
			this.#inputField.unsubscribe(this.#copilotInputEvents.containerClick, this.#inputFieldContainerClickEventHandler);
			this.#inputField.unsubscribe(this.#copilotInputEvents.submit, this.#inputFieldSubmitEventHandler);
			this.#inputField.unsubscribe(this.#copilotInputEvents.input, this.#inputFieldInputEventHandler);
			this.#inputField.unsubscribe(this.#copilotInputEvents.goOutFromBottom, this.#inputFieldGoOutFromBottomEventHandler);
			this.#inputField.unsubscribe(this.#copilotInputEvents.startRecording, this.#inputFieldStartRecordingEventHandler);
			this.#inputField.unsubscribe(this.#copilotInputEvents.stopRecording, this.#inputFieldStopRecordingEventHandler);
			this.#inputField.unsubscribe(this.#copilotInputEvents.cancelLoading, this.#inputFieldCancelLoadingEventHandler);
			this.#inputField.unsubscribe(this.#copilotInputEvents.adjustHeight, this.#inputFieldAdjustHeightEventHandler);
		}
		#handleInputContainerClickEvent() {
			if (this.#inputField.isDisabled() && this.#resultMenu?.isShown() && this.#readonly === false) {
				const editCommand = new EditResultCommand({
					copilotTextController: this,
					inputField: this.#inputField
				});
				editCommand.execute();
			}
		}
		#handleInputFieldGoOutFromBottomEvent() {
			this.#generalMenu.enableArrowsKey();
		}
		#handleInputFieldInputEvent(e) {
			const text = e.getData();
			if (!text) {
				this.#selectedPromptCodeWithSimpleTemplate = null;
			}
			this.#generalMenu?.disableArrowsKey();
			requestAnimationFrame(() => {
				this.#adjustMenus();
			});
		}
		#handleInputFieldStartRecordingEvent() {
			this.#generalMenu?.hide();
		}

		// eslint-disable-next-line consistent-return
		async getDataForFeedbackForm() {
			try {
				const feedDataResult = await this.#engine.getFeedbackData();
				const messages = feedDataResult.data.context_messages;
				const authorMessage = feedDataResult.data.original_message;
				const payload = this.#engine.getPayload();
				return payload ? {
					context_messages: messages,
					author_message: authorMessage,
					...payload.getRawData(),
					...payload.getMarkers()
				} : {};
			} catch (error) {
				console.error(error);
				const payload = this.#engine.getPayload();
				return payload ? {
					...payload.getRawData(),
					...payload.getMarkers()
				} : {};
			}
		}
		#handleInputFieldStopRecordingEvent() {
			this.#generalMenu?.show();
		}
		#handleInputFieldCancelLoadingEvent() {
			this.#currentGenerateRequestId = -1;
			this.#inputField.finishGenerating();
			this.#inputField.focus();
			if (this.#readonly) {
				this.#inputField.clear();
			}
			this.openGeneralMenu();
		}
		#handleInputFieldAdjustHeightEvent() {
			setTimeout(() => {
				// this.#adjustMenus();
			}, 150);
		}
		#handleInputFieldSubmitEvent() {
			const userPrompt = this.#inputField.getValue();
			if (!userPrompt) {
				return;
			}
			this.#setEnginePayload({
				command: 'zero_prompt',
				markers: {
					userMessage: userPrompt,
					originalMessage: this.#selectedText || this.#context || '',
					current_result: this.#resultStack
				}
			});
			this.generate();
		}
		#adjustMenus() {
			this.#generalMenu?.adjustPosition();
		}
		#getTooling() {
			return CopilotTextController.#toolingDataByCategory[this.#category]?.data;
		}
		#getSelectedEngineCode(engines) {
			const selectedEngine = engines.find(engine => engine.selected);
			return selectedEngine?.code || engines[0]?.code;
		}
		#initGeneralMenu() {
			const {
				promptsOther: userPrompts,
				promptsSystem: systemPrompts,
				promptsFavorite: favouritePrompts,
				engines,
				permissions
			} = this.#getTooling();
			this.#generalMenu = new this.#CopilotMenu({
				roleInfo: this.#getRoleInfoForMenu({
					withOpenRolesDialogAction: true,
					subtitle: main_core.Loc.getMessage('AI_COPILOT_GENERAL_MENU_ROLE_SUBTITLE')
				}),
				items: CopilotGeneralMenuItems.getMenuItems({
					userPrompts,
					systemPrompts,
					favouritePrompts,
					engines,
					selectedEngineCode: this.#selectedEngineCode,
					canEditSettings: permissions.can_edit_settings === true,
					copilotTextController: this,
					addImageMenuItem: this.#addImageMenuItem
				}),
				keyboardControlOptions: {
					clearHighlightAfterType: this.#readonly === false,
					canGoOutFromTop: this.#readonly === false,
					highlightFirstItemAfterShow: this.#readonly === true
				},
				forceTop: this.#menuForceTop,
				cacheable: false
			});
			this.#generalMenu.subscribe('set-favourite', async e => {
				const isFavourite = e.getData().isFavourite;
				const promptCode = e.getData().promptCode;
				await this.setPromptIsFavourite(promptCode, isFavourite);
			});
			this.#generalMenu.subscribe(this.#copilotMenuEvents.clearHighlight, () => {
				this.#generalMenu?.disableArrowsKey();
				this.#inputField.enableEnterAndArrows();
			});
			this.#generalMenu.subscribe(this.#copilotMenuEvents.highlightMenuItem, () => {
				this.#generalMenu?.enableArrowsKey();
				this.#inputField.disableEnterAndArrows();
			});
		}
		async setPromptIsFavourite(promptCode, isFavourite) {
			try {
				this.#setMenuItemPromptIsFavourite(promptCode, isFavourite);
				const data = new FormData();
				data.append('promptCode', promptCode);
				const action = isFavourite ? 'addInFavoriteList' : 'deleteFromFavoriteList';
				await main_core.ajax.runAction(`ai.prompt.${action}`, {
					data
				});
			} catch (error) {
				const prompts = [...this.#getTooling().promptsOther, ...this.#getTooling().promptsSystem];
				const searchPrompt = this.#getPromptByCode(prompts, promptCode);
				const message = isFavourite ? main_core.Loc.getMessage('AI_COPILOT_ADD_PROMPT_TO_FAVOURITE_ERROR', {
					'#NAME#': searchPrompt.title
				}) : main_core.Loc.getMessage('AI_COPILOT_REMOVE_PROMPT_FROM_FAVOURITE_ERROR', {
					'#NAME#': searchPrompt.title
				});
				ui_notification.UI.Notification.Center.notify({
					id: `set-favourite-error-${searchPrompt.code}`,
					content: message,
					autoHide: true
				});
				this.#setMenuItemPromptIsFavourite(promptCode, !isFavourite);
				console.error(error);
			}
		}
		#setMenuItemPromptIsFavourite(promptCode, isFavourite) {
			if (isFavourite) {
				this.#setMenuItemPromptFavourite(promptCode);
			} else {
				this.#unsetMenuItemPromptFavourite(promptCode);
			}
		}
		#setMenuItemPromptFavourite(promptCode) {
			const prompts = [...this.#getTooling().promptsOther, ...this.#getTooling().promptsSystem];
			const searchPrompt = this.#getPromptByCode(prompts, promptCode);
			if (this.#getTooling().promptsFavorite.length === 0) {
				this.#generalMenu.insertItemAfterRole(CopilotGeneralMenuItems.getFavouritePromptsSeparatorMenuItem());
			}
			this.#getTooling().promptsFavorite.push(searchPrompt);
			searchPrompt.isFavorite = true;
			const copilotMenuItem = CopilotGeneralMenuItems.getMenuItem(searchPrompt, prompts, this, true);
			this.#generalMenu.insertItemAfter(CopilotGeneralMenuItems.getFavouritePromptsSeparatorMenuItem().code, copilotMenuItem);
			this.#generalMenu.setItemIsFavourite(this.getMenuItemCodeFromPrompt(promptCode), true);
		}
		#unsetMenuItemPromptFavourite(promptCode) {
			const prompts = [...this.#getTooling().promptsOther, ...this.#getTooling().promptsSystem];
			const searchPrompt = this.#getPromptByCode(prompts, promptCode);
			searchPrompt.isFavorite = false;
			const searchPromptIndexInFavouriteList = this.#getTooling().promptsFavorite.findIndex(prompt => {
				return prompt.code === searchPrompt.code;
			});
			this.#getTooling().promptsFavorite.splice(searchPromptIndexInFavouriteList, 1);
			if (this.#getTooling().promptsFavorite.length === 0) {
				this.#generalMenu.removeItem(CopilotGeneralMenuItems.getFavouritePromptsSeparatorMenuItem().code);
			}
			this.#generalMenu.removeItem(this.getMenuItemCodeFromFavouritePrompt(promptCode));
			this.#generalMenu.setItemIsFavourite(this.getMenuItemCodeFromPrompt(promptCode), false);
		}
		getMenuItemCodeFromPrompt(promptCode) {
			return promptCode;
		}
		getMenuItemCodeFromFavouritePrompt(promptCode) {
			return `${promptCode}:favourite`;
		}
		async #showRolesDialog() {
			if (this.#rolesDialog) {
				return Promise.resolve();
			}
			await main_core.Runtime.loadExtension('ui.vue3');
			const {
				RolesDialog,
				RolesDialogEvents
			} = await main_core.Runtime.loadExtension('ai.roles-dialog');
			const dialogOptions = {
				moduleId: this.#engine.getModuleId(),
				contextId: this.#engine.getContextId(),
				selectedRoleCode: this.#currentRole?.code,
				title: main_core.Loc.getMessage('AI_COPILOT_ROLES_DIALOG_TITLE')
			};
			this.#rolesDialog = new RolesDialog(dialogOptions);
			this.#rolesDialog.subscribe(RolesDialogEvents.SELECT_ROLE, e => {
				const role = e.getData().role;
				this.#currentRole = role;
				this.#generalMenu?.updateRoleInfo(role);
				if (this.#rolesDialog?.hide) {
					this.#rolesDialog.hide();
				}
			});
			this.#rolesDialog.subscribe(RolesDialogEvents.HIDE, () => {
				this.#rolesDialog = null;
			});
			return this.#rolesDialog.show();
		}
		#getPromptTitleByCommandFromPrompts(prompts, command) {
			let result = '';
			for (const currentPrompt of prompts) {
				if (currentPrompt.code === command) {
					result = currentPrompt.title;
					break;
				}
				const promptChildren = currentPrompt.children;
				if (promptChildren && promptChildren.length > 0) {
					const promptTitle = this.#getPromptTitleByCommandFromPrompts(promptChildren, command);
					if (promptTitle) {
						result = `${currentPrompt.title} - ${promptTitle}`;
						break;
					}
				}
			}
			return result;
		}
		#setEnginePayload(options = {}) {
			const command = options.command || '';
			const markers = options.markers || {};
			const userMessage = markers.userMessage || undefined;
			const originalMessage = markers.originalMessage || undefined;
			const payload = new ai_engine.Text({
				prompt: {
					code: command
				},
				engineCode: this.#selectedEngineCode,
				roleCode: this.#useRole() ? this.#currentRole?.code : undefined
			});
			const oldPayloadMarkers = this.#engine.getPayload()?.getMarkers() ?? {};
			payload.setMarkers({
				...oldPayloadMarkers,
				original_message: this.#isCommandRequiredContextMessage(command) ? originalMessage : undefined,
				user_message: this.#isCommandRequiredUserMessage(command) ? userMessage : undefined,
				current_result: this.#resultStack
			});
			this.#engine.setPayload(payload);
			const analytic = this.getAnalytics();
			this.#engine.setAnalyticParameters({
				category: analytic.getCategory(),
				type: analytic.getType(),
				c_sub_section: analytic.getCSubSection(),
				c_element: analytic.getCElement()
			});
		}
		#isCommandRequiredUserMessage(commandCode) {
			const prompts = [...this.#getTooling().promptsOther, ...this.#getTooling().promptsSystem];
			const searchPrompt = this.#getPromptByCode(prompts, commandCode);
			if (!searchPrompt) {
				return false;
			}
			return searchPrompt.required.user_message || searchPrompt.type === 'simpleTemplate';
		}
		#isCommandRequiredContextMessage(commandCode) {
			const prompts = [...this.#getTooling().promptsOther, ...this.#getTooling().promptsSystem];
			const searchPrompt = this.#getPromptByCode(prompts, commandCode);
			if (!searchPrompt) {
				return false;
			}
			return searchPrompt.required.context_message;
		}
		#getPromptByCode(prompts, commandCode) {
			let searchPrompt = null;
			prompts.some(prompt => {
				if (prompt.code === commandCode) {
					searchPrompt = prompt;
					return true;
				}
				return prompt.children?.some(childrenPrompt => {
					if (childrenPrompt.code === commandCode) {
						searchPrompt = childrenPrompt;
						return true;
					}
					return false;
				});
			});
			return searchPrompt;
		}
		#setSelectedEngine(engineCode) {
			const data = this.#getTooling();
			this.#selectedEngineCode = engineCode;
			this.#generalMenu.replaceMenuItemSubmenu({
				code: 'provider',
				children: CopilotProvidersMenuItems.getMenuItems({
					engines: data.engines,
					selectedEngineCode: engineCode,
					canEditSettings: data.permissions.can_edit_settings,
					copilotTextController: this
				})
			});
		}
		async generate() {
			this.#inputField.startGenerating();
			main_core.Dom.removeClass(this.#copilotContainer, '--error');
			this.destroyAllMenus();
			const id = Math.round(Math.random() * 10000);
			this.#currentGenerateRequestId = id;
			try {
				this.#engine.addParameter('response_format', this.#responseFormat);
				const res = await this.#engine.textCompletions();
				const result = res.data.result || res.data.last.data;
				if (this.#currentGenerateRequestId !== id) {
					return;
				}
				this.#inputField.finishGenerating();
				this.#inputField.disable();
				this.#generationResultText = res.data.result;
				if (this.#showResultInCopilot === true || this.#showResultInCopilot === undefined && this.#selectedText || this.#readonly) {
					this.#resultField?.clearResult();
					if (this.#responseFormat === 'plaintext') {
						this.#resultField?.addResult(this.#generationResultText.replaceAll('\n', '<br/>'));
					} else if (this.#responseFormat === 'default') {
						this.#resultField?.addResult(this.#generationResultText, this.#generationResultText.replaceAll(/(\r\n|\r|\n)/g, '<br>'));
					} else {
						this.#resultField?.addResult(this.#generationResultText);
					}
				} else {
					this.emit('aiResult', {
						result
					});
				}
				this.#addResultToStack(result);
				this.#warningField?.expand();
				this.#openResultMenu();
			} catch (res) {
				if (this.#currentGenerateRequestId !== id) {
					return;
				}
				this.getAnalytics().sendEventError();
				this.#handleGenerateError(res);
			}
		}
		#addResultToStack(result) {
			const stackSize = 3;
			this.#resultStack.unshift(result);
			if (this.#resultStack.length > stackSize) {
				this.#resultStack.pop();
			}
		}

		// eslint-disable-next-line max-lines-per-function
		#handleGenerateError(res) {
			const maxGenerateRestartErrors = 4;
			const firstErrorCode = res?.errors?.[0]?.code;
			if (res instanceof Error) {
				this.#inputField.setErrors([{
					message: res.message,
					code: -1,
					customData: {}
				}]);
			} else if (main_core.Type.isString(res)) {
				this.#inputField.setErrors([{
					message: res,
					code: -1,
					customData: {}
				}]);
			} else if (firstErrorCode === 100 && this.#errorsCount < maxGenerateRestartErrors) {
				this.#errorsCount += 1;
				this.generate();
				return;
			} else {
				switch (firstErrorCode) {
					case 'AI_ENGINE_ERROR_OTHER':
						{
							const command = new OpenFeedbackFormCommand({
								category: this.getCategory(),
								isBeforeGeneration: false,
								copilotTextController: this
							});
							res.errors[0].customData = {
								clickHandler: () => command.execute()
							};
							this.#inputField.setErrors([{
								code: 'AI_ENGINE_ERROR_OTHER',
								message: main_core.Loc.getMessage('AI_COPILOT_ERROR_OTHER'),
								customData: {
									clickHandler: () => command.execute()
								}
							}]);
							break;
						}
					case 'AI_ENGINE_ERROR_PROVIDER':
						{
							this.#inputField.setErrors([{
								code: 'AI_ENGINE_ERROR_PROVIDER',
								message: main_core.Loc.getMessage('AI_COPILOT_ERROR_PROVIDER')
							}]);
							break;
						}
					case 'LIMIT_IS_EXCEEDED_BAAS':
						{
							break;
						}
					default:
						{
							this.#inputField.setErrors(res.errors);
						}
				}
			}
			this.#errorsCount = 0;
			this.#inputField.finishGenerating();
			if (firstErrorCode === 'LIMIT_IS_EXCEEDED_BAAS') {
				this.#inputField.disable();
				setTimeout(() => {
					const baasPopup = main_popup.PopupManager.getPopups().find(popup => popup.getId().includes('baas'));
					if (!baasPopup) {
						return;
					}
					const baasPopupAutoHide = baasPopup.autoHide;
					baasPopup.subscribe('onClose', e => {
						baasPopup.setAutoHide(baasPopupAutoHide);
					});
					baasPopup?.setAutoHide(false);
				}, 200);
			} else if (firstErrorCode === 'LIMIT_IS_EXCEEDED_MONTHLY' || firstErrorCode === 'LIMIT_IS_EXCEEDED_DAILY' || firstErrorCode === 'SERVICE_IS_NOT_AVAILABLE_BY_TARIFF') {
				this.emit('close');
			} else {
				this.#initErrorMenu();
				this.#errorMenu.adjustPosition();
				this.#errorMenu.open();
				main_core.Dom.addClass(this.#copilotContainer, '--error');
			}
			const firstError = res?.errors?.[0];
			ai_ajaxErrorHandler.AjaxErrorHandler.handleTextGenerateError({
				baasOptions: {
					bindElement: this.#inputField.getContainer().querySelector('.ai__copilot_input-field-baas-point'),
					context: this.#engine.getContextId(),
					useAngle: false
				},
				errorCode: firstErrorCode,
				showSliderWithMsg: firstError?.customData?.showSliderWithMsg,
				sliderCode: firstError?.customData?.sliderCode,
				forceCodeRules: ['sliderCode', 'msgWithHtmlLink'],
				forceOption: firstError?.customData,
				bindElement: this.#inputField
			});
		}
		#initErrorMenu() {
			this.#errorMenu = new this.#CopilotMenu({
				bindElement: this.#copilotContainer,
				offsetTop: 8,
				items: CopilotErrorMenuItems.getMenuItems({
					inputField: this.#inputField,
					copilotTextController: this,
					copilotContainer: this.#copilotContainer
				}),
				keyboardControlOptions: {
					canGoOutFromTop: false,
					highlightFirstItemAfterShow: true,
					clearHighlightAfterType: false
				},
				forceTop: this.#menuForceTop
			});
			this.#errorMenu.setBindElement(this.#copilotContainer, {
				top: 8
			});
		}
		adjustMenusPosition() {
			this.#generalMenu?.adjustPosition();
			this.#errorMenu?.adjustPosition();
			this.#resultMenu?.adjustPosition();
		}
		#openResultMenu() {
			if (!this.#resultMenu) {
				this.#initResultMenu();
			}
			this.#resultMenu.setBindElement(this.#copilotContainer, {
				top: 8
			});
			this.#resultMenu.open();
		}
		#initResultMenu() {
			const items = this.#getResultMenuItems();
			this.#resultMenu = new this.#CopilotMenu({
				items,
				roleInfo: this.#getRoleInfoForMenu({
					withOpenRolesDialogAction: false,
					subtitle: main_core.Loc.getMessage('AI_COPILOT_RESULT_MENU_ROLE_SUBTITLE')
				}),
				keyboardControlOptions: {
					clearHighlightAfterType: false,
					canGoOutFromTop: false,
					highlightFirstItemAfterShow: true
				},
				cacheable: false,
				forceTop: this.#menuForceTop
			});
		}
		#getRoleInfoForMenu(params) {
			if (this.#useRole() === false) {
				return undefined;
			}
			const roleInfo = {
				role: this.#currentRole,
				subtitle: params.subtitle
			};
			if (params.withOpenRolesDialogAction) {
				roleInfo.onclick = this.#showRolesDialog.bind(this);
			}
			return roleInfo;
		}
		#useRole() {
			return this.isReadonly() === false;
		}
		#getResultMenuItems() {
			const prompts = this.#getTooling().promptsOther;
			if (this.#readonly) {
				return CopilotResultMenuItems.getMenuItemsForReadonlyResult(this.#category, this, this.#inputField, this.#copilotContainer);
			}
			return CopilotResultMenuItems.getMenuItems({
				prompts,
				selectedText: this.#selectedText,
				copilotTextController: this,
				inputField: this.#inputField,
				copilotContainer: this.#copilotContainer,
				showResultInCopilot: this.#showResultInCopilot
			}, this.#category);
		}

		// eslint-disable-next-line sonarjs/cognitive-complexity
		getAnalytics() {
			if (!this.#selectedText || this.#selectedText === '') {
				this.#analytics.setTypeTextNew();
			} else if (this.#readonly) {
				this.#analytics.setTypeTextEdit();
			} else {
				this.#analytics.setTypeTextReply();
			}
			if (this.#engine && this.#engine.getPayload()) {
				this.#analytics.setP1('prompt', this.getLastCommandCode()).setP2('provider', this.#selectedEngineCode);
			}
			const usedTextInput = this.#inputField.usedTextInput();
			const usedVoiceRecord = this.#inputField.usedVoiceRecord();
			if (usedTextInput && usedVoiceRecord) {
				this.#analytics.setContextTypeFromTextAndAudio();
			} else if (usedTextInput) {
				this.#analytics.setContextTypeFromText();
			} else if (usedVoiceRecord) {
				this.#analytics.setContextTypeFromAudio();
			}
			if (this.getSelectedText()) {
				this.#analytics.setContextElementPopupButton();
			} else {
				this.#analytics.setContextElementSpaceButton();
			}
			if (this.#readonly) {
				if (this.getSelectedText()) {
					this.#analytics.setContextElementReadonlyQuote();
				} else {
					this.#analytics.setContextElementReadonlyCommon();
				}
			}
			return this.#analytics;
		}
		async showPromptMasterPopup() {
			const {
				PromptMasterPopup,
				PromptMasterPopupEvents
			} = await main_core.Runtime.loadExtension('ai.prompt-master');
			const popup = new PromptMasterPopup({
				masterOptions: {
					prompt: this.#inputField.getValue()
				},
				popupEvents: {
					onPopupShow: () => {
						this.emit('prompt-master-show');
						this?.#resultMenu?.disableArrowsKey();
					},
					onPopupDestroy: () => {
						this.emit('prompt-master-destroy');
					}
				},
				analyticFields: {
					c_section: this.#category
				}
			});
			popup.subscribe(PromptMasterPopupEvents.SAVE_SUCCESS, () => {
				this.updateGeneralMenuPrompts();
			});
			popup.show();
		}
	}

	exports.AboutCopilotMenuItem = AboutCopilotMenuItem;
	exports.CancelCopilotMenuItem = CancelCopilotMenuItem;
	exports.ChangeRequestMenuItem = ChangeRequestMenuItem;
	exports.ConnectModelMenuItem = ConnectModelMenuItem;
	exports.CopilotTextController = CopilotTextController;
	exports.CopilotTextControllerEngine = CopilotTextControllerEngine;
	exports.CopyResultMenuItem = CopyResultMenuItem;
	exports.FeedbackMenuItem = FeedbackMenuItem;
	exports.MarketMenuItem = MarketMenuItem;
	exports.OpenCopilotMenuItem = OpenCopilotMenuItem;
	exports.ProviderMenuItem = ProviderMenuItem;
	exports.RepeatCopilotMenuItem = RepeatCopilotMenuItem;
	exports.SettingsMenuItem = SettingsMenuItem;

})(this.BX.AI = this.BX.AI || {}, BX.AI, BX, BX.Event, BX.Main, BX.UI.Feedback, BX.UI.IconSet, BX.UI.Notification, BX.AI);
//# sourceMappingURL=copilot-text-controller.bundle.js.map
