/* eslint-disable */
type VibecodeBrand = 'bitrix24' | 'alaio';

declare namespace BX.Vibecodeconnector {
	class VibecodeButton {
		constructor();
		render(): HTMLElement;
		setCollapsed(collapsed?: boolean): this;
	}
}
