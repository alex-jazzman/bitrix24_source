<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Security\Random;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Extension::load([
	'crm.ai.report-drawer',
]);

/** @var CrmAiReportDrawerWrapper $component */
$component = $this->getComponent();
$containerId = htmlspecialcharsbx('crm-ai-report-drawer-wrapper-' . Random::getString(8));
?>

<?php if ($component->getErrors()): ?>
	<div class="ui-alert ui-alert-danger">
		<?php foreach($component->getErrors() as $error): ?>
			<span class="ui-alert-message"><?= htmlspecialcharsbx($error->getMessage()) ?></span>
		<?php endforeach; ?>
	</div>
	<?php return; ?>
<?php endif; ?>

<div id="<?= $containerId ?>"></div>
<script>
	BX.ready(function() {
		const appParams = <?= Json::encode($arResult['APP_PARAMS'] ?? []) ?>;
		const reportDrawerClass = BX.Crm?.AI?.ReportDrawer ?? null;

		if (BX.Type.isNull(reportDrawerClass))
		{
			return;
		}

		BX.Dom.addClass(document.documentElement, 'crm-ai-report-drawer-frame');
		BX.Dom.addClass(document.body, 'crm-ai-report-drawer-frame');

		const container = document.getElementById('<?= CUtil::JSEscape($containerId) ?>');
		if (!BX.Type.isDomNode(container) || !BX.Type.isFunction(reportDrawerClass))
		{
			return;
		}

		const reportDrawer = new reportDrawerClass(appParams);

		reportDrawer.renderTo(container);

		const sidePanelManager = BX.Type.isObject(top.BX) && BX.Type.isObject(top.BX.SidePanel)
			? top.BX.SidePanel.Instance
			: null
		;
		const slider =
			(BX.Type.isObject(sidePanelManager) && BX.Type.isFunction(sidePanelManager.getSliderByWindow))
				? sidePanelManager.getSliderByWindow(window)
				: null
		;
		if (BX.Type.isObject(slider) && BX.Type.isFunction(slider.subscribe))
		{
			slider.subscribe('onCloseComplete', reportDrawer.destroy.bind(reportDrawer));
			slider.subscribe('onDestroyComplete', reportDrawer.destroy.bind(reportDrawer));
		}
	});
</script>
