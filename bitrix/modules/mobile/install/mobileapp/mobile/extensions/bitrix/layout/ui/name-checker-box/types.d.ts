type NameCheckerImageTypeValue = 'svg' | 'raster';

type NameCheckerUser = {
	id: string | number;
	firstName?: string | null;
	secondName?: string | null;
	email?: string;
	phone?: string;
	formattedPhone?: string;
};

type OpenNameCheckerParams<TUser extends NameCheckerUser = NameCheckerUser> = {
	parentLayout?: LayoutWidget | null;
	usersToInvite?: TUser[];
	alreadyInvitedUsers?: TUser[];
	analytics?: Partial<AnalyticsDTO> | AnalyticsEvent;
	openWidgetConfig?: Partial<Parameters<typeof PageManager.openWidget>[1]>;
	labelText?: string | ((layout: LayoutWidget) => ReturnType<typeof View>) | null;
	inviteButtonText?: string | null;
	boxTitle?: string | null;
	description?: string | null;
	subdescription?: string | null;
	onSendInviteButtonClick?: ((users: TUser[], alreadyInvitedUsers: TUser[]) => void | Promise<void>) | null;
	getItemFormattedSubDescription?: ((user: TUser) => string) | null;
	getAlreadyInvitedUsersLabelTextForSubtitle?: ((users: string) => string) | null;
	getAlreadyInvitedUsersStringForSubtitle?: ((users: TUser[]) => string) | null;
	infoAreaGraphicsUri?: string | null;
	infoAreaGraphicsType?: NameCheckerImageTypeValue;
	dismissAlert?: {
		title: string;
		description: string;
		destructiveButtonText: string;
		defaultButtonText: string;
	} | null;
	avatarEntityType?: AvatarEntityType;
};

export type {
	NameCheckerImageTypeValue,
	NameCheckerUser,
	OpenNameCheckerParams,
};
