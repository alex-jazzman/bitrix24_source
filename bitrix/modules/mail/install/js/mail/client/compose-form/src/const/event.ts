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
 * Messages posted to the sliders above the form. The identifier must not be renamed: it is matched as a
 * literal in `mail.client.message.list/templates/.default/user-interface-manager.js`, which reloads the
 * sent folder on it.
 */
export const SliderMessage = Object.freeze({
	MessageCreated: 'Mail.Client.MessageCreatedSuccess',
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
