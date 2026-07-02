<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Provider\Param\Search;

final class SearchQuery
{
	public function __construct(
		public readonly string $query,
	) {}

	public function getQuery(): string
	{
		return $this->query;
	}
}
