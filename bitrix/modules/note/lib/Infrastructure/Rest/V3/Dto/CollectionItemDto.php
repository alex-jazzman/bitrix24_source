<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Dto;

use Bitrix\Main\Validation\Rule\Length;
use Bitrix\Main\Validation\Rule\NotEmpty;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\Mapping\CollectionMapper;
use Bitrix\Note\Internal\Model\CollectionTable;
use Bitrix\Rest\V3\Attribute\Editable;
use Bitrix\Rest\V3\Attribute\MappedBy;
use Bitrix\Rest\V3\Attribute\Required;
use Bitrix\Rest\V3\Dto\Dto;

#[MappedBy(CollectionMapper::class)]
class CollectionItemDto extends Dto
{
	public ?int $id;

	#[Required(['add', 'update'])]
	#[Editable(['add', 'update'])]
	#[NotEmpty]
	#[Length(max: CollectionTable::MAX_NAME_LENGTH)]
	public ?string $name;

	#[Editable(['add'])]
	public ?int $position;

	public ?string $policyLevel;
	public ?int $createdBy;
	public ?string $createdAt;
	public ?int $updatedBy;
	public ?string $updatedAt;
}
