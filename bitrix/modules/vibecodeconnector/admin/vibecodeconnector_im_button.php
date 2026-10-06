<?php

declare(strict_types=1);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';

use Bitrix\Main\Application;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Vibecodeconnector\Infrastructure\Admin\PreviewUsersProvider;
use Bitrix\Vibecodeconnector\Public\Service\AvailabilityService;

/**
 * @global CMain $APPLICATION
 */

$module_id = 'vibecodeconnector';
Loc::loadMessages(__FILE__);

if (!Loader::includeModule($module_id))
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));

	return;
}

$moduleAccess = $APPLICATION->GetGroupRight($module_id);
if ($moduleAccess < 'R')
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));

	return;
}

$availability = ServiceLocator::getInstance()->get(AvailabilityService::class);
$isAvailable = $availability->isEnabled();

$request = Application::getInstance()->getContext()->getRequest();
$rawPreview = $request->getQuery('previewUserId');
$previewUserId = is_numeric($rawPreview) && (int)$rawPreview > 0 ? (int)$rawPreview : null;

$currentUserId = (int)CurrentUser::get()->getId();
$recentUsers = (new PreviewUsersProvider())->getRecent();

Extension::load('vibecodeconnector.vibe-code-catalog-button-test');

$APPLICATION->SetTitle(Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_TITLE_V2'));

$tabs = [
	[
		'DIV' => 'edit1',
		'TAB' => Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_TAB'),
		'TITLE' => Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_TAB_TITLE'),
	],
];
$tabControl = new CAdminTabControl('tabControl', $tabs);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

$pageUrl = $APPLICATION->GetCurPage();
?>
<form method="get" action="<?= htmlspecialcharsbx($pageUrl) ?>">
	<input type="hidden" name="lang" value="<?= htmlspecialcharsbx(LANGUAGE_ID) ?>">
	<?php $tabControl->Begin(); ?>
	<?php $tabControl->BeginNextTab(); ?>

	<tr>
		<td width="40%">
			<label for="vcc-preview-user"><?= Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_PREVIEW_USER') ?>:</label>
		</td>
		<td width="60%">
			<select id="vcc-preview-user" name="previewUserId">
				<option value=""><?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_PREVIEW_CURRENT')) ?> (#<?= $currentUserId ?>)</option>
				<?php foreach ($recentUsers as $user): ?>
					<option
						value="<?= (int)$user['id'] ?>"
						<?= $previewUserId === (int)$user['id'] ? 'selected' : '' ?>
					><?= htmlspecialcharsbx($user['label']) ?></option>
				<?php endforeach; ?>
			</select>
			<input type="submit" value="<?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_PREVIEW_USER_APPLY')) ?>">
			<?php if ($previewUserId !== null): ?>
				<a href="<?= htmlspecialcharsbx($pageUrl) ?>?lang=<?= htmlspecialcharsbx(LANGUAGE_ID) ?>" style="margin-left: 8px;">
					<?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_PREVIEW_USER_RESET')) ?>
				</a>
			<?php endif; ?>
			<br>
			<small><?= Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_PREVIEW_USER_HINT') ?></small>
		</td>
	</tr>

	<tr>
		<td width="40%"><?= Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_BUTTON_AREA') ?>:</td>
		<td width="60%">
			<div
				id="vcc-test-button-target"
				style="display: inline-flex; align-items: center; padding: 12px; border: 1px dashed #c5c9cd; border-radius: 8px; min-height: 58px; min-width: 58px; background: #f8fafc;"
			></div>
			<br>
			<small>
				<?php if ($isAvailable): ?>
					<span style="color: #1ba81b;"><?= Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_AVAILABLE') ?></span>
				<?php else: ?>
					<span style="color: #c00;"><?= Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_NOT_AVAILABLE') ?></span>
				<?php endif; ?>
				<br>
				<?= Loc::getMessage('VIBECODECONNECTOR_IM_BUTTON_BUTTON_HINT') ?>
			</small>
		</td>
	</tr>

	<?php $tabControl->Buttons(); ?>
	<?php $tabControl->End(); ?>
</form>

<script>
	BX.ready(function() {
		var target = document.getElementById('vcc-test-button-target');
		if (target && BX.Vibecodeconnector && BX.Vibecodeconnector.VccCatalogButtonTest)
		{
			BX.Vibecodeconnector.VccCatalogButtonTest.mountInto(target);
		}
	});
</script>

<?php
require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
