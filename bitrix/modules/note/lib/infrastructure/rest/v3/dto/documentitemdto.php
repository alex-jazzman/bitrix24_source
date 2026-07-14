<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Dto;

use Bitrix\Main\Validation\Rule\Length;
use Bitrix\Main\Validation\Rule\NotEmpty;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\Mapping\DocumentMapper;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Rest\V3\Attribute\Editable;
use Bitrix\Rest\V3\Attribute\MappedBy;
use Bitrix\Rest\V3\Attribute\Required;
use Bitrix\Rest\V3\Dto\Dto;

#[MappedBy(DocumentMapper::class)]
class DocumentItemDto extends Dto
{
	public ?int $id;

	#[Required(['add'])]
	#[Editable(['add'])]
	public ?int $collectionId;

	#[Editable(['add'])]
	public ?int $parentId;

	#[Required(['add'])]
	#[Editable(['add', 'update'])]
	#[NotEmpty]
	#[Length(max: DocumentTable::MAX_TITLE_LENGTH)]
	public ?string $title;

	#[Editable(['add', 'update'])]
	public ?string $markdown;

	public ?int $position;
	public ?int $createdBy;
	public ?int $updatedBy;
	public ?string $createdAt;
	public ?string $updatedAt;
}
