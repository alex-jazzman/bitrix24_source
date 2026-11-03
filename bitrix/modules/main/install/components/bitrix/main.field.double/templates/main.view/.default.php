<?php

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Text\HtmlFilter;

/**
 * @var DoubleUfComponent $component
 * @var array $arResult
 */
?>

<span class="fields integer field-wrap">
	<?php
	foreach($arResult['value'] as $item)
	{
		?>
		<span class="fields integer field-item">
			<?php
			$value = HtmlFilter::encode($item['value']);
			if(!empty($item['href']))
			{
				print "<a href=\"{$item['href']}\">{$value}</a>";
			}
			else
			{
				print $value;
			}
			?>
		</span>
		<?php
	}
	?>
</span>