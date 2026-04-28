<?php
declare(strict_types=1);

use Bitrix\Disk\Internal\Interface\CustomServerInterface;
use Bitrix\Disk\Public\Provider\CustomServerAvailabilityProvider;
use Bitrix\Disk\Public\Provider\CustomServerProvider;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$customServerAvailabilityProvider = ServiceLocator::getInstance()->get(CustomServerAvailabilityProvider::class);
$isCustomServerAvailableForEdit = $customServerAvailabilityProvider->isAvailableForEdit();
$customServerExpiredAt = $customServerAvailabilityProvider->getExpiredAt();

$customServerProvider = ServiceLocator::getInstance()->get(CustomServerProvider::class);
$customServers = $customServerProvider->getListForAdminPage();

$customServerLoc = [
	'templateNotFound' => Loc::getMessage('DISK_ADMIN_CUSTOM_SERVER_TEMPLATE_NOT_FOUND'),
	'customServerName' => Loc::getMessage('DISK_ADMIN_CUSTOM_SERVER_NAME'),
	'connect' => Loc::getMessage('DISK_ADMIN_CUSTOM_SERVER_CONNECT'),
	'disconnect' => Loc::getMessage('DISK_ADMIN_CUSTOM_SERVER_DISCONNECT'),
	'update' => Loc::getMessage('DISK_ADMIN_CUSTOM_SERVER_UPDATE'),
];

foreach ($customServers as $customServer)
{
	/** @var CustomServerInterface $customServer */
	$templatePath = $customServer->getAdminTemplatePath('form');

	if (is_null($templatePath))
	{
		$isTemplateFound = false;
		$template = "<tr><td colspan=\"2\">{$customServerLoc['templateNotFound']}</td></tr>";
	}
	else
	{
		$isTemplateFound = true;
		$groupId = $customServer->getType()?->value;
		$dataGroupKey = "custom_server_$groupId";
		$dataNamePrefix = 'data';
		$nameInputName = "{$dataNamePrefix}[name]";

		ob_start();
		include_once $templatePath;

		$template = ob_get_clean();
		$isConfigured = $customServer->isConfigured();
	}
	?>
	<tr>
		<td colspan="2">
			<?php if ($isCustomServerAvailableForEdit) { ?>
			<div class="adm-info-message-wrap" style="text-align: center">
				<div class="adm-info-message">
					<?= Loc::getMessage('DISK_ADMIN_CUSTOM_SERVER_AVAILABLE_NOTIFY', [
						'#DATE#' => $customServerExpiredAt?->format('d.m.Y'),
						'#MORE_LINK#' => 'https://www.1c-bitrix.ru/buy/products/b24.php#tab-section-7',
					]) ?>
				</div>
			</div>
			<?php } else { ?>
			<div class="adm-info-message-wrap adm-info-message-red" style="text-align: center">
				<div class="adm-info-message">
					<div class="adm-info-message-title">
						<?= Loc::getMessage('DISK_ADMIN_CUSTOM_SERVER_UNAVAILABLE_NOTIFY', [
							'#MORE_LINK#' => 'https://www.1c-bitrix.ru/buy/products/b24.php#tab-section-7',
						]) ?>
					</div>
					<div id="catalog_reindex_error_cont"></div>
					<div class="adm-info-message-icon"></div>
				</div>
			</div>
			<?php } ?>
		</td>
	</tr>
	<tr class="heading">
		<td colspan="2">
			<b>
				<?= htmlspecialcharsbx($customServer->getTitle()) ?>
			</b>
		</td>
	</tr>
	<tr>
		<td>
			<?= htmlspecialcharsbx($customServerLoc['customServerName']) ?>
		</td>
		<td>
			<input
				type="text"
				name="<?= htmlspecialcharsbx($nameInputName) ?>"
				value="<?= htmlspecialcharsbx($customServer->getName()) ?>"
				data-data-group="<?= htmlspecialcharsbx($dataGroupKey) ?>"
			>
		</td>
	</tr>
	<?= $template ?>
	<?php if ($isTemplateFound) { ?>
	<input
		type="hidden"
		name="customServerType"
		value="<?= htmlspecialcharsbx($customServer->getType()?->value) ?>"
		data-data-group="<?= htmlspecialcharsbx($dataGroupKey) ?>"
	>
	<input
		type="hidden"
		name="customServerId"
		value="<?= htmlspecialcharsbx($customServer->getId()) ?>"
		data-data-group="<?= htmlspecialcharsbx($dataGroupKey) ?>"
	>
	<tr>
		<td colspan="2" style="text-align: right">
			<?php if ($isConfigured) { ?>
				<input
					type="button"
					value="<?= htmlspecialcharsbx($customServerLoc['disconnect']) ?>"
					data-custom-server-disconnect="<?= htmlspecialcharsbx($dataGroupKey) ?>"
				>
				<input
					type="button"
					value="<?= htmlspecialcharsbx($customServerLoc['update']) ?>"
					data-custom-server-update="<?= htmlspecialcharsbx($dataGroupKey) ?>"
				>
			<?php } else { ?>
				<input
					type="button"
					value="<?= htmlspecialcharsbx($customServerLoc['connect']) ?>"
					class="adm-btn-save"
					data-custom-server-connect="<?= htmlspecialcharsbx($dataGroupKey) ?>"
				>
			<?php } ?>
		</td>
	</tr>
<?php } ?>
	<?php
}
