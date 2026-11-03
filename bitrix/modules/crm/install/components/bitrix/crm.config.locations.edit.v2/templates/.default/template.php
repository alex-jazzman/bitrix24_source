<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<?
use Bitrix\Main\Localization\Loc;
use Bitrix\Sale\Location\Admin\LocationHelper as Helper;

//echo '<pre>'; print_r($arResult); die();
Loc::loadMessages(__FILE__);

if (($arResult['TITLE'] ?? '') !== '')
{
	global $APPLICATION;
	$APPLICATION->SetTitle($arResult['TITLE']);
}
?>

<?if(!empty($arResult['ERRORS']['FATAL'])):?>

	<?foreach($arResult['ERRORS']['FATAL'] as $error):?>
		<? ShowError($error)?>
	<?endforeach?>

<?else:?>

	<?foreach($arResult['ERRORS']['NONFATAL'] as $error):?>
		<? ShowError($error)?>
	<?endforeach?>

	<?
	global $APPLICATION;

	CJSCore::Init();
	$APPLICATION->AddHeadScript('/bitrix/js/sale/core_ui_widget.js');
	$APPLICATION->AddHeadScript('/bitrix/js/sale/core_ui_etc.js');
	$APPLICATION->AddHeadScript('/bitrix/js/sale/core_ui_dynamiclist.js');

	$arTabs = array(
		'tab_params' => array(
			'id' => 'tab_params',
			'name' => Loc::getMessage('CRM_CLE2_TAB_PARAMS'),
			'title' => Loc::getMessage('CRM_CLE2_TAB_PARAMS_TITLE'),
			'icon' => ''
		),
		'tab_external' => array(
			'id' => 'tab_external',
			'name' => Loc::getMessage('CRM_CLE2_TAB_EXTERNAL'),
			'title' => Loc::getMessage('CRM_CLE2_TAB_EXTERNAL_TITLE'),
			'icon' => ''
		)
	);

	foreach($arResult['FIELDS'] as $field)
	{
		if(!$geoHeadingShown && ($field['id'] == 'LATITUDE' || $field['id'] == 'LONGITUDE'))
		{
			$arTabs['tab_params']['fields'][] = array(
				'id' => 'geo_heading',
				'name' => Loc::getMessage('CRM_CLE2_HEADING_GEO'),
				'type' => 'section'
			);

			$geoHeadingShown = true;
		}

		if(!$nameHeadingShown && mb_strpos($field['id'], 'NAME') !== false)
		{
			$arTabs['tab_params']['fields'][] = array(
				'id' => 'name_heading',
				'name' => Loc::getMessage('CRM_CLE2_HEADING_NAMES'),
				'type' => 'section'
			);

			$nameHeadingShown = true;
		}

		if($field['id'] == 'ID')
		{
			$field['type'] = 'label';
			$field['value'] = intval($field['value']) ? intval($field['value']) : Loc::getMessage('CRM_CLE2_NEW_ITEM');
		}
		elseif($field['id'] == 'PARENT_ID')
		{
			$field['type'] = 'custom';

			ob_start();
			$APPLICATION->IncludeComponent("bitrix:sale.location.selector.search", "", array(
				"ID" => intval($field['value']) ? intval($field['value']) : '',
				"INPUT_NAME" => "PARENT_ID",
				"PROVIDE_LINK_BY" => "id",
				"SHOW_ADMIN_CONTROLS" => 'N',
				"SELECT_WHEN_SINGLE" => 'N',
				"FILTER_BY_SITE" => 'N',
				"SHOW_DEFAULT_LOCATIONS" => 'N',
				"SEARCH_BY_PRIMARY" => 'N',

				"ADMIN_MODE" => 'N',
				//"JS_CONTROL_GLOBAL_ID" => 'crm_filter_parent_id'
				),
				false
			);
			$field['value'] = ob_get_contents();
			ob_end_clean();
		}
		elseif($field['id'] == 'TYPE_ID')
		{
			$field['type'] = 'list';

			$field['items'] = array();
			$field['items'][''] = Loc::getMessage('CRM_CLE2_NOT_SELECTED');
			foreach($arResult['TYPES'] as $id => $value)
				$field['items'][$id] = htmlspecialcharsbx($value);
		}
		elseif($field['id'] == 'EXTERNAL')
		{
			$field['type'] = 'custom';
			$field['name'] = Loc::getMessage('CRM_CLE2_TAB_EXTERNAL');

			ob_start();
			?>

			<?
			$randTag = rand(99, 999);
			$externalColumnHeaderIds = [];
			foreach($arResult['EXTERNAL_TABLE_COLUMNS'] as $code => $column)
			{
				$externalColumnHeaderIds[$code] = 'bx-ccle2-external-' . $randTag . '-column-' . strtolower($code);
			}
			$externalRemoveHeaderId = 'bx-ccle2-external-' . $randTag . '-column-remove';
			?>
			<div id="ib_external_values_<?=$randTag?>" class="bx-ccle2-external-values">

				<table cellpadding="0" cellspacing="0">
					<tbody class="bx-ui-dynamiclist-container">

						<tr class="heading">
							<?foreach($arResult['EXTERNAL_TABLE_COLUMNS'] as $code => $column):?>
								<th id="<?=htmlspecialcharsbx($externalColumnHeaderIds[$code])?>" scope="col"><?=$column['title']?></th>
							<?endforeach?>
							<th id="<?=htmlspecialcharsbx($externalRemoveHeaderId)?>" scope="col"><?=Loc::getMessage('CRM_CLE2_REMOVE')?></th>
						</tr>

						<?if(is_array($arResult['FORM_DATA']['EXTERNAL']) && !empty($arResult['FORM_DATA']['EXTERNAL'])):?>

							<?$externalRowNumber = 0;?>
							<?foreach($arResult['FORM_DATA']['EXTERNAL'] as $id => $ext):
								$externalRowNumber++;
								$externalRowContextId = 'bx-ccle2-external-' . $randTag . '-row-' . $externalRowNumber;
								$isYandexMarketOnUaPortal = (
									$arResult['PORTAL_ZONE'] === 'ua'
									&& (int)$ext['SERVICE_ID'] === $arResult['YANDEX_MARKET_ES_ID']
								);
							?>
								<tr style="<?=($isYandexMarketOnUaPortal ? 'visibility:hidden; position:absolute;' : '')?>;">
									<?$externalColumnNumber = 0;?>
									<?foreach($arResult['EXTERNAL_TABLE_COLUMNS'] as $code => $void):?>
										<?$value = Helper::makeSafeDisplay($ext[$code], $code);?>
										<td>
											<?if($externalColumnNumber === 0):?>
												<span class="bx-ccle2-visually-hidden" id="<?=htmlspecialcharsbx($externalRowContextId)?>"><?=Loc::getMessage('CRM_CLE2_EXTERNAL_ROW', ['#NUMBER#' => $externalRowNumber])?></span>
											<?endif?>
											<?if($code == 'SERVICE_ID'):?>
												<select name="EXTERNAL[<?=$ext['ID']?>][<?=$code?>]" aria-labelledby="<?=htmlspecialcharsbx($externalColumnHeaderIds[$code])?> <?=htmlspecialcharsbx($externalRowContextId)?>">
													<?foreach($arResult['EXTERNAL_SERVICES'] as $sId => $serv):
														if (
															$arResult['PORTAL_ZONE'] === 'ua'
															&& !$isYandexMarketOnUaPortal
															&& (int)$serv['ID'] === $arResult['YANDEX_MARKET_ES_ID']
														)
														{
															continue;
														}
													?>
														<option value="<?=intval($serv['ID'])?>"<?=($serv['ID'] == $value ? ' selected' : '')?>><?=htmlspecialcharsbx($serv['CODE'])?></option>
													<?endforeach?>
												</select>
											<?elseif($code == 'ID'):?>
												<?if(intval($value)):?>
													<?=$value?>
												<?endif?>
											<?else:?>
												<input type="text" name="EXTERNAL[<?=$ext['ID']?>][<?=$code?>]" value="<?=$value?>" size="20" aria-labelledby="<?=htmlspecialcharsbx($externalColumnHeaderIds[$code])?> <?=htmlspecialcharsbx($externalRowContextId)?>" />
											<?endif?>
										</td>
										<?$externalColumnNumber++;?>
									<?endforeach?>

									<td style="text-align: center">
										<?if($ext['ID']):?>
											<input type="checkbox" name="EXTERNAL[<?=$ext['ID']?>][REMOVE]" value="1" aria-labelledby="<?=htmlspecialcharsbx($externalRemoveHeaderId)?> <?=htmlspecialcharsbx($externalRowContextId)?>" />
										<?endif?>
									</td>
								</tr>
							<?endforeach?>

						<?endif?>

						<script type="text/html" data-template-id="bx-ui-dynamiclist-row">
							<tr>
								<td>
									<span class="bx-ccle2-visually-hidden" id="bx-ccle2-external-<?=$randTag?>-row-n{{column_id}}"><?=Loc::getMessage('CRM_CLE2_EXTERNAL_NEW_ROW', ['#NUMBER#' => '{{column_id}}'])?></span>
								</td>
								<td>
									<select name="EXTERNAL[n{{column_id}}][SERVICE_ID]" aria-labelledby="<?=htmlspecialcharsbx($externalColumnHeaderIds['SERVICE_ID'])?> bx-ccle2-external-<?=$randTag?>-row-n{{column_id}}">
										<?foreach($arResult['EXTERNAL_SERVICES'] as $sId => $serv):
											if (
												$arResult['PORTAL_ZONE'] === 'ua'
												&& (int)$serv['ID'] === $arResult['YANDEX_MARKET_ES_ID']
											)
											{
												continue;
											}
										?>
											<option value="<?=intval($serv['ID'])?>"><?=htmlspecialcharsbx($serv['CODE'])?></option>
										<?endforeach?>
									</select>
								</td>
								<td>
									<input type="text" name="EXTERNAL[n{{column_id}}][XML_ID]" value="" size="20" aria-labelledby="<?=htmlspecialcharsbx($externalColumnHeaderIds['XML_ID'])?> bx-ccle2-external-<?=$randTag?>-row-n{{column_id}}" />
								</td>
								<td></td>
							</tr>
						</script>

					</tbody>
				</table>

				<div class="bx-ccle2-addmore">
					<input class="bx-ui-dynamiclist-addmore" type="button" value="<?=Loc::getMessage('CRM_CLE2_TAB_EXTERNAL_MORE')?>" title="<?=Loc::getMessage('CRM_CLE2_TAB_EXTERNAL_MORE')?>">
				</div>

			</div>

			<script>
				new BX.ui.dynamicList({
					scope: 'ib_external_values_<?=$randTag?>',
					initiallyAdd: 3
				});
			</script>
				
			<?
			$field['value'] = ob_get_contents();
			ob_end_clean();
		}

		$arTabs[($field['id'] == 'EXTERNAL' ? 'tab_external' : 'tab_params')]['fields'][] = $field;
	}

	CCrmGridOptions::SetTabNames($arResult['FORM_ID'], $arTabs);

	$formCustomHtml = '
		<input type="hidden" name="loc_id" value="'.intval($arResult['LOCATION_ID']).'"/>
	';

	if($arResult['SPECIFIED_BACK_URL'] <> '')
	{
		$formCustomHtml .= '<input type="hidden" name="return_url" value="'.htmlspecialcharsbx($arResult['SPECIFIED_BACK_URL']).'"/>';
	}

	$APPLICATION->IncludeComponent(
		'bitrix:main.interface.form',
		'',
		array(
			'FORM_ID' => $arResult['FORM_ID'],
			'TABS' => $arTabs,
			'BUTTONS' => array(
				'standard_buttons' => true,
				'back_url' => $arResult['CALCULATED_BACK_URL'],
				'custom_html' => $formCustomHtml
			),
			'DATA' => $arResult['LOC'],
			'SHOW_SETTINGS' => 'Y',
			'THEME_GRID_ID' => $arResult['GRID_ID'],
			'SHOW_FORM_TAG' => 'Y'
		),
		$component,
		array('HIDE_ICONS' => 'Y')
	);
	?>
	<script>
		BX.ready(function() {
			var form = document.getElementById('form_<?=CUtil::JSEscape($arResult['FORM_ID'])?>');
			if(!form)
			{
				return;
			}

			form.dataset.testid = 'crm-locations-edit-form';
			[
				['save', 'crm-locations-edit-save'],
				['apply', 'crm-locations-edit-apply'],
				['cancel', 'crm-locations-edit-cancel'],
			].forEach(function(button) {
				var control = form.querySelector('[name="' + button[0] + '"]');
				if(control)
				{
					control.dataset.testid = button[1];
				}
			});
		});
	</script>
	<?if($arResult['IS_SIDE_PANEL']):?>
		<script>
			BX.ready(function() {
				var cancelButton = document.querySelector('[name="cancel"]');
				if(!cancelButton)
				{
					return;
				}

				var defaultCancelHandler = cancelButton.onclick;
				cancelButton.onclick = function(event) {
					if(top.BX.SidePanel && top.BX.SidePanel.Instance)
					{
						var slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
						if(slider)
						{
							slider.close();

							return false;
						}
					}

					return defaultCancelHandler.call(this, event);
				};
			});
		</script>
	<?endif?>

	<?if($arResult['ACTION_SUCCESS'] ?? false):?>
		<script>
			BX.ready(function() {
				if(!top.BX.SidePanel || !top.BX.SidePanel.Instance)
				{
					return;
				}

				var slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
				if(!slider)
				{
					return;
				}

				slider.getData().set('changed', true);
				<?if($arResult['ACTION'] === 'save'):?>
					slider.close();
				<?endif?>
			});
		</script>
	<?endif?>

<?endif?>
