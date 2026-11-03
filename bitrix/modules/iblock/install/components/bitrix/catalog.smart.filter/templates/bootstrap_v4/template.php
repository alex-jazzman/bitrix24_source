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

use Bitrix\Iblock\SectionPropertyTable;

$this->setFrameMode(true);
$templateData = array(
	'TEMPLATE_CLASS' => 'bx-'.$arParams['TEMPLATE_THEME']
);

if (isset($templateData['TEMPLATE_THEME']))
{
	$this->addExternalCss($templateData['TEMPLATE_THEME']);
}

// A property with an empty name would leave its toggle, its group and its range fields nameless:
// they are named by a fallback phrase instead of the empty title.
$getPropertyA11y = static function (array $item, string $key): array
{
	if (trim((string)$item["NAME"]) !== '')
	{
		return array(
			"NAME" => $item["NAME"],
			"LABEL" => 'aria-labelledby="smart_filter_prop_'.$key.'"',
		);
	}

	$name = htmlspecialcharsbx(GetMessage("CT_BCSF_PROP_FALLBACK_ARIA", array("#ID#" => $item["ID"])));

	return array(
		"NAME" => $name,
		"LABEL" => 'aria-label="'.$name.'"',
	);
};

// A value with an empty name is called by its position among the values of its property.
$getValueFallbacks = static function (array $values): array
{
	$fallbacks = array();
	$number = 0;
	foreach ($values as $val => $value)
	{
		$number++;
		if (trim((string)($value["VALUE"] ?? '')) === '')
		{
			$fallbacks[$val] = GetMessage("CT_BCSF_VALUE_FALLBACK_ARIA", array("#NUM#" => $number));
		}
	}

	return $fallbacks;
};
?>
<div class="smart-filter mb-4 <?=$templateData["TEMPLATE_CLASS"]?> <?if ($arParams["FILTER_VIEW_MODE"] == "HORIZONTAL") echo "smart-filter-horizontal"?>">
	<div class="smart-filter-section">

		<div class="smart-filter-title" id="smart_filter_caption"><?echo GetMessage("CT_BCSF_FILTER_TITLE")?></div>

		<?// the bounds of a range are there for the accessibility tree: the server takes a value outside them as it always did?>
		<form name="<?echo $arResult["FILTER_NAME"]."_form"?>" action="<?echo $arResult["FORM_ACTION"]?>" method="get" class="smart-filter-form" aria-labelledby="smart_filter_caption" novalidate onkeydown="smartFilter.keydown(event)">

			<?foreach($arResult["HIDDEN"] as $arItem):?>
				<input type="hidden" name="<?echo $arItem["CONTROL_NAME"]?>" id="<?echo $arItem["CONTROL_ID"]?>" value="<?echo $arItem["HTML_VALUE"]?>" />
			<?endforeach;?>

			<div class="row">
				<?foreach($arResult["ITEMS"] as $key=>$arItem)//prices
				{
					$key = $arItem["ENCODED_ID"];
					if(isset($arItem["PRICE"])):
						if ($arItem["VALUES"]["MAX"]["VALUE"] - $arItem["VALUES"]["MIN"]["VALUE"] <= 0)
							continue;

						$propertyA11y = $getPropertyA11y($arItem, (string)$key);

						$precision = 0;
						$step_num = 4;
						$step = ($arItem["VALUES"]["MAX"]["VALUE"] - $arItem["VALUES"]["MIN"]["VALUE"]) / $step_num;
						$prices = array();
						if (Bitrix\Main\Loader::includeModule("currency"))
						{
							for ($i = 0; $i < $step_num; $i++)
							{
								$prices[$i] = CCurrencyLang::CurrencyFormat($arItem["VALUES"]["MIN"]["VALUE"] + $step*$i, $arItem["VALUES"]["MIN"]["CURRENCY"], false);
							}
							$prices[$step_num] = CCurrencyLang::CurrencyFormat($arItem["VALUES"]["MAX"]["VALUE"], $arItem["VALUES"]["MAX"]["CURRENCY"], false);
						}
						else
						{
							$precision = $arItem["DECIMALS"]? $arItem["DECIMALS"]: 0;
							for ($i = 0; $i < $step_num; $i++)
							{
								$prices[$i] = number_format($arItem["VALUES"]["MIN"]["VALUE"] + $step*$i, $precision, ".", "");
							}
							$prices[$step_num] = number_format($arItem["VALUES"]["MAX"]["VALUE"], $precision, ".", "");
						}
						?>

						<div class="<?if ($arParams["FILTER_VIEW_MODE"] == "HORIZONTAL"):?>col-sm-6 col-md-4<?else:?>col-12<?endif?> mb-2 smart-filter-parameters-box bx-active">
							<button
								type="button"
								class="smart-filter-parameters-box-title"
								aria-expanded="true"
								aria-controls="smart_filter_values_<?=$key?>"
								<?=$propertyA11y["LABEL"]?>
								onclick="smartFilter.hideFilterProps(this)"
							>
								<span class="smart-filter-container-modef"></span>
								<span class="smart-filter-parameters-box-title-text" id="smart_filter_prop_<?=$key?>"><?=$arItem["NAME"]?></span>
								<span data-role="prop_angle" class="smart-filter-angle smart-filter-angle-up">
									<span  class="smart-filter-angles"></span>
								</span>
							</button>

							<div class="smart-filter-block" data-role="bx_filter_block" id="smart_filter_values_<?=$key?>" role="group" <?=$propertyA11y["LABEL"]?>>
								<div class="smart-filter-parameters-box-container">
									<div class="smart-filter-input-group-number">
										<div class="d-flex justify-content-between" role="group">
											<div class="form-group" style="width: calc(50% - 10px);">
												<div class="smart-filter-input-container">
													<label class="smart-filter-a11y-text" for="<?echo $arItem["VALUES"]["MIN"]["CONTROL_ID"]?>"><?=GetMessage("CT_BCSF_FILTER_FROM_FOR", array("#NAME#" => $propertyA11y["NAME"]))?></label>
													<input
														class="min-price form-control form-control-sm"
														type="number"
														name="<?echo $arItem["VALUES"]["MIN"]["CONTROL_NAME"]?>"
														id="<?echo $arItem["VALUES"]["MIN"]["CONTROL_ID"]?>"
														value="<?echo $arItem["VALUES"]["MIN"]["HTML_VALUE"]?>"
														size="5"
														min="<?=htmlspecialcharsbx($arItem["VALUES"]["MIN"]["VALUE"] ?? '')?>"
														max="<?=htmlspecialcharsbx($arItem["VALUES"]["MAX"]["VALUE"] ?? '')?>"
														step="any"
														placeholder="<?=GetMessage("CT_BCSF_FILTER_FROM")?>"
														onkeyup="smartFilter.keyup(this)"
													/>
												</div>
											</div>

											<div class="form-group" style="width: calc(50% - 10px);">
												<div class="smart-filter-input-container">
													<label class="smart-filter-a11y-text" for="<?echo $arItem["VALUES"]["MAX"]["CONTROL_ID"]?>"><?=GetMessage("CT_BCSF_FILTER_TO_FOR", array("#NAME#" => $propertyA11y["NAME"]))?></label>
													<input
														class="max-price form-control form-control-sm"
														type="number"
														name="<?echo $arItem["VALUES"]["MAX"]["CONTROL_NAME"]?>"
														id="<?echo $arItem["VALUES"]["MAX"]["CONTROL_ID"]?>"
														value="<?echo $arItem["VALUES"]["MAX"]["HTML_VALUE"]?>"
														size="5"
														min="<?=htmlspecialcharsbx($arItem["VALUES"]["MIN"]["VALUE"] ?? '')?>"
														max="<?=htmlspecialcharsbx($arItem["VALUES"]["MAX"]["VALUE"] ?? '')?>"
														step="any"
														placeholder="<?=GetMessage("CT_BCSF_FILTER_TO")?>"
														onkeyup="smartFilter.keyup(this)"
													/>
												</div>
											</div>
										</div>

										<div class="smart-filter-slider-track-container">
											<div class="smart-filter-slider-track" id="drag_track_<?=$key?>">
												<?for($i = 0; $i <= $step_num; $i++):?>
												<div class="smart-filter-slider-ruler p<?=$i+1?>"><span><?=$prices[$i]?></span></div>
												<?endfor;?>
												<div class="smart-filter-slider-price-bar-vd" style="left: 0;right: 0;" id="colorUnavailableActive_<?=$key?>"></div>
												<div class="smart-filter-slider-price-bar-vn" style="left: 0;right: 0;" id="colorAvailableInactive_<?=$key?>"></div>
												<div class="smart-filter-slider-price-bar-v"  style="left: 0;right: 0;" id="colorAvailableActive_<?=$key?>"></div>
												<div class="smart-filter-slider-range" id="drag_tracker_<?=$key?>"  style="left: 0; right: 0;">
													<a class="smart-filter-slider-handle left"  style="left:0;" id="left_slider_<?=$key?>" tabindex="-1" aria-hidden="true"></a>
													<a class="smart-filter-slider-handle right" style="right:0;" id="right_slider_<?=$key?>" tabindex="-1" aria-hidden="true"></a>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<?

						$arJsParams = array(
							"leftSlider" => 'left_slider_'.$key,
							"rightSlider" => 'right_slider_'.$key,
							"tracker" => "drag_tracker_".$key,
							"trackerWrap" => "drag_track_".$key,
							"minInputId" => $arItem["VALUES"]["MIN"]["CONTROL_ID"],
							"maxInputId" => $arItem["VALUES"]["MAX"]["CONTROL_ID"],
							"minPrice" => $arItem["VALUES"]["MIN"]["VALUE"],
							"maxPrice" => $arItem["VALUES"]["MAX"]["VALUE"],
							"curMinPrice" => $arItem["VALUES"]["MIN"]["HTML_VALUE"],
							"curMaxPrice" => $arItem["VALUES"]["MAX"]["HTML_VALUE"],
							"fltMinPrice" => intval($arItem["VALUES"]["MIN"]["FILTERED_VALUE"]) ? $arItem["VALUES"]["MIN"]["FILTERED_VALUE"] : $arItem["VALUES"]["MIN"]["VALUE"] ,
							"fltMaxPrice" => intval($arItem["VALUES"]["MAX"]["FILTERED_VALUE"]) ? $arItem["VALUES"]["MAX"]["FILTERED_VALUE"] : $arItem["VALUES"]["MAX"]["VALUE"],
							"precision" => $precision,
							"colorUnavailableActive" => 'colorUnavailableActive_'.$key,
							"colorAvailableActive" => 'colorAvailableActive_'.$key,
							"colorAvailableInactive" => 'colorAvailableInactive_'.$key,
						);
						?>
						<script>
							BX.ready(function(){
								window['trackBar<?=$key?>'] = new BX.Iblock.SmartFilter(<?=CUtil::PhpToJSObject($arJsParams)?>);
							});
						</script>
					<?endif;
				}

				//not prices
				foreach($arResult["ITEMS"] as $key=>$arItem)
				{
					if (empty($arItem["VALUES"]) || isset($arItem["PRICE"]))
						continue;

					if (
						$arItem["DISPLAY_TYPE"] === SectionPropertyTable::NUMBERS_WITH_SLIDER
						&& ($arItem["VALUES"]["MAX"]["VALUE"] - $arItem["VALUES"]["MIN"]["VALUE"] <= 0)
					)
					{
						continue;
					}

					$propertyA11y = $getPropertyA11y($arItem, (string)$key);
					$valueFallbacks = $getValueFallbacks($arItem["VALUES"]);
					?>

					<div class="<?if ($arParams["FILTER_VIEW_MODE"] == "HORIZONTAL"):?>col-sm-6 col-md-4<?else:?>col-lg-12<?endif?> mb-2 smart-filter-parameters-box <?if ($arItem["DISPLAY_EXPANDED"]== "Y"):?>bx-active<?endif?>">
						<button
							type="button"
							class="smart-filter-parameters-box-title"
							aria-expanded="<?if ($arItem["DISPLAY_EXPANDED"]== "Y"):?>true<?else:?>false<?endif?>"
							aria-controls="smart_filter_values_<?=$key?>"
							<?=$propertyA11y["LABEL"]?>
							onclick="smartFilter.hideFilterProps(this)"
						>
							<span class="smart-filter-container-modef"></span>

							<span class="smart-filter-parameters-box-title-text" id="smart_filter_prop_<?=$key?>"><?=$arItem["NAME"]?></span>

							<span data-role="prop_angle" class="smart-filter-angle smart-filter-angle-<?if ($arItem["DISPLAY_EXPANDED"]== "Y"):?>up<?else:?>down<?endif?>">
								<span  class="smart-filter-angles"></span>
							</span>

							<?if ($arItem["FILTER_HINT"] <> ""):?>
								<span class="smart-filter-hint">
									<span class="smart-filter-hint-icon">?</span>
									<span class="smart-filter-hint-popup">
										<span class="smart-filter-hint-popup-angle"></span>
										<span class="smart-filter-hint-popup-content">

										</span>	<?=$arItem["FILTER_HINT"]?></span>
								</span>
							<?endif?>
						</button>

						<div class="smart-filter-block" data-role="bx_filter_block" id="smart_filter_values_<?=$key?>" role="group" <?=$propertyA11y["LABEL"]?>>
							<div class="smart-filter-parameters-box-container">
							<?
							$arCur = current($arItem["VALUES"]);
							switch ($arItem["DISPLAY_TYPE"])
							{
								//region NUMBERS_WITH_SLIDER +
								case SectionPropertyTable::NUMBERS_WITH_SLIDER:
								?>
									<div class="smart-filter-input-group-number">
										<div class="d-flex justify-content-between" role="group">

											<div class="form-group" style="width: calc(50% - 10px);">
												<div class="smart-filter-input-container">
													<label class="smart-filter-a11y-text" for="<?echo $arItem["VALUES"]["MIN"]["CONTROL_ID"]?>"><?=GetMessage("CT_BCSF_FILTER_FROM_FOR", array("#NAME#" => $propertyA11y["NAME"]))?></label>
													<input class="min-price form-control form-control-sm"
														type="number"
														name="<?echo $arItem["VALUES"]["MIN"]["CONTROL_NAME"]?>"
														id="<?echo $arItem["VALUES"]["MIN"]["CONTROL_ID"]?>"
														value="<?echo $arItem["VALUES"]["MIN"]["HTML_VALUE"]?>"
														size="5"
														min="<?=htmlspecialcharsbx($arItem["VALUES"]["MIN"]["VALUE"] ?? '')?>"
														max="<?=htmlspecialcharsbx($arItem["VALUES"]["MAX"]["VALUE"] ?? '')?>"
														step="any"
														placeholder="<?=GetMessage("CT_BCSF_FILTER_FROM")?>"
														onkeyup="smartFilter.keyup(this)"
													/>
												</div>
											</div>

											<div class="form-group" style="width: calc(50% - 10px);">
												<div class="smart-filter-input-container">
													<label class="smart-filter-a11y-text" for="<?echo $arItem["VALUES"]["MAX"]["CONTROL_ID"]?>"><?=GetMessage("CT_BCSF_FILTER_TO_FOR", array("#NAME#" => $propertyA11y["NAME"]))?></label>
													<input
														class="max-price form-control form-control-sm"
														type="number"
														name="<?echo $arItem["VALUES"]["MAX"]["CONTROL_NAME"]?>"
														id="<?echo $arItem["VALUES"]["MAX"]["CONTROL_ID"]?>"
														value="<?echo $arItem["VALUES"]["MAX"]["HTML_VALUE"]?>"
														size="5"
														min="<?=htmlspecialcharsbx($arItem["VALUES"]["MIN"]["VALUE"] ?? '')?>"
														max="<?=htmlspecialcharsbx($arItem["VALUES"]["MAX"]["VALUE"] ?? '')?>"
														step="any"
														placeholder="<?=GetMessage("CT_BCSF_FILTER_TO")?>"
														onkeyup="smartFilter.keyup(this)"
													/>
												</div>
											</div>

										</div>

										<div class="smart-filter-slider-track-container">
											<div class="smart-filter-slider-track" id="drag_track_<?=$key?>">
												<?
													$precision = $arItem["DECIMALS"]? $arItem["DECIMALS"]: 0;
													$step = ($arItem["VALUES"]["MAX"]["VALUE"] - $arItem["VALUES"]["MIN"]["VALUE"]) / 4;
													$value1 = number_format($arItem["VALUES"]["MIN"]["VALUE"], $precision, ".", "");
													$value2 = number_format($arItem["VALUES"]["MIN"]["VALUE"] + $step, $precision, ".", "");
													$value3 = number_format($arItem["VALUES"]["MIN"]["VALUE"] + $step * 2, $precision, ".", "");
													$value4 = number_format($arItem["VALUES"]["MIN"]["VALUE"] + $step * 3, $precision, ".", "");
													$value5 = number_format($arItem["VALUES"]["MAX"]["VALUE"], $precision, ".", "");
												?>
												<div class="smart-filter-slider-ruler p1"><span><?=$value1?></span></div>
												<div class="smart-filter-slider-ruler p2"><span><?=$value2?></span></div>
												<div class="smart-filter-slider-ruler p3"><span><?=$value3?></span></div>
												<div class="smart-filter-slider-ruler p4"><span><?=$value4?></span></div>
												<div class="smart-filter-slider-ruler p5"><span><?=$value5?></span></div>

												<div class="smart-filter-slider-price-bar-vd" style="left: 0;right: 0;" id="colorUnavailableActive_<?=$key?>"></div>
												<div class="smart-filter-slider-price-bar-vn" style="left: 0;right: 0;" id="colorAvailableInactive_<?=$key?>"></div>
												<div class="smart-filter-slider-price-bar-v"  style="left: 0;right: 0;" id="colorAvailableActive_<?=$key?>"></div>
												<div class="smart-filter-slider-range" 	id="drag_tracker_<?=$key?>"  style="left: 0;right: 0;">
													<a class="smart-filter-slider-handle left"  style="left:0;" id="left_slider_<?=$key?>" tabindex="-1" aria-hidden="true"></a>
													<a class="smart-filter-slider-handle right" style="right:0;" id="right_slider_<?=$key?>" tabindex="-1" aria-hidden="true"></a>
												</div>
											</div>
										</div>
									</div>

									<?
										$arJsParams = array(
										"leftSlider" => 'left_slider_'.$key,
										"rightSlider" => 'right_slider_'.$key,
										"tracker" => "drag_tracker_".$key,
										"trackerWrap" => "drag_track_".$key,
										"minInputId" => $arItem["VALUES"]["MIN"]["CONTROL_ID"],
										"maxInputId" => $arItem["VALUES"]["MAX"]["CONTROL_ID"],
										"minPrice" => $arItem["VALUES"]["MIN"]["VALUE"],
										"maxPrice" => $arItem["VALUES"]["MAX"]["VALUE"],
										"curMinPrice" => $arItem["VALUES"]["MIN"]["HTML_VALUE"],
										"curMaxPrice" => $arItem["VALUES"]["MAX"]["HTML_VALUE"],
										"fltMinPrice" => intval($arItem["VALUES"]["MIN"]["FILTERED_VALUE"]) ? $arItem["VALUES"]["MIN"]["FILTERED_VALUE"] : $arItem["VALUES"]["MIN"]["VALUE"] ,
										"fltMaxPrice" => intval($arItem["VALUES"]["MAX"]["FILTERED_VALUE"]) ? $arItem["VALUES"]["MAX"]["FILTERED_VALUE"] : $arItem["VALUES"]["MAX"]["VALUE"],
										"precision" => $arItem["DECIMALS"]? $arItem["DECIMALS"]: 0,
										"colorUnavailableActive" => 'colorUnavailableActive_'.$key,
										"colorAvailableActive" => 'colorAvailableActive_'.$key,
										"colorAvailableInactive" => 'colorAvailableInactive_'.$key,
									);
									?>
										<script>
											BX.ready(function(){
												window['trackBar<?=$key?>'] = new BX.Iblock.SmartFilter(<?=CUtil::PhpToJSObject($arJsParams)?>);
											});
										</script>
									<?

								break;

								//endregion

								//region NUMBERS +
								case SectionPropertyTable::NUMBERS:
								?>
									<div class="smart-filter-input-group-number">
										<div class="d-flex justify-content-between" role="group">
											<div class="form-group" style="width: calc(50% - 10px);">
												<div class="smart-filter-input-container">
													<label class="smart-filter-a11y-text" for="<?echo $arItem["VALUES"]["MIN"]["CONTROL_ID"]?>"><?=GetMessage("CT_BCSF_FILTER_FROM_FOR", array("#NAME#" => $propertyA11y["NAME"]))?></label>
													<input
														class="min-price form-control form-control-sm"
														type="number"
														name="<?echo $arItem["VALUES"]["MIN"]["CONTROL_NAME"]?>"
														id="<?echo $arItem["VALUES"]["MIN"]["CONTROL_ID"]?>"
														value="<?echo $arItem["VALUES"]["MIN"]["HTML_VALUE"]?>"
														size="5"
														min="<?=htmlspecialcharsbx($arItem["VALUES"]["MIN"]["VALUE"] ?? '')?>"
														max="<?=htmlspecialcharsbx($arItem["VALUES"]["MAX"]["VALUE"] ?? '')?>"
														step="any"
														placeholder="<?=GetMessage("CT_BCSF_FILTER_FROM")?>"
														onkeyup="smartFilter.keyup(this)"
														/>
												</div>
											</div>

											<div class="form-group" style="width: calc(50% - 10px);">
											<div class="smart-filter-input-container">
												<label class="smart-filter-a11y-text" for="<?echo $arItem["VALUES"]["MAX"]["CONTROL_ID"]?>"><?=GetMessage("CT_BCSF_FILTER_TO_FOR", array("#NAME#" => $propertyA11y["NAME"]))?></label>
												<input
													class="max-price form-control form-control-sm"
													type="number"
													name="<?echo $arItem["VALUES"]["MAX"]["CONTROL_NAME"]?>"
													id="<?echo $arItem["VALUES"]["MAX"]["CONTROL_ID"]?>"
													value="<?echo $arItem["VALUES"]["MAX"]["HTML_VALUE"]?>"
													size="5"
													min="<?=htmlspecialcharsbx($arItem["VALUES"]["MIN"]["VALUE"] ?? '')?>"
													max="<?=htmlspecialcharsbx($arItem["VALUES"]["MAX"]["VALUE"] ?? '')?>"
													step="any"
													placeholder="<?=GetMessage("CT_BCSF_FILTER_TO")?>"
													onkeyup="smartFilter.keyup(this)"
													/>
											</div>
										</div>
										</div>
									</div>
								<?
								break;
								//endregion

								//region CHECKBOXES_WITH_PICTURES +
								case SectionPropertyTable::CHECKBOXES_WITH_PICTURES:
								?>
									<div class="smart-filter-input-group-checkbox-pictures">
										<?foreach ($arItem["VALUES"] as $val => $ar):?>
											<input
												class="smart-filter-a11y-text"
												type="checkbox"
												name="<?=$ar["CONTROL_NAME"]?>"
												id="<?=$ar["CONTROL_ID"]?>"
												value="<?=$ar["HTML_VALUE"]?>"
												<? echo $ar["CHECKED"]? 'checked="checked"': '' ?>
												onchange="smartFilter.toggleValue(this)"
											/>
											<?
												$class = "";
												if ($ar["CHECKED"])
													$class.= " bx-active";
												if ($ar["DISABLED"])
													$class.= " disabled";
											?>
											<label for="<?=$ar["CONTROL_ID"]?>"
													data-role="label_<?=$ar["CONTROL_ID"]?>"
													class="smart-filter-checkbox-label<?=$class?>">
												<span class="smart-filter-checkbox-btn bx-color-sl">
													<?if (isset($ar["FILE"]) && !empty($ar["FILE"]["SRC"])):?>
														<span class="smart-filter-checkbox-btn-image" style="background-image: url('<?=$ar["FILE"]["SRC"]?>');"></span>
													<?endif?>
												</span>
												<span class="smart-filter-a11y-text"><?=$valueFallbacks[$val] ?? $ar["VALUE"]?></span>
											</label>
										<?endforeach?>
										<div style="clear: both;"></div>
									</div>
								<?
								break;
								//endregion

								//region CHECKBOXES_WITH_PICTURES_AND_LABELS +
								case SectionPropertyTable::CHECKBOXES_WITH_PICTURES_AND_LABELS:
								?>
									<div class="smart-filter-input-group-checkbox-pictures-text">
										<?foreach ($arItem["VALUES"] as $val => $ar):?>
										<input
											class="smart-filter-a11y-text"
											type="checkbox"
											name="<?=$ar["CONTROL_NAME"]?>"
											id="<?=$ar["CONTROL_ID"]?>"
											value="<?=$ar["HTML_VALUE"]?>"
											<? echo $ar["CHECKED"]? 'checked="checked"': '' ?>
											onchange="smartFilter.toggleValue(this)"
										/>
										<?
											$class = "";
											if ($ar["CHECKED"])
												$class.= " bx-active";
											if ($ar["DISABLED"])
												$class.= " disabled";
										?>
										<label for="<?=$ar["CONTROL_ID"]?>"
												data-role="label_<?=$ar["CONTROL_ID"]?>"
												class="smart-filter-checkbox-label<?=$class?>">
											<span class="smart-filter-checkbox-btn">
												<?if (isset($ar["FILE"]) && !empty($ar["FILE"]["SRC"])):?>
													<span class="smart-filter-checkbox-btn-image" style="background-image:url('<?=$ar["FILE"]["SRC"]?>');"></span>
												<?endif?>
											</span>
											<span class="smart-filter-checkbox-text" title="<?=$ar["VALUE"];?>">
												<?=$ar["VALUE"];
												if (isset($valueFallbacks[$val])):
													?><span class="smart-filter-a11y-text"><?=$valueFallbacks[$val]?></span><?
												endif;
												if ($arParams["DISPLAY_ELEMENT_COUNT"] !== "N" && isset($ar["ELEMENT_COUNT"])):
													?> (<span data-role="count_<?=$ar["CONTROL_ID"]?>"><? echo $ar["ELEMENT_COUNT"]; ?></span>)<?
												endif;?>
											</span>
										</label>
									<?endforeach?>
									</div>
								<?
								break;
								//endregion

								//region DROPDOWN +
								case SectionPropertyTable::DROPDOWN:
								?>
									<? $checkedItemExist = false; ?>
									<div class="smart-filter-input-group-dropdown">
										<div class="smart-filter-dropdown-block">
											<button
												type="button"
												class="smart-filter-dropdown-opener"
												aria-expanded="false"
												onclick="smartFilter.showDropDownPopup(this, '<?=CUtil::JSEscape($key)?>')"
											>
												<span class="smart-filter-dropdown-text" data-role="currentOption">
													<?foreach ($arItem["VALUES"] as $val => $ar)
													{
														if ($ar["CHECKED"])
														{
															echo $ar["VALUE"];
															$checkedItemExist = true;
														}
													}
													if (!$checkedItemExist)
													{
														echo GetMessage("CT_BCSF_FILTER_ALL");
													}
													?>
												</span>
												<span class="smart-filter-dropdown-arrow"></span>
											</button>
											<input
												class="smart-filter-a11y-text smart-filter-dropdown-value"
												tabindex="-1"
												type="radio"
												name="<?=$arCur["CONTROL_NAME_ALT"]?>"
												id="<? echo "all_".$arCur["CONTROL_ID"] ?>"
												value=""
												onchange="smartFilter.selectDropDownValue(this)"
												onfocus="smartFilter.markDropDownValue(this, true)"
												onblur="smartFilter.markDropDownValue(this, false)"
											/>
											<?foreach ($arItem["VALUES"] as $val => $ar):?>
												<input
													class="smart-filter-a11y-text smart-filter-dropdown-value"
													tabindex="-1"
													type="radio"
													name="<?=$ar["CONTROL_NAME_ALT"]?>"
													id="<?=$ar["CONTROL_ID"]?>"
													value="<? echo $ar["HTML_VALUE_ALT"] ?>"
													<? echo $ar["CHECKED"]? 'checked="checked"': '' ?>
													onchange="smartFilter.selectDropDownValue(this)"
													onfocus="smartFilter.markDropDownValue(this, true)"
													onblur="smartFilter.markDropDownValue(this, false)"
												/>
											<?endforeach?>

											<div class="smart-filter-dropdown-popup" data-role="dropdownContent" style="display: none;">
												<ul>
													<li>
														<label for="<?="all_".$arCur["CONTROL_ID"]?>"
																class="smart-filter-dropdown-label"
																data-role="label_<?="all_".$arCur["CONTROL_ID"]?>"
																onclick="smartFilter.closeDropDownPopup()">
															<?=GetMessage("CT_BCSF_FILTER_ALL"); ?>
														</label>
													</li>
													<?foreach ($arItem["VALUES"] as $val => $ar):
														$class = "";
														if ($ar["CHECKED"])
															$class.= " selected";
														if ($ar["DISABLED"])
															$class.= " disabled";
													?>
														<li>
															<label for="<?=$ar["CONTROL_ID"]?>"
																	class="smart-filter-dropdown-label<?=$class?>"
																	data-role="label_<?=$ar["CONTROL_ID"]?>"
																	onclick="smartFilter.closeDropDownPopup()">
																<?=$ar["VALUE"]?>
																<?if (isset($valueFallbacks[$val])):?><span class="smart-filter-a11y-text"><?=$valueFallbacks[$val]?></span><?endif?>
															</label>
														</li>
													<?endforeach?>
												</ul>
											</div>
										</div>
									</div>
								<?
								break;
								//endregion

								//region DROPDOWN_WITH_PICTURES_AND_LABELS
								case SectionPropertyTable::DROPDOWN_WITH_PICTURES_AND_LABELS:
									?>
										<div class="smart-filter-input-group-dropdown">
											<div class="smart-filter-dropdown-block">
												<button
													type="button"
													class="smart-filter-dropdown-opener"
													aria-expanded="false"
													onclick="smartFilter.showDropDownPopup(this, '<?=CUtil::JSEscape($key)?>')"
												>
													<span class="smart-filter-input-group-dropdown-flex" data-role="currentOption">
														<?
														$checkedItemExist = false;
														foreach ($arItem["VALUES"] as $val => $ar):
															if ($ar["CHECKED"])
															{
															?>
																<?if (isset($ar["FILE"]) && !empty($ar["FILE"]["SRC"])):?>
																	<span class="smart-filter-checkbox-btn-image" style="background-image:url('<?=$ar["FILE"]["SRC"]?>');"></span>
																<?endif?>
																<span class="smart-filter-dropdown-text"><?=$ar["VALUE"]?></span>
															<?
																$checkedItemExist = true;
															}
														endforeach;
														if (!$checkedItemExist)
														{
															?>
																<span class="smart-filter-checkbox-btn-image all"></span>
																<span class="smart-filter-dropdown-text"><?=GetMessage("CT_BCSF_FILTER_ALL");?></span>
															<?
														}
														?>
													</span>

													<span class="smart-filter-dropdown-arrow"></span>
												</button>

												<input
													class="smart-filter-a11y-text smart-filter-dropdown-value"
													tabindex="-1"
													type="radio"
													name="<?=$arCur["CONTROL_NAME_ALT"]?>"
													id="<? echo "all_".$arCur["CONTROL_ID"] ?>"
													value=""
													onchange="smartFilter.selectDropDownValue(this)"
													onfocus="smartFilter.markDropDownValue(this, true)"
													onblur="smartFilter.markDropDownValue(this, false)"
												/>
												<?foreach ($arItem["VALUES"] as $val => $ar):?>
													<input
														class="smart-filter-a11y-text smart-filter-dropdown-value"
														tabindex="-1"
														type="radio"
														name="<?=$ar["CONTROL_NAME_ALT"]?>"
														id="<?=$ar["CONTROL_ID"]?>"
														value="<?=$ar["HTML_VALUE_ALT"]?>"
														<? echo $ar["CHECKED"]? 'checked="checked"': '' ?>
														onchange="smartFilter.selectDropDownValue(this)"
														onfocus="smartFilter.markDropDownValue(this, true)"
														onblur="smartFilter.markDropDownValue(this, false)"
													/>
												<?endforeach?>

												<div class="smart-filter-dropdown-popup" data-role="dropdownContent" style="display: none">
													<ul>
														<li style="border-bottom: 1px solid #e5e5e5;padding-bottom: 5px;margin-bottom: 5px;">
															<label for="<?="all_".$arCur["CONTROL_ID"]?>"
																	class="smart-filter-param-label"
																	data-role="label_<?="all_".$arCur["CONTROL_ID"]?>"
																	onclick="smartFilter.closeDropDownPopup()">
																<span class="smart-filter-checkbox-btn-image all"></span>
																<span class="smart-filter-dropdown-text"><?=GetMessage("CT_BCSF_FILTER_ALL"); ?></span>
															</label>
														</li>
													<?
													foreach ($arItem["VALUES"] as $val => $ar):
														$class = "";
														if ($ar["CHECKED"])
															$class.= " selected";
														if ($ar["DISABLED"])
															$class.= " disabled";
													?>
														<li>
															<label for="<?=$ar["CONTROL_ID"]?>"
																	data-role="label_<?=$ar["CONTROL_ID"]?>"
																	class="smart-filter-param-label<?=$class?>"
																	onclick="smartFilter.closeDropDownPopup()">
																<?if (isset($ar["FILE"]) && !empty($ar["FILE"]["SRC"])):?>
																	<span class="smart-filter-checkbox-btn-image" style="background-image:url('<?=$ar["FILE"]["SRC"]?>');"></span>
																<?endif?>
																<span class="smart-filter-dropdown-text"><?=$ar["VALUE"]?></span>
																<?if (isset($valueFallbacks[$val])):?><span class="smart-filter-a11y-text"><?=$valueFallbacks[$val]?></span><?endif?>
															</label>
														</li>
													<?endforeach?>
													</ul>
												</div>
											</div>
										</div>
									<?
									break;
								//endregion

								//region RADIO_BUTTONS
								case SectionPropertyTable::RADIO_BUTTONS:
									?>
									<div class="col">
										<div class="radio">
											<label class="smart-filter-param-label" for="<? echo "all_".$arCur["CONTROL_ID"] ?>">
												<span class="smart-filter-input-checkbox">
													<input
														type="radio"
														value=""
														name="<? echo $arCur["CONTROL_NAME_ALT"] ?>"
														id="<? echo "all_".$arCur["CONTROL_ID"] ?>"
														onclick="smartFilter.click(this)"
													/>
													<span class="smart-filter-param-text"><? echo GetMessage("CT_BCSF_FILTER_ALL"); ?></span>
												</span>
											</label>
										</div>
										<?foreach($arItem["VALUES"] as $val => $ar):?>
											<div class="radio">
												<label data-role="label_<?=$ar["CONTROL_ID"]?>" class="smart-filter-param-label" for="<? echo $ar["CONTROL_ID"] ?>">
													<span class="smart-filter-input-checkbox <? echo $ar["DISABLED"] ? 'disabled': '' ?>">
														<input
															type="radio"
															value="<? echo $ar["HTML_VALUE_ALT"] ?>"
															name="<? echo $ar["CONTROL_NAME_ALT"] ?>"
															id="<? echo $ar["CONTROL_ID"] ?>"
															<? echo $ar["CHECKED"]? 'checked="checked"': '' ?>
															onclick="smartFilter.click(this)"
														/>
														<span class="smart-filter-param-text" title="<?=$ar["VALUE"];?>"><?=$ar["VALUE"];?><?
														if (isset($valueFallbacks[$val])):
															?><span class="smart-filter-a11y-text"><?=$valueFallbacks[$val]?></span><?
														endif;
														if ($arParams["DISPLAY_ELEMENT_COUNT"] !== "N" && isset($ar["ELEMENT_COUNT"])):
															?>&nbsp;(<span data-role="count_<?=$ar["CONTROL_ID"]?>"><? echo $ar["ELEMENT_COUNT"]; ?></span>)<?
														endif;?></span>
													</span>
												</label>
											</div>
										<?endforeach;?>
									</div>
									<div class="w-100"></div>
									<?
									break;

								//endregion

								//region CALENDAR
								case SectionPropertyTable::CALENDAR:
									?>
									<div class="col">
										<div class=""><div class="smart-filter-input-container smart-filter-calendar-container">
											<?$APPLICATION->IncludeComponent(
												'bitrix:main.calendar',
												'',
												array(
													'FORM_NAME' => $arResult["FILTER_NAME"]."_form",
													'SHOW_INPUT' => 'Y',
													'INPUT_ADDITIONAL_ATTR' => 'class="calendar" placeholder="'.FormatDate("SHORT", $arItem["VALUES"]["MIN"]["VALUE"]).'" onkeyup="smartFilter.keyup(this)" onchange="smartFilter.keyup(this)"',
													'INPUT_NAME' => $arItem["VALUES"]["MIN"]["CONTROL_NAME"],
													'INPUT_VALUE' => $arItem["VALUES"]["MIN"]["HTML_VALUE"],
													'SHOW_TIME' => 'N',
													'HIDE_TIMEBAR' => 'Y',
												),
												null,
												array('HIDE_ICONS' => 'Y')
											);?>
										</div></div>
										<div class=""><div class="smart-filter-input-container smart-filter-calendar-container">
											<?$APPLICATION->IncludeComponent(
												'bitrix:main.calendar',
												'',
												array(
													'FORM_NAME' => $arResult["FILTER_NAME"]."_form",
													'SHOW_INPUT' => 'Y',
													'INPUT_ADDITIONAL_ATTR' => 'class="calendar" placeholder="'.FormatDate("SHORT", $arItem["VALUES"]["MAX"]["VALUE"]).'" onkeyup="smartFilter.keyup(this)" onchange="smartFilter.keyup(this)"',
													'INPUT_NAME' => $arItem["VALUES"]["MAX"]["CONTROL_NAME"],
													'INPUT_VALUE' => $arItem["VALUES"]["MAX"]["HTML_VALUE"],
													'SHOW_TIME' => 'N',
													'HIDE_TIMEBAR' => 'Y',
												),
												null,
												array('HIDE_ICONS' => 'Y')
											);?>
										</div></div>
									</div>
									<div class="w-100"></div>
									<?
									break;
								//endregion

								//region CHECKBOXES +
								default:
									?>
								<div class="smart-filter-input-group-checkbox-list">
										<?foreach($arItem["VALUES"] as $val => $ar):?>
											<div class="form-group form-check mb-1">
												<input
													type="checkbox"
													value="<? echo $ar["HTML_VALUE"] ?>"
													name="<? echo $ar["CONTROL_NAME"] ?>"
													id="<? echo $ar["CONTROL_ID"] ?>"
													class="form-check-input"
													<? echo $ar["CHECKED"]? 'checked="checked"': '' ?>
													<? echo $ar["DISABLED"] ? 'disabled': '' ?>
													onclick="smartFilter.click(this)"
												/>
												<label data-role="label_<?=$ar["CONTROL_ID"]?>" class="smart-filter-checkbox-text form-check-label" for="<? echo $ar["CONTROL_ID"] ?>">
													<?=$ar["VALUE"];
													if (isset($valueFallbacks[$val])):
														?><span class="smart-filter-a11y-text"><?=$valueFallbacks[$val]?></span><?
													endif;
													if ($arParams["DISPLAY_ELEMENT_COUNT"] !== "N" && isset($ar["ELEMENT_COUNT"])):
														?>&nbsp;(<span data-role="count_<?=$ar["CONTROL_ID"]?>"><? echo $ar["ELEMENT_COUNT"]; ?></span>)<?
													endif;?>
												</label>
											</div>
										<?endforeach;?>
								</div>
							<?
								//endregion
							}
							?>
							</div>
						</div>
					</div>
				<?
				}
				?>
			</div><!--//row-->

			<div class="row">
				<div class="col smart-filter-button-box">
					<div class="smart-filter-block">
						<div class="smart-filter-parameters-box-container">
							<input
								class="btn btn-primary"
								type="submit"
								id="set_filter"
								name="set_filter"
								value="<?=GetMessage("CT_BCSF_SET_FILTER")?>"
							/>
							<input
								class="btn btn-link"
								type="submit"
								id="del_filter"
								name="del_filter"
								value="<?=GetMessage("CT_BCSF_DEL_FILTER")?>"
							/>
							<div class="smart-filter-popup-result <?if ($arParams["FILTER_VIEW_MODE"] == "VERTICAL") echo $arParams["POPUP_POSITION"]?>" id="modef" <?if(!isset($arResult["ELEMENT_COUNT"])) echo 'style="display:none"';?> style="display: inline-block;">
								<?echo GetMessage("CT_BCSF_FILTER_COUNT", array("#ELEMENT_COUNT#" => '<span id="modef_num">'.(int)($arResult["ELEMENT_COUNT"] ?? 0).'</span>'));?>
								<span class="arrow"></span>
								<br/>
								<?// the visible text stays the beginning of the name, and the name itself tells the link from the button below it?>
								<a href="<?echo $arResult["FILTER_URL"]?>" target="" aria-label="<?=GetMessage("CT_BCSF_FILTER_SHOW_FOUND")?>"><?echo GetMessage("CT_BCSF_FILTER_SHOW")?></a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</form>

	</div>
</div>

<?
// The language file of a template does not reach its script by itself, so the phrases the recount
// announces travel in the parameters the template already hands over.
$jsFilterParams = $arResult["JS_FILTER_PARAMS"];
$jsFilterParams["MESSAGES"] = array(
	"ANNOUNCE" => GetMessage("CT_BCSF_FILTER_ANNOUNCE"),
	"ANNOUNCE_AVAILABILITY" => GetMessage("CT_BCSF_FILTER_ANNOUNCE_AVAILABILITY"),
);
?>
<script>
	var smartFilter = new JCSmartFilter('<?echo CUtil::JSEscape($arResult["FORM_ACTION"])?>', '<?=CUtil::JSEscape($arParams["FILTER_VIEW_MODE"])?>', <?=CUtil::PhpToJSObject($jsFilterParams)?>);
</script>