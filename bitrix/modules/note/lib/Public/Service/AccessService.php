<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Service;

use Bitrix\Note\Internal\Access\AccessController;
use Bitrix\Note\Internal\Access\ActionDictionary;
use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Access\Service\DocumentAccessService;
use Bitrix\Note\Internal\Exceptions\AccessDeniedException;

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

	public static function canModerateCollection(int $collectionId): bool
	{
		return CollectionAccessService::currentUserHasLevel($collectionId, CollectionAccessService::LEVEL_MODERATE);
	}

	public static function canCreateInCollection(int $collectionId): bool
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

	public static function assertCanCreateCollections(): void
	{
		if (!self::canCreateCollections())
		{
			throw new AccessDeniedException();
		}
	}

	public static function assertCanViewCollection(int $collectionId): void
	{
		if (!self::canViewCollection($collectionId))
		{
			throw new AccessDeniedException();
		}
	}

	public static function assertCanEditCollection(int $collectionId): void
	{
		if (!self::canEditCollection($collectionId))
		{
			throw new AccessDeniedException();
		}
	}

	public static function assertCanModerateCollection(int $collectionId): void
	{
		if (!self::canModerateCollection($collectionId))
		{
			throw new AccessDeniedException();
		}
	}

	public static function assertCanCreateInCollection(int $collectionId): void
	{
		if (!self::canCreateInCollection($collectionId))
		{
			throw new AccessDeniedException();
		}
	}

	public static function assertCanEditDocument(int $documentId, int $collectionId): void
	{
		if (!self::canEditDocument($documentId, $collectionId))
		{
			throw new AccessDeniedException();
		}
	}
}
