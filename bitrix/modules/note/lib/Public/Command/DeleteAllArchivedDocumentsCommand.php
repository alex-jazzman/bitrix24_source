<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Entity\RecycleBin\RecycleBinRecord;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;
use Bitrix\Note\Public\Provider\DocumentProvider;

class DeleteAllArchivedDocumentsCommand extends AbstractCommand
{
	private readonly int $userId;
	private readonly DocumentProvider $provider;
	private readonly RecycleBinRepository $recycleBinRepository;
	private readonly SearchIndexService $searchIndexService;

	public function __construct(
		int $userId,
		?DocumentProvider $provider = null,
		?RecycleBinRepository $recycleBinRepository = null,
		?SearchIndexService $searchIndexService = null,
	)
	{
		$this->userId = $userId;
		$this->provider = $provider ?? new DocumentProvider();
		$this->recycleBinRepository = $recycleBinRepository ?? new RecycleBinRepository();
		$this->searchIndexService = $searchIndexService ?? new SearchIndexService();
	}

	protected function execute(): Result
	{
		$result = new Result();

		// Provider returns archived rows in user's MANAGE-collections that are NOT yet in the bin.
		$archivedIds = $this->provider->listArchivedIdsForUserWithManageAccess($this->userId);
		if (empty($archivedIds))
		{
			$result->setData(['deletedCount' => 0]);

			return $result;
		}

		$records = [];
		foreach ($archivedIds as $id)
		{
			$records[] = RecycleBinRecord::createForUserDelete($id, $this->userId);
		}

		// addBatch chunks INSERT IGNORE in 500-row batches; idempotent, no surrounding transaction needed.
		$this->recycleBinRepository->addBatch($records);

		try
		{
			$this->searchIndexService->deindexDocuments($archivedIds);
		}
		catch (\Throwable)
		{
		}

		$result->setData(['deletedCount' => count($archivedIds)]);

		return $result;
	}
}
