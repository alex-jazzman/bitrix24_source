<? if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @global CDatabase $DB */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var CBitrixComponent $component */

$isStExport = (($arResult['STEXPORT_MODE'] ?? 'N') === 'Y');
$isFirstPage = (($arResult['STEXPORT_IS_FIRST_PAGE'] ?? 'N') === 'Y');
$isLastPage = (($arResult['STEXPORT_IS_LAST_PAGE'] ?? 'N') === 'Y');
?>
<?php if (!$isStExport || $isFirstPage): ?>
<html>
	<head>
	<title><?php $APPLICATION->GetTitle() ?></title>
	<meta http-equiv="Content-Type" content="text/html; charset=<?= LANG_CHARSET ?>">
	<style>
		td {mso-number-format:\@;}
		.number0 {mso-number-format:0;}
		.number2 {mso-number-format:Fixed;}
	</style>
	</head>
<body>
	<table border="1">
	<tr>
		<?php foreach ($arResult["EXCEL_COLUMN_NAME"] as $value): ?>
		<td><?= (string)$value ?></td>
		<?php endforeach; ?>
	</tr>
<?php endif; ?>

<?php foreach ($arResult["EXCEL_CELL_VALUE"] as $array): ?>
	<tr>
		<?php foreach ($array as $value): ?>
			<td><?= (string)$value ?></td>
		<?php endforeach; ?>
	</tr>
<?php endforeach; ?>

<?php if (!$isStExport || $isLastPage): ?>
	</table>
</body>
</html>
<?php endif; ?>
