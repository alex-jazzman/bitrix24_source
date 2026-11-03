export type WhatsNewCategory = {
	code: string,
	name: string,
};

export type WhatsNewArticle = {
	id: string | number,
	name?: string | null,
	time?: string | number | null,
	isNew?: boolean,
	isRead?: boolean,
	actionType?: string,
	actionArticleId?: string,
	categoryCode?: string | null,
	bottomDescriptionType?: string | null,
	bottomDescription?: string | null,
};

export type WhatsNewCarouselArticle = {
	id: string | number,
	title: string,
	isNew?: boolean,
	isRead?: boolean,
	actionType?: string,
	actionArticleId?: string,
	category: string | null,
	imageUri: string | null,
};

export type WhatsNewButtonProps = {
	testId?: string,
	counter?: number,
	onCounterChange?: (counter?: number) => void,
	hubDesign?: boolean,
	/** The card was tapped, its header or a row of its carousel; only the section listens to this. */
	onCardClick?: () => void,
	/** The screen the card is drawn in; left out, its own events stay with the menu that owns it. */
	analyticsSection?: string,
	articles: WhatsNewArticle[],
	categories: WhatsNewCategory[],
	isIdle: boolean,
	isLoading: boolean,
	isSucceeded: boolean,
	isFailed: boolean,
	urlParams?: {
		url?: string | null,
		userDateRegister?: string | null,
		portalDateRegister?: string | null,
	} | null,
	fetchWhatsNewThunk: (params: { blockPage: number }) => Promise<unknown> & { unwrap?: () => Promise<unknown> },
	fetchUrlParamsThunk: () => Promise<unknown> & { unwrap?: () => Promise<unknown> },
	updateReadNewsThunk: (params: { newsIds: Array<string | number> }) => Promise<unknown> & {
		unwrap?: () => Promise<unknown>,
	},
	updateLocalWhatsNewsParamsThunk: (params: Record<string, never>) => Promise<unknown> & {
		unwrap?: () => Promise<unknown>,
	},
	statusReset: () => void,
};

export type WhatsNewButtonState = {
	snapshot: WhatsNewCarouselArticle[],
	width: number | null,
};
