<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var CBitrixComponentTemplate $this
 * @var array $arResult
 */

use Bitrix\Main\Web\Json;
use Bitrix\Timeman\V2\Public\Provider\SettingsProvider;

$reportReady = (!empty($arResult['reportData']['REPORT_DATA']));

$frame = $this->createFrame()->begin('');

if ($reportReady)
{
	$runtimeInfo = CTimeMan::initRuntimeInfo();
	
	CJSCore::Init(['timeman']);
	
	$isReportsEnabled = (new SettingsProvider())->isReportsEnabledWithAi();
}
?>

<?php if ($reportReady): ?>
<script type="text/javascript">
	BX.ready(() => {
		const isReportsEnabled = <?= $isReportsEnabled ? 'true' : 'false'; ?>;
		Promise.all([
			BX.Runtime.loadExtension('ui.banner-dispatcher'),
			BX.Runtime.loadExtension('timeman.work-time-report'),
		]).then(([{ BannerDispatcher }, { WorkTimeReport }]) => {
			const autoLauncherId = 'timeman-report-form';
			BannerDispatcher.normal.toQueue(
				() => {
					BX.Event.EventEmitter.subscribeOnce('onTimemanInit', () => {
						if (isReportsEnabled)
						{
							(new WorkTimeReport()).open('weekly', {
								onClose: () => {
									const AutoLauncher = BX.Reflection.getClass('BX.UI.AutoLaunch.AutoLauncher');
									AutoLauncher?.unregister(autoLauncherId);
								},
							});
						}
						else
						{
							window.BXTIMEMAN.ShowFormWeekly(
								<?= Json::encode($arResult['reportData']) ?>,
								autoLauncherId
							);
						}
					});

					BX.timeman('bx_tm', <?= Json::encode($runtimeInfo) ?>, '<?= SITE_ID ?>');
				},
				{
					id: autoLauncherId,
				},
			);
		});
	});
</script>
<?php endif ?>

<?php
$frame->end();
