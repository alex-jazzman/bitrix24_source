<?php

use Bitrix\Crm\Service\Container;
use Bitrix\Main\Localization\Loc;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/** @var CMain $APPLICATION */
/** @var array $arResult */

\Bitrix\Main\UI\Extension::load([
	'ui.alerts',
]);

if ($this->getComponent()->getErrors()):?>
	<div class="ui-alert ui-alert-danger" style="margin-bottom: 0px;">
		<?php foreach($this->getComponent()->getErrors() as $error):?>
			<span class="ui-alert-message"><?= htmlspecialcharsbx($error->getMessage()) ?></span>
		<?php endforeach;?>
	</div>
	<?php
	return;
endif;
/** @see \Bitrix\Crm\Component\Base::addTopPanel() */
$this->getComponent()->addTopPanel($this);

/** @see \Bitrix\Crm\Component\Base::addToolbar() */
$this->getComponent()->addToolbar($this);

/** @see \Bitrix\Crm\Component\Base::addJsRouter() */
$this->getComponent()->addJsRouter($this);
?>
<div class="ui-alert ui-alert-danger crm-error-container">
	<span class="ui-alert-message" id="crm-type-item-details-error-text-container"></span>
	<span class="ui-alert-close-btn" onclick="this.parentNode.style.display = 'none';"></span>
</div>
<?php

\Bitrix\Main\Page\Asset::getInstance()->addJs('/bitrix/js/crm/partial_entity_editor.js');

\Bitrix\Main\UI\Extension::load([
	'crm.item-details-component',
	'bp_starter',
	'bizproc.script',
]);

$APPLICATION->IncludeComponent(
	'bitrix:crm.activity.editor',
	'',
	$arResult['activityEditorParams'],
	$this->getComponent(),
	['HIDE_ICONS' => 'Y']
);

$messages = array_merge(Container::getInstance()->getLocalization()->loadMessages(), Loc::loadLanguageFile(__FILE__));
if(isset($arResult['jsParams']['messages']['crmTimelineHistoryStub']))
{
	$messages['CRM_TIMELINE_HISTORY_STUB'] = $arResult['jsParams']['messages']['crmTimelineHistoryStub'];
}

// messages should be loaded on page before entity-details, otherwise timeline wont have the stub message
?><script>
	BX.ready(function() {
		BX.message(<?=\Bitrix\Main\Web\Json::encode($messages)?>);
		var params = <?=CUtil::PhpToJSObject($arResult['jsParams'], false, false, true);?>;
		params.errorTextContainer = document.getElementById('crm-type-item-details-error-text-container');
		(new BX.Crm.ItemDetailsComponent(params)).init();
	});
</script><?php

$componentParams = $arResult['entityDetailsParams'];

if (array_key_exists('bizprocStarterConfig', $arResult))
{
	$componentParams['BIZPROC_STARTER_DATA'] = $arResult['bizprocStarterConfig'] ?? [];
}

$APPLICATION->IncludeComponent(
	'bitrix:crm.entity.details',
	'',
	$componentParams
);
