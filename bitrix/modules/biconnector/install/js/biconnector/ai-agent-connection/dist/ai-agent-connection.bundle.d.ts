/* eslint-disable */
type AiAgentConnectionParams = {
	anchor: HTMLElement;
	operations?: AgentOperationCatalog | null;
	transport?: ConnectionTransport | null;
};

type AgentOperationCatalog = {
	[toolSetCode: string]: AgentOperation[];
};

type AgentOperation = {
	toolSetCode: string;
	toolName: string;
	impact: AgentOperationImpact;
	title: string;
	warning: string | null;
};

type AgentOperationImpact = 'read' | 'modify' | 'destructive';

type ConnectionTransport = {
	getState(): Promise<ConnectionResponse>;
	issue(): Promise<ConnectionResponse>;
	reissue(): Promise<ConnectionResponse>;
};

type ConnectionResponse = {
	status: string;
	data: {
		[field: string]: unknown;
	} | null;
	errors: {
		code: string;
		[field: string]: unknown;
	}[];
};

declare namespace BX.BIConnector {
	/**
	 * The facade of the extension: it joins the scenarios, the view and the surface and holds no state of its
	 * own. The state of the popup and the secret belong to the scenarios, the markup to the view, the placement
	 * and the ban on closing to the surface; the facade only carries the changes of the one to the others.
	 */
	class AiAgentConnection {
		constructor(params: AiAgentConnectionParams);
		show(): void;
		destroy(): void;
	}
}
