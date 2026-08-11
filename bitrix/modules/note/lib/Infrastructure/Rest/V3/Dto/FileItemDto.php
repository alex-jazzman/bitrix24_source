<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Dto;

use Bitrix\Rest\V3\Dto\Dto;

class FileItemDto extends Dto
{
	public ?int $id;
	public ?int $documentId;
	public ?string $name;
	public ?int $size;
	public ?string $mimeType;
	public ?string $assetType;
	public ?string $assetMarkdown;
}
