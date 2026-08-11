<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Collaboration;

use Bitrix\Main\Application;

class DocumentLockService
{
	private const LOCK_PREFIX = 'note_doc_';

	public function acquireLock(int $documentId, int $timeoutSeconds = 0, string $scope = 'compact'): bool
	{
		return Application::getConnection()->lock(
			self::LOCK_PREFIX . $scope . '_' . $documentId,
			$timeoutSeconds,
		);
	}

	public function releaseLock(int $documentId, string $scope = 'compact'): void
	{
		Application::getConnection()->unlock(self::LOCK_PREFIX . $scope . '_' . $documentId);
	}
}
