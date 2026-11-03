/* eslint-disable */
type BitrixGptBiAnnounceOptions = {
	surface: string;
	canShow: boolean;
	isEmbedReady?: () => boolean;
	isHintShown?: () => boolean;
};

declare namespace BX.BIConnector {
	class BitrixGptBiAnnounce {
		constructor(options: BitrixGptBiAnnounceOptions);
		static init(options: BitrixGptBiAnnounceOptions): BitrixGptBiAnnounce | null;
		destroy(): void;
	}

	const AnnounceSurface: Readonly<{
		Detail: "detail";
		List: "list";
	}>;
}
