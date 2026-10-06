type ProjectListMode = 'tasks_project';

type ProjectListCounterFilterId =
	| 'none'
	| 'sonetTotalExpired'
	| 'sonetTotalComments'
;

declare const PROJECT_LIST_MODE: ProjectListMode;
declare const DEFAULT_PRESET_ID: 'my';
declare const COUNTER_FILTER: {
	none: 'none',
	sonetTotalExpired: 'sonetTotalExpired',
	sonetTotalComments: 'sonetTotalComments',
};
declare const COUNTER_TYPES_TO_LOAD: string[];
declare const READ_ALL_BUTTON_ID: 'readAll';

type ProjectListSearchParams = {
	searchString: string,
	presetId: string,
	counterFilterId?: ProjectListCounterFilterId,
};

type ProjectListCounters = {
	projectsTotal?: number,
	sonetTotalExpired?: number,
	sonetTotalComments?: number,
};

type ProjectListLoadItemsResponse = {
	items?: object[],
	groups?: object[],
	users?: object[],
	meta?: {
		isPortalProjectsEmpty?: boolean,
	},
};

type TasksProjectListV2Props = {
	layout?: object,
};

type ProjectListSearchConfig = {
	layout: object,
	mode: ProjectListMode,
	onChange?: (params?: { isPresetChanged?: boolean }) => void,
};

type ProjectListEmptyStateProps = {
	testId: string,
	isSearchActive: boolean,
	isPortalProjectsEmpty: boolean,
	onRefresh?: () => void,
};

type ProjectListProjectOpenerConfig = {
	getPreloadedChatId: (projectId: number) => number,
};

type ProjectListMoreMenuCallbacks = {
	onCounterClick?: (counterFilterId: ProjectListCounterFilterId) => void,
	onReadAllClick?: () => void,
};

declare class TasksProjectListV2
{
	constructor(props?: TasksProjectListV2Props);
	render(): object;
	reload(): void;
}

declare class ProjectListSearch
{
	constructor(config: ProjectListSearchConfig);
	getParams(): ProjectListSearchParams;
	isActive(): boolean;
	getButton(): object;
	close(): void;
}

declare class ProjectListEmptyState
{
	constructor(props: ProjectListEmptyStateProps);
	render(): object;
}

declare class ProjectListProjectOpener
{
	constructor(config: ProjectListProjectOpenerConfig);
	open(projectId: number | string): Promise<void>;
}

declare class TasksProjectListMoreMenu
{
	constructor(
		counters: ProjectListCounters,
		selectedCounter: ProjectListCounterFilterId,
		selectedSorting: string | null,
		callbacks?: ProjectListMoreMenuCallbacks,
	);

	getMenuButton(): object;
	getMenuItems(): object[];
}
