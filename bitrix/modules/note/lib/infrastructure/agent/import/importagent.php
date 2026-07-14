<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Agent\Import;

use Bitrix\Main\Config\Option;
use Bitrix\Main\Update\Stepper;
use Bitrix\Note\Internal\Repository\ImportSessionRepository;
use Bitrix\Note\Public\Command\Import\ProcessImportStepCommand;
use Bitrix\Note\Public\Command\Import\ProcessImportStepResult;

class ImportAgent extends Stepper
{
	protected static $moduleId = 'note';

	public function execute(array &$option): bool
	{
		$sessionId = (int)($this->outerParams[0] ?? 0);
		if ($sessionId <= 0)
		{
			return self::FINISH_EXECUTION;
		}

		$sessionOption = $this->loadSessionOption($sessionId);
		if (empty($sessionOption))
		{
			return self::FINISH_EXECUTION;
		}

		try
		{
			$result = (new ProcessImportStepCommand($sessionOption))->run();
		}
		catch (\Throwable $e)
		{
			self::logError('ImportAgent exception: ' . $e->getMessage());
			$this->finishSession($sessionId, 'error');

			return self::FINISH_EXECUTION;
		}

		if (!$result->isSuccess() || !$result instanceof ProcessImportStepResult)
		{
			$errors = array_map(fn($e) => $e->getMessage(), $result->getErrors());
			self::logError('ImportAgent step failed: ' . implode('; ', $errors));
			$this->finishSession($sessionId, 'error');

			return self::FINISH_EXECUTION;
		}

		$updatedOption = $result->getOption();

		if ($result->shouldContinue())
		{
			$this->saveSessionOption($sessionId, $updatedOption);

			return self::CONTINUE_EXECUTION;
		}

		$status = $updatedOption['status'] ?? 'error';
		$this->finishSession($sessionId, $status, $updatedOption);

		return self::FINISH_EXECUTION;
	}

	private function loadSessionOption(int $sessionId): array
	{
		$raw = Option::get('main.stepper.note', self::class . "({$sessionId})");
		if ($raw === '')
		{
			return [];
		}

		$data = unserialize($raw, ['allowed_classes' => false]);

		return is_array($data) ? $data : [];
	}

	private function saveSessionOption(int $sessionId, array $state): void
	{
		Option::set(
			'main.stepper.note',
			self::class . "({$sessionId})",
			serialize($state),
		);
	}

	private function deleteSessionOption(int $sessionId): void
	{
		Option::delete('main.stepper.note', ['name' => self::class . "({$sessionId})"]);
	}

	private function finishSession(int $sessionId, string $status, array $finalOption = []): void
	{
		$slim = [
			'status' => $status,
			'sourceType' => $finalOption['sourceType'] ?? null,
			'sourceUrl' => $finalOption['sourceUrl'] ?? null,
			'collectionIds' => $finalOption['collectionIds'] ?? [],
			'collectionNames' => $finalOption['collectionNames'] ?? [],
			'globalDoneCount' => $finalOption['globalDoneCount'] ?? 0,
			'globalErrorCount' => $finalOption['globalErrorCount'] ?? 0,
			'globalTotalAttachments' => $finalOption['globalTotalAttachments'] ?? 0,
			'globalDoneAttachments' => $finalOption['globalDoneAttachments'] ?? 0,
			'errorDetails' => $finalOption['errorDetails'] ?? [],
		];

		$this->saveSessionOption($sessionId, $slim);
		(new ImportSessionRepository())->updateStatus($sessionId, $status);
	}

	private static function logError(string $message): void
	{
		\CEventLog::Add([
			'SEVERITY' => \CEventLog::SEVERITY_ERROR,
			'AUDIT_TYPE_ID' => 'IMPORT_ERROR',
			'MODULE_ID' => 'note',
			'DESCRIPTION' => $message,
		]);
	}
}
