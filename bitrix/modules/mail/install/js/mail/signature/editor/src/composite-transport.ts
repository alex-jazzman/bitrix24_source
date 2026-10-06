import { type SavePayload, type SignatureTransport } from './types';

export type CompositeTransportOptions = {
	/**
	 * The shared signature the editor was opened on, if it was opened on one at all. The `signatureId`
	 * of the editor answers for the personal path alone, so the shared one is named separately.
	 */
	sharedSignatureId?: number,
	/** The original row of the unified model, used only when its scope changes. */
	unifiedSignatureId?: number,
	/** Scope of the original unified row. */
	initialKind?: 'user' | 'shared',
	/** Transport of the unified model, required when unifiedSignatureId is set. */
	unifiedTransport?: SignatureTransport,
};

export type UnifiedTransportCondition = {
	/** The row of the unified model the editor was opened on, 0 for a signature being created. */
	unifiedSignatureId?: number,
	/** Whether the screen offers the card of the shared scope. */
	hasSharedScopeCard?: boolean,
};

/**
 * Whether the screen has to route its saves through the unified model. A signature that already has
 * a row there is saved by the identifier of that row — the card of the shared scope is a separate
 * matter, it decides the scope of the signature and not the identifier space the row lives in, so a
 * screen without the card needs the same routing.
 */
export function needsUnifiedTransport(condition: UnifiedTransportCondition): boolean
{
	return (condition.unifiedSignatureId ?? 0) > 0 || condition.hasSharedScopeCard === true;
}

/**
 * Routes save() to the personal or corporate transport depending on the active
 * panel's `kind`. The unified editor (admin) uses this so a single
 * SignatureEditor can persist either a user signature or a shared one without
 * the editor core knowing about the two storage backends.
 *
 * Existing signatures keep their unified identifier when the scope changes. Saves that keep the
 * original scope still use the compatibility transports.
 */
export class CompositeTransport implements SignatureTransport
{
	#userTransport: SignatureTransport;
	#sharedTransport: SignatureTransport;
	#unifiedTransport: SignatureTransport;
	#sharedSignatureId: number;
	#unifiedSignatureId: number;
	#initialKind: 'user' | 'shared';
	#continueInUnifiedModel: boolean = false;

	constructor(
		userTransport: SignatureTransport,
		sharedTransport: SignatureTransport,
		options: CompositeTransportOptions = {},
	)
	{
		this.#userTransport = userTransport;
		this.#sharedTransport = sharedTransport;
		this.#unifiedTransport = options.unifiedTransport ?? sharedTransport;
		this.#sharedSignatureId = options.sharedSignatureId ?? 0;
		this.#unifiedSignatureId = options.unifiedSignatureId ?? 0;
		this.#initialKind = options.initialKind ?? 'user';
	}

	save(payload: SavePayload): Promise<number>
	{
		const kind = payload.panelData?.kind ?? 'user';

		if (
			this.#unifiedSignatureId > 0
			&& (
				this.#continueInUnifiedModel || kind !== this.#initialKind
				|| (kind === 'user' && payload.signatureId <= 0)
			)
		)
		{
			return this.#unifiedTransport.save({
				...payload,
				signatureId: this.#unifiedSignatureId,
				scopeChanged: kind !== this.#initialKind,
			}).then((savedId: number) => {
				this.#unifiedSignatureId = savedId;
				this.#sharedSignatureId = kind === 'shared' ? savedId : 0;
				this.#initialKind = kind;
				this.#continueInUnifiedModel = true;

				return savedId;
			});
		}

		if (kind === 'shared')
		{
			return this.#sharedTransport.save({ ...payload, signatureId: this.#sharedSignatureId });
		}

		return this.#userTransport.save(payload);
	}

	getUpdateSuccessText(): string
	{
		// The two underlying transports share the same generic message; the
		// shared one is more specific, prefer it when unsure.
		return this.#userTransport.getUpdateSuccessText();
	}
}
