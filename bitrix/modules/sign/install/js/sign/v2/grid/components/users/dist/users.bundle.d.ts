/* eslint-disable */
type UsersPopupOptions = {
	users?: UserData[];
	title?: string;
	bindElement?: HTMLElement | null;
	totalCount?: number;
	loadUsers?: LoadUsers | null;
};

type UserData = {
	id: number;
	name: string;
	photo: string;
};

type LoadUsers = (limit: number, afterUserId: number | null) => Promise<UsersPage>;

type UsersPage = {
	users: UserData[];
	total: number | null;
	nextCursor: number | null;
};

type RoleAvatarStackOptions = {
	users?: UserData[];
	title?: string;
	maxVisible?: number;
	totalCount?: number;
	loadUsers?: LoadUsers;
};

declare namespace BX.Sign.V2.Grid.Components {
	class UsersPopup {
		constructor(options?: UsersPopupOptions);
		show(): void;
	}

	class RoleAvatarStack {
		constructor(options?: RoleAvatarStackOptions);
		render(): HTMLElement;
	}
}
