<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Service;

use Bitrix\Note\Internal\Access\AccessController;
use Bitrix\Note\Internal\Access\ActionDictionary;
use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Access\Service\DocumentAccessService;

final class AccessService
{
	public static function canAccess(): bool
	{
		return AccessController::getCurrent()->check(ActionDictionary::ACTION_NOTE_ACCESS);
	}

	public static function canEditPermissions(): bool
	{
		return AccessController::getCurrent()->check(ActionDictionary::ACTION_NOTE_EDIT_PERMISSIONS);
	}

	public static function canCreateCollections(): bool
	{
		return AccessController::getCurrent()->check(ActionDictionary::ACTION_NOTE_CREATE_COLLECTIONS);
	}

	public static function canViewCollection(int $collectionId): bool
	{
		return CollectionAccessService::currentUserHasLevel($collectionId, CollectionAccessService::LEVEL_VIEW);
	}

	public static function canEditCollection(int $collectionId): bool
	{
		return CollectionAccessService::currentUserHasLevel($collectionId, CollectionAccessService::LEVEL_MANAGE);
	}

	public static function canViewDocument(int $documentId, int $collectionId): bool
	{
		return DocumentAccessService::currentUserHasLevel($documentId, $collectionId, DocumentAccessService::LEVEL_VIEW);
	}

	public static function canEditDocument(int $documentId, int $collectionId): bool
	{
		return DocumentAccessService::currentUserHasLevel($documentId, $collectionId, DocumentAccessService::LEVEL_EDIT);
	}
}
