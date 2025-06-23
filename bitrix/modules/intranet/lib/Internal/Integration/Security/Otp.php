<?php

declare(strict_types=1);

namespace Bitrix\Intranet\Internal\Integration\Security;

use Bitrix\Security\Mfa;
use Bitrix\Main\Loader;

class Otp
{
	public function isAvailable(): bool
	{
		return Loader::includeModule('security') && Mfa\Otp::isOtpEnabled();
	}

	public function isActiveByUserId(int $userId): bool
	{
		return $this->isAvailable()
			&& \CSecurityUser::IsUserOtpActive($userId);
	}
}
