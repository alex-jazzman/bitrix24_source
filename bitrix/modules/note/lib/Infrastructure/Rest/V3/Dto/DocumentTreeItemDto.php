<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Dto;

use Bitrix\Rest\V3\Dto\Dto;

class DocumentTreeItemDto extends Dto
{
	public ?int $id;
	public ?int $collectionId;
	public ?int $parentId;
	public ?string $title;
	public ?int $position;
	public ?array $children;
}
