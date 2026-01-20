<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php');

global $APPLICATION;
$APPLICATION->ShowHead();

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\Web\Json;

/**
 * @var array $arResult
 * @var array $arParams
 * @var CBitrixComponentTemplate $this
 */

$containerId = 'bizprocdesigner-editor-container';

$isLegacyPropertiesDialog = (int)($arResult['IS_LEGACY_PROPERTIES_DIALOG'] ?? 0);

$loadActivityJs = static function (ActivityDescription $activity, string $fileName)
{
	$pathToActivity = $activity->getPathToActivity();
	$path = mb_substr($pathToActivity, mb_strlen($_SERVER['DOCUMENT_ROOT']));
	if (file_exists($pathToActivity . '/' . $fileName . '.js'))
	{
		Asset::getInstance()->addJs($path . '/' . $fileName . '.js');
	}
};

$loadActivityCss = static function (ActivityDescription $activity, string $fileName)
{
	$pathToActivity = $activity->getPathToActivity();
	$path = mb_substr($pathToActivity, mb_strlen($_SERVER['DOCUMENT_ROOT']));
	if (file_exists($pathToActivity . '/' . $fileName . '.css'))
	{
		Asset::getInstance()->addCss($path . '/' . $fileName . '.css');
	}
};

\Bitrix\Main\Loader::includeModule('bizproc');

Extension::load([
	'bizprocdesigner.editor.chart',
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
	'ui.icons',
	'popup',
	'main.core',
	'ui.icon-set.actions',
	'ui.icon-set.main',
	'bizproc.automation',
]);

if (\Bitrix\BizprocDesigner\Internal\Config\Feature::instance()->isAiAssistantAvailable())
{
	Extension::load(['aiassistant.marta']);
}

if ($isLegacyPropertiesDialog)
{
	CUtil::InitJSCore(['window', 'ajax', 'bp_selector', 'clipboard', 'marketplace', 'bp_field_type']);

	Extension::load([
		'ui.hint',
		'bizproc.globals',
		'main.popup',
	]);

	Asset::getInstance()->addJs('/bitrix/js/main/utils.js');
	Asset::getInstance()->addJs('/bitrix/js/main/popup_menu.js');
	Asset::getInstance()->addJs('/bitrix/js/main/admin_tools.js');
	Asset::getInstance()->addJs('/bitrix/js/main/public_tools.js');
	Asset::getInstance()->addJs('/bitrix/js/bizproc/bizproc.js');

	/** @var ActivityDescription $description */
	foreach ($arResult['ACTIVITIES'] as $activityId => $description)
	{
		$loadActivityJs($description, $activityId);
	}
}

/** @var ActivityDescription $description */
foreach ($arResult['ACTIVITIES'] as $description)
{
	$loadActivityJs($description, 'renderer');
	$loadActivityCss($description, 'renderer');
}

/** @var ActivityDescription $description */
foreach ($arResult['TRIGGERS'] as $description)
{
	$loadActivityJs($description, 'renderer');
	$loadActivityCss($description, 'renderer');
}

?>

<div data-id="<?= $containerId ?>-wrapper" class="<?= $containerId ?>-wrapper">
	<div data-id="<?= $containerId ?>" id="<?= $containerId ?>">
		<div id="bizprocdesigner-editor"></div>
	</div>
</div>
<body>
<script>
	if (!!<?=$isLegacyPropertiesDialog?>)
	{
		BPDesignerUseJson = true;
		arAllActivities = <?= Json::encode($arResult['ACTIVITIES']) ?>;
		arWorkflowTemplate = {};
		arAllId = {};
		rootActivity = CreateActivity('NodeWorkflowActivity');
		workflowTemplateName = '';
		workflowTemplateDescription = '';
		workflowTemplateAutostart = 0;
	}

	(() => {
		BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
		const { App } = BX.Bizprocdesigner.Editor;
		const rootProps = {
			initTemplateId: <?= Json::encode($arResult['templateId'] ?? null) ?>,
			initDocumentType: <?= Json::encode($arResult['documentType'] ?? null) ?>,
			initStartTrigger: <?= Json::encode($arResult['startTrigger'] ?? null) ?>,
		};

		App.mount('bizprocdesigner-editor', rootProps);
	})();
</script>
</body>
