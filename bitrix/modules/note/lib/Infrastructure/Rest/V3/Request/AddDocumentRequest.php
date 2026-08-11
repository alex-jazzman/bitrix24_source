<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Request;

use Bitrix\Rest\V3\Interaction\Request\Request;

class AddDocumentRequest extends Request
{
	public int $collectionId;
	public string $title;
	public ?int $parentId = null;
	public ?string $markdown = null;
}
