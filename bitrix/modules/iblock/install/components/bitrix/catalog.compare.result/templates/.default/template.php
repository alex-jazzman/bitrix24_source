<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @global CDatabase $DB */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var CBitrixComponent $component */

$isAjax = false;
if ($_SERVER['REQUEST_METHOD'] == 'POST')
{
	$isAjax = (
		(isset($_POST['ajax_action']) && $_POST['ajax_action'] == 'Y')
		|| (isset($_POST['compare_result_reload']) && $_POST['compare_result_reload'] == 'Y')
	);
}

$templateData = array(
	'TEMPLATE_THEME' => $this->GetFolder().'/themes/'.$arParams['TEMPLATE_THEME'].'/style.css',
	'TEMPLATE_CLASS' => 'bx_'.$arParams['TEMPLATE_THEME']
);

?><div class="bx_compare <? echo $templateData['TEMPLATE_CLASS']; ?>" id="bx_catalog_compare_block"><?
if ($isAjax)
{
	$APPLICATION->RestartBuffer();
}
?><div class="bx_sort_container">
	<div class="sorttext"><?=GetMessage("CATALOG_SHOWN_CHARACTERISTICS")?>:</div>
	<?
	// The mode the page is showing was told apart by a fill alone. These are two links to two
	// addresses, so the mark is `aria-current` and not the pressed state of a button.
	?>
	<a class="sortbutton<? echo (!$arResult["DIFFERENT"] ? ' current' : ''); ?>" href="<? echo $arResult['COMPARE_URL_TEMPLATE'].'DIFFERENT=N'; ?>" rel="nofollow"<? echo (!$arResult["DIFFERENT"] ? ' aria-current="true"' : ''); ?>><?=GetMessage("CATALOG_ALL_CHARACTERISTICS")?></a>
	<a class="sortbutton<? echo ($arResult["DIFFERENT"] ? ' current' : ''); ?>" href="<? echo $arResult['COMPARE_URL_TEMPLATE'].'DIFFERENT=Y'; ?>" rel="nofollow"<? echo ($arResult["DIFFERENT"] ? ' aria-current="true"' : ''); ?>><?=GetMessage("CATALOG_ONLY_DIFFERENT")?></a>
</div>
<?
if (!empty($arResult["ALL_FIELDS"]) || !empty($arResult["ALL_PROPERTIES"]) || !empty($arResult["ALL_OFFER_FIELDS"]) || !empty($arResult["ALL_OFFER_PROPERTIES"]))
{
?>
<div class="bx_filtren_container">
	<h5><?=GetMessage("CATALOG_COMPARE_PARAMS")?></h5>
	<ul><?
	if (!empty($arResult["ALL_FIELDS"]))
	{
		foreach ($arResult["ALL_FIELDS"] as $propCode => $arProp)
		{
			if (!isset($arResult['FIELDS_REQUIRED'][$propCode]))
			{
		?>
		<li><span>
			<span><input type="checkbox" id="PF_<?=$propCode?>"<? echo ($arProp["IS_DELETED"] == "N" ? ' checked="checked"' : ''); ?> onclick="CatalogCompareObj.MakeAjaxAction('<?=CUtil::JSEscape($arProp["ACTION_LINK"])?>')"></span>
			<label for="PF_<?=$propCode?>"><?=GetMessage("IBLOCK_FIELD_".$propCode)?></label>
		</span></li>
		<?
			}
		}
	}
	if (!empty($arResult["ALL_OFFER_FIELDS"]))
	{
		foreach($arResult["ALL_OFFER_FIELDS"] as $propCode => $arProp)
		{
			?>
			<li><span>
		<span><input type="checkbox" id="OF_<?=$propCode?>"<? echo ($arProp["IS_DELETED"] == "N" ? ' checked="checked"' : ''); ?> onclick="CatalogCompareObj.MakeAjaxAction('<?=CUtil::JSEscape($arProp["ACTION_LINK"])?>')"></span>
		<label for="OF_<?=$propCode?>"><?=GetMessage("IBLOCK_OFFER_FIELD_".$propCode)?></label>
	</span></li>
		<?
		}
	}
	if (!empty($arResult["ALL_PROPERTIES"]))
	{
		foreach($arResult["ALL_PROPERTIES"] as $propCode => $arProp)
		{
	?>
		<li><span>
			<span><input type="checkbox" id="PP_<?=$propCode?>"<?echo ($arProp["IS_DELETED"] == "N" ? ' checked="checked"' : '');?> onclick="CatalogCompareObj.MakeAjaxAction('<?=CUtil::JSEscape($arProp["ACTION_LINK"])?>')"></span>
			<label for="PP_<?=$propCode?>"><?=$arProp["NAME"]?></label>
		</span></li>
	<?
		}
	}
	if (!empty($arResult["ALL_OFFER_PROPERTIES"]))
	{
		foreach($arResult["ALL_OFFER_PROPERTIES"] as $propCode => $arProp)
		{
	?>
		<li><span>
			<span><input type="checkbox" id="OP_<?=$propCode?>"<? echo ($arProp["IS_DELETED"] == "N" ? ' checked="checked"' : ''); ?> onclick="CatalogCompareObj.MakeAjaxAction('<?=CUtil::JSEscape($arProp["ACTION_LINK"])?>')"></span>
			<label for="OP_<?=$propCode?>"><?=$arProp["NAME"]?></label>
		</span></li>
	<?
		}
	}
	?>
	</ul>
</div>
<?
}
?>
<div class="table_compare" role="region" aria-label="<?=GetMessage("CATALOG_COMPARE_SCROLL_REGION")?>">
<table class="data-table">
<caption class="bx-compare-a11y-text"><?=GetMessage("CATALOG_COMPARE_TABLE_CAPTION")?></caption>
<?
// A cell with nothing in it sounds to a reader exactly like the end of the row: the phrase tells
// the two apart and stays away from the eye.
$printCellValue = static function ($value): void
{
	if ((string)$value !== '')
	{
		echo $value;

		return;
	}
	?><span class="bx-compare-a11y-text"><?=GetMessage("CATALOG_COMPARE_NO_VALUE")?></span><?
};

