<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Collaboration;

use Bitrix\Main\Loader;

class PushNotificationService
{
	private const TAG_DOCUMENT_PREFIX = 'NOTE_DOC_';
	private const TAG_AWARENESS_PREFIX = 'NOTE_DOC_AWARE_';
	private const MODULE_ID = 'note';

	public function sendDocumentPatch(int $documentId, int $skipUserId, string $patch, ?string $cursor = null): void
	{
		$params = [
			'documentId' => $documentId,
			'patch' => $patch,
			'userId' => $skipUserId,
		];

		if ($cursor !== null && $cursor !== '')
		{
			$params['cursor'] = $cursor;
		}

		$this->sendByTag(
			self::TAG_DOCUMENT_PREFIX . $documentId,
			'documentPatchReceived',
			$params,
			[$skipUserId],
		);
	}

	public function sendAwareness(int $documentId, int $skipUserId, array $data): void
	{
		$this->sendByTag(
			self::TAG_AWARENESS_PREFIX . $documentId,
			'documentAwareness',
			array_merge($data, ['documentId' => $documentId]),
			[$skipUserId],
		);
	}

	private function sendByTag(string $tag, string $command, array $params, array $skipUsers = []): void
	{
		if (!Loader::includeModule('pull'))
		{
			return;
		}

		\CPullWatch::AddToStack(
			$tag,
			[
				'module_id' => self::MODULE_ID,
				'command' => $command,
				'params' => $params,
				'skip_users' => $skipUsers,
			],
		);
	}
}
