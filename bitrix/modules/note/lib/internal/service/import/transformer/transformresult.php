<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Transformer;

class TransformResult
{
	public function __construct(
		public readonly string $markdown,
		public readonly array $fileIds,
	)
	{
	}
}
