import { post } from '../../shared/api';
import type { Block, Connection, DiagramTemplate } from '../../shared/types';
import type {
	ProcessDataCatalogResponse,
	ProcessDataMutationResponse,
	ProcessDataProperty,
	ProcessDataUsagesResponse,
	Purpose,
	SharedElementResponse,
} from './types';

/**
 * What every action of the controller receives besides its own parameters: the template as the
 * editor holds it right now. The server owns no state of the window — it answers about what it
 * was handed, exactly like `Diagram.publicateDraft`.
 */
export type ProcessDataScope = {
	templateId: number;
	draftId: number;
	documentTypeSigned: string;
	template: DiagramTemplate;
};

/** The scope plus the diagram itself: the actions that read or rewrite the references of the nodes. */
export type ProcessDataContext = {
	...ProcessDataScope,
	blocks: Block[];
	connections: Connection[];
};

export const processDataApi = {
	getProcessData: (scope: ProcessDataScope): Promise<ProcessDataCatalogResponse> => {
		return post('ProcessData.get', scope);
	},
	createElement: (
		scope: ProcessDataScope,
		element: { key: string, purpose: Purpose, property: $Shape<ProcessDataProperty> },
	): Promise<ProcessDataMutationResponse> => {
		return post('ProcessData.create', { ...scope, element });
	},
	updateElement: (
		scope: ProcessDataScope,
		sourceType: string,
		key: string,
		property: $Shape<ProcessDataProperty>,
	): Promise<ProcessDataMutationResponse> => {
		return post('ProcessData.update', { ...scope, sourceType, key, property });
	},
	renameElement: (
		context: ProcessDataContext,
		sourceType: string,
		key: string,
		newKey: string,
	): Promise<ProcessDataMutationResponse> => {
		return post('ProcessData.rename', { ...context, sourceType, key, newKey });
	},
	/**
	 * The property travels with the move: the edited schema and the new purpose are one change (AC-045).
	 * `sharedSourceType` names the storage a value becoming shared is written into — the purpose the form
	 * gives it decides the table, not the source it is moved from. Named none, the server keeps its own rule.
	 */
	changeElementPurpose: (
		context: ProcessDataContext,
		sourceType: string,
		key: string,
		purpose: Purpose,
		property: $Shape<ProcessDataProperty>,
		sharedSourceType: string = '',
	): Promise<ProcessDataMutationResponse> => {
		return post('ProcessData.changePurpose', {
			...context,
			sourceType,
			key,
			purpose,
			property,
			sharedSourceType,
		});
	},
	deleteElement: (
		context: ProcessDataContext,
		sourceType: string,
		key: string,
	): Promise<ProcessDataMutationResponse> => {
		return post('ProcessData.delete', { ...context, sourceType, key });
	},
	getElementUsages: (
		context: ProcessDataContext,
		sourceType: string,
		key: string,
	): Promise<ProcessDataUsagesResponse> => {
		return post('ProcessData.usages', { ...context, sourceType, key });
	},
	upsertSharedElement: (
		scope: ProcessDataScope,
		sourceType: string,
		id: string,
		property: $Shape<ProcessDataProperty>,
	): Promise<SharedElementResponse> => {
		return post('ProcessData.upsertShared', { ...scope, sourceType, id, property });
	},
	deleteSharedElement: (
		context: ProcessDataContext,
		sourceType: string,
		id: string,
	): Promise<{ deleted: boolean }> => {
		return post('ProcessData.deleteShared', { ...context, sourceType, id });
	},
};