// The names of the products are the header of the table, and the header is printed in both modes:
// inside the loop below this row was dropped by the same check as any other one, and in the mode
// "only the different" the columns were left nameless exactly where comparing is hardest.
if (isset($arResult["SHOW_FIELDS"]["NAME"]))
{
	?><thead>
	<tr>
		<td></td>
		<?
		foreach ($arResult["ITEMS"] as $arElement)
		{
			// The column is named explicitly: the buy button lies in this very cell, and a header
			// named by its own content would repeat "name buy" over every cell of the column.
			?><th scope="col" aria-label="<?=$arElement["NAME"]?>">
			<a href="<?=$arElement["DETAIL_PAGE_URL"]?>"><?=$arElement["NAME"]?></a>
			<?if($arElement["CAN_BUY"]):?>
			<noindex><br /><a class="bx_bt_button bx_small" href="<?=$arElement["BUY_URL"]?>" rel="nofollow"
				aria-label="<?=htmlspecialcharsbx(GetMessage("CATALOG_COMPARE_BUY_FOR", array("#NAME#" => $arElement["~NAME"])))?>"
			><?=GetMessage("CATALOG_COMPARE_BUY"); ?></a></noindex>
			<?elseif(!empty($arResult["PRICES"]) || is_array($arElement["PRICE_MATRIX"])):?>
			<br /><?=GetMessage("CATALOG_NOT_AVAILABLE")?>
			<?endif;?>
			</th><?
		}
		unset($arElement);
		?>
	</tr>
	</thead><?
}

if (!empty($arResult["SHOW_FIELDS"]))
{
	foreach ($arResult["SHOW_FIELDS"] as $code => $arProp)
	{
		if ($code === "NAME")
		{
			continue;
		}

		$showRow = true;
		if ((!isset($arResult['FIELDS_REQUIRED'][$code]) || $arResult['DIFFERENT']) && count($arResult["ITEMS"]) > 1)
		{
			$arCompare = array();
			foreach($arResult["ITEMS"] as $arElement)
			{
				$arPropertyValue = $arElement["FIELDS"][$code];
				if (is_array($arPropertyValue))
				{
					sort($arPropertyValue);
					$arPropertyValue = implode(" / ", $arPropertyValue);
				}
				$arCompare[] = $arPropertyValue;
			}
			unset($arElement);
			$showRow = (count(array_unique($arCompare)) > 1);
		}
		if ($showRow)
		{
			?><tr><th scope="row"><?=GetMessage("IBLOCK_FIELD_".$code)?></th><?
			foreach($arResult["ITEMS"] as $arElement)
			{
		?>
				<td valign="top">
		<?
				switch($code)
				{
					case "PREVIEW_PICTURE":
					case "DETAIL_PICTURE":
						if (!empty($arElement["FIELDS"][$code]) && is_array($arElement["FIELDS"][$code])):?>
							<a href="<?=$arElement["DETAIL_PAGE_URL"]?>"><img
							border="0" src="<?=$arElement["FIELDS"][$code]["SRC"]?>"
							width="auto" height="150"
							alt="<?=$arElement["FIELDS"][$code]["ALT"]?>" title="<?=$arElement["FIELDS"][$code]["TITLE"]?>"
							/></a>
						<?else:
							$printCellValue('');
						endif;
						break;
					default:
						$printCellValue($arElement["FIELDS"][$code]);
						break;
				}
			?>
				</td>
			<?
			}
			unset($arElement);
		}
	?>
	</tr>
	<?
	}
}

