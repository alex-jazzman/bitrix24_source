<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Entity\Search;

use Bitrix\Main\Entity\EntityCollection;

final class SearchResultCollection extends EntityCollection implements \JsonSerializable
{
	private bool $hasMore = false;

	public function markHasMore(bool $hasMore): void
	{
		$this->hasMore = $hasMore;
	}

	public function hasMore(): bool
	{
		return $this->hasMore;
	}

	public function trimTo(int $limit): void
	{
		if ($limit < 0)
		{
			$limit = 0;
		}
		if (count($this->items) > $limit)
		{
			$this->items = array_slice($this->items, 0, $limit);
		}
	}

	/**
	 * In-place replacement of items, preserving collection metadata (hasMore).
	 *
	 * @param callable(SearchResult): SearchResult $mapper
	 */
	public function transform(callable $mapper): void
	{
		$this->items = array_map($mapper, $this->items);
	}

	public function jsonSerialize(): array
	{
		return array_values($this->items);
	}

	protected static function getEntityClass(): string
	{
		return SearchResult::class;
	}
}
