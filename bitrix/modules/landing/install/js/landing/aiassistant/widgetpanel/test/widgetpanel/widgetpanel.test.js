const originalBXDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'BX');
const originalWindowBXDescriptor = Object.getOwnPropertyDescriptor(globalThis.window, 'BX');

const createNamespace = (root) => {
	return (namespace) => {
		return namespace
			.split('.')
			.filter((part) => part !== 'BX')
			.reduce((context, part) => {
				context[part] = context[part] || {};

				return context[part];
			}, root)
		;
	};
};

const setBX = (bx) => {
	bx.namespace = createNamespace(bx);

	Object.defineProperty(globalThis, 'BX', {
		value: bx,
		writable: true,
		configurable: true,
	});

	Object.defineProperty(globalThis.window, 'BX', {
		value: bx,
		writable: true,
		configurable: true,
	});

	return bx;
};

setBX({});
require('../../widgetpanel');

const WidgetPanel = BX.Landing.AiAssistant.WidgetPanel;

const restoreGlobal = (name, descriptor, target = globalThis) => {
	if (descriptor)
	{
		Object.defineProperty(target, name, descriptor);
	}
	else
	{
		delete target[name];
	}
};

const createBXMock = ({triggerResponse = {data: {dialogId: 'chat123'}}} = {}) => {
	const calls = [];
	const bx = {
		Landing: {
			AiAssistant: {
				WidgetPanel,
			},
		},
		Runtime: {
			loadExtension: (extensionName) => {
				calls.push(['loadExtension', extensionName]);

				if (extensionName !== 'aiassistant.trigger')
				{
					return Promise.resolve({});
				}

				return Promise.resolve({
					Trigger: {
						execute: (options) => {
							calls.push(['executeTrigger', options]);

							return Promise.resolve(triggerResponse);
						},
					},
				});
			},
		},
		Loader: class Loader
		{
			show()
			{}

			hide()
			{}
		},
	};

	setBX(bx);

	return {bx, calls};
};

const setupMessengerMock = (fixture, {currentDialogId = 'chat999'} = {}) => {
	let widgetDialogId = currentDialogId;

	fixture.bx.Messenger = {
		v2: {
			Const: {
				EventType: {
					textarea: {
						insertText: 'textarea.insertText',
					},
				},
			},
				Application: {
					Core: {
						getStore: () => ({
							state: {
								copilot: {
									widgetDialogId,
								},
							},
						}),
					},
				},
			Service: {
				SendingService: {
					getInstance: () => ({
						sendMessage: (message) => {
							fixture.calls.push(['sendMessage', message]);

							return Promise.resolve();
						},
					}),
				},
			},
		},
	};

	fixture.bx.Event = {
		EventEmitter: {
			emit: (eventName, payload) => {
				fixture.calls.push(['emit', eventName, payload]);
			},
		},
	};

	return {
		setCurrentDialogId: (dialogId) => {
			widgetDialogId = dialogId;
		},
	};
};

const setupAjaxMock = (fixture) => {
	fixture.bx.ajax = {
		runAction: (action, options) => {
			fixture.calls.push(['runAction', action, options]);

			return Promise.resolve({});
		},
	};
};

const setupPageContextMock = (fixture) => {
	fixture.bx.UI = {
		PageContext: {
			set: (moduleId, key, value) => {
				fixture.calls.push(['pageContextSet', moduleId, key, value]);
			},
			delete: (moduleId, key) => {
				fixture.calls.push(['pageContextDelete', moduleId, key]);
			},
		},
	};
};

const createRootContainer = () => {
	const rootContainer = document.createElement('div');
	rootContainer.innerHTML = `
		<div class="landing-ai-assistant-panel__chat">
			<div class="landing-ai-assistant-panel__widget"></div>
		</div>
		<button class="landing-ai-assistant-panel__toggle" type="button"></button>
	`;
	document.body.appendChild(rootContainer);

	return rootContainer;
};

const flushPromises = async (count = 20) => {
	for (let index = 0; index < count; index++)
	{
		await Promise.resolve();
	}
};

