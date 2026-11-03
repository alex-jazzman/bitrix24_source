<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */
/** @var array $arResult */
/** @var \CBitrixComponentTemplate $this */

use Bitrix\Crm\Service\Container;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/** @var CrmAutomatedSolutionDetailsComponent $component */
$component = $this->getComponent();

if ($component->getErrors()): ?>
	<div class="ui-alert ui-alert-danger">
		<?php foreach ($component->getErrors() as $error): ?>
			<span class="ui-alert-message"><?= htmlspecialcharsbx($error->getMessage()) ?></span>
		<?php endforeach; ?>
	</div>
	<?php
	return;
endif;

Extension::load([
	'crm.settings-hub',
	'ui.vue3',
	'ui.vue3.vuex',
	'ui.vue3.mixins.loc-mixin',
	'ui.entity-selector',
	'crm.router',
	'crm.toolbar-component',
	'crm.dialog',
	'crm.integration.analytics',
	'ui.analytics',
	'ui.dialogs.messagebox',
	'ui.alerts',
	'ui.forms',
	'ui.layout-form',
	'main.core',
	'main.core.events',
	'ui.info-helper',
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.a11y',
	'ui.system.skeleton.vue',
]);

// `no-all-paddings` гасит боковые отступы каркаса слайдера: обёртка воркэрии приезжает с классом
// `ui-page-slider-workarea-content-padding` (`padding: 0 15px`), и без этого колонка контента у нас
// выходила 552px против 582px у СП-хаба — тот же слайдер, тот же 582-пиксельный воркэриа, но у нас
// контент был вписан внутрь отступов. Правило узкое:
// `.template-air.no-all-paddings .ui-page-slider-workarea-content-padding { padding: 0 }`
// (ui.sidepanel.wrapper/templates/.default/template.css). `template-air` на боди уже есть.
// Тот же класс ставит эталон — crm.type.detail/templates/hub/template.php.
$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'crm-automated-solution-details-slider-wrapper no-all-paddings');

$component->addJsRouter($this);
$component->addToolbar($this);

// Заголовок страницы — в строке тулбара слайдера, слева от «Помощь»: это его штатное место, и тулбар
// на этом экране виден (D-08). Кроме нас его никто не ставит: ни class.php, ни страница роутера
// DetailsPage (title не задан). Тулбар (ui.toolbar) и <title> фрейма рисуются отложенно и читают
// заголовок в момент отрисовки, поэтому ставить его здесь, после addToolbar, достаточно. После
// сохранения на создании слайдер перезагружается адресом записи, где isNew уже ложен.
$APPLICATION->SetTitle(Loc::getMessage(
	!empty($arResult['isNew'])
		? 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_PAGE_TITLE_NEW'
		: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_PAGE_TITLE_SETTINGS'
));

// Меню разделов нет: всё на одном экране (паспорт, «Смарт-процессы», «Главная страница»). Таб
// передаётся в приложение как раньше — это контракт с class.php (TAB_IDS), — но раздел от него
// больше не зависит: любой таб даёт единственный раздел `types` (src/const/hub-tree.ts).
$activeTabId = $arResult['activeTabId'];

$appParams = [
	'containerId' => 'crm-automated-solution-details-hub-app',
	'activeTabId' => $activeTabId,
	'state' => $arResult['state'],
	'readOnly' => $arResult['readOnly'] ?? false,
];
?>
<div id="crm-automated-solution-details-hub-app" class="crm-automated-solution-details-hub-container crm-automated-solution-hub-container"></div>
<script>
	BX.ready(function() {
		BX.message(<?= Json::encode(
			array_merge(
				Container::getInstance()->getLocalization()->loadMessages(),
				Loc::loadLanguageFile(__FILE__),
			)
		) ?>);

		var app = new BX.Crm.AutomatedSolutionDetailsHub.App(<?= Json::encode($appParams) ?>);
		app.start();
	});
</script>