if (!empty($arResult["SHOW_OFFER_FIELDS"]))
{
	foreach ($arResult["SHOW_OFFER_FIELDS"] as $code => $arProp)
	{
		$showRow = true;
		if ($arResult['DIFFERENT'])
		{
			$arCompare = array();
			foreach($arResult["ITEMS"] as $arElement)
			{
				$Value = $arElement["OFFER_FIELDS"][$code];
				if(is_array($Value))
				{
					sort($Value);
					$Value = implode(" / ", $Value);
				}
				$arCompare[] = $Value;
			}
			unset($arElement);
			$showRow = (count(array_unique($arCompare)) > 1);
		}
		if ($showRow)
		{
		?>
		<tr>
			<th scope="row"><?=GetMessage("IBLOCK_OFFER_FIELD_".$code)?></th>
			<?foreach($arResult["ITEMS"] as $arElement)
			{
				?><td><?
				switch ($code)
				{
					case 'PREVIEW_PICTURE':
					case 'DETAIL_PICTURE':
						if (!empty($arElement["OFFER_FIELDS"][$code]) && is_array($arElement["OFFER_FIELDS"][$code]))
						{
							?><img border="0" src="<?= $arElement["OFFER_FIELDS"][$code]["SRC"] ?>"
								width="auto" height="150"
								alt="<?= $arElement["OFFER_FIELDS"][$code]["ALT"] ?>" title="<?= $arElement["OFFER_FIELDS"][$code]["TITLE"] ?>"
							/><?
						}
						else
						{
							$printCellValue('');
						}
						break;
					default:
						$printCellValue(is_array($arElement["OFFER_FIELDS"][$code])? implode("/ ", $arElement["OFFER_FIELDS"][$code]): $arElement["OFFER_FIELDS"][$code]);
						break;
				}
				?></td><?
			}
			unset($arElement);
			?>
		</tr>
		<?
		}
	}
}
?>
<tr>
	<th scope="row"><?=GetMessage('CATALOG_COMPARE_PRICE');?></th>
	<?
	foreach ($arResult["ITEMS"] as $arElement)
	{
		if (isset($arElement['MIN_PRICE']) && is_array($arElement['MIN_PRICE']))
		{
			?><td><? $printCellValue($arElement['MIN_PRICE']['PRINT_DISCOUNT_VALUE']); ?></td><?
		}
		elseif (!empty($arElement['PRICE_MATRIX']) && is_array($arElement['PRICE_MATRIX']))
		{
			?><td style="vertical-align: top;"><?
			$matrix = $arElement['PRICE_MATRIX'];
			$rows = $matrix['ROWS'];
			$rowsCount = count($rows);
			if ($rowsCount > 0)
			{
				?><table class="compare-price"><?
				if (count($rows) > 1)
				{
					foreach ($rows as $index => $rowData)
					{
						if (empty($matrix['MIN_PRICES'][$index]))
							continue;
						if ($rowData['QUANTITY_FROM'] == 0)
							$rowTitle = GetMessage('CP_TPL_CCR_RANGE_TO', array('#TO#' => $rowData['QUANTITY_TO']));
						elseif ($rowData['QUANTITY_TO'] == 0)
							$rowTitle = GetMessage('CP_TPL_CCR_RANGE_FROM', array('#FROM#' => $rowData['QUANTITY_FROM']));
						else
							$rowTitle = GetMessage(
								'CP_TPL_CCR_RANGE_FULL',
								array('#FROM#' => $rowData['QUANTITY_FROM'], '#TO#' => $rowData['QUANTITY_TO'])
							);
						echo '<tr><td>'.$rowTitle.'</td><td>';
						echo \CCurrencyLang::CurrencyFormat($matrix['MIN_PRICES'][$index]['PRICE'], $matrix['MIN_PRICES'][$index]['CURRENCY']);
						echo '</td></tr>';
						unset($rowTitle);
					}
					unset($index, $rowData);
				}
				else
				{
					$currentPrice = current($matrix['MIN_PRICES']);
					echo '<tr><td class="simple">'.\CCurrencyLang::CurrencyFormat($currentPrice['PRICE'], $currentPrice['CURRENCY']).'</td></tr>';
					unset($currentPrice);
				}
				?></table><?
			}
			unset($rowsCount, $rows, $matrix);
			?></td><?
		}
		else
		{
			?><td><? $printCellValue(''); ?></td><?
		}
	}
	unset($arElement);
	?>
