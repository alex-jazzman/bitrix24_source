<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @global CMain $APPLICATION */
/** @var array $arResult */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Security\Random;
?>
<tr>
	<td><?= Loc::getMessage('USER_TYPE_MONEY_DEFAULT_VALUE') ?>:</td>
	<td>
		<?php
		$APPLICATION->IncludeComponent(
			'bitrix:currency.money.input',
			'',
			[
				'CONTROL_ID' => ($arResult['userField']['FIELD_NAME'] ?? 'SETTINGS') . '_' . Random::getString(5),
				'FIELD_NAME' => $arResult['additionalParameters']['NAME']. '[DEFAULT_VALUE]',
				'FIELD_NAME_CURRENCY' => $arResult['additionalParameters']['NAME']. '[DEFAULT_CURRENCY]',
				'VALUE' => $arResult['value'],
				'CURRENCY' => $arResult['currency'],
				'EXTENDED_CURRENCY_SELECTOR' => 'Y',
			],
			null,
			['HIDE_ICONS' => 'Y']
		);
		?>
	</td>
</tr>
