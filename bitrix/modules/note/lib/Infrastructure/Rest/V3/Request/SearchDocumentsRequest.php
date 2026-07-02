<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Request;

use Bitrix\Rest\V3\Interaction\Request\Request;

class SearchDocumentsRequest extends Request
{
	public string $query;
	public ?array $pagination = null;
}
