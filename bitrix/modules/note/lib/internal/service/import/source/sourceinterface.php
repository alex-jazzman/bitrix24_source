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

	/**
	 * Access control list of the source collection, expressed in note terms so it
	 * can be applied verbatim by ApplyCollectionAccessStep.
	 *
	 * data:
	 *   - permissions: array<array{subjectCode: string, level: string}> — positive
	 *     grants only (Bitrix access codes + note level codes view|manage|moderate);
	 *   - policyLevel: string — the '*' fallback level (none|view|manage|moderate).
	 *
	 * An empty permissions list means "do not transfer any access": the step keeps
	 * the default private ACL the import created. Sources that have no notion of
	 * source-side permissions (e.g. Outline) return an empty list.
	 */
	public function getCollectionAccess(string $collectionId): SourceResult;
}
