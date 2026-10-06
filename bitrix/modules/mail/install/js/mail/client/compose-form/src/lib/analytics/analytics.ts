import { type AnalyticsOptions, sendData } from 'ui.analytics';

/**
 * Every value is validated on the analytics server, so the set repeats the one the old compose screen sent
 * (`mail.client.message.new/templates/.default/template.php`) name for name.
 */
const SendEvent = Object.freeze({
	tool: 'mail',
	event: 'mail_send',
	category: 'mail_operations',
	type: 'mail',
});

export type ComposeAnalyticsSource = {
	section: string,
	element: string,
};

/**
 * Sent on the click, before the request and regardless of its result: the slice counts send attempts.
 * `source.element` is passed through as the server gave it and is never rewritten on the client.
 */
export function sendComposeSendAnalytics(source: ComposeAnalyticsSource): void
{
	const payload: AnalyticsOptions = {
		...SendEvent,
		c_section: source.section,
		c_element: source.element,
	};

	sendData(payload);
}
