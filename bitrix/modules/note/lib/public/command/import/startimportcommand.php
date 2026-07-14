<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command\Import;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Note\Infrastructure\Agent\Import\ImportAgent;
use Bitrix\Note\Internal\Repository\ImportSessionRepository;

class StartImportCommand extends AbstractCommand
{
	private string $sourceType;
	private string $sourceUrl;
	private string $sourceToken;
	private array $collectionIds;
	private int $userId;
	private bool $overwrite;
	private ImportSessionRepository $sessionRepository;

	public function __construct(
		string $sourceType,
		string $sourceUrl,
		string $sourceToken,
		array $collectionIds,
		int $userId,
		bool $overwrite = false,
		?ImportSessionRepository $sessionRepository = null,
	)
	{
		$this->sourceType = $sourceType;
		$this->sourceUrl = $sourceUrl;
		$this->sourceToken = $sourceToken;
		$this->collectionIds = $collectionIds;
		$this->userId = $userId;
		$this->overwrite = $overwrite;
		$this->sessionRepository = $sessionRepository ?? new ImportSessionRepository();
	}

	protected function execute(): Result
	{
		$result = new Result();

		if (empty($this->collectionIds))
		{
			$result->addError(new Error('No collections selected'));

			return $result;
		}

		$existing = $this->sessionRepository->getByUser($this->userId);
		if ($existing !== null)
		{
			if ($existing['STATUS'] === 'in_progress')
			{
				$result->addError(new Error('Import already in progress', 'IMPORT_IN_PROGRESS'));

				return $result;
			}

			$oldSessionId = (int)$existing['ID'];
			Option::delete('main.stepper.note', ['name' => ImportAgent::class . "({$oldSessionId})"]);
			$this->sessionRepository->delete($oldSessionId);
		}

		$saveResult = $this->sessionRepository->save($this->userId, 'connecting');
		if (!$saveResult->isSuccess())
		{
			$result->addErrors($saveResult->getErrors());

			return $result;
		}

		$sessionId = (int)$saveResult->getData()['id'];

		try
		{
			$initialOption = [
				'sourceType' => $this->sourceType,
				'sourceUrl' => $this->sourceUrl,
				'sourceToken' => $this->sourceToken,
				'userId' => $this->userId,
				'collectionIds' => $this->collectionIds,
				'totalItems' => 0,
				'doneCount' => 0,
				'errorCount' => 0,
				'errorMessage' => '',
				'collectionIndex' => 0,
				'step' => 'createCollection',
				'resultCollectionId' => null,
				'importedDocIds' => [],
				'attachmentDocIndex' => 0,
				'attachmentFileIndex' => 0,
				'totalAttachments' => 0,
				'doneAttachments' => 0,
				'overwrite' => $this->overwrite,
			];

			Option::set(
				'main.stepper.note',
				ImportAgent::class . "({$sessionId})",
				serialize($initialOption),
			);

			ImportAgent::bind(1, [$sessionId]);
			$this->sessionRepository->updateStatus($sessionId, 'in_progress');
		}
		catch (\Throwable $e)
		{
			Option::delete('main.stepper.note', ['name' => ImportAgent::class . "({$sessionId})"]);
			$this->sessionRepository->delete($sessionId);

			throw $e;
		}

		$result->setData([
			'sessionId' => $sessionId,
		]);

		return $result;
	}
}
