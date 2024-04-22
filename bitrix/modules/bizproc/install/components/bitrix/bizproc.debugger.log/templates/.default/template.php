<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty(
	'BodyClass',
	($bodyClass ? $bodyClass . ' ' : '') . 'no-all-paddings'
);

\Bitrix\Main\UI\Extension::load([
	'bizproc.debugger',
	'ui.alerts'
]);

/** @var array $arResult*/

if (count($arResult['Logs']) <= 0): ?>
	<div class="ui-alert ui-alert-default">
		<span class="ui-alert-message"><?= htmlspecialcharsbx(\Bitrix\Main\Localization\Loc::getMessage('BIZPROC_TMP_DEBUGGER_LOG_NO_LOG')) ?></span>
	</div>
<?php return;
endif ?>

<div id="bizproc-debugger-log" class="bizproc-debugger-automation__scope bizproc-debugger-automation__slider"></div>

<script>
	BX.ready(() => {
		const automation = BX.Bizproc.Debugger.Manager.Instance.createAutomationDebugger({
			session: new BX.Bizproc.Debugger.Session( <?= CUtil::PhpToJSObject($arResult['Session']) ?>)
		});

		automation.getLogView()
			.setPreviousLog({
				logs: <?= CUtil::PhpToJSObject($arResult['Logs']) ?>,
				workflowRobots: <?= CUtil::PhpToJSObject($arResult['WorkflowRobots']) ?>
			})
			.renderTo(document.getElementById('bizproc-debugger-log'))
		;
	});
</script>
