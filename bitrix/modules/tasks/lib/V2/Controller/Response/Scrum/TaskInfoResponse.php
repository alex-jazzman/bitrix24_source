<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Response\Scrum;

use Bitrix\Tasks\V2\Entity;

class TaskInfoResponse
{
	public function __construct(
		public readonly ?string $storyPoints = null,
		public readonly ?Entity\Epic $epic = null,
	)
	{
	}

	public function toArray(): array
	{
		return [
			'storyPoints' => $this->storyPoints,
			'epic' => $this->epic?->toArray(),
		];
	}
}
