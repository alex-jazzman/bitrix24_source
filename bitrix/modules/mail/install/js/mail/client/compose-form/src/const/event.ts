/**
 * Events of the sending layer. `EventEmitter` broadcasts them globally, so every payload carries
 * `formId`: several compose panels can be open at once and a listener must handle its own form only.
 */
export const ComposeFormEvent = Object.freeze({
	Changed: 'BX.Mail.Client.ComposeForm:changed',
	Submit: 'BX.Mail.Client.ComposeForm:submit',
	SendSuccess: 'BX.Mail.Client.ComposeForm:sendSuccess',
	SendError: 'BX.Mail.Client.ComposeForm:sendError',
	Destroy: 'BX.Mail.Client.ComposeForm:destroy',
} as const);

/**
 * Messages the form posts down to the pages it was opened over. The identifiers must not be renamed: they are
 * matched as literals in the list of the letters — `MessageCreated` in
 * `mail.client.message.list/templates/.default/user-interface-manager.js`, which reloads the sent folder on
 * it, and `ScheduledMessageSaved` in the `src/js/list.es6.js` of the same template, which rereads the
 * section of the scheduled letters.
 */
export const SliderMessage = Object.freeze({
	MessageCreated: 'Mail.Client.MessageCreatedSuccess',
	/** A letter was put on the schedule or the letter already on it was changed. */
	ScheduledMessageSaved: 'Mail.Client.ScheduledMessageSaved',
} as const);

export type ComposeFormEventPayload = {
	formId: string,
};

/** `body` is the assembled message body, exactly what is sent to the server. */
export type ComposeFormSubmitPayload = ComposeFormEventPayload & {
	body: string,
};

export type ComposeFormChangedPayload = ComposeFormEventPayload & {
	reason: 'template' | 'user',
};
