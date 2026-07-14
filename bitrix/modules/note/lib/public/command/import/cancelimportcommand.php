<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command\Import;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Note\Infrastructure\Agent\Import\ImportAgent;
use Bitrix\Note\Internal\Repository\ImportSessionRepository;

class CancelImportCommand extends AbstractCommand
{
	private int $sessionId;
	private ImportSessionRepository $sessionRepository;

	public function __construct(
		int $sessionId,
		?ImportSessionRepository $sessionRepository = null,
	)
	{
		$this->sessionId = $sessionId;
		$this->sessionRepository = $sessionRepository ?? new ImportSessionRepository();
	}

	protected function execute(): Result
	{
		$result = new Result();

		$session = $this->sessionRepository->getById($this->sessionId);
		if ($session === null)
		{
			$result->addError(new Error('Session not found'));

			return $result;
		}

		$this->deleteSessionOption();
		$this->removeAgent();

		$this->sessionRepository->updateStatus($this->sessionId, 'cancelled');

		return $result;
	}

	private function deleteSessionOption(): void
	{
		Option::delete('main.stepper.note', ['name' => ImportAgent::class . "({$this->sessionId})"]);
	}

	private function removeAgent(): void
	{
		$agentName = ImportAgent::class . '::execAgent(' . $this->sessionId . ');';

		Option::delete('main.stepper.note', ['name' => ImportAgent::class]);

		\CAgent::RemoveAgent($agentName, 'note');
	}
}
