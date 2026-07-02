<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Application;
use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;
use Bitrix\Note\Internal\Service\RecycleBin\RestoreFromRecycleBinService;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;

class RestoreDocumentFromRecycleBinCommand extends AbstractCommand
{
	public const ERROR_RECORD_MISSING = 'NOTE_RECYCLE_BIN_RECORD_MISSING';

	public function __construct(
		private readonly int $entryId,
		private readonly int $userId,
		private readonly ?int $targetCollectionId = null,
		private readonly RecycleBinRepository $recycleBinRepository = new RecycleBinRepository(),
		private readonly RestoreFromRecycleBinService $restoreService = new RestoreFromRecycleBinService(),
		private readonly SearchIndexService $searchIndexService = new SearchIndexService(),
	) {}

	protected function execute(): Result
	{
		$record = $this->recycleBinRepository->getById($this->entryId);
		if ($record === null)
		{
			$result = new Result();
			$result->addError(new Error('Recycle-bin record not found', self::ERROR_RECORD_MISSING));

			return $result;
		}

		$connection = Application::getConnection();
		$connection->startTransaction();
		try
		{
			$result = $this->restoreService->restore($record, $this->targetCollectionId, $this->userId);
			if (!$result->isSuccess())
			{
				$connection->rollbackTransaction();

				return $result;
			}
			$connection->commitTransaction();
		}
		catch (\Throwable $e)
		{
			$connection->rollbackTransaction();
			throw $e;
		}

		try
		{
			$this->searchIndexService->indexDocument((int)$record->getDocumentId());
		}
		catch (\Throwable)
		{
		}

		return $result;
	}
}
