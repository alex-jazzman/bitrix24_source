<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\RecycleBin;

use Bitrix\Main\ORM\Query\Query;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;

/**
 * Thin wrapper for two things:
 *  - applyExclusion($query) — adds WHERE RECYCLE_BIN.ID IS NULL to a DocumentTable query
 *    (the 'RECYCLE_BIN' Reference is defined in DocumentTable::getMap; LEFT JOIN on UNIQUE(DOCUMENT_ID) → eq_ref).
 *  - isInRecycleBin($id) — point check for command guards, with a request-scoped cache.
 */
class RecycleBinFilter
{
	/** @var array<int, bool> request-scoped cache */
	private static array $cache = [];

	private readonly RecycleBinRepository $repository;

	public function __construct(?RecycleBinRepository $repository = null)
	{
		$this->repository = $repository ?? new RecycleBinRepository();
	}

	/**
	 * Apply only to queries on DocumentTable (or any entity with a RECYCLE_BIN Reference registered).
	 */
	public function applyExclusion(Query $query): void
	{
		$query->whereNull('RECYCLE_BIN.ID');
	}

	public function isInRecycleBin(int $documentId): bool
	{
		if ($documentId <= 0)
		{
			return false;
		}

		if (array_key_exists($documentId, self::$cache))
		{
			return self::$cache[$documentId];
		}

		$result = $this->repository->isInRecycleBin($documentId);
		self::$cache[$documentId] = $result;

		return $result;
	}

	public static function clearCache(): void
	{
		self::$cache = [];
	}
}
