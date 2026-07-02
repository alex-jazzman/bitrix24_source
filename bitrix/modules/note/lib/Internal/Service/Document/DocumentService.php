<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Document;

use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Model\Document;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Document\Position\PositionCalculator;
use Bitrix\Note\Internal\Service\DocumentFileService;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;
use Bitrix\Note\Internal\Service\User\SystemUser;
use Bitrix\Note\Internal\Util\IdNormalizer;

class DocumentService
{
	public function __construct(
		private readonly DocumentRepository $repository = new DocumentRepository(),
		private readonly DocumentFileService $documentFileService = new DocumentFileService(),
		private readonly PositionCalculator $positionCalculator = new PositionCalculator(),
		private readonly SearchIndexService $searchIndexService = new SearchIndexService(),
	)
	{
	}

	/**
	 * Creates a new document.
	 *
	 * @throws SystemException on validation or persistence failure
	 */
	public function create(
		int $collectionId,
		?int $parentId,
		string $title,
		string $markdown,
		int $userId,
		string $contentFormat = DocumentTable::CONTENT_FORMAT_YJS,
	): Document
	{
		$this->assertParentBelongsToCollection($parentId, $collectionId);

		$position = $this->positionCalculator->calculateNextPosition(
			$this->repository->getMaxPosition($collectionId, $parentId)
		);

		$document = DocumentTable::createObject()
			->setCollectionId($collectionId)
			->setParentId($parentId)
			->setTitle($title)
			->setMarkdown($markdown)
			->setContentFormat($contentFormat)
			->setPosition($position)
			->setIsArchived(false)
			->setCreatedBy($userId)
			->setUpdatedBy($userId)
		;

		$saveResult = $this->repository->save($document);
		if (!$saveResult->isSuccess())
		{
			throw new SystemException($this->buildSaveErrorMessage(
				$saveResult->getErrorMessages(),
				'Failed to save document',
			));
		}

		$saved = $saveResult->getData()['document'] ?? null;
		if (!$saved instanceof Document)
		{
			throw new SystemException('Failed to save document');
		}

		if ($contentFormat === DocumentTable::CONTENT_FORMAT_MD)
		{
			try
			{
				$this->searchIndexService->indexDocument((int)$saved->getId(), $markdown, $title);
			}
			catch (\Throwable)
			{
			}
		}

		return $saved;
	}

	/**
	 * Updates an existing document. Returns null if document not found.
	 *
	 * @throws SystemException on validation or persistence failure
	 */
	public function update(
		int $id,
		?string $title,
		string|array|null $markdown,
		int $userId,
		?string $contentFormat = null,
		?array $referencedFileIds = null,
	): ?Document
	{
		$document = $this->repository->getById($id);
		if ($document === null)
		{
			return null;
		}

		if ($title !== null)
		{
			$document->setTitle($title);
		}

		if ($markdown !== null)
		{
			if (is_array($markdown))
			{
				$this->validateReferencedFileIds($markdown, $referencedFileIds);
			}
			$document->setMarkdown($markdown);
		}

		if ($contentFormat !== null)
		{
			$allowedFormats = [
				DocumentTable::CONTENT_FORMAT_JSON,
				DocumentTable::CONTENT_FORMAT_MD,
				DocumentTable::CONTENT_FORMAT_YJS,
			];
			if (!in_array($contentFormat, $allowedFormats, true))
			{
				throw new SystemException('Invalid document content format');
			}
			$document->setContentFormat($contentFormat);
		}
		elseif (is_array($markdown))
		{
			$document->setContentFormat(DocumentTable::CONTENT_FORMAT_JSON);
		}

		$document->setUpdatedBy($userId);
		$saveResult = $this->repository->save($document);
		if (!$saveResult->isSuccess())
		{
			throw new SystemException($this->buildSaveErrorMessage(
				$saveResult->getErrorMessages(),
				'Failed to save document',
			));
		}

		$saved = $saveResult->getData()['document'] ?? null;
		if (!$saved instanceof Document)
		{
			throw new SystemException('Failed to save document');
		}

		$savedFormat = $saved->getContentFormat();
		$shouldReindex =
			($savedFormat === DocumentTable::CONTENT_FORMAT_MD && (is_string($markdown) || $title !== null))
			|| ($savedFormat === DocumentTable::CONTENT_FORMAT_YJS && $title !== null)
		;
		if ($shouldReindex)
		{
			try
			{
				$this->searchIndexService->indexDocument(
					(int)$saved->getId(),
					is_string($markdown) ? $markdown : null,
					$saved->getTitle(),
				);
			}
			catch (\Throwable)
			{
			}
		}

		return $saved;
	}

