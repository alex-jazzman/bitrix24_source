<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\License;

use Bitrix\Main\Loader;

class LicenseService
{
	public const FEATURE_ACCESS_PERMISSIONS = 'limit_note_access_permissions';

	public const SLIDER_ACCESS_PERMISSIONS = 'limit_v2_note_access_permissions';

	public const SLIDER_TOOL_DISABLED = 'limit_note_base_off';

	public function isModuleAvailable(): bool
	{
		if (!$this->isBitrix24Available())
		{
			return true;
		}

		return $this->isFeatureEnabled(self::FEATURE_ACCESS_PERMISSIONS);
	}

	public function getAccessSliderCode(): string
	{
		return self::SLIDER_ACCESS_PERMISSIONS;
	}

	public function getToolDisabledSliderCode(): string
	{
		return self::SLIDER_TOOL_DISABLED;
	}

	protected function isBitrix24Available(): bool
	{
		return Loader::includeModule('bitrix24');
	}

	protected function isFeatureEnabled(string $featureId): bool
	{
		return \Bitrix\Bitrix24\Feature::isFeatureEnabled($featureId);
	}
}
