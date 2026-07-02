<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Source;

interface SourceInterface
{
	public function checkConnection(): SourceResult;

	public function getCollections(): SourceResult;

	public function getDocumentTree(string $collectionId): SourceResult;

	public function getDocumentsPage(string $collectionId, int $offset, int $limit): SourceResult;

	public function downloadAttachment(string $attachmentId): SourceResult;
}
