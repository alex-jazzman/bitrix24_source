type TasksUnavailableFeatureImage = {
	name: string,
	folder: string,
	moduleId?: string,
	width: number,
	height: number,
};

type UnsupportedFeatureImage = TasksUnavailableFeatureImage;

type TasksUnavailableFeatureItem = {
	icon: object,
	text: string,
};

type UnsupportedFeatureItem = TasksUnavailableFeatureItem;

type TasksUnavailableFeaturePresetValue = {
	testIdPrefix: string,
	title: string,
	description?: string,
	footnote?: string,
	image: TasksUnavailableFeatureImage,
	items?: TasksUnavailableFeatureItem[],
	redirectUrl?: string,
	qrTitle?: string,
	buttonText?: string,
};

type UnsupportedFeaturePresetValue = TasksUnavailableFeaturePresetValue;

type TasksUnavailableFeatureProps = {
	layout: object,
	type: TasksUnavailableFeaturePreset,
};

type UnsupportedFeatureProps = TasksUnavailableFeatureProps;

declare class TasksUnavailableFeaturePreset
{
	static readonly FLOWS: TasksUnavailableFeaturePreset;
	static readonly ANALYTICS: TasksUnavailableFeaturePreset;
	static readonly SCRUM: TasksUnavailableFeaturePreset;
	static readonly PROJECT_RESTRICTION: TasksUnavailableFeaturePreset;

	constructor(name: string, value: TasksUnavailableFeaturePresetValue);

	static has(preset: unknown): boolean;

	getTitle(): string;
	getQrTitle(): string | undefined;
	getButtonText(): string;
	getDescription(): string | undefined;
	getFootnote(): string | undefined;
	getImageWidth(): number;
	getImageHeight(): number;
	getImageUri(): string;
	getItems(): TasksUnavailableFeatureItem[] | undefined;
	getRedirectUrl(): string | undefined;
	hasRedirectUrl(): boolean;
	hasFootnote(): boolean;
	getTestIdPrefix(): string;
}

type UnsupportedFeaturePreset = TasksUnavailableFeaturePreset;
declare const UnsupportedFeaturePreset: typeof TasksUnavailableFeaturePreset;

declare class TasksUnavailableFeature
{
	constructor(props: TasksUnavailableFeatureProps);
	render(): object;
}

type UnsupportedFeature = TasksUnavailableFeature;
declare const UnsupportedFeature: typeof TasksUnavailableFeature;
