/* eslint-disable */
type SigningMethodType = 'ukep' | 'goskey';

declare namespace BX.Sign.V2.B2e {
	const SigningMethod: Readonly<Record<string, SigningMethodType>>;

	/**
	 * Signing method of the company representative. The list is offered only when the server says the
	 * method is available for the selected company and provider: the client never derives availability
	 * from the representative himself, and the right of that person to use goskey is checked by the
	 * server when the step is left.
	 */
	class SigningMethodSelector {
		getLayout(): HTMLElement;
		setAvailable(available: boolean): void;
		isAvailable(): boolean;
		getSelectedMethod(): SigningMethodType | null;
		setSelectedMethod(method: string | null): void;
	}
}
