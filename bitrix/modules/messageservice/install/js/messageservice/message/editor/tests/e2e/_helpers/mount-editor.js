const CONTAINER_SELECTOR = '#sandbox';

/**
 * Mount a minimal Editor in sandbox. Saves the instance to window.__editor
 * so tests can inspect state via sandbox.page.evaluate().
 *
 * @param {import('ui.test.e2e.sandbox').Sandbox} sandbox
 * @param {{ initialText?: string }} options
 */
export async function mountEditor(sandbox, { initialText = '' } = {})
{
	// Pre-navigate so sandbox.loadExtension can resolve a relative URL.
	// The on-disk sandbox uses `page.url() || 'http://localhost'` as the base;
	// for a fresh `about:blank` page `new URL('/path', 'about:blank')` throws.
	if (!/^https?:/.test(sandbox.page.url()))
	{
		await sandbox.page.goto('/');
	}

	await sandbox.loadExtension('messageservice.message.editor');

	// sandbox.mount() only forwards the selector as the single arg to page.evaluate.
	// We need to pass initialText too, so call page.evaluate directly.
	await sandbox.page.evaluate(({ selector, args }) => {
		const { Editor } = BX.MessageService.Message.Editor;

		const editor = new Editor({
			renderTo: selector,
			scene: { id: 'sandbox' },
			channels: [
				{
					id: 'sms',
					backend: { senderCode: 'sms', id: 'sandbox-sms' },
					type: 'sms',
					appearance: {
						icon: { title: 'SMS', color: '#000', background: '#fff' },
						title: 'SMS',
						subtitle: null,
					},
					fromList: [{ id: 'from-1', name: 'From 1', isDefault: true, isAvailable: true }],
					isConnected: true,
					connectionUrl: '',
					isPromo: false,
					isTemplatesBased: false,
				},
			],
			toList: [],
			contentProviders: {},
			notificationTemplates: [],
			layout: {
				isHeaderShown: false,
				isFooterShown: false,
				isSendButtonShown: false,
				isCancelButtonShown: false,
				isMessagePreviewShown: false,
				isContentProvidersShown: false,
				isEmojiButtonShown: false,
				isMessageLengthCounterShown: false,
				isToSelectorShown: false,
				isChannelSelectorShown: false,
				isMessageTextReadOnly: false,
				padding: '0',
				paddingTop: null,
				paddingBottom: null,
				paddingLeft: null,
				paddingRight: null,
			},
			preferences: {
				channelsSort: [],
				channelsLastUsedFrom: [],
			},
			analytics: {
				tool: 'sandbox',
				c_section: null,
				c_sub_section: null,
				p1: null,
			},
			message: {
				text: args.initialText,
			},
		});

		// eslint-disable-next-line no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private
		window.__editor = editor;
		editor.render();
	}, { selector: CONTAINER_SELECTOR, args: { initialText } });
}
