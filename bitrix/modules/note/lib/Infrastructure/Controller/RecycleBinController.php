<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Controller;

use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use Bitrix\Note\Infrastructure\Controller\ActionFilter;
use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Access\Service\DocumentAccessService;
use Bitrix\Note\Internal\Exceptions\OrphanRestoreTargetRequiredException;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;
use Bitrix\Note\Public\Command\EmptyRecycleBinCommand;
use Bitrix\Note\Public\Command\HardDeleteDocumentCommand;
use Bitrix\Note\Public\Command\RestoreAllFromRecycleBinCommand;
use Bitrix\Note\Public\Command\RestoreDocumentFromRecycleBinCommand;
use Bitrix\Note\Public\Provider\RecycleBinProvider;

class RecycleBinController extends Controller
{
	public const ERROR_ORPHAN_TARGET_REQUIRED = 'NOTE_RECYCLE_BIN_ORPHAN_TARGET_REQUIRED';

	protected function getDefaultPreFilters(): array
	{
		return array_merge(
			parent::getDefaultPreFilters(),
			[
				new ActionFilter\NoteAccess(),
			],
		);
	}

	public function listAction(int $limit = 50, ?array $afterCursor = null): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		$limit = max(1, min(200, $limit));
		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);

		$payload = (new RecycleBinProvider())->getRecycleBinForUser($accessCodes, $userId, $limit, $afterCursor);
		$payload['isAdmin'] = DocumentAccessService::isPortalAdmin($userId);

		return $payload;
	}

	public function restoreDocumentAction(int $recycleBinId, ?int $targetCollectionId = null): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		$record = (new RecycleBinRepository())->getById($recycleBinId);
		if ($record === null)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_TRASH_RESTORE_ERROR')));

			return null;
		}

		if (!DocumentAccessService::canRestoreFromRecycleBin($userId, $record))
		{
			$this->denyAccess();

			return null;
		}

		if ($targetCollectionId !== null && $targetCollectionId > 0 && !$this->userCanManageCollection($userId, $targetCollectionId))
		{
			$this->denyAccess();

			return null;
		}

		try
		{
			$result = (new RestoreDocumentFromRecycleBinCommand($recycleBinId, $userId, $targetCollectionId))->run();
		}
		catch (OrphanRestoreTargetRequiredException)
		{
			$this->addError(new Error(
				Loc::getMessage('NOTE_DOCUMENT_TRASH_ORPHAN_TARGET_REQUIRED'),
				self::ERROR_ORPHAN_TARGET_REQUIRED,
			));

			return null;
		}
		catch (SystemException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_TRASH_RESTORE_ERROR')));

			return null;
		}

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return [
			'documentId' => (int)($result->getData()['documentId'] ?? $record->getDocumentId()),
		];
	}

	public function getStatsAction(): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);

		return (new RecycleBinProvider())->getStatsForUser($userId, $accessCodes);
	}

	public function restoreAllAction(?int $orphanTargetCollectionId = null): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);

		$normalizedTarget = $orphanTargetCollectionId !== null && $orphanTargetCollectionId > 0
			? $orphanTargetCollectionId
			: null
		;

		if ($normalizedTarget !== null && !$this->userCanManageCollection($userId, $normalizedTarget))
		{
			$this->denyAccess();

			return null;
		}

		try
		{
			$result = (new RestoreAllFromRecycleBinCommand($userId, $accessCodes, $normalizedTarget))->run();
		}
		catch (SystemException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_TRASH_RESTORE_ALL_ERROR')));

			return null;
		}

		return [
			'restored' => (int)($result->getData()['restoredCount'] ?? 0),
			'skippedOrphan' => (int)($result->getData()['skippedOrphans'] ?? 0),
		];
	}

	public function hardDeleteDocumentAction(int $recycleBinId): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		$record = (new RecycleBinRepository())->getById($recycleBinId);
		if ($record === null)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_TRASH_HARD_DELETE_ERROR')));

			return null;
		}

		if (!DocumentAccessService::canHardDeleteFromRecycleBin($userId, $record))
		{
			$this->denyAccess();

			return null;
		}

		try
		{
			$result = (new HardDeleteDocumentCommand($recycleBinId, $userId))->run();
		}
		catch (SystemException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_TRASH_HARD_DELETE_ERROR')));

			return null;
		}

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return [
			'documentId' => (int)($result->getData()['documentId'] ?? 0),
		];
	}

	public function emptyAction(): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);

		try
		{
			$result = (new EmptyRecycleBinCommand($userId, $accessCodes))->run();
		}
		catch (SystemException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_TRASH_EMPTY_ERROR')));

			return null;
		}

		return [
			'deleted' => (int)($result->getData()['deletedCount'] ?? 0),
		];
	}

	private function denyAccess(): void
	{
		$this->addError(new Error((string)(Loc::getMessage('NOTE_ACCESS_DENIED'))));
	}

	private function userCanManageCollection(int $userId, int $collectionId): bool
	{
		if (DocumentAccessService::isPortalAdmin($userId))
		{
			return true;
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);

		return CollectionAccessService::hasCollectionLevel(
			$collectionId,
			$userId,
			$accessCodes,
			CollectionAccessService::LEVEL_MANAGE,
		);
	}
}
