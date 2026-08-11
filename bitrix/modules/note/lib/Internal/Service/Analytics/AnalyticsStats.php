<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Analytics;

use Bitrix\Main\Web\Json;

/**
 * Builds p1 JSON payloads for create_collection / create_document analytics events.
 * Keys are camelCase (zero underscores) so the whole JSON string is a valid pN value.
 */
final class AnalyticsStats
{
	public const IMPORT_TYPE_OUTLINE = 'outline';
	public const IMPORT_TYPE_WIKI = 'wiki';
	public const IMPORT_TYPE_OLD_BK = 'old_bk';

	public static function buildCollectionStats(
		int $admin,
		int $reductorsCount,
		int $viewersCount,
		?string $importType = null,
	): string
	{
		$stats = [
			'admin' => $admin,
			'reductorsCount' => $reductorsCount,
			'viewersCount' => $viewersCount,
			// note has no custom roles yet; kept for BI schema parity with other tools.
			'customCount' => 0,
		];

		if ($importType !== null)
		{
			$stats['importType'] = $importType;
		}

		return Json::encode($stats);
	}

	/**
	 * p1 for create_document, only when the document is created during an import. Carries the source
	 * tool as importType (outline/wiki/old_bk); plain (non-import) creates send no p1 at all. The single
	 * underscore in `old_bk` is the only one in the whole JSON string, so the pN value stays valid.
	 */
	public static function buildDocumentImportStats(string $importType): string
	{
		return Json::encode(['importType' => $importType]);
	}
}
