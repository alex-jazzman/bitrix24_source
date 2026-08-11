<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Structure;

use Bitrix\Rest\V3\Interaction\Request\Request;
use Bitrix\Rest\V3\Structure\Structure;

// Search is limit-only (paginated by hasMore, no cursor); kept separate from the collection
// cursor structure so the search schema does not advertise an unused afterCursor.
final class SearchPaginationStructure extends Structure
{
	public const DEFAULT_LIMIT = 50;
	public const MAX_LIMIT = 200;

	protected int $limit = self::DEFAULT_LIMIT;

	public static function create(mixed $value, ?string $dtoClass = null, ?Request $request = null): self
	{
		$structure = new self();

		if (is_array($value) && isset($value['limit']))
		{
			$limit = (int)$value['limit'];
			if ($limit > 0)
			{
				$structure->limit = min($limit, self::MAX_LIMIT);
			}
		}

		return $structure;
	}

	public function getLimit(): int
	{
		return $this->limit;
	}
}
