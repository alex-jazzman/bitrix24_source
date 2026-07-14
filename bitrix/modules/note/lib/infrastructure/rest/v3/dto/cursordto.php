<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Dto;

use Bitrix\Rest\V3\Dto\Dto;

// Keyset pagination cursor (POSITION DESC, ID DESC). Built by hand and only serialized,
// so it needs no mapper.
class CursorDto extends Dto
{
	public ?int $position;
	public ?int $id;
}
