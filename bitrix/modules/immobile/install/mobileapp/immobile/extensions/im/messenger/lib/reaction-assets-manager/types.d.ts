import {DialogReactionSettingCurrentUserAvatar} from "../../controller/dialog/types/dialog";

export type LegacyReactionData = {
	id: string;
	testId: string;
	lottieUrl: string;
	svgUrl: string;
};

export type ReactionData = {
	id: string;
	name: string;
	testId: string;
	svgUrl: string;
	lottieUrl: string;
	imageUrl: string;
};

export type ReactionSvgUrlMap = {
	[key: string]: string;
};
export type ReactionLottieUrlMap = {
	[key: string]: string;
}
export type ReactionPngUrlMap = {
	[key: string]: string;
}

export type ReactionAssetsUrlData = {
	svg?: ReactionSvgUrlMap,
	lottie: ReactionLottieUrlMap,
	png?: ReactionPngUrlMap,
};

declare type ReactionPack = Array<object>;

export interface ReactionAssetsManagerInterface {
	getWidgetSettings(): {
		currentUserAvatar: DialogReactionSettingCurrentUserAvatar;
		version: number;
		isMultiSelection: boolean;
	} & ReactionAssetsUrlData;

	getReactionAssetsUrl(): ReactionAssetsUrlData;

	// @ts-ignore
	getAvailableReactions(): Set<string>;

	getPackByType(
		type: Array<string> | ReactionPack | { ids: Array<string> }
	): Array<ReactionData>;

	getCurrentUserAvatarForReactions(): DialogReactionSettingCurrentUserAvatar;

	getLegacyReactions(): Array<LegacyReactionData>;

	getTopReactions(): Promise<Array<ReactionData>>;

	prewarmFavoriteReactionsCache(): void;
}