</tr>
<?
if (!empty($arResult["SHOW_PROPERTIES"]))
{
	foreach ($arResult["SHOW_PROPERTIES"] as $code => $arProperty)
	{
		$showRow = true;
		if ($arResult['DIFFERENT'])
		{
			$arCompare = array();
			foreach($arResult["ITEMS"] as $arElement)
			{
				if (!isset($arElement["DISPLAY_PROPERTIES"][$code]))
				{
					continue;
				}
				$arPropertyValue = $arElement["DISPLAY_PROPERTIES"][$code]["VALUE"];
				if (is_array($arPropertyValue))
				{
					sort($arPropertyValue);
					$arPropertyValue = implode(" / ", $arPropertyValue);
				}
				$arCompare[] = $arPropertyValue;
			}
			unset($arElement);
			$showRow = (count(array_unique($arCompare)) > 1);
		}

		if ($showRow)
		{
			?>
			<tr>
				<th scope="row"><?=$arProperty["NAME"]?></th>
				<?foreach($arResult["ITEMS"] as $arElement)
				{
					?>
					<td>
						<?php
							$printCellValue(
								isset($arElement["DISPLAY_PROPERTIES"][$code])
									? (
										is_array($arElement["DISPLAY_PROPERTIES"][$code]["DISPLAY_VALUE"])
											? implode("/ ", $arElement["DISPLAY_PROPERTIES"][$code]["DISPLAY_VALUE"])
											: (string)$arElement["DISPLAY_PROPERTIES"][$code]["DISPLAY_VALUE"]
									)
									: ''
							);
						?>
					</td>
				<?
				}
				unset($arElement);
				?>
			</tr>
		<?
		}
	}
}

if (!empty($arResult["SHOW_OFFER_PROPERTIES"]))
{
	foreach($arResult["SHOW_OFFER_PROPERTIES"] as $code=>$arProperty)
	{
		$showRow = true;
		if ($arResult['DIFFERENT'])
		{
			$arCompare = array();
			foreach($arResult["ITEMS"] as $arElement)
			{
				if (!isset($arElement["OFFER_DISPLAY_PROPERTIES"][$code]))
				{
					continue;
				}
				$arPropertyValue = $arElement["OFFER_DISPLAY_PROPERTIES"][$code]["VALUE"];
				if(is_array($arPropertyValue))
				{
					sort($arPropertyValue);
					$arPropertyValue = implode(" / ", $arPropertyValue);
				}
				$arCompare[] = $arPropertyValue;
			}
			unset($arElement);
			$showRow = (count(array_unique($arCompare)) > 1);
		}
		if ($showRow)
		{
		?>
		<tr>
			<th scope="row"><?=$arProperty["NAME"]?></th>
			<?foreach($arResult["ITEMS"] as $arElement)
			{
			?>
			<td>
				<?php
				$printCellValue(
					isset($arElement["OFFER_DISPLAY_PROPERTIES"][$code])
						? (
							is_array($arElement["OFFER_DISPLAY_PROPERTIES"][$code]["DISPLAY_VALUE"])
								? implode("/ ", $arElement["OFFER_DISPLAY_PROPERTIES"][$code]["DISPLAY_VALUE"])
								: (string)$arElement["OFFER_DISPLAY_PROPERTIES"][$code]["DISPLAY_VALUE"]
						)
						: ''
				);
				?>
			</td>
			<?
			}
			unset($arElement);
			?>
		</tr>
		<?
		}
	}
}
	?>
	<tr>
		<td></td>
		<?foreach($arResult["ITEMS"] as $arElement)
		{
		?>
		<td>
			<a onclick="CatalogCompareObj.delete('<?=CUtil::JSEscape($arElement['~DELETE_URL'])?>');" href="javascript:void(0)"
				aria-label="<?=htmlspecialcharsbx(GetMessage("CATALOG_REMOVE_PRODUCT_FOR", array("#NAME#" => $arElement["~NAME"])))?>"
			><?=GetMessage("CATALOG_REMOVE_PRODUCT")?></a>
		</td>
		<?
		}
		unset($arElement);
		?>
	</tr>
</table>
</div>
<?
if ($isAjax)
{
	die();
}
?>
</div>
<?
// The language file of a template does not reach its script: the platform prints the script into
// the page and knows nothing about the phrases of the template. The two the script speaks with are
// handed over here, where the template is the one talking to it.
?><script>
	var CatalogCompareObj = new BX.Iblock.Catalog.CompareClass(
		"bx_catalog_compare_block",
		'<?=CUtil::JSEscape($arResult['~COMPARE_URL_TEMPLATE']); ?>',
		<?=CUtil::PhpToJSObject(array(
			'ANNOUNCE_REMOVED' => GetMessage('CATALOG_COMPARE_ANNOUNCE_REMOVED'),
			'ANNOUNCE_PARAMS' => GetMessage('CATALOG_COMPARE_ANNOUNCE_PARAMS'),
		)); ?>
	);
</script>