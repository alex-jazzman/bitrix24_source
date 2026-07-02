<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

global $APPLICATION;

use Bitrix\Crm\Restriction\RestrictionManager;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\Localization\Loc;

if (!RestrictionManager::getAutomatedSolutionRestriction()->hasPermission()):
	?>
	<script>
	BX.ready(() => {
		<?= RestrictionManager::getAutomatedSolutionRestriction()->prepareFeaturePromoterScript() ?>;

		const slider = top?.BX?.SidePanel?.Instance.getSliderByWindow(window);
		if (slider)
		{
			slider.close();
		}
		else
		{
			BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', () => {
				location.href = '/automation/';
			});
		}
	});
</script>
<?php
endif;

Container::getInstance()->getLocalization()->loadMessages();

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	[
		'GRID_ID' => 'AUTOMATED_SOLUTIONS_TYPE_LIST_RESTRICTED',
		'HEADERS' => [
			[
				'id' => 'ID',
				'name' => 'ID',
			],
		],
		'ROWS' => [],
		'STUB' => [
			'title' => Loc::getMessage('CRM_FEATURE_RESTRICTION_GRID_TITLE'),
			'description' => Loc::getMessage('CRM_FEATURE_RESTRICTION_GRID_TEXT'),
		],
	],
	$component,
	['HIDE_ICONS' => 'Y'],
);
