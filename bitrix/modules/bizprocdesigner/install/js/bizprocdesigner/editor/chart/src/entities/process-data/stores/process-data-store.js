import { Loc, Text, Type } from 'main.core';
import { defineStore } from 'ui.vue3.pinia';

import { type ApiError } from '../../../shared/api';
import type { DiagramData } from '../../../shared/types';
import { diagramStore as useDiagramStore } from '../../blocks/stores/diagram';
import { processDataApi, type ProcessDataContext, type ProcessDataScope } from '../api';
import type {
	Mechanics,
	ProcessDataElement,
	ProcessDataError,
	ProcessDataMutationResponse,
	ProcessDataProperty,
	ProcessDataSelector,
	ProcessDataUsage,
	Purpose,
	SharedAccess,
} from '../types';

type ProcessDataState = {
	isOpen: boolean;
	isLoading: boolean;
	// An answered read, empty catalog included: the grouping of the selectors is decided by this and
	// not by the length of the lists.
	isLoaded: boolean;
	pendingLoad: Promise<void> | null;
	// Which diagram the read belongs to: an answer of a read started before a reload is dropped.
	readGeneration: number;
	// Which read is the current one: an answer of a read started earlier does not overwrite a later one.
	readSequence: number;
	mechanics: Mechanics;
	canEdit: boolean;
	runningInstances: number;
	elements: ProcessDataElement[];
	shared: ProcessDataElement[];
	sharedAccess: SharedAccess;
	selectedId: string | null;
	errors: ProcessDataError[];
};

/** The draft refused the change: the catalog of the editor is ahead of what the process keeps. */
const DRAFT_NOT_SAVED_CODE = 'PROCESS_DATA_DRAFT_NOT_SAVED';

/** The compensation of a move could not take the portal write back: the portal is ahead of the draft. */
const SHARED_NOT_RESTORED_CODE = 'PROCESS_DATA_SHARED_NOT_RESTORED';

/** Sources of the portal: an element of these is a shared value, not a part of the template. */
const SHARED_SOURCE_TYPES: string[] = ['GlobalVar', 'GlobalConst'];

/**
 * Storage a moved element lands in: the one the form named, and the one the server falls back to when
 * it is named none — a constant becomes a global constant.
 */
function sharedSourceTypeOf(sourceType: string, sharedSourceType: string = ''): string
{
	if (SHARED_SOURCE_TYPES.includes(sharedSourceType))
	{
		return sharedSourceType;
	}

	return sourceType === 'Constant' ? 'GlobalConst' : 'GlobalVar';
}

function draftNotSavedError(): ProcessDataError
{
	return {
		code: DRAFT_NOT_SAVED_CODE,
		message: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_DRAFT_NOT_SAVED') ?? '',
		customData: null,
	};
}

/** Identity of an element inside the window: a key alone repeats between blocks. */
export function elementId(sourceType: string, key: string): string
{
	return `${sourceType}:${key}`;
}

/** What an action needs to answer about the template itself: the diagram is not sent where it is not read. */
function readScope(): ProcessDataScope
{
	const { templateId, draftId, documentTypeSigned, template } = useDiagramStore().diagramData;

	return { templateId, draftId, documentTypeSigned, template };
}

/** The actions reading or rewriting the references of the nodes get the diagram on top of the scope. */
function readContext(): ProcessDataContext
{
	const { blocks, connections } = useDiagramStore().diagramData;

	return { ...readScope(), blocks, connections };
}

// A failure the transport could not attribute to the server still produces one entry: the window
// has to report the refusal, and an empty message beats an untranslated one.
function readErrors(error: ApiError): ProcessDataError[]
{
	const errors = Type.isArray(error?.errors) ? error.errors : [];
	if (errors.length === 0)
	{
		return [{ code: null, message: '', customData: null }];
	}

	return errors.map((item) => ({
		code: item?.code ?? null,
		message: item?.message ?? '',
		customData: item?.customData ?? null,
	}));
}

function mergeSharedElement(shared: ProcessDataElement[], element: ProcessDataElement): ProcessDataElement[]
{
	const id = elementId(element.sourceType, element.key);
	const index = shared.findIndex((item) => elementId(item.sourceType, item.key) === id);
	if (index === -1)
	{
		return [...shared, element];
	}

	return shared.map((item, itemIndex) => (itemIndex === index ? element : item));
}

