<?
if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
	die();

$linkAttributes = ($arParams['IS_SETTINGS_HUB'] ?? null) === true
	? ' data-slider-ignore-autobinding="true" target="_self"'
	: '';

$APPLICATION->IncludeComponent(
	'bitrix:main.interface.toolbar',
	'',
	array(
		'BUTTONS'=>array(
			array(
				'TEXT' => GetMessage('CRM_BP_TOOLBAR_TYPES'),
				'TITLE' => GetMessage('CRM_BP_TOOLBAR_TYPES_TITLE'),
				'LINK' => $arResult['ENTITY_LIST_URL'],
				'LINK_PARAM' => 'data-testid="crm-config-bp-list-types-button"' . $linkAttributes,
				'ICON' => 'btn-view-elements',
			),
			array(
				'SEPARATOR' => 'Y',
			),
			array(
				'TEXT' => GetMessage('CRM_BP_TOOLBAR_ADD'),
				'TITLE' => GetMessage('CRM_BP_TOOLBAR_ADD_TITLE'),
				'LINK' => CComponentEngine::MakePathFromTemplate($arResult['BP_EDIT_URL'],
					array(
						'bp_id' => '0'
					)
				),
				'LINK_PARAM' => 'data-testid="crm-config-bp-list-add-button"' . $linkAttributes,
				'ICON' => 'btn-add-field',
			)
		)
	),
	$component,
	array('HIDE_ICONS' => 'Y')
);

?>
<div data-testid="crm-config-bp-list-workflow-list">
<?
$APPLICATION->IncludeComponent(
	'bitrix:bizproc.workflow.list',
	'',
	Array(
		'MODULE_ID' => 'crm',
		'ENTITY' => $arResult['ENTITY_TYPE'],
		'DOCUMENT_ID' => $arResult['DOCUMENT_TYPE'],
		'EDIT_URL' => CComponentEngine::MakePathFromTemplate($arResult['~BP_EDIT_URL'],
			array(
				'bp_id' => '#ID#'
			)
		),
		'SET_TITLE'	=>	'N'
	),
	$component,
	array('HIDE_ICONS' => 'Y')
);
?>
</div>
