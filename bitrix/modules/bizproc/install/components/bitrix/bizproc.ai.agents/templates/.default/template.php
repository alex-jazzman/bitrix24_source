<?php

use Bitrix\Main\Localization\Loc;

use Bitrix\UI\Buttons\AirButtonStyle;
use Bitrix\UI\Toolbar;
use Bitrix\UI\Buttons;
use Bitrix\UI\Typography\Text;
use Bitrix\UI\Typography\Headline;

use Bitrix\BizprocDesigner\Infrastructure\Enum\StartTrigger;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @var $APPLICATION */
/** @var CBitrixComponentTemplate $this */

\Bitrix\Main\UI\Extension::load([
	'main.pagination.lazyloadtotalcount',
	'bizproc.ai-agents.grid',
	'bizproc.setup-template',
	'ui.system.typography',
	'ui.icon-set.api.core',
	'ui.tooltip',
]);

$APPLICATION->clearViewContent('above_pagetitle');

$headerMenuSortIndex = 100;
$this->setViewTarget('above_pagetitle', $headerMenuSortIndex);

$menuItems = $arResult['MENU_ITEMS'] ?? [];

$APPLICATION->includeComponent(
	'bitrix:main.interface.buttons',
	'',
	[
		'ID' => 'ai-agents-menu',
		'ITEMS' => $menuItems,
		'THEME' => 'air',
	]
);

$this->endViewTarget();

$APPLICATION->setTitle(htmlspecialcharsbx(Loc::getMessage('BIZPROC_AI_AGENTS_PAGE_TITLE')));

$addButton = (new Buttons\Button())
	->setUniqId($arResult['AI_AGENTS_HEADER_ADD_BUTTON_UNIQUE_ID'])
	->setText(Loc::getMessage('BIZPROC_AI_AGENTS_HEADER_ADD_BUTTON_TEXT'))
	->setStyle(AirButtonStyle::FILLED_SUCCESS)
;

$addButton->addAttribute('data-test-id', 'bizproc-ai-agents-header-add-button');

Toolbar\Facade\Toolbar::setTitle(htmlspecialcharsbx(Loc::getMessage('BIZPROC_AI_AGENTS_PAGE_TITLE')));

$user = new CBPWorkflowTemplateUser(\CBPWorkflowTemplateUser::CurrentUser);
$isUserAdmin = $user->isAdmin();
if($isUserAdmin)
{
	Toolbar\Facade\Toolbar::addButton($addButton, Toolbar\ButtonLocation::AFTER_TITLE);
}

Toolbar\Facade\Toolbar::addFavoriteStar();

if ($arResult['SHOW_FACADE_FILTER'])
{
	Toolbar\Facade\Toolbar::addFilter([
		'FILTER_ID' => $arResult['FILTER_ID'],
		'FILTER' => [],
		'FILTER_PRESETS' => [],
		'DISABLE_SEARCH' => false,
		'ENABLE_LIVE_SEARCH' => false,
		'ENABLE_LABEL' => false,
		'RESET_TO_DEFAULT_MODE' => false,
	]);
}

$gridContainerId = $arResult['GRID_ID'] . '-container';
$availableAiAgentsCount = $arResult['AVAILABLE_AI_AGENTS_COUNT'] ?? 0;

?>

<div class="ai-agents-header-wrapper">
	<div class="ai-agents-header-container">
		<div class="ai-agents-title-container">
			<div class="ui-icon-set --o-ai-stars ai-agents-icon-container" style="--ui-icon-set__icon-size: 40px"></div>
			<?= Headline::render(
				size: 'lg',
				content: Loc::getMessage('BIZPROC_AI_AGENTS_HEADER_TEXT'),
			) ?>
		</div>

		<?= Text::render(
			size: 'sm',
			className: 'ai-agents-header-description',
			content: Loc::getMessage('BIZPROC_AI_AGENTS_HEADER_DESCRIPTION'),
		) ?>

		<div class="ai-agents-available-container">
			<?php if ($arResult['SHOW_AVAILABLE_AGENTS_COUNT']): ?>
				<?= Text::render(
					size: 'md',
					accent: true,
					content: Loc::getMessage('BIZPROC_AI_AGENTS_HEADER_AVAILABLE'),
				) ?>
				<?= Text::render(
					size: 'xl',
					accent: true,
					content: $availableAiAgentsCount,
				) ?>
				<?= Text::render(
					size: 'md',
					accent: true,
					content: Loc::getMessagePlural('BIZPROC_AI_AGENTS_HEADER_AVAILABLE_AGENTS', $availableAiAgentsCount),
				) ?>
			<?php endif ?>
		</div>
	</div>

	<div class="ai-agents-graph-placeholder ai-agents-header-graph-grid"></div>
	<div class="ai-agents-graph-placeholder ai-agents-header-graph-stub-black-and-white"></div>
	<div class="ai-agents-graph-placeholder ai-agents-header-graph-stub"></div>
	<div class="ai-agents-graph-placeholder with-blur"></div>
</div>


<span class="bizproc-ai-agents-grid-container" id="<?= htmlspecialcharsbx($gridContainerId) ?>"><?php
	if (!empty($arResult))
	{
		$APPLICATION->IncludeComponent(
			'bitrix:main.ui.grid',
			'',
			$arResult['GRID_PARAMS'],
		);
	}
	?></span>

<script>
	BX.ready(function ()
	{
		(new BX.Main.Pagination.Lazyloadtotalcount()).register();
		BX.Bizproc.SetupTemplate.subscribeOnPull();

		new BX.Bizproc.Automation.AiAgentsPage({
			agentsGridId: '<?= CUtil::JSEscape($arResult['GRID_ID']) ?>',
			headerAddButtonUniqId: '<?= CUtil::JSEscape($arResult['AI_AGENTS_HEADER_ADD_BUTTON_UNIQUE_ID']) ?>',
			baseDesignerUri: '<?= CUtil::JSEscape($arResult['BASE_BIZPROC_DESIGNER_URI']) ?>',
			startTrigger: '<?= CUtil::JSEscape(StartTrigger::AiAgent->value) ?>',
		});
	});
</script>