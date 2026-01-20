import type { UserDto } from 'tasks.v2.provider.service.user-service';

export type InterfaceModelParams = {
	currentUser: UserDto,
	stateFlags: StateFlags,
	deadlineUserOption: DeadlineUserOption,
	userOptions: {
		fullCard: FullCardOptions | false,
	},
	taskUserFieldScheme: UserFieldScheme[],
	templateUserFieldScheme: UserFieldScheme[],
};

export type InterfaceModelState = {
	currentUserId: number,
	deadlineChangeCount: number,
	titleFieldOffsetHeight: ?number,
	stateFlags: StateFlags,
	deadlineUserOption: DeadlineUserOption,
	deletingCheckListIds: { [key: number | string ]: number | string },
	disableCheckListAnimations: boolean,
	checkListCompletionCallbacks: CheckListCompletionCallbacks,
	draggedCheckListId: ?number | ?string,
	taskUserFieldScheme: UserFieldScheme[],
	templateUserFieldScheme: UserFieldScheme[],
};

export type DeadlineUserOption = {
	id: number,
	userId: number,
	defaultDeadlineInSeconds: number,
	isExactDeadlineTime: boolean,
	defaultDeadlineDate: string,
	canChangeDeadline: boolean,
	maxDeadlineChangeDate: string,
	maxDeadlineChanges: number,
	requireDeadlineChangeReason: boolean,
};

type FullCardOptions = {
	cardWidth?: number,
}

export type CheckListCompletionCallbacks = { [id: string]: CheckListCompletionCallback };

export type CheckListCompletionCallback = () => void;

export type StateFlags = {
	needsControl: boolean,
	matchesWorkTime: boolean,
};

export type UserFieldScheme = {
	id: number,
	entityId: string,
	fieldName: string,
	userTypeId: string,
	multiple: boolean,
	mandatory: boolean,
	editFormLabel: string,
	value: any,
};
