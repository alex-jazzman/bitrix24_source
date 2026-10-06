type ProjectListCounter = {
	value?: number,
	VALUE?: number,
	isHidden?: boolean,
	IS_HIDDEN?: boolean | 'Y' | 'N',
	[key: string]: any,
};

type ProjectListItem = {
	id: number,
	activityDate: number | null,
	isPinned: boolean,
	opened: boolean,
	closed: boolean,
	visible: boolean,
	ownerId: number,
	moderatorIds: number[],
	memberIds: number[],
	counter: ProjectListCounter,
	actions: object,
	hasCollabers: boolean | 'Y' | 'N',
};

type ProjectListState = {
	ids: number[],
	entities: Record<number, ProjectListItem>,
};

type ProjectListMeta = {
	sliceName: string,
	entityAdapter: object,
	initialState: ProjectListState,
};

type ProjectListAction = {
	payload?: ProjectListItem[] | number[] | number | string,
};

type ProjectListActionCreator = (payload?: any) => object;

declare const sliceName: string;
declare const entityAdapter: object;
declare const initialState: ProjectListState;
declare const slice: object;

declare const addProjectListItems: ProjectListActionCreator;
declare const upsertProjectListItems: ProjectListActionCreator;
declare const removeProjectListItems: ProjectListActionCreator;
declare const clearProjectList: ProjectListActionCreator;

declare function selectAll(state: object): ProjectListItem[];
declare function selectById(state: object, id: number | string): ProjectListItem | undefined;
declare function selectEntities(state: object): Record<number, ProjectListItem>;
declare function selectIds(state: object): number[];
declare function selectTotal(state: object): number;

declare function normalizeId(value: number | string): number;
declare function prepareProjectListItems(state: ProjectListState, items: object[]): ProjectListItem[];
