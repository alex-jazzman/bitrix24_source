export interface MCPSelectorProps
{
	selectedAuthId?: string | null;
	items?: MCPSelectorItemData[];
	onSelect?: (params: { selectedAuth: AuthorizationData; selectedServer: ServerData }) => void;
}

export interface MCPSelectorItemProps
{
	id: string;
	name: string;
	subtitle?: string;
	iconUrl: string;
	isActive?: boolean;
	isDisabled?: boolean;
	isLink?: boolean;
	isAuthorization?: boolean;
	serverId?: string;
	userId?: string;
	selectedAuthId?: string | null;
	disableDivider?: boolean;
	onSelect?: (params: { authId?: string; serverId: string }) => void;
	authorizations?: AuthorizationData[];
}

export interface MCPSelectorDataProviderProps
{
	cacheHandler?: () => void;
	responseHandler?: () => void;
	onItemSelect?: () => void;
}

export interface MCPSelectorServerModel
{
	id: string;
	name: string;
	description?: string;
	iconUrl: string;
	isActive: boolean;
	isDisabled?: boolean;
	onSelect?: (params: { authId?: string; serverId: string }) => void;
	authorizations?: AuthorizationData[];
}

export interface MCPSelectorServerAuthorizationModel
{
	id: string;
	serverId: string;
	isAuthorization?: boolean;
	name: string;
	iconUrl: string;
	onSelect?: (params: { authId?: string; serverId: string }) => void;
	userId: string;
}

export interface MCPSelectorResponseData
{
	items?: ServerData[];
	users?: any[];
	disabledByAdmin?: boolean;
	disabledByTariff?: boolean;
}

export interface MCPSelectorPreparedItem
{
	id: string;
	name: string;
	subtitle?: string;
	iconUrl: string;
	isActive: boolean;
	isDisabled: boolean;
	onSelect?: (params: { authId?: string; serverId: string }) => void;
	authorizations?: AuthorizationData[];
	isLink: boolean;
}
