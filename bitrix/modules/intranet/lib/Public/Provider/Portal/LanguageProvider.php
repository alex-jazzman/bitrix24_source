<?php

namespace Bitrix\Intranet\Public\Provider\Portal;

use Bitrix\Intranet\Internal\Repository\LanguageRepository;

class LanguageProvider
{
	public function getPublicArray(): array
	{
		$languagesRes = (new LanguageRepository())->getPortalLanguages();

		$languages = [];

		foreach ($languagesRes as $language)
		{
			$languages[$language['ID']] = [
				'NAME' => $language['NAME'],
				'IS_BETA' => in_array($language['ID'], ['kz', 'ar']) ? true : false,
			];
		}

		return $languages;
	}
}
