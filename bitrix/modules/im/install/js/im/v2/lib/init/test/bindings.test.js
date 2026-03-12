import { ChatType, GetParameter } from 'im.v2.const';
import { Messenger } from 'im.public';

import { BindingsManager } from '../src/classes/bindings';

describe('BindingsManager', () => {
	let bindingsManager = null;
	let messengerStub = null;

	beforeEach(() => {
		bindingsManager = new BindingsManager();
		messengerStub = {
			openNavigationItem: sinon.stub().resolves(),
			openLinesHistory: sinon.stub().resolves(),
			openLines: sinon.stub().resolves(),
			openCopilot: sinon.stub().resolves(),
			openChannel: sinon.stub().resolves(),
			openCollab: sinon.stub().resolves(),
			openTaskComments: sinon.stub().resolves(),
			openChat: sinon.stub().resolves(),
			openChatWithBotContext: sinon.stub().resolves(),
			joinChatByCode: sinon.stub().resolves(),
		};

		Object.keys(messengerStub).forEach((method) => {
			sinon.stub(Messenger, method).callsFake(messengerStub[method]);
		});
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('routeLink', () => {
		it('should open copilot with dialogId', () => {
			const dialogId = 'chat123';
			bindingsManager.routeLink(`?${GetParameter.openCopilotChat}=${dialogId}`);

			assert.strictEqual(messengerStub.openCopilot.calledOnceWith(dialogId), true);
		});
		it('should open channel with dialogId', () => {
			const dialogId = 'chat456';
			bindingsManager.routeLink(`?${GetParameter.openChannel}=${dialogId}`);

			assert.strictEqual(messengerStub.openChannel.calledOnceWith(dialogId), true);
		});
		it('should open lines history with dialogId', () => {
			const dialogId = 'chat789';
			bindingsManager.routeLink(`?${GetParameter.openHistory}=${dialogId}`);

			assert.strictEqual(messengerStub.openLinesHistory.calledOnceWith(dialogId), true);
		});
		it('should open lines with dialogId', () => {
			const dialogId = 'chat101';
			bindingsManager.routeLink(`?${GetParameter.openLines}=${dialogId}`);

			assert.strictEqual(messengerStub.openLines.calledOnceWith(dialogId), true);
		});
		it('should open collab with dialogId', () => {
			const dialogId = 'chat202';
			bindingsManager.routeLink(`?${GetParameter.openCollab}=${dialogId}`);

			assert.strictEqual(messengerStub.openCollab.calledOnceWith(dialogId), true);
		});
		it('should open task comments with dialogId and messageId', () => {
			const dialogId = 'chat303';
			const messageId = 42;
			bindingsManager.routeLink(`?${GetParameter.openTaskComments}=${dialogId}&${GetParameter.openMessage}=${messageId}`);

			assert.strictEqual(messengerStub.openTaskComments.calledOnceWith(dialogId, messageId), true);
		});
		it('should open task comments with dialogId only', () => {
			const dialogId = 'chat404';
			bindingsManager.routeLink(`?${GetParameter.openTaskComments}=${dialogId}`);

			assert.strictEqual(messengerStub.openTaskComments.calledOnceWith(dialogId), true);
		});
		it('should open chat with dialogId and messageId', () => {
			const dialogId = 'chat505';
			const messageId = 99;
			bindingsManager.routeLink(`?${GetParameter.openChat}=${dialogId}&${GetParameter.openMessage}=${messageId}`);

			assert.strictEqual(messengerStub.openChat.calledOnceWith(dialogId, messageId), true);
		});
		it('should open chat with dialogId only', () => {
			const dialogId = 'chat606';
			bindingsManager.routeLink(`?${GetParameter.openChat}=${dialogId}`);

			assert.strictEqual(messengerStub.openChat.calledOnceWith(dialogId), true);
		});
		it('should open chat with bot context', () => {
			const dialogId = 'chat707';
			const botContext = encodeURIComponent(JSON.stringify({ key: 'value' }));
			bindingsManager.routeLink(`?${GetParameter.openChat}=${dialogId}&${GetParameter.botContext}=${botContext}`);

			assert.strictEqual(messengerStub.openChatWithBotContext.calledOnceWith(dialogId, { key: 'value' }), true);
		});
		it('should open shared link with code', () => {
			const code = 'SIsbGv2bL5P35U5J';
			bindingsManager.routeLink(`?${GetParameter.openSharedLink}=${code}`);

			assert.strictEqual(messengerStub.joinChatByCode.calledOnceWith(code), true);
		});
		it('should handle invalid bot context', () => {
			const consoleErrorStub = sinon.stub(console, 'error');
			const dialogId = 'chat808';
			bindingsManager.routeLink(`?${GetParameter.openChat}=${dialogId}&${GetParameter.botContext}=invalid`);

			assert.strictEqual(consoleErrorStub.called, true);
			assert.strictEqual(messengerStub.openChatWithBotContext.calledOnceWith(dialogId, {}), true);
			consoleErrorStub.restore();
		});
		it('should open navigation item for origin root', () => {
			bindingsManager.routeLink(`${location.origin}/online/`);

			assert.strictEqual(messengerStub.openNavigationItem.calledOnceWith({ id: ChatType.chat, asLink: true }), true);
		});
		it('should open navigation item for root', () => {
			bindingsManager.routeLink('/online/');

			assert.strictEqual(messengerStub.openNavigationItem.calledOnceWith({ id: ChatType.chat, asLink: true }), true);
		});
		it('should open navigation item for extranet root', () => {
			bindingsManager.routeLink('/extranet/online/');

			assert.strictEqual(messengerStub.openNavigationItem.calledOnceWith({ id: ChatType.chat, asLink: true }), true);
		});
		it('should open channel layout', () => {
			bindingsManager.routeLink(`/online/?${GetParameter.openChannel}`);

			assert.strictEqual(messengerStub.openNavigationItem.calledOnceWith({ id: ChatType.channel, asLink: true }), true);
		});
		it('should open collab layout', () => {
			bindingsManager.routeLink(`/online/?${GetParameter.openCollab}`);

			assert.strictEqual(messengerStub.openNavigationItem.calledOnceWith({ id: ChatType.collab, asLink: true }), true);
		});
		it('should open copilot layout', () => {
			bindingsManager.routeLink(`/online/?${GetParameter.openCopilotChat}`);

			assert.strictEqual(messengerStub.openNavigationItem.calledOnceWith({ id: ChatType.copilot, asLink: true }), true);
		});
		it('should not call any handler for non-matching url', () => {
			bindingsManager.routeLink('/some/random/path');

			Object.values(messengerStub).forEach((stub) => {
				assert.strictEqual(stub.called, false);
			});
		});
	});
});
