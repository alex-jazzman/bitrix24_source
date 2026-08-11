<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Document\Position;

use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Main\Type\DateTime;
use Bitrix\Note\Internal\Model\Document;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\DocumentRepository;

final readonly class BranchManager
{
	private DocumentRepository $repository;
	private PositionCalculator $calculator;

	public function __construct(
		?DocumentRepository $repository = null,
		?PositionCalculator $calculator = null
	)
	{
		$this->repository = $repository ?? new DocumentRepository();
		$this->calculator = $calculator ?? new PositionCalculator();
	}

	public function moveInsideBranch(
		Document $document,
		int $collectionId,
		?int $parentId,
		?int $targetPosition,
		int $userId
	): Result
	{
		$documentId = (int)$document->getId();
		$siblings = $this->removeDocumentFromBranch(
			$this->repository->getDocumentMetaByParent($collectionId, $parentId),
			$documentId,
		);
		if ($siblings === null)
		{
			return $this->createErrorResult('Document not found in source branch.');
		}

		$renumbered = [];
		$newPosition = $this->resolveGapPosition(
			$siblings,
			$collectionId,
			$parentId,
			$targetPosition,
			$userId,
			$documentId,
			$renumbered,
		);

		$updateResult = $this->updateDocument($document, [
			'POSITION' => $newPosition,
			'UPDATED_BY' => $userId,
			'UPDATED_AT' => new DateTime(),
		]);

		return $this->attachAffectedPositions($updateResult, $renumbered, $documentId, $newPosition);
	}

	public function moveBetweenBranches(
		Document $document,
		int $sourceCollectionId,
		?int $sourceParentId,
		int $targetCollectionId,
		?int $targetParentId,
		?int $targetPosition,
		int $userId,
		?array $precomputedSubtreeIds = null
	): Result
	{
		$documentId = (int)$document->getId();
		$sourceDocuments = $this->repository->getBranchDocumentsMeta($sourceCollectionId, $sourceParentId);
		if ($this->findDocumentById($sourceDocuments, $documentId) === null)
		{
			return $this->createErrorResult('Document not found in source branch.');
		}

		$targetDocuments = $this->repository->getDocumentMetaByParent($targetCollectionId, $targetParentId);
		$renumbered = [];
		$newPosition = $this->resolveGapPosition(
			$targetDocuments,
			$targetCollectionId,
			$targetParentId,
			$targetPosition,
			$userId,
			null,
			$renumbered,
		);

		$rootUpdateResult = $this->updateDocument($document, [
			'POSITION' => $newPosition,
			'COLLECTION_ID' => $targetCollectionId,
			'PARENT_ID' => $targetParentId,
			'UPDATED_BY' => $userId,
			'UPDATED_AT' => new DateTime(),
		]);
		if (!$rootUpdateResult->isSuccess())
		{
			return $rootUpdateResult;
		}

		if ($sourceCollectionId !== $targetCollectionId)
		{
			$cascadeResult = $this->cascadeDescendantsCollection(
				$documentId,
				$sourceCollectionId,
				$targetCollectionId,
				$precomputedSubtreeIds,
			);
			if (!$cascadeResult->isSuccess())
			{
				return $cascadeResult;
			}
		}

		return $this->attachAffectedPositions($rootUpdateResult, $renumbered, $documentId, $newPosition);
	}

	private function cascadeDescendantsCollection(
		int $rootId,
		int $sourceCollectionId,
		int $targetCollectionId,
		?array $precomputedSubtreeIds
	): Result
	{
		$subtreeIds = $precomputedSubtreeIds
			?? $this->repository->getSubtreeIds($rootId, $sourceCollectionId, true);
		$descendantIds = array_values(array_diff(
			array_map('intval', $subtreeIds),
			[$rootId],
		));
		if (empty($descendantIds))
		{
			return new Result();
		}

		$updateResult = DocumentTable::updateMulti($descendantIds, ['COLLECTION_ID' => $targetCollectionId], true);
		if (!$updateResult->isSuccess())
		{
			return $this->createOrmErrorResult($updateResult->getErrors());
		}

		return new Result();
	}

	public function reorderBranch(int $collectionId, ?int $parentId, array $orderedIds, int $userId): Result
	{
		$branchDocuments = $this->repository->getBranchDocumentsMeta($collectionId, $parentId);
		if (empty($branchDocuments))
		{
			return $this->createResultWithAffected([]);
		}

		$normalizedIds = $this->normalizeIds($orderedIds);
		$orderedBranch = $this->buildReorderedBranch($branchDocuments, $normalizedIds);

		$changes = [];
		$persistResult = $this->persistBranchOrder($orderedBranch, $collectionId, $parentId, $userId, null, true, $changes);
		if (!$persistResult->isSuccess())
		{
			return $persistResult;
		}

		return $this->createResultWithAffected($changes);
	}

	public function updateDocument(Document $document, array $fields): Result
	{
		$documentId = (int)$document->getId();
		if ($documentId <= 0)
		{
			return $this->createErrorResult('Invalid document id.');
		}

		$updateResult = DocumentTable::update($documentId, $fields);
		if (!$updateResult->isSuccess())
		{
			return $this->createOrmErrorResult($updateResult->getErrors());
		}

		$this->applyUpdatedFields($document, $fields);

		return $this->createDocumentResult($document);
	}

	private function persistBranchOrder(
		array $branchDocuments,
		int $collectionId,
		?int $parentId,
		int $userId,
		?int $touchDocumentId,
		bool $touchAll,
		array &$changesOut = []
	): Result
	{
		$result = new Result();
		$now = new DateTime();
		$total = count($branchDocuments);

		foreach (array_values($branchDocuments) as $index => $document)
		{
			$documentId = (int)$document->getId();
			if ($documentId <= 0)
			{
				return $this->createErrorResult('Invalid document id.');
			}

			$desiredPosition = $this->calculator->calculateSequentialPosition($total - 1 - $index);
			$fields = [];

			if ($document->getCollectionId() !== $collectionId)
			{
				$fields['COLLECTION_ID'] = $collectionId;
			}
			if (!$this->isSameParent($document->getParentId(), $parentId))
			{
				$fields['PARENT_ID'] = $parentId;
			}
			if ($document->getPosition() !== $desiredPosition)
			{
				$fields['POSITION'] = $desiredPosition;
				$changesOut[$documentId] = $desiredPosition;
			}
			if ($touchAll || ($touchDocumentId !== null && $documentId === $touchDocumentId))
			{
				$fields['UPDATED_BY'] = $userId;
				$fields['UPDATED_AT'] = $now;
			}
			if (empty($fields))
			{
				continue;
			}

			$updateResult = DocumentTable::update($documentId, $fields);
			if (!$updateResult->isSuccess())
			{
				return $this->createOrmErrorResult($updateResult->getErrors());
			}

			$this->applyUpdatedFields($document, $fields);
		}

		return $result;
	}

	private function resolveGapPosition(
		array $documents,
		int $collectionId,
		?int $parentId,
		?int $targetPosition,
		int $userId,
		?int $excludedDocumentId = null,
		array &$renumberedOut = []
	): ?int
	{
		$newPosition = $this->calculator->calculateGapPosition(
			$this->extractPositions($documents),
			$targetPosition,
		);
		if ($newPosition !== null)
		{
			return $newPosition;
		}

		$this->renumberBranch($collectionId, $parentId, $userId, $renumberedOut);

		$documents = $this->repository->getDocumentMetaByParent($collectionId, $parentId);
		if ($excludedDocumentId !== null)
		{
			$documents = $this->removeDocumentFromBranch($documents, $excludedDocumentId) ?? [];
		}

		return $this->calculator->calculateGapPosition(
			$this->extractPositions($documents),
			$targetPosition,
		);
	}

	private function extractPositions(array $documents): array
	{
		$positions = [];
		foreach ($documents as $document)
		{
			$positions[] = (int)$document->getPosition();
		}

		return $positions;
	}

	private function removeDocumentFromBranch(array $branchDocuments, int $documentId): ?array
	{
		$siblings = [];
		$foundDocument = false;

		foreach ($branchDocuments as $branchDocument)
		{
			if ((int)$branchDocument->getId() === $documentId)
			{
				$foundDocument = true;

				continue;
			}

			$siblings[] = $branchDocument;
		}

		return $foundDocument ? $siblings : null;
	}

	private function renumberBranch(int $collectionId, ?int $parentId, int $userId, array &$changesOut = []): void
	{
		$documents = $this->repository->getDocumentMetaByParent($collectionId, $parentId);
		if (empty($documents))
		{
			return;
		}

		$this->persistBranchOrder($documents, $collectionId, $parentId, $userId, null, false, $changesOut);
	}

	private function buildReorderedBranch(array $branchDocuments, array $orderedIds): array
	{
		$documentMap = [];
		foreach ($branchDocuments as $document)
		{
			$documentMap[(int)$document->getId()] = $document;
		}

		$ordered = [];
		$used = [];

		foreach ($orderedIds as $id)
		{
			if (!isset($documentMap[$id]) || isset($used[$id]))
			{
				continue;
			}

			$ordered[] = $documentMap[$id];
			$used[$id] = true;
		}

		foreach ($branchDocuments as $document)
		{
			$id = (int)$document->getId();
			if (isset($used[$id]))
			{
				continue;
			}

			$ordered[] = $document;
		}

		return $ordered;
	}

	private function normalizeIds(array $ids): array
	{
		$normalizedIds = [];
		foreach ($ids as $id)
		{
			$id = (int)$id;
			if ($id <= 0)
			{
				continue;
			}

			$normalizedIds[$id] = $id;
		}

		return array_values($normalizedIds);
	}

	private function applyUpdatedFields(Document $document, array $fields): void
	{
		if (array_key_exists('POSITION', $fields))
		{
			$document->setPosition((int)$fields['POSITION']);
		}
		if (array_key_exists('COLLECTION_ID', $fields))
		{
			$document->setCollectionId((int)$fields['COLLECTION_ID']);
		}
		if (array_key_exists('PARENT_ID', $fields))
		{
			$document->setParentId($fields['PARENT_ID'] === null ? null : (int)$fields['PARENT_ID']);
		}
		if (array_key_exists('UPDATED_BY', $fields))
		{
			$document->setUpdatedBy((int)$fields['UPDATED_BY']);
		}
		if (($fields['UPDATED_AT'] ?? null) instanceof DateTime)
		{
			$document->setUpdatedAt($fields['UPDATED_AT']);
		}
	}

	private function createDocumentResult(?Document $document): Result
	{
		$result = new Result();
		$result->setData(['document' => $document, 'affectedPositions' => []]);

		return $result;
	}

	/**
	 * Merges renumber-induced position changes with the moved document's
	 * final position. The moved document's final position always wins over
	 * any earlier renumber entry for the same id.
	 */
	private function attachAffectedPositions(
		Result $result,
		array $renumbered,
		int $movedDocumentId,
		?int $finalPosition
	): Result
	{
		if (!$result->isSuccess())
		{
			return $result;
		}

		if ($finalPosition !== null)
		{
			$renumbered[$movedDocumentId] = $finalPosition;
		}

		$data = $result->getData();
		$data['affectedPositions'] = $this->buildAffectedList($renumbered);
		$result->setData($data);

		return $result;
	}

	private function createResultWithAffected(array $changes): Result
	{
		$result = new Result();
		$result->setData(['affectedPositions' => $this->buildAffectedList($changes)]);

		return $result;
	}

	/**
	 * @param array<int,int> $changes id => position
	 * @return list<array{id:int,position:int}>
	 */
	private function buildAffectedList(array $changes): array
	{
		$out = [];
		foreach ($changes as $id => $position)
		{
			$out[] = ['id' => (int)$id, 'position' => (int)$position];
		}

		return $out;
	}

	private function createErrorResult(string $message): Result
	{
		$result = new Result();
		$result->addError(new Error($message));

		return $result;
	}

	private function createOrmErrorResult(array $errors): Result
	{
		$result = new Result();
		foreach ($errors as $error)
		{
			$result->addError($error);
		}

		return $result;
	}

	private function findDocumentById(array $documents, int $documentId): ?Document
	{
		foreach ($documents as $document)
		{
			if ((int)$document->getId() === $documentId)
			{
				return $document;
			}
		}

		return null;
	}

	private function isSameParent(?int $leftParentId, ?int $rightParentId): bool
	{
		return ($leftParentId === null && $rightParentId === null)
			|| ($leftParentId !== null && $rightParentId !== null && $leftParentId === $rightParentId)
		;
	}
}
