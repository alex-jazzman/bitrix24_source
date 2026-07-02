<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;

class ArchiveDocumentCommand extends AbstractCommand
{
	private readonly int $id;
	private readonly int $userId;
	private readonly DocumentRepository $repository;
	private readonly SearchIndexService $searchIndexService;

	public function __construct(
		int $id,
		int $userId,
		?DocumentRepository $repository = null,
		?SearchIndexService $searchIndexService = null,
	)
	{
		$this->id = $id;
		$this->userId = $userId;
		$this->repository = $repository ?? new DocumentRepository();
		$this->searchIndexService = $searchIndexService ?? new SearchIndexService();
	}

	protected function execute(): Result
	{
		$document = $this->repository->getById($this->id);
		if ($document === null || $document->getIsArchived())
		{
			return $this->createResult(['success' => false]);
		}

		$subtreeIds = $this->repository->getSubtreeIds($this->id, (int)$document->getCollectionId());
		if (empty($subtreeIds))
		{
			$subtreeIds = [$this->id];
		}

		$this->repository->archiveByIds($subtreeIds, $this->userId);

		try
		{
			$this->searchIndexService->deindexDocuments($subtreeIds);
		}
		catch (\Throwable)
		{
		}

		return $this->createResult(['success' => true, 'archivedIds' => $subtreeIds]);
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
