<?php

use Bitrix\Main\Text\HtmlFilter;
use Bitrix\Main\Web\Json;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();

/**
 * @var DoubleUfComponent $component
 * @var array $arResult
 * @var array $arParams
 */

$component = $this->getComponent();
?>

<div class="mobile-grid-data-string-container">
	<div class="fields double field-wrap">
		<?php
		$isFirst = true;
		$nodes = [];
		foreach($arResult['value'] as $item)
		{
			$nodes[] = $item['attrList']['id'];
			if(!$isFirst)
			{
				print $component->getHtmlBuilder()->getMultipleValuesSeparator();
			}
			$isFirst = false;
			?>
			<span class="field-item">
				<input
					<?= $component->getHtmlBuilder()->buildTagAttributes($item['attrList']) ?>
				>
				<span id="<?= $item['attrList']['id'] ?>_container">
					<?php
					// The container holds the formatted value only, exactly as the desktop template
					// (@see .default.php) does: an empty field stays empty, a zero (including '0' at
					// precision 0) is shown as a zero. The placeholder of an empty field is drawn by
					// mobile.js after an inline edit and is read from the input above.
					?>
					<?= HtmlFilter::encode($item['value']) ?>
				</span>
			</span>
			<?php
		}
		?>
	</div>
</div>

<script>
	BX.ready(function ()
	{
		new BX.Mobile.Field.Double(
			<?= Json::encode([
				'name' => 'BX.Mobile.Field.Double',
				'nodes' => $nodes,
				'restrictedMode' => true,
				'formId' => $arParams['additionalParameters']['formId'],
				'gridId' => $arParams['additionalParameters']['gridId']
			]) ?>
		);
	});
</script>