type NestedDepartmentEntityId = string | number;

type NestedDepartmentUserOptions = Record<string, unknown>;

type NestedDepartmentEntityOptions = {
	shouldAddCounters: () => boolean,
	allowFlatDepartments?: boolean,
	allowSelectRootDepartment?: boolean,
	onlyManagedHierarchy?: boolean,
	allowedDepartmentIds?: Array<NestedDepartmentEntityId>,
	userOptions?: NestedDepartmentUserOptions,
};

type NestedDepartmentUserEntityOptions = {
	disableSearch?: boolean,
	fillDialog?: false,
	userOptions?: NestedDepartmentUserOptions,
};

type NestedDepartmentDialogDepartmentOptions = {
	allowFlatDepartments?: boolean,
	allowSelectRootDepartment?: boolean,
	onlyManagedHierarchy?: boolean,
	allowedDepartmentIds?: Array<NestedDepartmentEntityId>,
	userOptions?: NestedDepartmentUserOptions,
	selectMode: 'usersAndDepartments',
	shouldCountSubdepartments: boolean,
	shouldCountUsers: boolean,
};

type NestedDepartmentDialogUserOptions = NestedDepartmentUserOptions & {
	emailUsers: true,
	inviteEmployeeLink: false,
	fillDialog?: false,
};

type NestedDepartmentEntityStyles = {
	image?: Record<string, unknown>,
	selectedImage?: Record<string, unknown>,
	[key: string]: unknown,
};

type NestedDepartmentSelectorItem = {
	id?: NestedDepartmentEntityId,
	entityId: string,
	type?: string | null,
	title?: string,
	shortTitle?: string,
	subtitle?: string,
	imageUrl?: string,
	avatar?: string | Record<string, unknown>,
	styles?: NestedDepartmentEntityStyles,
	params?: {
		entityId?: string,
		entityType?: string,
		customData?: Record<string, unknown>,
	},
	children?: Array<NestedDepartmentSelectorItem>,
	customData?: Record<string, unknown>,
	[key: string]: unknown,
};

type NestedDepartmentEntityDialog = {
	id: string,
	dynamicLoad: boolean,
	dynamicSearch: boolean,
	filters: Array<Record<string, unknown>>,
	searchable: boolean,
	substituteEntityId: string | null,
	options: NestedDepartmentDialogDepartmentOptions | NestedDepartmentDialogUserOptions | NestedDepartmentUserOptions,
};

type NestedDepartmentAvatarProps = Record<string, unknown>;

type NestedDepartmentUserNameStyle = Record<string, unknown>;
