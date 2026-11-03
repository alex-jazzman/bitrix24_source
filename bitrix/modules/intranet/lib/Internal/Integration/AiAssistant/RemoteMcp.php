<?php

declare(strict_types = 1);

namespace Bitrix\Intranet\Internal\Integration\AiAssistant;

use Bitrix\AiAssistant\Config\Feature;
use Bitrix\AiAssistant\Facade\PortalDetails;
use Bitrix\AiAssistant\McpToken\Service\McpEntryPointAccess;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;

class RemoteMcp
{
	public function isLeftMenuItemAvailable(): bool
	{
		if (!Loader::includeModule('aiassistant'))
		{
			return false;
		}

		// A box carries no bitrix24 module, so its own page gate answers instead of the cloud feature.
		$isPageAvailable = $this->isBox()
			? $this->canOpenMcpPage()
			: Loader::includeModule('bitrix24') && Feature::getInstance()->isMCPEnabled();

		return $isPageAvailable && Option::get('aiassistant', 'left_menu_mcp', 'N') === 'Y';
	}

	protected function isBox(): bool
	{
		return PortalDetails::isBox();
	}

	protected function canOpenMcpPage(): bool
	{
		// The gate class ships with aiassistant, and a box may take this module first: while the
		// gate is absent the item is not offered, which is how a box behaved before the delivery.
		if (!class_exists(McpEntryPointAccess::class))
		{
			return false;
		}

		return (new McpEntryPointAccess())->canOpenMcpPage();
	}
}
