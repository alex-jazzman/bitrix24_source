type NewProjectsPromoActionResponse = {
	status?: string;
	data?: unknown;
	errors?: ReadonlyArray<unknown> | null;
};

declare function shouldShow(): Promise<boolean>;
declare function setViewed(): Promise<boolean>;

export {
	NewProjectsPromoActionResponse,
	setViewed,
	shouldShow,
};
