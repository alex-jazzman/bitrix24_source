<?
use Bitrix\Main\Page\Asset;

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
Asset::getInstance()->addString(Bitrix\MobileApp\Mobile::getInstance()->getViewPort());
?>


<?
$placementOptions = '';
if (isset($_GET['bx24_placementOptions']))
{
	$decoded = json_decode($_GET['bx24_placementOptions'], true);
	if (is_array($decoded))
	{
		$placementOptions = $decoded;
	}
}

$componentParams = [
	"ID" => $_GET["id"],
	"COMPONENT_TEMPLATE" => ".default",
	"MOBILE" => "Y",
	"LAZYLOAD" => isset($_GET["lazyload"]) && $_GET["lazyload"] === "Y" ? "Y" : "N",
	"PLACEMENT_OPTIONS" => $placementOptions,
	"~PLACEMENT_OPTIONS" => $placementOptions,
];

if (!empty($_GET['bx24_placement']))
{
	$componentParams['PLACEMENT'] = $_GET['bx24_placement'];
}

if (!empty($_GET['bx24_placementId']))
{
	$componentParams['PLACEMENT_ID'] = (int)$_GET['bx24_placementId'];
}

$APPLICATION->IncludeComponent(
	"bitrix:app.layout",
	".default",
	$componentParams,
	false
);?>

<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");?>
