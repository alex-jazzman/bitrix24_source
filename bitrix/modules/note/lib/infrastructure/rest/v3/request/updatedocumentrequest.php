<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Request;

use Bitrix\Rest\V3\Interaction\Request\UpdateRequest;

// Canonical UpdateRequest (id + fields) plus the `overwrite` write-control flag,
// which is not a document field and therefore has no place inside `fields`.
// Nullable so the doc-schema generator keeps it optional (it marks any non-nullable
// property required, ignoring the default); runtime still falls back to false.
class UpdateDocumentRequest extends UpdateRequest
{
	public ?bool $overwrite = false;
}
