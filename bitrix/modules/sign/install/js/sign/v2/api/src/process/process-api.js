import { post } from '../request';
import {
	type AvailableProcessListResponse,
	type DocumentProcessResponse,
	type ProcessLaunchResponse,
	type ProcessRetryResponse,
	type ProcessStartFieldsResponse,
	type ProcessStartMember,
	type ProcessStartParameters,
	type RunningProcessFilter,
	type RunningProcessGroupPage,
	type RunningProcessPage,
} from './type';

/**
 * Transport of the processes of the KEDO section. The catalog of the section answers what may be started,
 * so the list, the fields of the form and the start itself all speak about the same process.
 */
export class ProcessApi
{
	/**
	 * Processes the employee may start. `limit` narrows the set for the submenu; the grid of the section
	 * asks for the same set without one.
	 */
	getAvailableList(
		limit: number | null = null,
		searchQuery: string | null = null,
	): Promise<AvailableProcessListResponse>
	{
		return post('sign.api_v1.b2e.process.listAvailable', { limit, searchQuery });
	}

	/**
	 * Start fields of the process. An empty `fields` means the step of the parameters is skipped.
	 */
	getStartFields(processId: number): Promise<ProcessStartFieldsResponse>
	{
		return post('sign.api_v1.b2e.process.startFields', { processId });
	}

	/**
	 * The answer comes back before the processes do: the selection turns into a launch group served by a
	 * queue. A field the backend refused carries the name of the field in `customData.parameter`.
	 */
	start(
		processId: number,
		members: ProcessStartMember[],
		parameters: ProcessStartParameters = {},
		excludeRefused: boolean = true,
	): Promise<ProcessLaunchResponse>
	{
		return post('sign.api_v1.b2e.process.start', { processId, members, parameters, excludeRefused });
	}

	/**
	 * The top level of the list of what is already running - the launch groups. `limit` and `offset` are
	 * named by the caller: the backend types them as plain integers and its own page size is not a value
	 * the client may keep a copy of.
	 */
	getGroups(filter: RunningProcessFilter, limit: number, offset: number): Promise<RunningProcessGroupPage>
	{
		return post('sign.api_v1.b2e.process.list', { filter, limit, offset });
	}

	/**
	 * The composition of one launch group; asked for separately so a launch on thirty employees does not
	 * drag thirty rows into the first answer.
	 */
	getGroupProcesses(launchId: number, limit: number, offset: number): Promise<RunningProcessPage>
	{
		return post('sign.api_v1.b2e.process.list', { launchId, limit, offset });
	}

	/**
	 * Rows that did not start in the term of their group go back into the queue. Without `itemId` the whole
	 * group is retried, with it - the named row alone.
	 */
	retry(launchId: number, itemId: number | null = null): Promise<ProcessRetryResponse>
	{
		return post('sign.api_v1.b2e.process.retry', { launchId, itemId });
	}

	/**
	 * The process a document was created by - the same link as the cell of the documents, read backwards. A
	 * document created by no process is the ordinary case and answers with an empty `process`.
	 */
	getByDocument(documentId: number): Promise<DocumentProcessResponse>
	{
		return post('sign.api_v1.b2e.process.getByDocument', { documentId });
	}
}
