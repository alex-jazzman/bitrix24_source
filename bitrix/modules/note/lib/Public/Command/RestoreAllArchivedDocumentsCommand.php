<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\CollectionRepository;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;
use Bitrix\Note\Public\Provider\DocumentProvider;

class RestoreAllArchivedDocumentsCommand extends AbstractCommand
{
	private readonly int $userId;
	private readonly DocumentRepository $repository;
	private readonly DocumentProvider $provider;
	private readonly SearchIndexService $searchIndexService;
	private readonly CollectionRepository $collectionRepository;

	public function __construct(
		int $userId,
		?DocumentRepository $repository = null,
		?DocumentProvider $provider = null,
		?SearchIndexService $searchIndexService = null,
		?CollectionRepository $collectionRepository = null,
	)
	{
		$this->userId = $userId;
		$this->repository = $repository ?? new DocumentRepository();
		$this->provider = $provider ?? new DocumentProvider();
		$this->searchIndexService = $searchIndexService ?? new SearchIndexService();
		$this->collectionRepository = $collectionRepository ?? new CollectionRepository();
	}

	protected function execute(): Result
	{
		$result = new Result();

		$ids = $this->provider->listArchivedIdsForUserWithManageAccess($this->userId);
		if (empty($ids))
		{
			$result->setData(['restoredCount' => 0]);

			return $result;
		}

		$collectionIds = $this->collectArchivedCollectionIds($ids);

		$this->repository->restoreByIds($ids, $this->userId);
		$restoredCollections = [];
		foreach ($collectionIds as $collectionId)
		{
			if ($this->collectionRepository->restoreById($collectionId))
			{
				$collection = $this->collectionRepository->getById($collectionId);
				if ($collection !== null)
				{
					$restoredCollections[] = $collection;
				}
			}
		}
		$this->repository->liftArchivedOrphansToRoot($ids);

		try
		{
			$this->searchIndexService->reindexByIds($ids);
		}
		catch (\Throwable)
		{
		}

		$result->setData([
			'restoredCount' => count($ids),
			'restoredCollections' => $restoredCollections,
		]);

		return $result;
	}

	/**
	 * @param int[] $documentIds
	 * @return int[] distinct ids of currently archived collections holding the given documents
	 */
	private function collectArchivedCollectionIds(array $documentIds): array
	{
		if (empty($documentIds))
		{
			return [];
		}

		$rows = DocumentTable::query()
			->setSelect(['COLLECTION_ID'])
			->whereIn('ID', $documentIds)
			->where('COLLECTION.IS_ARCHIVED', 'Y')
			->setGroup(['COLLECTION_ID'])
			->fetchAll()
		;

		return array_values(array_filter(
			array_map(static fn(array $row): int => (int)$row['COLLECTION_ID'], $rows),
			static fn(int $id): bool => $id > 0,
		));
	}
}
