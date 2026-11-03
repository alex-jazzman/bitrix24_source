import { Loc } from 'main.core';

import { Api } from './api';
import { describeFailure, parseSaveFailure, type SaveFailure } from './state';
import { type SaveSettingRequest, type VacationAutoReplySetting } from './types';

export type SavePayload = {
	signatureId: number,
	signature: string,
	panelData: unknown,
};

export type SignatureTransport = {
	save(payload: SavePayload): Promise<number>,
	getUpdateSuccessText(): string,
};

/** A save request prepared by the screen and sent through the signature editor boundary. */
export type SaveContext = SaveSettingRequest;

export type VacationAutoReplyTransportOptions = {
	/** The values of the form at the moment of the save. */
	readForm: (payload: SavePayload) => SaveContext,
	/** The request is on its way; one of the two below ends the wait it begins. */
	onStarted: () => void,
	onSaved: (setting: VacationAutoReplySetting) => void,
	onFailure: (failure: SaveFailure) => void,
};

/**
 * The save path of the editor of the signatures, pointed at the setting of the auto-reply: the core
 * of the editor hands over the text it holds and knows nothing of the API behind it, the same way it
 * knows nothing of the API of the signatures.
 *
 * A rejected save reaches the screen twice on purpose: the messages of the fields go to the fields,
 * and the editor is answered with the text of the whole failure, which it shows above the form.
 */
export class VacationAutoReplyTransport implements SignatureTransport
{
	#options: VacationAutoReplyTransportOptions;

	constructor(options: VacationAutoReplyTransportOptions)
	{
		this.#options = options;
	}

	save(payload: SavePayload): Promise<number>
	{
		const request: SaveSettingRequest = {
			...this.#options.readForm(payload),
			body: payload.signature,
		};
		/*
		 * The start of the save is named here and not at the press of the button: on its way to the
		 * transport the editor reads the text of the auto-reply, and a read of an editor that is not
		 * on the page throws instead of returning it. A save named before that would be waited for
		 * forever - neither answer below is ever brought back to end the wait.
		 */
		const pending = Api.save(request);
		this.#options.onStarted();

		return pending.then(
			(response: { setting: VacationAutoReplySetting }): number => {
				this.#options.onSaved(response.setting);

				return response.setting.mailboxId;
			},
			(reason: unknown): never => {
				const failure = parseSaveFailure(reason);
				this.#options.onFailure(failure);

				throw new Error(describeFailure(failure));
			},
		);
	}

	getUpdateSuccessText(): string
	{
		return Loc.getMessage('MAIL_VACATION_AUTO_REPLY_SAVED') ?? '';
	}
}
