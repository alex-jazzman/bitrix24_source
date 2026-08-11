/* eslint-disable */
type BitrixGptAgentPromoOptions = {
	onClose?: () => void;
};

declare namespace BX.Messenger.v2.Component.Elements {
	class BitrixGptAgentPromo {
		static show(options?: BitrixGptAgentPromoOptions): void;
		static close(): void;
		constructor(options: BitrixGptAgentPromoOptions);
		close(): void;
	}
}