export const useProcessDataStore = defineStore('bizprocdesigner-editor-process-data', {
	state: (): ProcessDataState => ({
		isOpen: false,
		isLoading: false,
		isLoaded: false,
		pendingLoad: null,
		readGeneration: 0,
		readSequence: 0,
		mechanics: 'new',
		canEdit: false,
		runningInstances: 0,
		elements: [],
		shared: [],
		sharedAccess: { canUpsert: false, canDelete: false, visibility: {} },
		selectedId: null,
		errors: [],
	}),
	getters:
	{
		isReadOnly(state: ProcessDataState): boolean
		{
			return state.mechanics === 'legacy' || !state.canEdit || useDiagramStore().isWriteLocked;
		},
		byPurpose(state: ProcessDataState): (purpose: Purpose) => ProcessDataElement[]
		{
			return (purpose: Purpose): ProcessDataElement[] => {
				if (purpose === 'shared')
				{
					return state.shared;
				}

				return state.elements.filter((element) => element.purpose === purpose);
			};
		},
		selected(state: ProcessDataState): ProcessDataElement | null
		{
			if (state.selectedId === null)
			{
				return null;
			}

			const found = [...state.elements, ...state.shared]
				.find((element) => elementId(element.sourceType, element.key) === state.selectedId)
			;

			return found ?? null;
		},
	},
	actions:
	{
		async open(select: ProcessDataSelector | null = null): Promise<void>
		{
			this.isOpen = true;
			this.selectedId = select ? elementId(select.sourceType, select.key) : null;

			await this.load();
		},
		// The catalog outlives the window: it is kept up to date by the mutations themselves, and the
		// selectors read it without going to the server again.
		close(): void
		{
			this.isOpen = false;
			this.selectedId = null;
			this.errors = [];
		},
		/**
		 * Callers landing while a read is in flight get that read instead of starting one of their own.
		 *
		 * @return {Promise<boolean>} true when the catalog in the store is the one this read answered
		 */
		load(): Promise<boolean>
		{
			const generation = this.readGeneration;

			this.pendingLoad ??= this.readCatalog().finally(() => {
				if (generation === this.readGeneration)
				{
					this.pendingLoad = null;
				}
			});

			return this.pendingLoad;
		},
		/**
		 * A read that answers for the state after a mutation: a read already in flight could have started
		 * before it and carries the state from before. The read of the caller becomes the current one, so the
		 * older answer is dropped instead of overwriting it.
		 */
		reload(): Promise<boolean>
		{
			this.pendingLoad = null;

			return this.readCatalog();
		},
		/**
		 * The diagram in the editor became another one — a restore, an undo, a version view — so the catalog
		 * read from the previous one is not the catalog of this one and is asked for anew.
		 */
		invalidate(): void
		{
			this.readGeneration += 1;
			this.pendingLoad = null;
			this.isLoaded = false;
			this.isLoading = false;
			// The catalog belongs to the diagram that is gone: an open window would keep showing it and let
			// it be edited into the one that replaced it.
			this.elements = [];
			this.shared = [];

			if (this.isOpen)
			{
				void this.load();
			}
		},
		/** @return {Promise<boolean>} true when this read answered and its catalog is the one in the store */
		async readCatalog(): Promise<boolean>
		{
			const generation = this.readGeneration;
			const sequence = this.readSequence + 1;
			this.readSequence = sequence;
			this.isLoading = true;
			this.errors = [];
			try
			{
				const response = await processDataApi.getProcessData(readScope());

				if (generation !== this.readGeneration || sequence !== this.readSequence)
				{
					return false;
				}

				this.mechanics = response.mechanics === 'legacy' ? 'legacy' : 'new';
				this.canEdit = response.canEdit === true;
				this.runningInstances = Text.toInteger(response.runningInstances);
				this.elements = response.catalog ?? [];
				this.shared = response.shared?.elements ?? [];
				this.sharedAccess = {
					canUpsert: response.shared?.canUpsert === true,
					canDelete: response.shared?.canDelete === true,
					visibility: response.shared?.visibility ?? {},
				};
				this.isLoaded = true;

				return true;
			}
			catch (error)
			{
				if (generation === this.readGeneration && sequence === this.readSequence)
				{
					this.errors = readErrors(error);
				}

				return false;
			}
			finally
			{
				if (generation === this.readGeneration && sequence === this.readSequence)
				{
					this.isLoading = false;
				}
			}
		},
		/**
		 * @return {Promise<boolean>} true when the change reached the diagram store
		 */
		async applyMutation(request: () => Promise<ProcessDataMutationResponse>): Promise<boolean>
		{
			this.errors = [];
			if (this.isReadOnly)
			{
				return false;
			}

			const diagram = useDiagramStore();
			const generation = this.readGeneration;
			try
			{
				const response = await request();

				// The diagram the answer speaks about is gone: its blocks and its catalog are not written
				// over the one that replaced it, and the change never reached the draft.
				if (generation !== this.readGeneration)
				{
					this.errors = [draftNotSavedError()];

					return false;
				}

				// Read after the answer, not before it: what the editor holds now is what the blocks
				// the server did not rewrite have to stay.
				const { diagramData } = diagram;

				diagram.setDiagramData({
					...diagramData,
					template: { ...diagramData.template, ...response.template },
					blocks: response.blocks ?? diagramData.blocks,
					connections: response.connections ?? diagramData.connections,
				});
				this.elements = response.catalog ?? [];

				const isSaved = await diagram.publicDraft();
				if (!isSaved)
				{
					this.errors = [draftNotSavedError()];
				}

				return isSaved;
			}
			catch (error)
			{
				this.errors = readErrors(error);

				return false;
			}
		},
		create(element: { key: string, purpose: Purpose, property: $Shape<ProcessDataProperty> }): Promise<boolean>
		{
			return this.applyMutation(() => processDataApi.createElement(readScope(), element));
		},
		update(sourceType: string, key: string, property: $Shape<ProcessDataProperty>): Promise<boolean>
		{
			return this.applyMutation(() => processDataApi.updateElement(readScope(), sourceType, key, property));
		},
		rename(sourceType: string, key: string, newKey: string): Promise<boolean>
		{
			return this.applyMutation(() => processDataApi.renameElement(readContext(), sourceType, key, newKey));
		},
		/**
		 * The property travels with the move: the element is edited where it still stands and the shared value
		 * the move writes is created by the schema it is moved with, so the window asks the server once.
		 */
		async changePurpose(
			sourceType: string,
			key: string,
			purpose: Purpose,
			property: $Shape<ProcessDataProperty> = {},
			sharedSourceType: string = '',
		): Promise<boolean>
		{
			const restorePoint = {
				generation: this.readGeneration,
				diagramData: useDiagramStore().diagramData,
				elements: this.elements,
				shared: this.shared,
			};
			// The row of the portal the move writes or deletes: the storage the form named for a value
			// becoming shared, the source of the element itself for the one going back into the template.
			const portalSourceType = purpose === 'shared'
				? sharedSourceTypeOf(sourceType, sharedSourceType)
				: sourceType
			;

			// An answer tells the two failures apart: a refusal of the server itself wrote nothing on the
			// portal, and everything after it leaves a write to take back.
			let isMoveApplied = false;
			const isDone = await this.applyMutation(async () => {
				const response = await processDataApi.changeElementPurpose(
					readContext(),
					sourceType,
					key,
					purpose,
					property,
					sharedSourceType,
				);
				isMoveApplied = true;

				return response;
			});

			if (!isDone)
			{
				// An answer that never came tells nothing, so the portal itself is asked instead.
				const isTaken = isMoveApplied
					|| await this.isMoveWrittenOnPortal(portalSourceType, key, purpose, restorePoint.shared)
				;
				if (isTaken)
				{
					await this.undoPurposeChange(portalSourceType, key, purpose, restorePoint);
				}

				return false;
			}

			// Shared values live outside the draft, so the answer of the mutation carries neither the one
			// written nor the one the move back into the template deleted.
			if (purpose === 'shared' || SHARED_SOURCE_TYPES.includes(sourceType))
			{
				await this.reload();
			}

			this.selectedId = this.idOfPurpose(key, purpose);

			return true;
		},
		/**
		 * The answer of the move never came, so the portal is asked instead of guessed at: a shared value
		 * standing where the move started with none, or gone from where it started with one, is the move
		 * itself, applied. A read that did not answer knows nothing and leaves the portal alone.
		 */
		async isMoveWrittenOnPortal(
			portalSourceType: string,
			key: string,
			purpose: Purpose,
			startedWith: ProcessDataElement[],
		): Promise<boolean>
		{
			if (purpose !== 'shared' && !SHARED_SOURCE_TYPES.includes(portalSourceType))
			{
				return false;
			}

			// The read empties the errors of the refused move, and the window still has to say why it failed.
			const errors = this.errors;
			const isRead = await this.reload();
			this.errors = errors;

			// A read that failed leaves the catalog of before in the store, and it says nothing about the move.
			if (!isRead)
			{
				return false;
			}

			const id = elementId(portalSourceType, key);
			const wasOnPortal = startedWith.some((element) => elementId(element.sourceType, element.key) === id);
			const isOnPortal = this.shared.some((element) => elementId(element.sourceType, element.key) === id);

			return purpose === 'shared' ? isOnPortal && !wasOnPortal : wasOnPortal && !isOnPortal;
		},
		/**
		 * A shared value is written outside the draft (API-04), so a move the editor could not finish leaves
		 * the portal alone with it — whether the draft refused the change or the request saving it never
		 * reached the server: the write is taken back and the window returns to where the move started.
		 * Called only for a move the portal has already taken.
		 */
		async undoPurposeChange(
			portalSourceType: string,
			key: string,
			purpose: Purpose,
			restorePoint: {
				generation: number,
				diagramData: DiagramData,
				elements: ProcessDataElement[],
				shared: ProcessDataElement[],
			},
		): Promise<void>
		{
			const isSharedInvolved = purpose === 'shared' || SHARED_SOURCE_TYPES.includes(portalSourceType);
			if (!isSharedInvolved)
			{
				return;
			}

			const errors = this.errors;
			const movedBack = restorePoint.shared.find(
				(element) => elementId(element.sourceType, element.key) === elementId(portalSourceType, key),
			);

			// The diagram the move started on is gone: the portal is still put back, its canvas is not.
			const isSameDiagram = restorePoint.generation === this.readGeneration;
			if (isSameDiagram)
			{
				useDiagramStore().setDiagramData(restorePoint.diagramData);
				this.elements = restorePoint.elements;
			}

			let isUndone = false;
			if (purpose === 'shared')
			{
				isUndone = await this.removeShared(portalSourceType, key);
			}
			else if (movedBack)
			{
				isUndone = await this.upsertShared(portalSourceType, key, movedBack.property);
			}

			if (isSameDiagram)
			{
				this.shared = restorePoint.shared;
			}

			this.errors = isUndone ? errors : [...errors, {
				code: SHARED_NOT_RESTORED_CODE,
				message: Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_SHARED_NOT_RESTORED') ?? '',
				customData: null,
			}];
		},
		/** The element answers to another source after the change: the selection follows it to keep the form on it. */
		idOfPurpose(key: string, purpose: Purpose): string | null
		{
			const among = purpose === 'shared' ? this.shared : this.elements;
			const sameKey = among.filter((element) => element.key === key);
			const found = sameKey.find((element) => element.purpose === purpose) ?? sameKey[0] ?? null;

			return found === null ? null : elementId(found.sourceType, found.key);
		},
		remove(sourceType: string, key: string): Promise<boolean>
		{
			return this.applyMutation(() => processDataApi.deleteElement(readContext(), sourceType, key));
		},
		async usages(sourceType: string, key: string): Promise<ProcessDataUsage[]>
		{
			this.errors = [];
			try
			{
				const response = await processDataApi.getElementUsages(readContext(), sourceType, key);

				return response.usages ?? [];
			}
			catch (error)
			{
				this.errors = readErrors(error);

				return [];
			}
		},
		// A global value belongs to no template: it is written at once, without the draft (API-04).
		async upsertShared(sourceType: string, id: string, property: $Shape<ProcessDataProperty>): Promise<boolean>
		{
			if (!this.sharedAccess.canUpsert)
			{
				return false;
			}

			this.errors = [];
			try
			{
				const response = await processDataApi.upsertSharedElement(readScope(), sourceType, id, property);
				this.shared = mergeSharedElement(this.shared, response.element);

				return true;
			}
			catch (error)
			{
				this.errors = readErrors(error);

				return false;
			}
		},
		async removeShared(sourceType: string, id: string): Promise<boolean>
		{
			if (!this.sharedAccess.canDelete)
			{
				return false;
			}

			this.errors = [];
			try
			{
				await processDataApi.deleteSharedElement(readContext(), sourceType, id);
				this.shared = this.shared.filter(
					(element) => element.sourceType !== sourceType || element.key !== id,
				);

				return true;
			}
			catch (error)
			{
				this.errors = readErrors(error);

				return false;
			}
		},
	},
});