describe('landing.aiassistant.widgetpanel trigger mode', () => {
	let rootContainer = null;

	afterEach(() => {
		if (rootContainer)
		{
			rootContainer.remove();
			rootContainer = null;
		}

		restoreGlobal('BX', originalBXDescriptor);
		restoreGlobal('BX', originalWindowBXDescriptor, globalThis.window);
	});

	it('Should normalize bindingId to trigger entityId', async () => {
		const fixture = createBXMock();
		const panel = new WidgetPanel({
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
		});

		const dialogId = await panel.resolveDialogId();

		assert.strictEqual(dialogId, 'chat123');
		assert.deepEqual(fixture.calls, [
			['loadExtension', 'aiassistant.trigger'],
			['executeTrigger', {
				triggerCode: 'landing.ai-site.chat',
				entityId: '123',
				context: {},
				openChatAfterExecute: false,
			}],
		]);
	});

	it('Should prefer explicit entityId over bindingId', async () => {
		const fixture = createBXMock();
		const panel = new WidgetPanel({
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
				entityId: '456',
			},
		});

		await panel.resolveDialogId();

		assert.strictEqual(fixture.calls[1][1].entityId, '456');
	});

	it('Should disable trigger mode for empty, zero and negative bindingId', async () => {
		const invalidBindingIds = ['', 0, -1, '-1'];

		for (const bindingId of invalidBindingIds)
		{
			const fixture = createBXMock();
			const panel = new WidgetPanel({
				dialogId: 'chat321',
				triggerOptions: {
					enabled: true,
					triggerCode: 'landing.ai-site.chat',
					bindingId,
				},
			});

			const dialogId = await panel.resolveDialogId();

			assert.strictEqual(dialogId, 'chat321');
			assert.isFalse(panel.isTriggerMode());
			assert.deepEqual(fixture.calls, []);
		}
	});

	it('Should use trigger dialog instead of constructor dialog in trigger mode', async () => {
		const fixture = createBXMock({triggerResponse: {data: {dialogId: 'chat123'}}});
		const panel = new WidgetPanel({
			dialogId: 'chat999',
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
		});

		const dialogId = await panel.resolveDialogId();

		assert.strictEqual(dialogId, 'chat123');
		assert.strictEqual(fixture.calls[1][0], 'executeTrigger');
	});

	it('Should keep legacy dialogId mode without trigger calls', async () => {
		const fixture = createBXMock();
		const panel = new WidgetPanel({
			dialogId: 'chat123',
		});

		const dialogId = await panel.resolveDialogId();

		assert.strictEqual(dialogId, 'chat123');
		assert.isFalse(panel.isTriggerMode());
		assert.deepEqual(fixture.calls, []);
	});

	it('Should resolve trigger before mounting widget on init', async () => {
		const triggerContext = {
			contextData: {
				bindingId: 123,
				surface: 'sites-ai',
			},
		};
		const fixture = createBXMock();
		rootContainer = createRootContainer();
		const errors = [];
		const panel = new WidgetPanel({
			rootContainer,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
				triggerContext,
			},
			onError: (error) => {
				errors.push(error);
			},
		});

		panel.mountWidget = () => {
			fixture.calls.push(['mountWidget', panel.dialogId]);

			return Promise.resolve();
		};

		panel.init();

		assert.deepEqual(fixture.calls, [
			['loadExtension', 'aiassistant.trigger'],
		]);

		await flushPromises();

		assert.deepEqual(fixture.calls, [
			['loadExtension', 'aiassistant.trigger'],
			['executeTrigger', {
				triggerCode: 'landing.ai-site.chat',
				entityId: '123',
				context: triggerContext,
				openChatAfterExecute: false,
			}],
			['mountWidget', 'chat123'],
		]);
		assert.deepEqual(errors, []);
	});

	it('Should normalize trigger chatId response to dialogId', async () => {
		createBXMock({triggerResponse: {data: {chatId: 123}}});
		const panel = new WidgetPanel({
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
		});

		const dialogId = await panel.resolveDialogId();

		assert.strictEqual(dialogId, 'chat123');
	});

	it('Should report controlled error when trigger response does not contain dialog id', async () => {
		const originalConsoleError = console.error;
		const fixture = createBXMock({triggerResponse: {data: {}}});
		rootContainer = createRootContainer();
		const errors = [];
		const panel = new WidgetPanel({
			rootContainer,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
			onError: (error) => {
				errors.push(error);
			},
		});

		panel.mountWidget = () => {
			fixture.calls.push(['mountWidget', panel.dialogId]);

			return Promise.resolve();
		};

		console.error = () => {};

		try
		{
			panel.init();
			await flushPromises();
		}
		finally
		{
			console.error = originalConsoleError;
		}

		assert.deepEqual(fixture.calls, [
			['loadExtension', 'aiassistant.trigger'],
			['executeTrigger', {
				triggerCode: 'landing.ai-site.chat',
				entityId: '123',
				context: {},
				openChatAfterExecute: false,
			}],
		]);
		assert.lengthOf(errors, 1);
		assert.strictEqual(errors[0].code, 'dialog_unavailable');
		assert.strictEqual(errors[0].message, 'Dialog id is not available');
	});

	it('Should apply and send initial prompt only after trigger dialog is resolved and mounted', async () => {
		const fixture = createBXMock();
		setupMessengerMock(fixture, {currentDialogId: 'chat999'});
		rootContainer = createRootContainer();
		const panel = new WidgetPanel({
			rootContainer,
			initialPrompt: 'Create a site',
			autoSendInitialPrompt: true,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
		});

		panel.mountWidget = () => {
			fixture.calls.push(['mountWidget', panel.dialogId]);
			panel.widgetContainer.innerHTML = '<textarea></textarea>';

			return panel.applyInitialPrompt().then((isApplied) => {
				fixture.calls.push(['initialPromptApplied', isApplied]);
			});
		};

		panel.init();
		await flushPromises();

		assert.deepEqual(fixture.calls, [
			['loadExtension', 'aiassistant.trigger'],
			['executeTrigger', {
				triggerCode: 'landing.ai-site.chat',
				entityId: '123',
				context: {},
				openChatAfterExecute: false,
			}],
			['mountWidget', 'chat123'],
			['loadExtension', 'im.v2.const'],
			['loadExtension', 'im.v2.lib.feature'],
			['loadExtension', 'im.v2.provider.service.sending'],
			['emit', 'textarea.insertText', {
				dialogId: 'chat123',
				text: 'Create a site',
				replace: true,
			}],
			['sendMessage', {
				dialogId: 'chat123',
				text: 'Create a site',
			}],
			['emit', 'textarea.insertText', {
				dialogId: 'chat123',
				text: '',
				replace: true,
			}],
			['initialPromptApplied', true],
		]);
	});

	it('Should not send initial prompt when trigger dialog resolving fails', async () => {
		const originalConsoleError = console.error;
		const fixture = createBXMock({triggerResponse: {data: {}}});
		setupMessengerMock(fixture);
		rootContainer = createRootContainer();
		const errors = [];
		const panel = new WidgetPanel({
			rootContainer,
			initialPrompt: 'Create a site',
			autoSendInitialPrompt: true,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
			onError: (error) => {
				errors.push(error);
			},
		});

		panel.mountWidget = () => {
			fixture.calls.push(['mountWidget', panel.dialogId]);

			return Promise.resolve();
		};

		console.error = () => {};

		try
		{
			panel.init();
			await flushPromises();
		}
		finally
		{
			console.error = originalConsoleError;
		}

		assert.deepEqual(fixture.calls, [
			['loadExtension', 'aiassistant.trigger'],
			['executeTrigger', {
				triggerCode: 'landing.ai-site.chat',
				entityId: '123',
				context: {},
				openChatAfterExecute: false,
			}],
		]);
		assert.lengthOf(errors, 1);
	});

	it('Should not send initial prompt twice after it is applied', async () => {
		const fixture = createBXMock();
		setupMessengerMock(fixture);
		const panel = new WidgetPanel({
			initialPrompt: 'Create a site',
			autoSendInitialPrompt: true,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
		});

		panel.dialogId = 'chat123';
		panel.widgetContainer = document.createElement('div');
		panel.widgetContainer.innerHTML = '<textarea></textarea>';

		const firstApplyResult = await panel.applyInitialPrompt();
		const callsAfterFirstApply = fixture.calls.length;
		const secondApplyResult = await panel.applyInitialPrompt();

		assert.isTrue(firstApplyResult);
		assert.isFalse(secondApplyResult);
		assert.strictEqual(fixture.calls.length, callsAfterFirstApply);
		assert.deepEqual(fixture.calls.filter((call) => call[0] === 'sendMessage'), [
			['sendMessage', {
				dialogId: 'chat123',
				text: 'Create a site',
			}],
		]);
	});

	it('Should send initial prompt to trigger-bound dialog instead of current messenger dialog', async () => {
		const fixture = createBXMock();
		setupMessengerMock(fixture, {currentDialogId: 'chat999'});
		const panel = new WidgetPanel({
			initialPrompt: 'Create a site',
			autoSendInitialPrompt: true,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
		});

		panel.dialogId = 'chat123';
		panel.widgetContainer = document.createElement('div');
		panel.widgetContainer.innerHTML = '<textarea></textarea>';

		await panel.applyInitialPrompt();

		assert.deepEqual(fixture.calls.filter((call) => call[0] === 'sendMessage'), [
			['sendMessage', {
				dialogId: 'chat123',
				text: 'Create a site',
			}],
		]);
		assert.notDeepInclude(fixture.calls, ['sendMessage', {
			dialogId: 'chat999',
			text: 'Create a site',
			}]);
	});

	it('Should set trusted PageContext for valid sites-ai trigger mode on init', async () => {
		const fixture = createBXMock();
		setupPageContextMock(fixture);
		rootContainer = createRootContainer();
		const panel = new WidgetPanel({
			rootContainer,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
				triggerContext: {
					contextData: {
						bindingId: '123',
						module: 'landing',
						surface: 'sites-ai',
					},
				},
			},
		});

		panel.mountWidget = () => {
			fixture.calls.push(['mountWidget', panel.dialogId]);

			return Promise.resolve();
		};

		panel.init();
		await flushPromises();

		assert.deepEqual(fixture.calls[0], ['pageContextSet', 'landing', 'ai_site', {
			bindingId: 123,
			entityId: '123',
			triggerCode: 'landing.ai-site.chat',
			module: 'landing',
			surface: 'sites-ai',
			section: '/sites/ai/',
		}]);
	});

	it('Should include editor site and page ids in trusted PageContext', () => {
		const fixture = createBXMock();
		setupPageContextMock(fixture);
		const panel = new WidgetPanel({
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
				triggerContext: {
					contextData: {
						bindingId: 123,
						surface: 'editor',
						siteId: '456',
						pageId: 789,
					},
				},
			},
		});

		panel.syncAiSitePageContext();

		assert.deepEqual(fixture.calls, [
			['pageContextSet', 'landing', 'ai_site', {
				bindingId: 123,
				entityId: '123',
				triggerCode: 'landing.ai-site.chat',
				surface: 'editor',
				siteId: 456,
				pageId: 789,
			}],
		]);
	});

	it('Should clear trusted PageContext when trigger binding is invalid', () => {
		const fixture = createBXMock();
		setupPageContextMock(fixture);
		const panel = new WidgetPanel({
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 0,
			},
		});

		panel.syncAiSitePageContext();

		assert.deepEqual(fixture.calls, [
			['pageContextDelete', 'landing', 'ai_site'],
		]);
	});

	it('Should refresh trusted PageContext before sending initial prompt user message', async () => {
		const fixture = createBXMock();
		setupMessengerMock(fixture);
		setupPageContextMock(fixture);
		const panel = new WidgetPanel({
			initialPrompt: 'Create a site',
			autoSendInitialPrompt: true,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
				triggerContext: {
					contextData: {
						bindingId: 123,
						surface: 'sites-ai',
					},
				},
			},
		});

		panel.dialogId = 'chat123';
		panel.widgetContainer = document.createElement('div');
		panel.widgetContainer.innerHTML = '<textarea></textarea>';

		await panel.applyInitialPrompt();

		assert.deepEqual(fixture.calls.slice(-3), [
			['pageContextSet', 'landing', 'ai_site', {
				bindingId: 123,
				entityId: '123',
				triggerCode: 'landing.ai-site.chat',
				surface: 'sites-ai',
				section: '/sites/ai/',
			}],
			['sendMessage', {
				dialogId: 'chat123',
				text: 'Create a site',
			}],
			['emit', 'textarea.insertText', {
				dialogId: 'chat123',
				text: '',
				replace: true,
			}],
		]);
	});

	it('Should not call landing backend or ajax actions for manual current chat changes', async () => {
		const fixture = createBXMock();
		const messenger = setupMessengerMock(fixture, {currentDialogId: 'chat999'});
		setupAjaxMock(fixture);
		const panel = new WidgetPanel({
			dialogId: 'chat123',
			initialPrompt: 'Create a site',
			autoSendInitialPrompt: true,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
		});

		panel.dialogId = 'chat123';
		panel.widgetContainer = document.createElement('div');
		panel.widgetContainer.innerHTML = '<textarea></textarea>';
		messenger.setCurrentDialogId('chat777');

		await panel.applyInitialPrompt();

		assert.deepEqual(fixture.calls.filter((call) => call[0] === 'runAction'), []);
		assert.deepEqual(fixture.calls.filter((call) => call[0] === 'sendMessage'), [
			['sendMessage', {
				dialogId: 'chat123',
				text: 'Create a site',
			}],
		]);
	});

	it('Should not force manual current chat switch back in current widget session', async () => {
		const fixture = createBXMock();
		const messenger = setupMessengerMock(fixture, {currentDialogId: 'chat999'});
		setupAjaxMock(fixture);
		rootContainer = createRootContainer();
		let mountCount = 0;
		const panel = new WidgetPanel({
			rootContainer,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
		});

		panel.mountWidget = () => {
			mountCount += 1;
			fixture.calls.push(['mountWidget', panel.dialogId]);

			return Promise.resolve();
		};

		panel.init();
		await flushPromises();

		messenger.setCurrentDialogId('chat777');
		panel.setMinimized(true);
		panel.setMinimized(false);
		await flushPromises();

		assert.strictEqual(mountCount, 1);
		assert.deepEqual(fixture.calls.filter((call) => call[0] === 'executeTrigger'), [
			['executeTrigger', {
				triggerCode: 'landing.ai-site.chat',
				entityId: '123',
				context: {},
				openChatAfterExecute: false,
			}],
		]);
		assert.deepEqual(fixture.calls.filter((call) => call[0] === 'runAction'), []);
	});

	it('Should resolve trigger chat again on new widget init after manual current chat switch', async () => {
		const fixture = createBXMock();
		const messenger = setupMessengerMock(fixture, {currentDialogId: 'chat999'});
		rootContainer = createRootContainer();
		const mountedDialogs = [];

		const firstPanel = new WidgetPanel({
			rootContainer,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
		});
		firstPanel.mountWidget = () => {
			mountedDialogs.push(firstPanel.dialogId);

			return Promise.resolve();
		};
		firstPanel.init();
		await flushPromises();

		messenger.setCurrentDialogId('chat777');
		rootContainer.remove();
		rootContainer = createRootContainer();

		const secondPanel = new WidgetPanel({
			rootContainer,
			triggerOptions: {
				enabled: true,
				triggerCode: 'landing.ai-site.chat',
				bindingId: 123,
			},
		});
		secondPanel.mountWidget = () => {
			mountedDialogs.push(secondPanel.dialogId);

			return Promise.resolve();
		};
		secondPanel.init();
		await flushPromises();

		assert.deepEqual(mountedDialogs, ['chat123', 'chat123']);
		assert.lengthOf(fixture.calls.filter((call) => call[0] === 'executeTrigger'), 2);
	});
});
