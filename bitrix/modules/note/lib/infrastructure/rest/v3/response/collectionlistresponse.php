<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Response;

use Bitrix\Note\Infrastructure\Rest\V3\Dto\CursorDto;
use Bitrix\Rest\V3\Dto\DtoCollection;
use Bitrix\Rest\V3\Interaction\Response\ListResponse;

// Typed list envelope: {items: [...], nextCursor: {...}|null}. Extends ListResponse so the
// runtime serialization path is identical to the canonical list responses; the cursor is the
// extra field stock ListResponse cannot carry. Schema is declared by CollectionListMethodProvider.
class CollectionListResponse extends ListResponse
{
	public function __construct(DtoCollection $items, public ?CursorDto $nextCursor = null)
	{
		parent::__construct($items);
	}
}
