<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import;

use Bitrix\Main\Command\Exception\CommandException;
use Bitrix\Main\DB\SqlQueryException;
use Bitrix\Main\Localization\Loc;

class ImportLogger
{
	private const ERROR_DETAILS_LIMIT = 50;

	public static function logError(string $message): void
	{
		\CEventLog::Add([
			'SEVERITY' => \CEventLog::SEVERITY_ERROR,
			'AUDIT_TYPE_ID' => 'IMPORT_ERROR',
			'MODULE_ID' => 'note',
			'DESCRIPTION' => $message,
		]);
	}

	public static function logInfo(string $message): void
	{
		\CEventLog::Add([
			'SEVERITY' => \CEventLog::SEVERITY_DEBUG,
			'AUDIT_TYPE_ID' => 'IMPORT_DEBUG',
			'MODULE_ID' => 'note',
			'DESCRIPTION' => $message,
		]);
	}

	public static function addErrorDetail(array &$option, string $title, string $reason): void
	{
		$option['errorCount'] = ($option['errorCount'] ?? 0) + 1;

		$details = $option['errorDetails'] ?? [];
		if (count($details) < self::ERROR_DETAILS_LIMIT)
		{
			$details[] = [
				'title' => mb_substr($title, 0, 200),
				'reason' => mb_substr($reason, 0, 300),
			];
			$option['errorDetails'] = $details;
		}
	}

	public static function resolveErrorReason(\Throwable $e): string
	{
		$inner = $e->getPrevious() ?? $e;

		if ($inner instanceof SqlQueryException)
		{
			return Loc::getMessage('NOTE_IMPORT_ERROR_DB_ERROR');
		}

		if ($e instanceof CommandException)
		{
			return Loc::getMessage('NOTE_IMPORT_ERROR_DOC_CONTENT_SAVE_FAILED');
		}

		return Loc::getMessage('NOTE_IMPORT_ERROR_UNEXPECTED');
	}
}
