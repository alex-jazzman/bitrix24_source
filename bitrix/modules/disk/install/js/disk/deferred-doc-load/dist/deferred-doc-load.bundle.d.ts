/* eslint-disable */
declare namespace BX.Disk {
	class DeferredDocLoad {
		private static loaded;
		private static timeoutId;
		private static immediateLoadLinkId;
		static render(selector: string): void;
		static maybeLoadDocument(): void;
		static loadDocument(): void;
		static showStub(selector: string): void;
		private static renderStub;
		private static initLoadLink;
		static getUriToLoad(): string;
	}
}
