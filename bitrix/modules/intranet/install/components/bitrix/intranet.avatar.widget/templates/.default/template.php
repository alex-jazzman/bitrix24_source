<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die;
}

/**
 * @var array $arResult
 */

use Bitrix\Intranet;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Extension::load([
	'intranet.widget-loader',
	'ui.hint',
	'timeman.work-time-state-icon',
]);

$style = '';

if (!empty($arResult['avatar']))
{
	$style = "background: url('{$arResult['avatar']}') no-repeat center; background-size: cover;";
}

$workTimeAvailable = Intranet\Internal\Integration\Timeman\WorkTime::canUse();

$workTimeState = '';
$workTimeAction = '';
if ($workTimeAvailable)
{
	$timeManUser = \CTimeManUser::instance();
	$workTimeState = $timeManUser->state();

	if ($workTimeState === 'CLOSED')
	{
		$workTimeAction = $timeManUser->openAction();
		$workTimeAction = ($workTimeAction === false) ? '' : $workTimeAction;
	}
}

?>

	<div data-testid="user-id-<?= (int)$arResult['userId'] ?>" class="air-user-profile --ui-hoverable-alt" data-id="bx-avatar-widget">
		<div class="air-user-profile__avatar ui-icon-common-user <?= '--' . $arResult['userRole'] ?>">
			<i style="<?= htmlspecialcharsbx($style) ?>"></i>
		</div>
		<div class="air-user-profile-avatar__counter"></div>
		<div class="air-user-profile-avatar__work-time-state"></div>
	</div>

<?php
$frame = $this->createFrame()->begin('');
?>

	<script>
		BX.ready(() => {
			BX.Intranet.Bitrix24.AvatarButton.init({
				userId: <?= (int)$arResult['userId'] ?>,
				skeleton: <?= Json::encode($arResult['skeleton']) ?>,
				signDocumentsCounter: <?= (int)$arResult['signDocumentsCounter'] ?>,
				signDocumentsPullEventName: '<?= \CUtil::JSEscape($arResult['signDocumentsPullEventName']) ?>',
				workTimeAvailable: '<?= \CUtil::JSEscape($workTimeAvailable) ?>',
				workTimeState: '<?= \CUtil::JSEscape($workTimeState) ?>',
				workTimeAction: '<?= \CUtil::JSEscape($workTimeAction) ?>',
			});
		})
	</script>
<?php
$frame->end();
