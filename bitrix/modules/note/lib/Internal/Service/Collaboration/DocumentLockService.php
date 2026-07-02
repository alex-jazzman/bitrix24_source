<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Collaboration;

use Bitrix\Main\Application;

class DocumentLockService
{
	private const LOCK_PREFIX = 'note_doc_compact_';

	public function acquireLock(int $documentId, int $timeoutSeconds = 0): bool
	{
		return Application::getConnection()->lock(
			self::LOCK_PREFIX . $documentId,
			$timeoutSeconds,
		);
	}

	public function releaseLock(int $documentId): void
	{
		Application::getConnection()->unlock(self::LOCK_PREFIX . $documentId);
	}
}
