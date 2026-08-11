<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Request;

use Bitrix\Rest\V3\Interaction\Request\Request;

class AddCollectionRequest extends Request
{
	public string $name;
	public ?int $position = null;
}
