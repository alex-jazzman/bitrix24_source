type SignStageId = string;

declare type SignBannerAnnulledCountPhrase = (annulledCount: number) => string | null;

declare type SignBannerPhrase = string | SignBannerAnnulledCountPhrase;

declare type SignBannerProps = Omit<BannerProps, 'title' | 'description'> & {
	title: SignBannerPhrase,
	description: SignBannerPhrase,
}

declare type SignBannerMetaData = Record<SignStageId, { banner: SignBannerProps }>

declare type SignBannerUser = {
	id: number,
	name: string,
}

declare type SignBannerDocument = {
	id?: number,
	name?: string,
	link?: string,
}

/**
 * Card params the server puts into params.COMPONENT_PARAMS, in camelCase after the standard
 * conversion. Everything but the stage and the document is sent only when it applies.
 */
declare type SignBannerComponentParams = {
	stageId: SignStageId,
	document: SignBannerDocument,
	user?: SignBannerUser,
	initiator?: SignBannerUser,
	userMessage?: string,
	annulledCount?: number,
	helpArticle?: string,
	actionCompleted?: boolean,
}
