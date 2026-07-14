<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Response;

use Bitrix\Rest\V3\Dto\DtoCollection;
use Bitrix\Rest\V3\Interaction\Response\ListResponse;

// Typed tree envelope: {items: [root nodes with nested children], truncated: bool}.
// Nodes are DocumentTreeItemDto; children stay as nested arrays and serialize verbatim.
// Schema is declared by DocumentTreeListMethodProvider.
class DocumentTreeListResponse extends ListResponse
{
	public function __construct(DtoCollection $items, public bool $truncated = false)
	{
		parent::__construct($items);
	}
}
