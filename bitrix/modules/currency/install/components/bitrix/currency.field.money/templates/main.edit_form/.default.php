<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @global CMain $APPLICATION
 * @var MoneyUfComponent $component
 * @var array $arResult
 * @var array $arParams
 */

use Bitrix\Main\Security\Random;
use Bitrix\Main\Text\HtmlFilter;

?>
<span
	class="fields money field-wrap"
	data-default-currency="<?= HtmlFilter::encode($arResult['defaultCurrency']) ?>"
>
	<?php
	foreach ($arResult['value'] as $value)
	{
		?>
		<span class="fields money field-item">
				<?php
				$APPLICATION->IncludeComponent(
					'bitrix:currency.money.input',
					'',
					[
						'CONTROL_ID' => $arResult['userField']['FIELD_NAME'] . '_' . Random::getString(5),
						'FIELD_NAME' => $arResult['fieldName'],
						'VALUE' => $value,
						'CURRENCY' => $arResult['defaultCurrency'],
						'EXTENDED_CURRENCY_SELECTOR' => 'Y',
					],
					null,
					['HIDE_ICONS' => 'Y']
				);
				?>
			</span>
		<?php
	}

	if ($arResult['userField']['MULTIPLE'] === 'Y')
	{
		$component = $this->getComponent();
		print $component->getHtmlBuilder()->getCloneButton($arResult['fieldName']);
	}
	?>
</span>
