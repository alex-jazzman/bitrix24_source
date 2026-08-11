<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Analytics;

/**
 * Wire-level constants and EVENT-MAP for note analytics (see SDD-analytics.md, section P1.T1).
 * String values are dictated by the BI pipeline and must not be renamed.
 */
final class AnalyticsDictionary
{
	public const TOOL = 'bk';
	public const CATEGORY = 'bk';

	// Transport of the event: engine UI (bk), REST V3 (rest), import pipeline (import).
	public const TYPE_BK = 'bk';
	public const TYPE_REST = 'rest';
	public const TYPE_IMPORT = 'import';

	public const SECTION_BK = 'bk';

	public const SUB_SECTION_SHOW_ALL_RESULTS = 'show_all_results';

	public const ELEMENT_ADD_BUTTON = 'add_button';
	public const ELEMENT_ACCESS_RIGHTS = 'access_rights';
	public const ELEMENT_EDIT_TEXT = 'edit_text';
	public const ELEMENT_VIEW_BUTTON = 'view_button';

	public const EVENT_CREATE_COLLECTION = 'create_collection';
	public const EVENT_DELETE_COLLECTION = 'delete_collection';
	public const EVENT_ARCHIVE_COLLECTION = 'archive_collection';
	public const EVENT_CHANGE_COLLECTION = 'change_collection';
	public const EVENT_VIEW_COLLECTION = 'view_collection';
	public const EVENT_VIEW_DOCUMENT = 'view_document';
	public const EVENT_CREATE_DOCUMENT = 'create_document';
	public const EVENT_CHANGE_DOCUMENT = 'change_document';
	public const EVENT_ARCHIVE_DOCUMENT = 'archive_document';
	public const EVENT_DELETE_DOCUMENT = 'delete_document';
	public const EVENT_ADD_FILE = 'add_file';
	public const EVENT_SEARCH_RESULT = 'search_result';

	// change_document is the single document-change event; c_element tells the two gestures apart:
	// access_rights (ACL edit) vs edit_text (title/content edit). update_document was merged into it.
	public const CHANGE_TYPE_ACCESS_RIGHTS = 'access_rights';
	public const CHANGE_TYPE_EDIT_TEXT = 'edit_text';

	/** @var string[] Valid $changeType values for documentUpdated() (edit_text only). */
	public const DOCUMENT_CHANGE_TYPES = [
		self::CHANGE_TYPE_EDIT_TEXT,
	];
}
