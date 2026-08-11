<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\RecycleBin;

use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Main\Type\DateTime;
use Bitrix\Note\Internal\Entity\RecycleBin\RecycleBinRecord;
use Bitrix\Note\Internal\Exceptions\OrphanRestoreTargetRequiredException;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\CollectionRepository;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;
use Bitrix\Note\Internal\Service\Document\Position\PositionCalculator;

class RestoreFromRecycleBinService
{
	public const ERROR_DOCUMENT_MISSING = 'NOTE_RESTORE_DOCUMENT_MISSING';

	public function __construct(
		private readonly RecycleBinRepository $recycleBinRepository = new RecycleBinRepository(),
		private readonly DocumentRepository $documentRepository = new DocumentRepository(),
		private readonly CollectionRepository $collectionRepository = new CollectionRepository(),
		private readonly PositionCalculator $positionCalculator = new PositionCalculator(),
	) {}

	/**
	 * Restores a single recycle-bin entry. The hint dictates whether the document returns to
	 * archived state (IS_ARCHIVED='Y') or to live; PARENT_ID is preserved only when target
	 * collection equals the original AND that parent is alive (not archived, not in bin).
	 *
	 * If the original collection is gone and $targetCollectionId is null,
	 * OrphanRestoreTargetRequiredException is thrown — the caller (controller) must surface
	 * the orphan-restore picker.
	 */
	public function restore(RecycleBinRecord $record, ?int $targetCollectionId, int $userId): Result
	{
		$result = new Result();

		$documentId = $record->getDocumentId();
		$document = $this->documentRepository->getMetaById($documentId);
		if ($document === null)
		{
			$result->addError(new Error('Document missing', self::ERROR_DOCUMENT_MISSING));

			return $result;
		}

		$wasArchivedBeforeTrash = $document->getIsArchived();
		$originalCollectionId = (int)$document->getCollectionId();
		$pickedCollectionId = $targetCollectionId ?? $originalCollectionId;
		$collection = $this->collectionRepository->getById($pickedCollectionId);
		if ($collection === null)
		{
			throw new OrphanRestoreTargetRequiredException();
		}

		$collectionId = (int)$collection->getId();
		$originalParentId = $document->getParentId() !== null ? (int)$document->getParentId() : null;

		$parentId = null;
		if ($collectionId === $originalCollectionId && $originalParentId !== null)
		{
			$parent = $this->documentRepository->getMetaById($originalParentId);
			if (
				$parent !== null
				&& !$parent->getIsArchived()
				&& (int)$parent->getCollectionId() === $collectionId
				&& !$this->recycleBinRepository->isInRecycleBin((int)$parent->getId())
			)
			{
				$parentId = (int)$parent->getId();
			}
		}

		$position = $this->positionCalculator->calculateNextPosition(
			$this->documentRepository->getMaxPosition($collectionId, $parentId),
		);

		$update = [
			'POSITION' => $position,
			'UPDATED_AT' => new DateTime(),
			'UPDATED_BY' => $userId,
		];
		if ($collectionId !== $originalCollectionId)
		{
			$update['COLLECTION_ID'] = $collectionId;
		}
		if ($parentId !== $originalParentId)
		{
			$update['PARENT_ID'] = $parentId;
		}

		DocumentTable::update($documentId, $update);

		$this->recycleBinRepository->deleteById((int)$record->getId());

		$result->setData([
			'documentId' => $documentId,
			'collectionId' => $collectionId,
			'parentId' => $parentId,
			'position' => $position,
			'wasArchivedBeforeTrash' => $wasArchivedBeforeTrash,
		]);

		return $result;
	}
}
