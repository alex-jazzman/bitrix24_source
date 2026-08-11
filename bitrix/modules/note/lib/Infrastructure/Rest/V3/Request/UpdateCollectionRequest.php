<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Request;

use Bitrix\Rest\V3\Interaction\Request\Request;

class UpdateCollectionRequest extends Request
{
	public int $id;
	public string $name;
}
