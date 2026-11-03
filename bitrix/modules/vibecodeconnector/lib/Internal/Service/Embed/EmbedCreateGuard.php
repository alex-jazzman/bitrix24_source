<?php

declare(strict_types=1);

namespace Bitrix\Vibecodeconnector\Internal\Service\Embed;

use Bitrix\Vibecodeconnector\Internal\Integration\Bitrix24\VibePlusPolicy;
use Bitrix\Vibecodeconnector\Public\Service\AvailabilityService;

final class EmbedCreateGuard
{
	public const ERROR_ACCESS_DENIED = 'ACCESS_DENIED';
	public const ERROR_FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE';

	public function __construct(
		private readonly AvailabilityService $availabilityService = new AvailabilityService(),
		private readonly VibePlusPolicy $vibePlusPolicy = new VibePlusPolicy(),
	) {
	}

	public function resolveErrorCode(EmbedView $view, int $userId): ?string
	{
		if ($userId <= 0 || !$this->availabilityService->isAvailableForUser($userId))
		{
			return self::ERROR_ACCESS_DENIED;
		}

		if ($this->vibePlusPolicy->getAvailability() === false)
		{
			return self::ERROR_FEATURE_NOT_AVAILABLE;
		}

		return null;
	}

	public function isAllowed(EmbedView $view, int $userId): bool
	{
		return $this->resolveErrorCode($view, $userId) === null;
	}
}
