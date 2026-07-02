<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Provider\Dto;

final class DocumentReadDto
{
	public function __construct(
		public readonly int $id,
		public readonly ?int $collectionId,
		public readonly ?int $parentId,
		public readonly string $title,
		public readonly string $markdown,
		public readonly int $position,
		public readonly int $createdBy,
		public readonly int $updatedBy,
		public readonly string $createdAt,
		public readonly string $updatedAt,
	) {}
}
