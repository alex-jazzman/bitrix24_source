<?php

declare(strict_types=1);

namespace Bitrix\Landing\Mainpage;

enum TemplateRegions: string
{
	case EnterpriseWestEn = 'alaio.vibe_enterprise_west_en';
	case EnterpriseWestBr = 'alaio.vibe_enterprise_west_br';
	case EnterpriseRu = 'bitrix.vibe_enterprise_ru';

	public static function resolve(Templates $code): ?string
	{
		$zone = \Bitrix\Landing\Manager::getZone();
		$regionCode = null;

		switch ($code)
		{
			case Templates::EnterpriseWest:
				$regionCode = in_array($zone, ['br']) ? self::EnterpriseWestBr : self::EnterpriseWestEn;

				break;
			case Templates::EnterpriseRu:
				$regionCode = self::EnterpriseRu;

				break;
		}

		return $regionCode?->value;
	}
}
