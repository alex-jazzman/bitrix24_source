<?php
/** @var R7CustomServer $customServer */
/** @var string $dataGroupKey */
/** @var string $dataNamePrefix */

use Bitrix\Disk\Internal\Entity\CustomServers\R7CustomServer;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$r7TemplateUrlKey = R7CustomServer::DATA_URL_KEY;
$r7TemplateSecretKeyKey = R7CustomServer::DATA_SECRET_KEY_KEY;
$r7TemplateMaxFileSizeKey = R7CustomServer::DATA_MAX_FILE_SIZE_KEY;

$r7TemplateUrlInputName = "{$dataNamePrefix}[$r7TemplateUrlKey]";
$r7TemplateSecretKeyInputName = "{$dataNamePrefix}[$r7TemplateSecretKeyKey]";
$r7TemplateMaxFileSizeInputName = "{$dataNamePrefix}[$r7TemplateMaxFileSizeKey]";

$r7TemplateUrl = $customServer->getUrl();
$r7TemplateSecretKey = $customServer->getSecretKey();
$r7TemplateMaxFileSize = $customServer->getMaxFileSizeForEdit();
$r7TemplateDefaultMaxFileSize = $customServer->getDefaultMaxFileSizeForView();
$r7TemplateVersionResult = $customServer->getVersion();

$r7TemplateLoc = [
	'url' => Loc::getMessage('DISK_CUSTOM_SERVER_R7_ADMIN_URL_DESCRIPTION'),
	'secretKey' => Loc::getMessage('DISK_CUSTOM_SERVER_R7_ADMIN_SECRET_KEY_DESCRIPTION'),
	'maxFileSize' => Loc::getMessage(
		code: 'DISK_CUSTOM_SERVER_R7_ADMIN_MAX_FILE_SIZE_DESCRIPTION',
		replace: [
			'#SIZE#' => $r7TemplateDefaultMaxFileSize,
		],
	),
	'maxFileSizeHint' => Loc::getMessage(
		code: 'DISK_CUSTOM_SERVER_R7_ADMIN_MAX_FILE_SIZE_HINT',
		replace: [
			'#SIZE#' => $r7TemplateDefaultMaxFileSize,
		],
	),
	'version' => Loc::getMessage('DISK_CUSTOM_SERVER_R7_ADMIN_VERSION_DESCRIPTION'),
	'unknown' => Loc::getMessage('DISK_CUSTOM_SERVER_R7_ADMIN_UNKNOWN'),
	'supported' => Loc::getMessage('DISK_CUSTOM_SERVER_R7_ADMIN_SUPPORTED'),
	'unsupported' => Loc::getMessage('DISK_CUSTOM_SERVER_R7_ADMIN_UNSUPPORTED'),
];

if ($r7TemplateVersionResult->isSuccess())
{
	$r7TemplateVersion = $r7TemplateVersionResult->getData()['version'];

	$supportedText =
		$customServer->isVersionSupported($r7TemplateVersion)
			? $r7TemplateLoc['supported']
			: $r7TemplateLoc['unsupported']
	;

	$r7TemplateVersionText = "$r7TemplateVersion ($supportedText)";
}
else
{
	$error = $r7TemplateVersionResult->getError();
	$isNotReadyForUse = $error?->getCustomData()['isNotReadyForUse'] ?? false;

	if (!$error instanceof \Bitrix\Main\Error || $isNotReadyForUse)
	{
		$r7TemplateVersionText = $r7TemplateLoc['unknown'];
	}
	else
	{
		$r7TemplateVersionText = $error->getMessage();
	}
}
?>
<tr>
	<td width="50%">
		<?= htmlspecialcharsbx($r7TemplateLoc['url']) ?>
	</td>
	<td width="50%">
		<input
			type="text"
			name="<?= htmlspecialcharsbx($r7TemplateUrlInputName) ?>"
			value="<?= htmlspecialcharsbx($r7TemplateUrl) ?>"
			data-data-group="<?= htmlspecialcharsbx($dataGroupKey) ?>"
		>
	</td>
</tr>
<tr>
	<td>
		<?= htmlspecialcharsbx($r7TemplateLoc['secretKey']) ?>
	</td>
	<td>
		<input
			type="text"
			name="<?= htmlspecialcharsbx($r7TemplateSecretKeyInputName) ?>"
			value="<?= htmlspecialcharsbx($r7TemplateSecretKey) ?>"
			data-data-group="<?= htmlspecialcharsbx($dataGroupKey) ?>"
		>
	</td>
</tr>
<tr>
	<td>
		<?= htmlspecialcharsbx($r7TemplateLoc['maxFileSize']) ?>
		<span data-hint="<?= htmlspecialcharsbx($r7TemplateLoc['maxFileSizeHint']) ?>"></span>
	</td>
	<td>
		<input
			type="text"
			name="<?= htmlspecialcharsbx($r7TemplateMaxFileSizeInputName) ?>"
			value="<?= htmlspecialcharsbx($r7TemplateMaxFileSize) ?>"
			data-data-group="<?= htmlspecialcharsbx($dataGroupKey) ?>"
		>
	</td>
</tr>
<tr>
	<td>
		<?= htmlspecialcharsbx($r7TemplateLoc['version']) ?>
	</td>
	<td>
		<?= htmlspecialcharsbx($r7TemplateVersionText) ?>
	</td>
</tr>