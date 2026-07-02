<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Provider;

use Bitrix\Main\Loader;
use Bitrix\Note\Internal\Model\Document;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Repository\DocumentUpdateRepository;

class CollaborationProvider
{
	private DocumentRepository $documentRepository;
	private DocumentUpdateRepository $updateRepository;

	public function __construct(
		?DocumentRepository $documentRepository = null,
		?DocumentUpdateRepository $updateRepository = null,
	)
	{
		$this->documentRepository = $documentRepository ?? new DocumentRepository();
		$this->updateRepository = $updateRepository ?? new DocumentUpdateRepository();
	}

	public function buildCollaborationMeta(
		int $documentId,
		int $collectionId,
		int $userId,
		bool $canEdit,
	): ?array
	{
		if ($userId <= 0 || $collectionId <= 0 || $documentId <= 0)
		{
			return null;
		}

		$this->subscribeUserToDocumentTag($userId, $documentId);

		return [
			'readOnly' => !$canEdit,
			'currentUser' => [
				'id' => (string)$userId,
				'name' => $this->resolveUserDisplayName($userId),
				'color' => '#' . substr(md5((string)$userId), 0, 6),
			],
			'patches' => $this->updateRepository->getByDocumentId($documentId),
			'lastPatchId' => $this->updateRepository->getLastId($documentId),
		];
	}

	public function loadForCollaboration(int $documentId, int $userId): array
	{
		$document = $this->documentRepository->getById($documentId);
		$patches = $this->updateRepository->getByDocumentId($documentId);
		$lastPatchId = $this->updateRepository->getLastId($documentId);

		$this->subscribeUserToDocumentTag($userId, $documentId);

		$yjsState = $document?->getYjsState();
		if ($document !== null
			&& $document->getContentFormat() === DocumentTable::CONTENT_FORMAT_YJS
			&& $yjsState !== null
			&& $yjsState !== ''
		)
		{
			return [
				'yjsState' => $yjsState,
				'patches' => $patches,
				'lastPatchId' => $lastPatchId,
			];
		}

		return [
			'markdown' => $document?->getMarkdown(),
			'patches' => $patches,
			'lastPatchId' => $lastPatchId,
		];
	}

	public function loadPatches(int $documentId): array
	{
		$patches = $this->updateRepository->getByDocumentId($documentId);
		$lastPatchId = $this->updateRepository->getLastId($documentId);

		return [
			'patches' => $patches,
			'lastPatchId' => $lastPatchId,
		];
	}

	private function subscribeUserToDocumentTag(int $userId, int $documentId): void
	{
		if (!Loader::includeModule('pull'))
		{
			return;
		}

		\CPullWatch::Add($userId, 'NOTE_DOC_' . $documentId);
		\CPullWatch::Add($userId, 'NOTE_DOC_AWARE_' . $documentId);
	}

	private function resolveUserDisplayName(int $userId): string
	{
		$row = \Bitrix\Main\UserTable::query()
			->setSelect(['ID', 'NAME', 'LAST_NAME'])
			->where('ID', $userId)
			->setCacheTtl(3600)
			->fetch()
		;

		if ($row)
		{
			$name = trim(($row['NAME'] ?? '') . ' ' . ($row['LAST_NAME'] ?? ''));
			if ($name !== '')
			{
				return $name;
			}
		}

		return 'User #' . $userId;
	}
}
