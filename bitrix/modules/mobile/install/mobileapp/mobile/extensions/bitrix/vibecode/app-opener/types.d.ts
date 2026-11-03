declare type RecordOpenOutcomeV1 = {
	isSuccess: boolean,
};

declare class VibeCodeAppOpener
{
	static recordOpen(catalogItemId: number | string): Promise<RecordOpenOutcomeV1>;
	static open(options: {
		catalogItemId: number | string,
		title?: string,
	}): Promise<RecordOpenOutcomeV1>;
}

declare function openAppPage(
	catalogItemId: number | string,
	options?: { title?: string },
): boolean;

declare function openInApp(
	url: string,
	options?: { title?: string, componentCode?: string },
): void;

export { RecordOpenOutcomeV1, VibeCodeAppOpener, openAppPage, openInApp };
