<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Collaboration;

use Bitrix\Main\Application;
use Bitrix\Main\Loader;
use Bitrix\Pull\Event;

class PushNotificationService
{
	public const REALTIME_BATCH_THRESHOLD = 500;

	private const TAG_DOCUMENT_PREFIX = 'NOTE_DOC_';
	private const TAG_DOCUMENT_ACL_SUFFIX = '_ACL';
	private const TAG_AWARENESS_PREFIX = 'NOTE_DOC_AWARE_';
	private const TAG_COLLECTION_PREFIX = 'NOTE_COLLECTION_';
	private const TAG_COLLECTION_ACL_SUFFIX = '_ACL';
	private const TAG_GLOBAL = 'NOTE_GLOBAL';
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

	public function sendToDocument(int $documentId, string $command, array $params, ?int $initiatorUserId = null): void
	{
		$this->sendByTag(
			self::TAG_DOCUMENT_PREFIX . $documentId,
			$command,
			$params,
			$initiatorUserId !== null ? [$initiatorUserId] : [],
		);
	}

	public function sendToDocumentAcl(int $documentId, string $command, array $params, ?int $initiatorUserId = null): void
	{
		$this->sendByTag(
			self::TAG_DOCUMENT_PREFIX . $documentId . self::TAG_DOCUMENT_ACL_SUFFIX,
			$command,
			$params,
			$initiatorUserId !== null ? [$initiatorUserId] : [],
		);
	}

	public function sendToCollection(int $collectionId, string $command, array $params, ?int $initiatorUserId = null): void
	{
		$this->sendByTag(
			self::TAG_COLLECTION_PREFIX . $collectionId,
			$command,
			$params,
			$initiatorUserId !== null ? [$initiatorUserId] : [],
		);
	}

	public function sendToCollectionAcl(int $collectionId, string $command, array $params, ?int $initiatorUserId = null): void
	{
		$this->sendByTag(
			self::TAG_COLLECTION_PREFIX . $collectionId . self::TAG_COLLECTION_ACL_SUFFIX,
			$command,
			$params,
			$initiatorUserId !== null ? [$initiatorUserId] : [],
		);
	}

	public function sendDocumentContentOverwritten(int $documentId, int $byUserId, bool $overwrite): void
	{
		// No initiator skip: an REST overwrite is out-of-band, so even the initiator's own open
		// editor (a different session under the same user-id) must receive it and rebuild.
		$this->sendToDocument(
			$documentId,
			'documentContentOverwritten',
			[
				'documentId' => $documentId,
				'byUserId' => $byUserId,
				'overwrite' => $overwrite,
				'ts' => time(),
			],
		);
	}

	public function sendGlobal(string $command, array $params, ?int $initiatorUserId = null): void
	{
		$this->sendByTag(
			self::TAG_GLOBAL,
			$command,
			$params,
			$initiatorUserId !== null ? [$initiatorUserId] : [],
		);
	}

	public function sendToUserChannel(int $userId, string $command, array $params): void
	{
		if (!Loader::includeModule('pull'))
		{
			return;
		}

		Event::add($userId, [
			'module_id' => self::MODULE_ID,
			'command' => $command,
			'params' => $params,
		]);
	}

	/**
	 * Collection-level event + optional NOTE_GLOBAL broadcast, single dispatchAfterCommit
	 * closure, threshold-aware payload (documentIds list under the threshold, requestRefetch
	 * flag above it).
	 *
	 * Per-document fan-out is intentionally absent: open editors listen on NOTE_COLLECTION_{cid}
	 * for documentArchive/documentDelete/collectionArchive/collectionDelete and decide locally
	 * (by documentIds match, or by re-fetching their own meta on requestRefetch).
	 *
	 * @param array<int|string> $documentIds  Subtree ids touched by the operation (used by sidebar + open editors to match their own id).
	 * @param array<string, mixed> $collectionPayloadExtra  Extra fields merged into the payload (next to collectionId / documentIds / requestRefetch).
	 * @param string|null $globalCommand  Optional NOTE_GLOBAL broadcast (e.g. collection lifecycle).
	 * @param array<string, mixed> $globalPayload  Payload for the global broadcast.
	 */
	public function emitDocumentCascade(
		int $collectionId,
		array $documentIds,
		string $collectionCommand,
		array $collectionPayloadExtra = [],
		?int $initiatorUserId = null,
		?string $globalCommand = null,
		array $globalPayload = [],
		int $threshold = self::REALTIME_BATCH_THRESHOLD,
	): void
	{
		$normalizedIds = array_values(array_map('intval', $documentIds));
		$requestRefetch = count($normalizedIds) > $threshold;

		$collectionPayload = $collectionPayloadExtra + ['collectionId' => $collectionId];
		if ($requestRefetch)
		{
			$collectionPayload['requestRefetch'] = true;
		}
		else
		{
			$collectionPayload['documentIds'] = $normalizedIds;
		}

		$this->dispatchAfterCommit(function () use (
			$collectionId,
			$collectionCommand,
			$collectionPayload,
			$initiatorUserId,
			$globalCommand,
			$globalPayload,
		): void {
			$this->sendToCollection($collectionId, $collectionCommand, $collectionPayload, $initiatorUserId);

			if ($globalCommand !== null)
			{
				$this->sendGlobal($globalCommand, $globalPayload, $initiatorUserId);
			}
		});
	}

	/**
	 * Defers emission until after the HTTP response is sent. By that point
	 * Bitrix has either committed the surrounding transaction or aborted
	 * the request with an exception, so receivers never observe state the
	 * initiator later rolled back.
	 */
	public function dispatchAfterCommit(callable $emitter): void
	{
		Application::getInstance()->addBackgroundJob($emitter);
	}

	public function sendByTag(string $tag, string $command, array $params, array $skipUsers = []): void
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
