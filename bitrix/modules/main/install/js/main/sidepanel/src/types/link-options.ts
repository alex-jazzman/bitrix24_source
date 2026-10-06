export type LinkOptions = {
	url: string; // URL
	target: string | null; // Target Attribute
	anchor: HTMLElement | null; // Dom Node
	matches?: RegExpMatchArray;
};
