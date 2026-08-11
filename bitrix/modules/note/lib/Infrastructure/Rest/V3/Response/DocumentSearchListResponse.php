<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Response;

use Bitrix\Rest\V3\Dto\DtoCollection;
use Bitrix\Rest\V3\Interaction\Response\ListResponse;

// Typed list envelope: {items: [...], hasMore: bool}. Schema is declared by
// DocumentSearchListMethodProvider.
class DocumentSearchListResponse extends ListResponse
{
	public function __construct(DtoCollection $items, public bool $hasMore = false)
	{
		parent::__construct($items);
	}
}
