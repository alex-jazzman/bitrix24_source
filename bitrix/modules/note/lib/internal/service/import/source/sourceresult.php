<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Source;

class SourceResult
{
	public function __construct(
		public readonly bool $success,
		public readonly array $data = [],
		public readonly ?string $error = null,
		public readonly ?string $errorField = null,
	)
	{
	}
}
