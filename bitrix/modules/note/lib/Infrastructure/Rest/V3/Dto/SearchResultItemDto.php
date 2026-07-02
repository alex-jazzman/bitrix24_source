<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Dto;

use Bitrix\Rest\V3\Dto\Dto;

class SearchResultItemDto extends Dto
{
	public ?int $documentId;
	public ?int $collectionId;
	public ?string $title;
	public ?float $score;
	public ?string $snippet;
	public ?bool $sharedAccess;
}
