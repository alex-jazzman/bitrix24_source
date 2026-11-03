// AvatarProps names the native element contract in dev/janative/types/elements/avatar, so the
// component props are named after the component and the native payload keeps the Native prefix:
// one name for two different contracts would be misleading even though both declarations are module-scoped

type AvatarId = string | number;

// the view resolves a filled string as a ready image path and an object as a library entry
type AvatarEmptyAvatar = string | {
	uri?: string;
	named?: EmptyAvatar;
};

// what the entity type contributes: the wrapper merges it into the props of the view
type AvatarPlaceholder = {
	emptyAvatar?: AvatarEmptyAvatar;
	backgroundColor?: Color;
};

// the native element instance, its shape is owned by the native layer
type AvatarNativeRef = unknown;

// an IconView instance, not the Icon enum: the view reads icon.props to build the svg placeholder
type AvatarIcon = {
	props?: {
		icon?: Icon;
		color?: Color;
		size?: number;
	};
};

// with redux on, the renderer is wrapped by statemanager/redux/connect, so the tree gets its
// Connect instance instead of the view; the class is not exported, hence the structural type
type AvatarConnected = {
	render: () => AvatarNativeRef;
};

type AvatarRendered = AvatarView | AvatarConnected;

type AvatarClickPayload = {
	id: number;
};

type AvatarColorGradient = {
	start: string;
	middle: string;
	end: string;
};

// props of the public component: this is what a consumer passes to Avatar()
interface AvatarComponentProps
{
	testId: string;
	id?: AvatarId;
	uri?: string;
	name?: string;
	size?: number;
	outline?: number;
	backBorderWidth?: number;
	shape?: AvatarShape;
	entityType?: AvatarEntityType;
	emptyAvatar?: AvatarEmptyAvatar;
	accent?: boolean;
	accentType?: AvatarAccentType;
	accentColor?: Color;
	accentGradient?: AvatarAccentGradient;
	accentGradientColors?: string[];
	backgroundColor?: Color;
	useLetterImage?: boolean;
	// with redux on, the users slice outranks the passed uri and name
	withRedux?: boolean;
	icon?: AvatarIcon;
	style?: Partial<ElementStyle>;
	forwardRef?: (ref: AvatarNativeRef) => void;
	onClick?: (payload: AvatarClickPayload) => void;
}

// props of the view: the wrapper has already resolved the entity type into placeholder and spread
// its values, so entityType and emptyAvatar do not reach the view as separate props
interface AvatarViewProps extends Omit<AvatarComponentProps, 'entityType' | 'emptyAvatar' | 'withRedux'>
{
	placeholder?: AvatarPlaceholder;
}

// the connector of the users slice: it wraps the renderer and feeds it uri and name from the store
type AvatarStateConnector = (
	renderer: (props: AvatarViewProps) => AvatarView,
) => (props: AvatarComponentProps) => AvatarConnected;

type AvatarNativeSvgParams = {
	uri?: string;
	named?: string;
	size?: number;
	tintColor?: string;
};

type AvatarNativePlaceholderParams = {
	type: string;
	backgroundColor?: string;
	svg?: AvatarNativeSvgParams;
};

type AvatarNativeAccentParams = {
	accentColorGradient?: AvatarColorGradient;
	accentColor?: string;
	accentType?: string;
};

// what the view feeds to the native Avatar element
type AvatarNativeParams = AvatarNativeAccentParams & {
	testId: string;
	title?: string;
	uri?: string;
	type: string;
	radius: number;
	placeholder: AvatarNativePlaceholderParams;
	backBorderWidth?: number;
	style: Partial<ElementStyle>;
	hideOutline: boolean;
};

// one user record of the users slice, as much of it as the avatar reads
type AvatarSliceUser = {
	fullName?: string;
	avatarSize100?: string;
	isCollaber?: boolean;
	isExtranet?: boolean;
};

// what a selector entity gives to the avatar: entityId is passed through for the selector itself
type AvatarSelectorParams = {
	id: AvatarId;
	title?: string;
	avatar?: string;
	entityId?: string;
	entityType?: string;
	size?: number;
	withRedux?: boolean;
	isCollaber?: boolean;
	isExtranet?: boolean;
	customData?: AvatarSelectorCustomData;
	onClick?: (payload: AvatarClickPayload) => void;
};

type AvatarSelectorCustomData = {
	name?: string;
	lastName?: string;
};

