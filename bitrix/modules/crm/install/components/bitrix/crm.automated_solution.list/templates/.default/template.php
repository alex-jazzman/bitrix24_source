<?php

/** @var array $arResult */
/** @var \CMain $APPLICATION */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Tour\AutomatedSolution\Marketplace;
use Bitrix\Crm\Tour\Permissions\AutomatedSolutionList;
use Bitrix\Main\Localization\Loc;

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass.' ' : '') . 'no-all-paddings no-hidden');

if($this->getComponent()->getErrors())
{
	foreach($this->getComponent()->getErrors() as $error)
	{
		/** @var \Bitrix\Main\Error $error */
		?>
		<div><?=htmlspecialcharsbx($error->getMessage());?></div>
		<?php
	}

	return;
}

/** @see \Bitrix\Crm\Component\Base::addToolbar() */
$this->getComponent()->addToolbar($this);

\Bitrix\Main\Loader::includeModule('ui');

echo AutomatedSolutionList::getInstance()->build();
echo Marketplace::getInstance()->build();

echo '<div class="crm-automated-solution-list-wrapper">';
$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	$arResult['grid'],
);
echo '</div>';

if (($arResult['hasImportedAutomatedSolution'] ?? false) === true)
{
	$APPLICATION->IncludeComponent(
		'bitrix:crm.automated_solution.notify',
		'',
	);
}

\Bitrix\Main\UI\Extension::load('ui.hint');
$hintText = Loc::getMessage('CRM_AUTOMATED_SOLUTION_IMPORTED');
$blockText = Loc::getMessage('CRM_AUTOMATED_SOLUTION_IMPORTED_BLOCKED');
?>

<script>
	BX.ready(() => {
		const grid = BX.Main.gridManager.getInstanceById('<?= \CUtil::JSEscape($arResult['grid']['GRID_ID']) ?>');

		BX.Crm.ToolbarComponent.Instance.subscribeAutomatedSolutionUpdatedEvent(() => {
			grid?.reload();
		});

		const showHint = ({ target }) => {
			const hintText = BX.Dom.hasClass(target, '--o-market')
				? '<?= CUtil::JSEscape($hintText) ?>'
				: '<?= CUtil::JSEscape($blockText) ?>'
			;

			BX.UI.Hint.show(
				target,
				hintText,
				false,
			);
		}

		const hideHint = () => {
			BX.UI.Hint.hide();
		}

		document.querySelectorAll('.crm-automated-solution-grid-types-title').forEach((element) => {
			BX.Event.bind(element.querySelector('.--o-market'), 'mouseenter', showHint);
			BX.Event.bind(element.querySelector('.--lock'), 'mouseenter', showHint);
		});

		document.querySelectorAll('.crm-automated-solution-grid-types-title').forEach((element) => {
			BX.Event.bind(element.querySelector('.--o-market'), 'mouseleave', hideHint);
			BX.Event.bind(element.querySelector('.--lock'), 'mouseleave', hideHint);
		});
	});
</script>
