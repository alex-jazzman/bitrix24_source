<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Repository\CollectionRepository;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;

class ArchiveCollectionCommand extends AbstractCommand
{
	private readonly int $collectionId;
	private readonly int $userId;
	private readonly CollectionRepository $collectionRepository;
	private readonly DocumentRepository $documentRepository;
	private readonly SearchIndexService $searchIndexService;

	public function __construct(
		int $collectionId,
		int $userId,
		?CollectionRepository $collectionRepository = null,
		?DocumentRepository $documentRepository = null,
		?SearchIndexService $searchIndexService = null,
	)
	{
		$this->collectionId = $collectionId;
		$this->userId = $userId;
		$this->collectionRepository = $collectionRepository ?? new CollectionRepository();
		$this->documentRepository = $documentRepository ?? new DocumentRepository();
		$this->searchIndexService = $searchIndexService ?? new SearchIndexService();
	}

	protected function execute(): Result
	{
		if ($this->collectionId <= 0)
		{
			return $this->createResult(['success' => false, 'archivedIds' => []]);
		}

		$collection = $this->collectionRepository->getById($this->collectionId);
		if ($collection === null || $collection->getIsArchived())
		{
			return $this->createResult(['success' => false, 'archivedIds' => []]);
		}

		$documentIds = $this->documentRepository->getLiveCollectionDocumentIds($this->collectionId);
		if (!empty($documentIds))
		{
			$this->documentRepository->archiveByIds($documentIds, $this->userId);

			try
			{
				$this->searchIndexService->deindexDocuments($documentIds);
			}
			catch (\Throwable)
			{
			}
		}

		$collectionArchived = $this->collectionRepository->archiveById($this->collectionId);

		return $this->createResult([
			'success' => $collectionArchived,
			'archivedIds' => $documentIds,
		]);
	}

	private function createResult(array $data = []): Result
	{
		$result = new Result();
		if (!empty($data))
		{
			$result->setData($data);
		}

		return $result;
	}
}
