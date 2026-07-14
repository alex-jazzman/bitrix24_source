<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Application;
use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Exceptions\OrphanRestoreTargetRequiredException;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;
use Bitrix\Note\Internal\Service\RecycleBin\RestoreFromRecycleBinService;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;
use Bitrix\Note\Public\Provider\RecycleBinProvider;

class RestoreAllFromRecycleBinCommand extends AbstractCommand
{
	private const CHUNK_SIZE = 200;

	public function __construct(
		private readonly int $userId,
		private readonly array $accessCodes,
		private readonly ?int $orphanTargetCollectionId = null,
		private readonly RecycleBinProvider $provider = new RecycleBinProvider(),
		private readonly RecycleBinRepository $recycleBinRepository = new RecycleBinRepository(),
		private readonly RestoreFromRecycleBinService $restoreService = new RestoreFromRecycleBinService(),
		private readonly SearchIndexService $searchIndexService = new SearchIndexService(),
	) {}

	protected function execute(): Result
	{
		$entryIds = $this->provider->listVisibleRestorableIdsForUser($this->userId, $this->accessCodes);
		$restoredDocumentIds = [];
		$skippedOrphans = 0;

		$orphanTarget = $this->orphanTargetCollectionId !== null && $this->orphanTargetCollectionId > 0
			? $this->orphanTargetCollectionId
			: null
		;

		$normalizedIds = array_values(array_map(static fn($id): int => (int)$id, $entryIds));
		$chunks = array_chunk($normalizedIds, self::CHUNK_SIZE);

		foreach ($chunks as $chunk)
		{
			$records = $this->recycleBinRepository->getByIds($chunk);
			$recordsById = [];
			foreach ($records as $record)
			{
				$recordsById[(int)$record->getId()] = $record;
			}

			foreach ($chunk as $entryId)
			{
				$record = $recordsById[$entryId] ?? null;
				if ($record === null)
				{
					continue;
				}

				$connection = Application::getConnection();
				$connection->startTransaction();
				try
				{
					try
					{
						$result = $this->restoreService->restore($record, null, $this->userId);
					}
					catch (OrphanRestoreTargetRequiredException $orphanException)
					{
						if ($orphanTarget === null)
						{
							throw $orphanException;
						}

						$result = $this->restoreService->restore($record, $orphanTarget, $this->userId);
					}

					if (!$result->isSuccess())
					{
						$connection->rollbackTransaction();

						continue;
					}
					$connection->commitTransaction();
					$restoredDocumentIds[] = (int)$record->getDocumentId();
				}
				catch (OrphanRestoreTargetRequiredException)
				{
					$connection->rollbackTransaction();
					$skippedOrphans++;
				}
				catch (\Throwable $e)
				{
					$connection->rollbackTransaction();
					throw $e;
				}
			}
		}

		if (!empty($restoredDocumentIds))
		{
			try
			{
				$this->searchIndexService->reindexByIds($restoredDocumentIds);
			}
			catch (\Throwable)
			{
			}
		}

		$result = new Result();
		$result->setData([
			'restoredCount' => count($restoredDocumentIds),
			'skippedOrphans' => $skippedOrphans,
		]);

		return $result;
	}
}
