<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Dto;

use Bitrix\Rest\V3\Dto\Dto;

class CollectionItemDto extends Dto
{
	public ?int $id;
	public ?string $name;
	public ?int $position;
	public ?string $policyLevel;
	public ?int $createdBy;
	public ?string $createdAt;
	public ?int $updatedBy;
	public ?string $updatedAt;
}
