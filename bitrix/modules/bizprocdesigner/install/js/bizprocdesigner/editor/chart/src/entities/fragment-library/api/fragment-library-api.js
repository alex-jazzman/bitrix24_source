import { Type } from 'main.core';

import { post } from '../../../shared/api';
import { type Block, type Connection } from '../../../shared/types';

/**
 * An item of the library as the server describes it (DTO-01). The visibility is the effective one and the
 * verdicts are counted by the server, so the client never recomputes the rights of a row it was given.
 */
export type FragmentListItem = {
	id: number,
	name: string,
	isShared: boolean,
	authorId: number,
	nodeCount: number,
	canEdit: boolean,
	canDelete: boolean,
};

export type FragmentListPage = {
	items: Array<FragmentListItem>,
	hasMore: boolean,
};

/** The selection of the scheme on its way into the library (API-02). */
export type NewFragment = {
	name: string,
	isShared: boolean,
	templateId: number,
	documentTypeSigned: string,
	blocks: Array<Block>,
	connections: Array<Connection>,
};

export type FragmentChanges = {
	name?: string,
	isShared?: boolean,
};

/** Why a node of the fragment never reached the scheme it was inserted into (DTO-03). */
export type FragmentSkipReasonType =
	'unsupported'
	| 'document_type'
	| 'locked'
	| 'hidden_group'
	| 'restricted_settings'
;

export type SkippedFragmentNode = {
	nodeName: string,
	reason: FragmentSkipReasonType,
};

export type FragmentNodeToReview = {
	nodeName: string,
	// The places to tune by hand, as AC-015 names them. Nothing reads them yet: the walk over the nodes
	// is what reaches the screen (decision Q-2).
	references: Array<string>,
};

/**
 * A fragment prepared for the canvas of the recipient (DTO-02): the node names in the blocks are the new
 * ones, and the two lists tell what was skipped and what is left to tune by hand.
 */
export type PreparedFragment = {
	blocks: Array<Block>,
	connections: Array<Connection>,
	skipped: Array<SkippedFragmentNode>,
	needsReview: Array<FragmentNodeToReview>,
};

/**
 * The codes the library answers a refusal with. ACCESS_DENIED is deliberately the single answer for
 * "not yours" and "not there" alike, so a refusal never tells that somebody else's fragment exists.
 *
 * `unknown` is the one member the server never sends: it stands for a failure that carried no code at all,
 * so that a caller reading the last refusal tells it from "nothing was refused".
 */
export const FragmentLibraryErrorCode = Object.freeze({
	accessDenied: 'ACCESS_DENIED',
	featureDisabled: 'FEATURE_DISABLED',
	unavailableByTariff: 'BP_DESIGNER_UNAVAILABLE_BY_TARIFF',
	invalidParam: 'INVALID_PARAM_ARG',
	emptySelection: 'EMPTY_TEMPLATE',
	tooLarge: 'FRAGMENT_TOO_LARGE',
	tooDeep: 'FRAGMENT_TOO_DEEP',
	formatUnsupported: 'FRAGMENT_FORMAT_UNSUPPORTED',
	unknown: 'UNKNOWN',
});

/**
 * A refusal by the switch of the feature or by the tariff means the client and the server disagree about
 * the surface: the entry point is not shown at all when the feature is off, so such an answer is not a
 * message to the user but a state the page has to be reloaded out of.
 */
const SURFACE_ERROR_CODES = Object.freeze([
	FragmentLibraryErrorCode.featureDisabled,
	FragmentLibraryErrorCode.unavailableByTariff,
]);

export function isSurfaceRefusal(errorCode: ?string): boolean
{
	return SURFACE_ERROR_CODES.includes(errorCode);
}

/**
 * The width of the name column of a fragment (SQL-01). The server holds the same ceiling, and holding it
 * here too is what lets a refusal be shown at the field instead of as a balloon over a window.
 */
export const FRAGMENT_NAME_MAX_LENGTH = 255;

const ACTION_PREFIX = 'FragmentLibrary.';

/**
 * The five actions of the library (API-01 ... API-05), transport only. It is a thin layer over the shared
 * post(): a refusal travels on as the typed ApiError, so the reading of errors[] stays in one place.
 */
export const fragmentLibraryApi = {
	list: async (limit: number, offset: number = 0): Promise<FragmentListPage> => {
		const data = await post(`${ACTION_PREFIX}list`, { limit, offset });

		return {
			items: Type.isArray(data?.items) ? data.items : [],
			hasMore: data?.hasMore === true,
		};
	},
	save: async (fragment: NewFragment): Promise<?FragmentListItem> => {
		const data = await post(`${ACTION_PREFIX}save`, fragment);

		return data?.item ?? null;
	},
	// A field left out of the changes is not changed: the server reads only the ones it was given.
	update: async (id: number, changes: FragmentChanges): Promise<?FragmentListItem> => {
		const data = await post(`${ACTION_PREFIX}update`, { id, ...changes });

		return data?.item ?? null;
	},
	remove: async (id: number): Promise<number> => {
		const data = await post(`${ACTION_PREFIX}delete`, { id });

		return Number(data?.id ?? id);
	},
	prepareInsert: async (
		id: number,
		templateId: number,
		documentTypeSigned: string,
	): Promise<PreparedFragment> => {
		const data = await post(`${ACTION_PREFIX}prepareInsert`, { id, templateId, documentTypeSigned });

		return {
			blocks: Type.isArray(data?.blocks) ? data.blocks : [],
			connections: Type.isArray(data?.connections) ? data.connections : [],
			skipped: Type.isArray(data?.skipped) ? data.skipped : [],
			needsReview: Type.isArray(data?.needsReview) ? data.needsReview : [],
		};
	},
};
