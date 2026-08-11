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

		$this->subscribeUserToDocumentTag($userId, $documentId, $collectionId);

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

		$this->subscribeUserToDocumentTag($userId, $documentId, (int)($document?->getCollectionId() ?? 0));

		$contentFormat = (string)($document?->getContentFormat() ?? DocumentTable::CONTENT_FORMAT_YJS);
		$yjsState = $document?->getYjsState();
		if ($document !== null
			&& $contentFormat === DocumentTable::CONTENT_FORMAT_YJS
			&& $yjsState !== null
			&& $yjsState !== ''
		)
		{
			return [
				'yjsState' => $yjsState,
				'contentFormat' => $contentFormat,
				'patches' => $patches,
				'lastPatchId' => $lastPatchId,
			];
		}

		return [
			'markdown' => $document?->getMarkdown(),
			'contentFormat' => $contentFormat,
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

	private function subscribeUserToDocumentTag(int $userId, int $documentId, int $collectionId = 0): void
	{
		if (!Loader::includeModule('pull'))
		{
			return;
		}

		$tags = [
			'NOTE_DOC_' . $documentId,
			'NOTE_DOC_AWARE_' . $documentId,
			// ACL channel — capability pushes flow here. FE extendWatch only renews; server-side Add is required.
			'NOTE_DOC_' . $documentId . '_ACL',
		];
		if ($collectionId > 0)
		{
			// Collection cascade (archive/delete) and ACL flips fan out via these tags;
			// without server-side Add an editor opened on a bare template would never get them.
			$tags[] = 'NOTE_COLLECTION_' . $collectionId;
			$tags[] = 'NOTE_COLLECTION_' . $collectionId . '_ACL';
		}
		foreach ($tags as $tag)
		{
			\CPullWatch::Add($userId, $tag);
		}
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