	/**
	 * Batch fetch by IDs. Returns map [id => row].
	 *
	 * @param int[] $ids
	 * @param string[] $select
	 * @return array<int, array<string, mixed>>
	 */
	public function findByIds(array $ids, array $select = ['ID', 'PARENT_ID', 'TITLE', 'MARKDOWN']): array
	{
		return $this->repository->getByIds($ids, $select);
	}

	public function setMarkdown(int $id, string $markdown): void
	{
		$this->repository->updatePartial($id, ['MARKDOWN' => $markdown]);
	}

	public function clearYjsState(int $id): void
	{
		$this->repository->updatePartial($id, ['YJS_STATE' => null]);
	}

	/**
	 * System-level document creation without a user actor.
	 * CREATED_BY / UPDATED_BY are set to SystemUser::ID. No update-log row
	 * and no document-access work — caller relies on collection-level policy.
	 *
	 * Use only for module bootstrap (welcome content). Do NOT call from
	 * user-facing code — use create() instead.
	 *
	 * Returns the new document id or null on failure.
	 */
	public function createAsSystem(
		int $collectionId,
		?int $parentId,
		string $title,
		string $markdown,
		string $contentFormat = DocumentTable::CONTENT_FORMAT_MD,
	): ?int
	{
		if ($collectionId <= 0)
		{
			return null;
		}

		$position = $this->positionCalculator->calculateNextPosition(
			$this->repository->getMaxPosition($collectionId, $parentId)
		);

		$document = DocumentTable::createObject()
			->setCollectionId($collectionId)
			->setParentId($parentId)
			->setTitle($title)
			->setMarkdown($markdown)
			->setContentFormat($contentFormat)
			->setPosition($position)
			->setIsArchived(false)
			->setCreatedBy(SystemUser::ID)
			->setUpdatedBy(SystemUser::ID)
		;

		$saveResult = $this->repository->save($document);
		if (!$saveResult->isSuccess())
		{
			return null;
		}

		$saved = $saveResult->getData()['document'] ?? null;
		if (!$saved instanceof Document)
		{
			return null;
		}

		$id = (int)$saved->getId();
		if ($id <= 0)
		{
			return null;
		}

		if ($contentFormat === DocumentTable::CONTENT_FORMAT_MD)
		{
			try
			{
				$this->searchIndexService->indexDocument($id, $markdown, $title);
			}
			catch (\Throwable)
			{
			}
		}

		return $id;
	}

	private function validateReferencedFileIds(array $markdown, ?array $referencedFileIds): void
	{
		$fileIds = is_array($referencedFileIds)
			? IdNormalizer::normalize($referencedFileIds)
			: $this->documentFileService->extractFileIds($markdown)
		;
		if (empty($fileIds))
		{
			return;
		}

		$validatedFileIdsMap = array_fill_keys(
			$this->documentFileService->getValidatedNoteFileIds($fileIds),
			true,
		);
		foreach ($fileIds as $fileId)
		{
			if (!isset($validatedFileIdsMap[$fileId]))
			{
				throw new SystemException('Document references an invalid file');
			}
		}
	}

	private function buildSaveErrorMessage(array $errorMessages, string $defaultMessage): string
	{
		return empty($errorMessages) ? $defaultMessage : implode(', ', $errorMessages);
	}

	/**
	 * @throws SystemException when parent does not exist or lives in another collection.
	 */
	private function assertParentBelongsToCollection(?int $parentId, int $collectionId): void
	{
		if ($parentId === null || $parentId <= 0)
		{
			return;
		}

		$parent = $this->repository->getMetaById($parentId, ['ID', 'COLLECTION_ID']);
		if ($parent === null || (int)$parent->getCollectionId() !== $collectionId)
		{
			throw new SystemException('Parent document does not belong to the target collection.');
		}
	}
}
