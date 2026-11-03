export type EmbedTargetBox = {
	top: number,
	left: number,
	width: number,
	height: number | null,
	heightRatio?: number,
};

export type DashboardOnboardingConfig = {
	mode: string,
	steps: string[],
	canRestart: boolean,
};

export type DashboardOnboardingOptions = {
	config: DashboardOnboardingConfig,
	frameNode: HTMLElement,
	isEmbedReady: () => boolean,
	onEditRequested: () => void,
};

export type TourStep = {
	id: string,
	target: HTMLElement,
	title: string,
	text: string,
	side: string,
	image: string,
};

export type CoachmarkAction = {
	text: string,
	primary?: boolean,
	onClick: () => void,
};

export type CoachmarkPagination = {
	current: number,
	total: number,
	onPrev: () => void,
	onNext: () => void,
};

export type CoachmarkLabels = {
	closeLabel: string,
	previousLabel: string,
	nextLabel: string,
};

export type CoachmarkOptions = CoachmarkLabels & {
	id?: string,
	target: HTMLElement,
	side: string,
	title: string,
	text: string,
	image?: string,
	illustrationNode?: HTMLElement | null,
	actions: CoachmarkAction[],
	pagination?: CoachmarkPagination | null,
	onClose: () => void,
};
