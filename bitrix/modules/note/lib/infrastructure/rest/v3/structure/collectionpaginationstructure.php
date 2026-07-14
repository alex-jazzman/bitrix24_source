<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Structure;

use Bitrix\Note\Public\Provider\CollectionProvider;
use Bitrix\Rest\V3\Interaction\Request\Request;
use Bitrix\Rest\V3\Structure\Structure;

// Typed pagination for the collection keyset list: limit + composite afterCursor {position, id}.
// Stock CursorStructure is single-field and cannot express the (POSITION, ID) cursor, so parsing
// lives here instead of a raw array in the action.
final class CollectionPaginationStructure extends Structure
{
	protected int $limit = CollectionProvider::DEFAULT_LIMIT;
	protected ?array $afterCursor = null;

	public static function create(mixed $value, ?string $dtoClass = null, ?Request $request = null): self
	{
		$structure = new self();

		if (!is_array($value))
		{
			return $structure;
		}

		if (isset($value['limit']))
		{
			$limit = (int)$value['limit'];
			if ($limit > 0)
			{
				$structure->limit = min($limit, CollectionProvider::MAX_LIMIT);
			}
		}

		if (isset($value['afterCursor']) && is_array($value['afterCursor']))
		{
			$cursor = $value['afterCursor'];
			if (isset($cursor['position'], $cursor['id']))
			{
				$structure->afterCursor = [
					'position' => (int)$cursor['position'],
					'id' => (int)$cursor['id'],
				];
			}
		}

		return $structure;
	}

	public function getLimit(): int
	{
		return $this->limit;
	}

	public function getAfterCursor(): ?array
	{
		return $this->afterCursor;
	}
}
