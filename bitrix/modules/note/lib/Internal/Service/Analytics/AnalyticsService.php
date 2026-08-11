<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Analytics;

use Bitrix\Main\Analytics\AnalyticsEvent;

/**
 * Backend facade for note analytics (EVENT-MAP / API-CORE-BE, see SDD-analytics.md § P1.T2).
 * One static method per business event; tool/category are fixed to 'bk'.
 *
 * send() itself is best-effort: the core swallows transport errors in production. This does NOT
 * cover build*(): setP1/setP2 validate the pN value (AnalyticsEvent allows at most one underscore)
 * and throw at build time. All current payloads satisfy this (camelCase JSON keys, numeric p2), so
 * no guard is added — keep pN values underscore-safe when adding new events.
 *
 * Each public method delegates to a matching build*() method that returns a fully configured,
 * unsent AnalyticsEvent. This keeps build*() unit-testable via exportToArray() without triggering
 * a real send().
 */
final class AnalyticsService
{
	public static function collectionCreated(bool $success, ?string $statsJson = null, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildCollectionCreated($success, $statsJson, $type)->send();
	}

	public static function collectionDeleted(bool $success, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildEvent(AnalyticsDictionary::EVENT_DELETE_COLLECTION, $success, $type)->send();
	}

	public static function collectionArchived(bool $success, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildEvent(AnalyticsDictionary::EVENT_ARCHIVE_COLLECTION, $success, $type)->send();
	}

	public static function collectionAccessChanged(bool $success, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildCollectionAccessChanged($success, $type)->send();
	}

	public static function documentAccessChanged(bool $success, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildDocumentAccessChanged($success, $type)->send();
	}

	public static function documentCreated(bool $success, ?string $statsJson = null, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildDocumentCreated($success, $statsJson, $type)->send();
	}

	public static function documentUpdated(string $changeType, bool $success, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildDocumentUpdated($changeType, $success, $type)->send();
	}

	public static function documentArchived(bool $success, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildEvent(AnalyticsDictionary::EVENT_ARCHIVE_DOCUMENT, $success, $type)->send();
	}

	public static function documentDeleted(bool $success, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildEvent(AnalyticsDictionary::EVENT_DELETE_DOCUMENT, $success, $type)->send();
	}

	public static function fileAdded(float $sizeMb, bool $success, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildFileAdded($sizeMb, $success, $type)->send();
	}

	public static function searchResult(bool $success, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildSearchResult($success, $type)->send();
	}

	// view_document / view_collection read events. Currently used for REST reads (getAction): no UI
	// source, so no c_sub_section/c_element — just the bare event with the transport type. The web SPA
	// sends its own richer view events from the frontend (with UI c_sub_section + c_element=view_button).
	public static function documentViewed(bool $success = true, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildDocumentViewed($success, $type)->send();
	}

	public static function collectionViewed(bool $success = true, string $type = AnalyticsDictionary::TYPE_BK): void
	{
		self::buildCollectionViewed($success, $type)->send();
	}

	protected static function buildCollectionCreated(bool $success, ?string $statsJson, string $type = AnalyticsDictionary::TYPE_BK): AnalyticsEvent
	{
		$event = self::buildEvent(AnalyticsDictionary::EVENT_CREATE_COLLECTION, $success, $type)
			->setElement(AnalyticsDictionary::ELEMENT_ADD_BUTTON)
		;

		if ($statsJson !== null)
		{
			$event->setP1($statsJson);
		}

		return $event;
	}

	protected static function buildCollectionAccessChanged(bool $success, string $type = AnalyticsDictionary::TYPE_BK): AnalyticsEvent
	{
		return self::buildEvent(AnalyticsDictionary::EVENT_CHANGE_COLLECTION, $success, $type)
			->setElement(AnalyticsDictionary::ELEMENT_ACCESS_RIGHTS)
		;
	}

	protected static function buildDocumentAccessChanged(bool $success, string $type = AnalyticsDictionary::TYPE_BK): AnalyticsEvent
	{
		return self::buildEvent(AnalyticsDictionary::EVENT_CHANGE_DOCUMENT, $success, $type)
			->setElement(AnalyticsDictionary::ELEMENT_ACCESS_RIGHTS)
		;
	}

	protected static function buildDocumentCreated(bool $success, ?string $statsJson, string $type = AnalyticsDictionary::TYPE_BK): AnalyticsEvent
	{
		$event = self::buildEvent(AnalyticsDictionary::EVENT_CREATE_DOCUMENT, $success, $type);

		if ($statsJson !== null)
		{
			$event->setP1($statsJson);
		}

		return $event;
	}

	protected static function buildDocumentUpdated(string $changeType, bool $success, string $type = AnalyticsDictionary::TYPE_BK): AnalyticsEvent
	{
		// Content edits share change_document with ACL edits; c_element (edit_text) distinguishes them.
		return self::buildEvent(AnalyticsDictionary::EVENT_CHANGE_DOCUMENT, $success, $type)
			->setElement($changeType)
		;
	}

	protected static function buildFileAdded(float $sizeMb, bool $success, string $type = AnalyticsDictionary::TYPE_BK): AnalyticsEvent
	{
		return self::buildEvent(AnalyticsDictionary::EVENT_ADD_FILE, $success, $type)
			->setP2((string)$sizeMb)
		;
	}

	protected static function buildSearchResult(bool $success, string $type = AnalyticsDictionary::TYPE_BK): AnalyticsEvent
	{
		return self::buildEvent(AnalyticsDictionary::EVENT_SEARCH_RESULT, $success, $type)
			->setSubSection(AnalyticsDictionary::SUB_SECTION_SHOW_ALL_RESULTS)
		;
	}

	protected static function buildDocumentViewed(bool $success, string $type = AnalyticsDictionary::TYPE_BK): AnalyticsEvent
	{
		return self::buildEvent(AnalyticsDictionary::EVENT_VIEW_DOCUMENT, $success, $type);
	}

	protected static function buildCollectionViewed(bool $success, string $type = AnalyticsDictionary::TYPE_BK): AnalyticsEvent
	{
		return self::buildEvent(AnalyticsDictionary::EVENT_VIEW_COLLECTION, $success, $type);
	}

	/**
	 * Base event builder shared by all facade methods: fixes tool/category/section, sets status and transport type.
	 */
	private static function buildEvent(string $eventName, bool $success, string $type = AnalyticsDictionary::TYPE_BK): AnalyticsEvent
	{
		$event = (new AnalyticsEvent($eventName, AnalyticsDictionary::TOOL, AnalyticsDictionary::CATEGORY))
			->setSection(AnalyticsDictionary::SECTION_BK)
			->setType($type)
		;

		return $success ? $event->markAsSuccess() : $event->markAsError();
	}
}
