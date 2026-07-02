<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Util;

final class IdNormalizer
{
	/**
	 * @param array $ids
	 * @return int[]
	 */
	public static function normalize(array $ids): array
	{
		$normalized = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $ids),
			static fn(int $id): bool => $id > 0,
		)));
		sort($normalized);

		return $normalized;
	}
}
