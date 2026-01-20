type MCPServer = {
	id: number,
	name: string,
	subtitle: string,
	iconUrl: string,
	isActive: boolean,
	isDisabled: boolean,
	isLink: boolean,
	authorizations: MCPAuth[],
	onSelect: () => {}
}

type MCPAuth = {
	id: number,
	serverId: number,
	userId: number,
	name: string,
	iconUrl: string,
	isAuthorization: boolean,
	onSelect: () => {}
}
