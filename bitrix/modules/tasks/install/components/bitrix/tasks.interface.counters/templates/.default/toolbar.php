<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage tasks
 * @copyright 2001-2021 Bitrix
 */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
/* @var $arParams array */
/* @var $arResult array */

use Bitrix\Main\Localization\Loc;

\Bitrix\Main\UI\Extension::load([
	'tasks.viewed',
	'ui.analytics',
]);
?>

<div class="task-interface-toolbar--item --visible" data-role="tasks-component-counters">
	<div></div>
</div>
<script>
	BX.message(<?= \CUtil::PhpToJSObject(Loc::loadLanguageFile(__FILE__)) ?>);
	BX.ready(function() {
		const counters = new BX.Tasks.Counters.Counters({
			renderTo: document.querySelector('[data-role="tasks-component-counters"]'),
			filterId: '<?= CUtil::JSEscape($arParams['GRID_ID']) ?>',
			role: '<?= CUtil::JSEscape($arParams['ROLE']) ?>',
			userId: <?= (int)$arParams['USER_ID'] ?>,
			targetUserId: <?= (int)$arParams['TARGET_USER_ID'] ?>,
			groupId: <?= (int)$arParams['GROUP_ID'] ?>,
			counterTypes: <?= CUtil::PhpToJSObject($arParams['COUNTERS']) ?>,
			counters: <?= CUtil::PhpToJSObject($arResult['COUNTERS']) ?>,
			signedParameters: <?=CUtil::PhpToJSObject($this->getComponent()->getSignedParameters()) ?>
		});
		counters.render();
	});
</script>

<?php
$shouldShowClue = $arResult['SHOULD_SHOW_COMMENT_COUNTER_AHA'] ?? false;
if ($shouldShowClue)
{
	\Bitrix\Main\UI\Extension::load([
		'tasks.clue',
	]);
}
?>

<script>
	const shouldShowClue = <?=($shouldShowClue? 'true': 'false')?>;
	BX.ready(function() {
		if (shouldShowClue)
		{
			const commentsCounter = document.querySelector('.tasks-counters--item-counter-num.--success');
			const counterWrapper = commentsCounter?.parentElement?.parentElement;
			if (BX.Type.isDomNode(commentsCounter) && !BX.Dom.hasClass(counterWrapper, '--fade'))
			{
				const clue = new BX.Tasks.Clue({
					id: `tasks_comment_counter`,
					autoSave: true,
				});
				clue.show(BX.Tasks.Clue.SPOT.COMMENT_COUNTER, commentsCounter);
			}
		}
	});
</script>
