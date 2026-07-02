/* eslint-disable */
interface IconOptions {
	icon: string;
	size?: number;
	color?: string;
	hoverMode?: IconHoverModeType;
	responsive?: boolean;
}

type IconHoverModeType = typeof BX.UI.IconSet.IconHoverMode[keyof typeof BX.UI.IconSet.IconHoverMode];

declare namespace BX.UI.IconSet {
	class Icon {
		icon: string;
		size: number | null;
		color: string | null;
		iconElement: HTMLElement | null;
		static isValid(params: IconOptions): boolean;
		static validateParams(params: IconOptions): string | null;
		constructor(params: IconOptions);
		validateParams(params: IconOptions): void;
		renderTo(node: HTMLElement): void;
		render(): HTMLElement;
		setColor(color: string): void;
		setHoverMode(hoverMode: string | null): void;
		setResponsive(responsive: boolean): void;
	}

	const IconHoverMode: Readonly<{
		readonly DEFAULT: "default";
		readonly ALT: "alt";
	}>;
}
