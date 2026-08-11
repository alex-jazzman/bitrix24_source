<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Provider;

use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Repository\ImportMapRepository;
use Bitrix\Note\Internal\Service\Import\Source\Wiki\WikiId;

/**
 * Public facade for the legacy `wiki` module: resolves a wiki base/page that was
 * imported into note back to the note collection/document so wiki can redirect
 * its old entry points to the new knowledge base.
 *
 * Callers pass wiki-native identifiers (iblock id, optional socnet group id, page
 * name). The note-internal id scheme (WikiId) stays encapsulated here, so the
 * keys built for the ImportMap lookup are guaranteed to match those the import
 * wrote. URL helpers return the note SPA paths (`/note/workspace|document/{id}/`).
 */
class WikiImportLinkProvider
{
	private const SOURCE_TYPE = 'wiki';

	// Tags the post-import redirect target so note's welcome_points analytics can attribute the
	// entry to the wiki tool (c_section=project, c_element=horizontal_menu) without wiki changes.
	private const WELCOME_SOURCE = 'wiki';

	private ImportMapRepository $mapRepository;

	public function __construct(?ImportMapRepository $mapRepository = null)
	{
		$this->mapRepository = $mapRepository ?? new ImportMapRepository();
	}

	/**
	 * Note collection id for an imported wiki base, or null if it was never
	 * imported. Pass $groupId for a group wiki, omit it for a company/standalone
	 * wiki (own iblock).
	 */
	public function resolveCollectionId(int $iblockId, ?int $groupId = null): ?int
	{
		$collectionId = $this->buildCollectionId($iblockId, $groupId);
		if ($collectionId === null)
		{
			return null;
		}

		return $this->mapRepository->findCollectionId(self::SOURCE_TYPE, $collectionId);
	}

	/**
	 * Note document id for an imported wiki page, or null if that page was not
	 * imported. $pageName is the wiki page NAME (same value the import keyed on).
	 */
	public function resolveDocumentId(int $iblockId, ?int $groupId, string $pageName): ?int
	{
		$collectionId = $this->buildCollectionId($iblockId, $groupId);
		if ($collectionId === null || $pageName === '')
		{
			return null;
		}

		$externalId = WikiId::pageExternalId($collectionId, $pageName);

		return $this->mapRepository->findDocumentId(self::SOURCE_TYPE, $externalId);
	}

	/**
	 * Whether the current user may at least view the note collection. wiki uses
	 * this to avoid redirecting a user into a 403 when the access transfer did not
	 * reach them (rare mapping gaps): in that case it shows a banner instead.
	 */
	public function currentUserCanView(int $collectionId): bool
	{
		return CollectionAccessService::currentUserHasLevel($collectionId, CollectionAccessService::LEVEL_VIEW);
	}

	public function getCollectionUrl(int $collectionId): string
	{
		return '/note/workspace/' . $collectionId . '/?source=' . self::WELCOME_SOURCE;
	}

	public function getDocumentUrl(int $documentId): string
	{
		return '/note/document/' . $documentId . '/?source=' . self::WELCOME_SOURCE;
	}

	private function buildCollectionId(int $iblockId, ?int $groupId): ?string
	{
		if ($iblockId <= 0)
		{
			return null;
		}

		if ($groupId !== null && $groupId > 0)
		{
			return WikiId::groupCollectionId($groupId, $iblockId);
		}

		return WikiId::companyCollectionId($iblockId);
	}
}
