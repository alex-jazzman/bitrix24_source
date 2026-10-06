<?php

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

use Bitrix\Main\Application;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Web\Uri;
use Bitrix\Sign\Config\Feature;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */

global $APPLICATION;

$APPLICATION->SetTitle($arResult['TITLE']);

const COMPONENT_TYPE_SAFE = 'safe';
const COMPONENT_TYPE_CURRENT = 'current';
const COMPONENT_TYPE_DOCUMENT = 'document';

// The single-row action drives the row menu, the JS instance and the per-row
// annul metadata; the mass action drives the row checkboxes and the group panel.
// Both cover the company safe and the per-document process grids behind the same
// feature flag.
$isAnnulSingleActionEnabled = (bool)($arResult['IS_ANNUL_SINGLE_ACTION_ENABLED'] ?? false);
$isAnnulMassActionsEnabled = (bool)($arResult['IS_ANNUL_MASS_ACTIONS_ENABLED'] ?? false);

$extensions = [
	'ui.icons.disk',
	'ui.label',
	'ui.icon-set.actions',
	'ui.design-tokens',
	'ui.hint',
];

if (!empty($arResult['SAFE_EXPORT_ERROR_MESSAGE']))
{
	$extensions[] = 'ui.notification';
}

if ($isAnnulSingleActionEnabled || $isAnnulMassActionsEnabled)
{
	$extensions[] = 'sign.v2.grid.b2e.annul';
}

Extension::load($extensions);

// Company Safe grid runs in the `safe` component type. Folder UI (mass move,
// clickable folder column, folder navigation) is only wired for this mode.
$isSafeGrid = mb_strtolower((string)($arParams['COMPONENT_TYPE'] ?? '')) === COMPONENT_TYPE_SAFE;

// Folder grouping in the safe grid is gated by a feature flag; the create-folder
// action additionally requires the permission to create folders (server-fed).
$isSafeFolderGroupingAllowed = $isSafeGrid && Feature::instance()->isSafeFolderGroupingAllowed();
$canCreateSafeFolder = (bool)($arResult['CAN_CREATE_SAFE_FOLDER'] ?? false);

// The Safe is single-level: folders can only live at the root. When the grid
// renders the content of a folder (SAFE_FOLDER_ID > 0) we are "inside a folder"
// and must hide root-only affordances (create-folder button, download banner).
$isInsideSafeFolder = $isSafeGrid && (int)($arResult['SAFE_FOLDER_ID'] ?? 0) > 0;

// The per-document signing process grid (participants of one document).
$isProcessGrid = mb_strtolower((string)($arParams['COMPONENT_TYPE'] ?? '')) === COMPONENT_TYPE_DOCUMENT;

// Where the group-action panel is rendered. BX.UI.ActionPanel stretches to the
// size of its render target, so it must go into the toolbar strip above the
// grid: given the grid container it covers the column headers and the rows.
// The safe root is a page (`.page__toolbar`); the safe folder view and the
// process grid open in a side panel, whose toolbar is `.ui-side-panel-toolbar`
// and where the page toolbar is absent (the page toolbar is kept as a fallback,
// as a missing render target throws and breaks the whole grid script).
$actionPanelRenderTo = ($isInsideSafeFolder || $isProcessGrid)
	? '.ui-side-panel-toolbar, .page__toolbar'
	: '.page__toolbar'
;

if ($isSafeFolderGroupingAllowed)
{
	Extension::load(['sign.v2.grid.b2e.safe']);
}

// CSS class the inline script binds the "create folder" click to (deferred to
// BX.ready so the Safe controller instance already exists when clicked).
$safeCreateFolderButtonClass = 'sign-safe-js-create-folder-button';

// Toolbar "Create folder" button — a plain button (unlike the templates grid,
// where it is a dropdown item). Click opens the create-folder popup (API-01).
if ($isSafeFolderGroupingAllowed && $canCreateSafeFolder && !$isInsideSafeFolder)
{
	Toolbar::addButton(
		(new Button([]))
			->setColor(Color::PRIMARY)
			->setText(Loc::getMessage('SIGN_DOCUMENT_LIST_SAFE_CREATE_FOLDER_BUTTON'))
			->addClass($safeCreateFolderButtonClass)
			->addDataAttribute('testid', 'sign-safe-create-folder-button'),
		ButtonLocation::AFTER_TITLE,
	);
}

// Action-panel button id for the mass "move to folder" action. Must match the
// constant used by BX.Sign.V2.Grid.B2e.Safe to toggle the button by selection.
$safeMoveToFolderButtonId = 'sign-safe-move-to-folder-button';

$getValidatedUrl = static function(string $validatedUrl, bool $needValidateOpenRedirect = true): string
{
	$urlParseResult = parse_url($validatedUrl);

	if (!$urlParseResult)
	{
		return "";
	}

	if (!isset($urlParseResult['host']) || !$needValidateOpenRedirect)
	{
		return htmlspecialcharsbx($validatedUrl);
	}

	$server = Application::getInstance()->getContext()->getServer();
	$portalHost = $server->getHttpHost();

	if ($portalHost !== $urlParseResult['host'])
	{
		return '';
	}

	return htmlspecialcharsbx($validatedUrl);
};

$getDataForLabels = static function(string $status, string $color, ?string $identifier = null)
{
	ob_start();
	?>
	<div class="ui-label ui-label-fill sign-grid-member-text-wrapper <?= htmlspecialcharsbx($color) ?> <?= htmlspecialcharsbx($identifier) ?>">
		<div class="ui-label-inner sign-grid-member-status-inner">
			<div class="sign-grid-member-status-text">
				<?= htmlspecialcharsbx($status) ?>
			</div>
		</div>
	</div>
	<?php
	return (string)ob_get_clean();
};

$getTextWithHoverTemplate = static function(string $text, string $hoverText): string
{
	ob_start();
	?>
	<span title="<?= htmlspecialcharsbx($hoverText) ?>">
		<?= htmlspecialcharsbx($text) ?>
	</span>
	<?php
	return (string)ob_get_clean();
};

$getText = static function(string $text): string
{
	ob_start();
	?>
	<div class="sign-grid-member-text-wrapper">
		<span>
			<?= htmlspecialcharsbx($text) ?>
		</span>
	</div>
	<?php
	return (string)ob_get_clean();
};

$getOpenSliderLinkTemplate = static function(
	string $templateText,
	?string $link = null,
	?string $viewUrl = null,
	?string $entityId = null,
	?string $downloadUrl = null,
) use ($getValidatedUrl, $isSafeGrid): string
{
	$viewUrlObject = $viewUrl !== null ? new \Bitrix\Main\Web\Uri($viewUrl) : null;
	$isValidViewUrl = $viewUrlObject !== null && str_starts_with($viewUrlObject->getPath(), '/bitrix/services/main/ajax.php');

	if ($link !== null)
	{
		$validatedLink = $getValidatedUrl($link);
		ob_start();
		?>
		<div class="sign-grid-document-title">
			<div
				class="sign-grid-document-title__icon_wrapper<?= $isSafeGrid ? ' sign-grid-document-title__icon_wrapper--plain' : '' ?>"
				<?php if ($isValidViewUrl): ?>
					id="icon_view_<?= htmlspecialcharsbx($entityId) ?>"
					data-hint="<?= htmlspecialcharsbx(Loc::getMessage('SIGN_DOCUMENT_VIEW')) ?>"
					data-hint-no-icon
				<?php endif; ?>
			>
				<?php if ($isSafeGrid): ?>
					<span class="sign-grid-safe-document__icon"></span>
				<?php else: ?>
					<span
						class="ui-icon-set --file-2 sign-grid-document-title__icon"
						style="--ui-icon-set__icon-size: 30px;"
					></span>
				<?php endif; ?>
			</div>
			<a class="sign-grid-document-title_text" target="_top"  href="<?= $validatedLink ?>">
				<?= htmlspecialcharsbx($templateText) ?>
			</a>
		</div>
		<?php
	}
	else
	{
		ob_start();
		?>
		<div class="sign-grid-document-title">
			<div
				class="sign-grid-document-title__icon_wrapper<?= $isSafeGrid ? ' sign-grid-document-title__icon_wrapper--plain' : '' ?>"
				<?php if ($isValidViewUrl): ?>
					id="icon_view_<?= htmlspecialcharsbx($entityId) ?>"
					data-hint="<?= htmlspecialcharsbx(Loc::getMessage('SIGN_DOCUMENT_VIEW')) ?>"
					data-hint-no-icon
				<?php endif; ?>
			>
				<?php if ($isSafeGrid): ?>
					<span class="sign-grid-safe-document__icon"></span>
				<?php else: ?>
					<span
						class="ui-icon-set --file-2 sign-grid-document-title__icon"
						style="--ui-icon-set__icon-size: 30px;"
					></span>
				<?php endif; ?>
			</div>
			<span class="sign-grid-document-title_text">
					<?= htmlspecialcharsbx($templateText) ?>
				</span>
		</div>
		<?php
	}?>

	<script>
		BX.ready(function() {
			const viewButton = BX("icon_view_<?= CUtil::JSEscape($entityId) ?>");
			if (viewButton) {
				<?php if ($viewUrl !== null && $isValidViewUrl): ?>
					BX.bind(viewButton, 'click', () => {
						BX.Sign.DocumentList.viewDocument(
							"<?= CUtil::JSEscape($viewUrl) ?>",
							"<?= CUtil::JSEscape($templateText) ?>",
							"<?= $downloadUrl !== null ? CUtil::JSEscape($downloadUrl) : null ?>"
						);
					});
				<?php endif; ?>
			}
		});
	</script>

	<?php

	return ob_get_clean();
};

$getUserInfoTemplate = static function (
	?string $fullName,
	?string $linkPath,
	?string $iconPath,
	?string $companyName = null
) use (
	$getValidatedUrl
): string {
	$userLinkPath = $getValidatedUrl((string)$linkPath);
	$userImagePath = $getValidatedUrl((string)$iconPath, false);
	$userFullName = htmlspecialcharsbx($fullName);

	ob_start();
	?>
	<div>
	<?php if ($companyName !== null): ?>
		<div class="sign-personal-grid-company">
			<?= htmlspecialcharsbx($companyName) ?>
		</div>
	<?php endif; ?>
	<a
		class="sign-personal-grid-user"
		target="_top"
		onclick="event.stopPropagation();"
		href="<?= $userLinkPath ?>">
		<span class="ui-icon ui-icon-common-user">
			<i style=" <?= ($iconPath !== null ? "background-image: url('". Uri::urnEncode($userImagePath) . "');" : '') ?>">
			</i>
		</span>
		<span class="sign-personal-grid-user-name">
				<?= $userFullName ?>
		</span>
	</a>
	</div>
	<?php
	return (string)ob_get_clean();
};

$getActionButton = static function (string $role, int $memberId): string {
	$buttonText = match ($role)
	{
		\Bitrix\Sign\Type\Member\Role::SIGNER,
		\Bitrix\Sign\Type\Member\Role::ASSIGNEE => Loc::getMessage('SIGN_DOCUMENT_GRID_COLUMN_ACTION_BUTTON_TEXT_ROLE_SIGNER'),
		\Bitrix\Sign\Type\Member\Role::EDITOR => Loc::getMessage('SIGN_DOCUMENT_GRID_COLUMN_ACTION_BUTTON_TEXT_ROLE_EDITOR'),
		\Bitrix\Sign\Type\Member\Role::REVIEWER => Loc::getMessage('SIGN_DOCUMENT_GRID_COLUMN_ACTION_BUTTON_TEXT_ROLE_REVIEWER'),
	};

	$button = new Button([
		'text' => $buttonText,
	]);

	$button->setColor(\Bitrix\UI\Buttons\Color::SUCCESS);
	$button->setSize(\Bitrix\UI\Buttons\Size::SMALL);
	$button->setStyles(['width' => '160px']);
	$button->addDataAttribute('member-id', $memberId);

	return $button->render();
};

$getDownloadResultFileTemplate = static function (
	?string $extensionName,
	?string $downloadUrl,
	?string $name = null,
	?string $entityId = null,
	?string $downloadUrlForPrinted = null,
	?string $viewUrl = null,
	?string $title = null,
	?string $annulUid = null,
	bool $canAnnul = false,
	bool $isAnnulled = false,
	bool $annulEnabled = false,
) use (
	$arParams
): string {

	ob_start();
	?>

	<?php
	$downloadUrlObject = $downloadUrl !== null ? new \Bitrix\Main\Web\Uri($downloadUrl) : null;
	$downloadUrlForPrintedObject = $downloadUrlForPrinted !== null ? new \Bitrix\Main\Web\Uri($downloadUrlForPrinted) : null;
	$viewUrlObject = $viewUrl !== null ? new \Bitrix\Main\Web\Uri($viewUrl) : null;

	$isValidDownloadUrl = $downloadUrlObject !== null && str_starts_with($downloadUrlObject->getPath(), '/bitrix/services/main/ajax.php');
	$isValidDownloadUrlForPrinted = $downloadUrlForPrintedObject !== null && str_starts_with($downloadUrlForPrintedObject->getPath(), '/bitrix/services/main/ajax.php') ?? null;
	$isValidViewUrl = $viewUrlObject !== null && str_starts_with($viewUrlObject->getPath(), '/bitrix/services/main/ajax.php');

	$downloadUrlFromUiViewer = null;
	if ($viewUrl !== null && $isValidViewUrl)
	{
		if ($downloadUrlForPrinted !== null && $isValidDownloadUrlForPrinted)
		{
			$downloadUrlFromUiViewer = $downloadUrlForPrinted;
		}
		elseif ($downloadUrl !== null && $isValidDownloadUrl && $extensionName === 'pdf')
		{
			$downloadUrlFromUiViewer = $downloadUrl;
		}
	}

	// The printed/archive split always coexist; the single annulment action reuses
	// the same dropdown so the "Action" column keeps one control per row. The item
	// is offered only under the feature flag and per-row rights; the endpoint stays
	// authoritative. When toggling, an already annulled document offers "unannul".
	$hasPrinted = ($downloadUrlForPrinted !== null) && $isValidDownloadUrlForPrinted;
	$showAnnulItem = $annulEnabled && $canAnnul && (string)$annulUid !== '';
	$hasMenu = $hasPrinted || $showAnnulItem;
	$annulActionText = $isAnnulled
		? (string)Loc::getMessage('SIGN_DOCUMENT_LIST_MASS_ACTION_UNANNUL')
		: (string)Loc::getMessage('SIGN_DOCUMENT_LIST_MASS_ACTION_ANNUL')
	;

	$componentType = mb_strtolower((string)$arParams['COMPONENT_TYPE']);
	// The company safe and the per-document process grid both render the download
	// button, with the dropdown toggle added only when there are menu items. Whether
	// a row can be annulled must not change the control itself, or the "Action"
	// column mixes buttons and labels within one grid. Personal/current keep the
	// plain download label below.
	if ($componentType === COMPONENT_TYPE_SAFE || $componentType === COMPONENT_TYPE_DOCUMENT): ?>
		<div class="sign-personal-action">
			<?php if ($isValidDownloadUrl || $isValidDownloadUrlForPrinted): ?>
				<div class="sign-personal-download-btn <?= $hasMenu ? '' : 'sign-personal-download-btn--no-toggle'?>">
					<a href="<?= htmlspecialcharsbx($downloadUrlObject) ?>" class="sign-personal-download-btn__main">
						<?= htmlspecialcharsbx(Loc::getMessage('SIGN_DOCUMENT_GRID_COLUMN_DOWNLOAD_BUTTON')) ?>
					</a>
					<?php if ($hasMenu): ?>
						<div
							class="sign-personal-download-btn__toggle"
							id="menu_btn_<?= htmlspecialcharsbx($entityId) ?>"
							data-test-id="sign-document-list__row-action-menu-btn"
							aria-haspopup="true"
							aria-label="<?= htmlspecialcharsbx((string)Loc::getMessage('SIGN_DOCUMENT_LIST_ROW_ACTIONS_MENU_LABEL')) ?>"
						>
							<span class="sign-personal-download-btn__icon"></span>
						</div>
				<?php endif; ?>
				</div>
			<?php endif; ?>
		<?php if ($isValidViewUrl): ?>
			<div
				class="sign-personal-view-btn"
				id="view_btn_<?= htmlspecialcharsbx($entityId) ?>"
				data-hint="<?= htmlspecialcharsbx(Loc::getMessage('SIGN_DOCUMENT_VIEW')) ?>"
				data-hint-no-icon>
					<span class="sign-personal-view-btn__icon"></span>
			</div>
		<?php endif; ?>
		</div>
		<?php if ($hasMenu || $isValidViewUrl): ?>
		<script>
			BX.ready(function()
			{
				const menuButton = BX("menu_btn_<?= CUtil::JSEscape($entityId) ?>");
				const viewButton = BX("view_btn_<?= CUtil::JSEscape($entityId) ?>");

				if (menuButton)
				{
					const menu = new BX.PopupMenuWindow({
					bindElement: menuButton,
					offsetLeft: -142,
					closeByEsc: true,
					className: 'sign-personal-download-dropdown-menu-btn',
					items: [
						<?php if ($hasPrinted): ?>
							{
								text: "<?= CUtil::JSEscape(Loc::getMessage('SIGN_DOCUMENT_DOWNLOAD_PRINTED'))?>",
								href: "<?= CUtil::JSEscape($downloadUrlForPrintedObject)?>"
							},
							{
								text: "<?= CUtil::JSEscape(Loc::getMessage('SIGN_DOCUMENT_DOWNLOAD_ARCHIVE'))?>",
								href: "<?= CUtil::JSEscape($downloadUrlObject)?>"
							},
						<?php endif; ?>
						<?php if ($showAnnulItem): ?>
							{
								text: "<?= CUtil::JSEscape($annulActionText)?>",
								className: 'menu-popup-no-icon sign-document-list__row-annul-item',
								dataset: { testid: 'sign-document-list-row-annul-item' },
								onclick: function() {
									menu.popupWindow.close();
									if (typeof signAnnulGrid !== 'undefined')
									{
										signAnnulGrid.annulOne(
											'<?= CUtil::JSEscape((string)$annulUid)?>',
											<?= $isAnnulled ? 'false' : 'true' ?>
										);
									}
								}
							},
						<?php endif; ?>
					]
				});

				BX.bind(menuButton, 'click', (event) => {
					event.preventDefault();
					event.stopPropagation();
					menu.popupWindow.show();
				});

				BX.bind(document, 'click', () => {
					if (menu.popupWindow.isShown())
					{
						menu.popupWindow.close();
					}
				});

				BX.bind(document.querySelector('.main-grid-container'), 'scroll', () => {
					if (menu.popupWindow.isShown())
					{
						menu.popupWindow.close();
					}
					})
				}

			<?php if ($viewUrl !== null && $isValidViewUrl): ?>
				BX.bind(viewButton, 'click', () => {
					BX.Sign.DocumentList.viewDocument(
						"<?= CUtil::JSEscape($viewUrl) ?>",
						"<?= CUtil::JSEscape($title ?? 'document.pdf') ?>",
						"<?= CUtil::JSEscape((string)$downloadUrlFromUiViewer) ?>"
					);
				});
			<?php endif; ?>
			});
		</script>
		<?php endif; ?>
	<?php else: ?>
		<?php if ($isValidDownloadUrl): ?>
			<a href="<?= htmlspecialcharsbx($downloadUrlObject) ?>" class="ui-label ui-label-light sign-personal-download-result-file-wrapper">
				<div class="ui-label-inner sign-personal-download-result-file-inner">
					<div class="ui-icon ui-icon-file-<?= htmlspecialcharsbx($extensionName) ?> sign-personal-download-result-icon"><i></i></div>
					<div class="sign-personal-download-result-file-text">
						<?= htmlspecialcharsbx($name ?? $extensionName) ?>
					</div>
				</div>
			</a>
		<?php endif; ?>
	<?php endif; ?>

	<?php
	return (string)ob_get_clean();
};

// Folder-row title cell for the company Safe grid (DTO-01). A folder row is a
// clickable link opening the folder content in a side panel, modeled on the
// templates grid folder row. The title is user data, so it is HTML-escaped;
// folderId is an int and safe to inline in the onclick handler.
$getFolderRowTitleTemplate = static function (int $folderId, string $folderTitle): string {
	ob_start();
	?>
	<a
		class="sign-grid-safe-folder sign-grid-safe-folder--link"
		href="#"
		data-testid="sign-safe-folder-row-title-<?= $folderId ?>"
		onclick="signSafeOpenFolderContent(<?= $folderId ?>); return false;"
	>
		<span class="sign-grid-safe-folder__icon"></span>
		<span class="sign-grid-safe-folder__text"><?= htmlspecialcharsbx($folderTitle) ?></span>
	</a>
	<?php

	return (string)ob_get_clean();
};

// Validates a user photo URL for the folder-row avatar stacks. Absolute URLs are
// allowed only for the portal host (relative URLs pass through); anything else
// is dropped. The raw (un-encoded) URL is returned: it is HTML-escaped once as
// part of the JSON `data-*` attribute below and URI-encoded again on the JS side
// before entering the CSS url() context.
$validateFolderPhotoUrl = static function (string $photoUrl): string {
	if ($photoUrl === '')
	{
		return '';
	}

	$parsed = parse_url($photoUrl);
	if ($parsed === false)
	{
		return '';
	}

	if (!isset($parsed['host']))
	{
		return $photoUrl;
	}

	$portalHost = Application::getInstance()->getContext()->getServer()->getHttpHost();

	return $parsed['host'] === $portalHost ? $photoUrl : '';
};

// Folder-row people cell (DTO-01): an empty placeholder carrying a short preview
// as a JSON data attribute. BX.Sign.V2.Grid.B2e.Safe reads it after grid render
// and mounts the avatar stack. Names stay raw here and are HTML-encoded once via
// the JSON attribute (Text.encode is additionally applied on the JS side); photo
// URLs are host-validated. Returns an empty string when there is nobody to show,
// so the cell stays empty.
$getFolderPeopleStackTemplate = static function (
	mixed $people,
	int $total,
	int $folderId,
	string $category,
	string $title = '',
) use ($validateFolderPhotoUrl): string {
	$cleanPeople = [];
	foreach ((is_array($people) ? $people : []) as $person)
	{
		if (!is_array($person))
		{
			continue;
		}

		$cleanPeople[] = [
			'id' => (int)($person['id'] ?? 0),
			'name' => (string)($person['name'] ?? ''),
			'photo' => $validateFolderPhotoUrl((string)($person['photo'] ?? '')),
		];
	}

	if (empty($cleanPeople))
	{
		return '';
	}

	return '<span'
		. ' class="sign-safe-folder-people-stack"'
		. ' data-people="' . htmlspecialcharsbx(Json::encode($cleanPeople)) . '"'
		. ' data-total="' . max(count($cleanPeople), $total) . '"'
		. ' data-folder-id="' . $folderId . '"'
		. ' data-category="' . htmlspecialcharsbx($category) . '"'
		. ' data-title="' . htmlspecialcharsbx($title) . '"'
		. '></span>';
};

// Folder-row aggregate text cell (DTO-01): comma-separated escaped titles/labels
// (companies, roles). Returns an empty string when the list is empty.
$getFolderAggregateTextTemplate = static function (mixed $values) use ($getText): string {
	$parts = [];
	foreach ((is_array($values) ? $values : []) as $value)
	{
		$part = trim((string)$value);
		if ($part !== '')
		{
			$parts[] = $part;
		}
	}

	if (empty($parts))
	{
		return '';
	}

	return $getText(implode(', ', $parts));
};

$prepareGridData = static function ($documentData) use (
	$isSafeGrid,
	$getTextWithHoverTemplate,
	$getOpenSliderLinkTemplate,
	$getUserInfoTemplate,
	$getDownloadResultFileTemplate,
	$getActionButton,
	$getDataForLabels,
	$getText,
	$isAnnulSingleActionEnabled,
	$isAnnulMassActionsEnabled
)
{
	$data = [];

	// The member id stays the row identity (set as the row `id` below) and is used
	// for per-row logic (download entity). The ID column shows the record's own id —
	// the member id for document rows (the folder id is shown for folder rows).
	$memberId = htmlspecialcharsbx((string)$documentData['ID']);
	$data['ID'] = $memberId;

	if (isset($documentData['DATE_SIGN_INFO']))
	{
		$dateSignInfo = $documentData['DATE_SIGN_INFO'];
		$data['DATE_SIGN'] = $getTextWithHoverTemplate(
			(string)$dateSignInfo['TEXT'],
			(string)$dateSignInfo['DETAIL']
		);
	}

	if (isset($documentData['DATE_CREATE_INFO']))
	{
		$dateCreateInfo = $documentData['DATE_CREATE_INFO'];
		$data['DATE_CREATE'] = $getTextWithHoverTemplate(
			(string)$dateCreateInfo['TEXT'],
			(string)$dateCreateInfo['DETAIL']
		);
	}

	if (isset($documentData['TITLE_INFO']))
	{
		$titleInfo = $documentData['TITLE_INFO'];
		if (isset($titleInfo['DOCUMENT_LINK']))
		{
			if (isset($titleInfo['VIEW_URL']))
			{
				$data['TITLE'] = $getOpenSliderLinkTemplate(
					templateText: (string)$titleInfo['TEXT'],
					link: (string)$titleInfo['DOCUMENT_LINK'],
					viewUrl: (string)$titleInfo['VIEW_URL'],
					entityId: $data['ID'],
					downloadUrl: (string)$titleInfo['DOWNLOAD_URL'],
				);
			}
			else
			{
				$data['TITLE'] = $getOpenSliderLinkTemplate(
					(string)$titleInfo['TEXT'],
					(string)$titleInfo['DOCUMENT_LINK'],
				);
			}

		}
		else
		{
			if (isset($titleInfo['VIEW_URL']))
			{
				$data['TITLE'] = $getOpenSliderLinkTemplate(
					templateText: (string)$titleInfo['TEXT'],
					viewUrl: (string)$titleInfo['VIEW_URL'],
					entityId: $data['ID'],
					downloadUrl: (string)$titleInfo['DOWNLOAD_URL'],
				);
			}
			else
			{
				$data['TITLE'] = $getOpenSliderLinkTemplate(
					(string)$titleInfo['TEXT'],
				);
			}
		}
	}

	if (isset($documentData['INITIATOR']))
	{
		$signWithInfo = $documentData['INITIATOR'];
		// In the company Safe the company gets its own column, so it is not stacked
		// on top of the representative cell (DTO-01, FP4.T3).
		$data['INITIATOR'] = $getUserInfoTemplate(
			$signWithInfo['FULL_NAME'],
			$signWithInfo['LINK'],
			$signWithInfo['ICON'],
			$isSafeGrid ? null : ($signWithInfo['COMPANY_NAME'] ?? null),
		);
	}

	// Company column (DTO-01, FP4.T3): a document row carries `company` = {id,title}
	// or null, kept separate from the representative/sender. Empty when absent.
	$documentCompany = $documentData['company'] ?? null;
	if (is_array($documentCompany) && isset($documentCompany['title']))
	{
		$data['COMPANY'] = $getText((string)$documentCompany['title']);
	}

	if (isset($documentData['MEMBER_INFO']))
	{
		$memberInfo = $documentData['MEMBER_INFO'];
		$data['MEMBER'] = $getUserInfoTemplate(
			$memberInfo['FULL_NAME'],
			$memberInfo['LINK'],
			$memberInfo['ICON']
		);
	}

	if (isset($documentData['CREATED_BY']))
	{
		$creatorUserInfo = $documentData['CREATED_BY'];
		$data['CREATED_BY'] = $getUserInfoTemplate(
			$creatorUserInfo['FULL_NAME'],
			$creatorUserInfo['LINK'],
			$creatorUserInfo['ICON']
		);
	}

	if (isset($documentData['RESULT_FILE_INFO']))
	{
		$downloadResultFileInfo = $documentData['RESULT_FILE_INFO'];
		$data['DOWNLOAD_DOCUMENT'] = !$downloadResultFileInfo['DOWNLOAD_URL']
			? ''
			: $getDownloadResultFileTemplate(
				extensionName: $downloadResultFileInfo['EXTENSION'],
				downloadUrl: $downloadResultFileInfo['DOWNLOAD_URL'],
				entityId: $memberId,
				downloadUrlForPrinted: $downloadResultFileInfo['DOWNLOAD_URL_PRINTED'],
				viewUrl: $downloadResultFileInfo['VIEW_URL'],
				title: $downloadResultFileInfo['TITLE'],
				annulUid: (string)($documentData['MEMBER_UID'] ?? ''),
				canAnnul: !empty($documentData['CAN_ANNUL']),
				isAnnulled: !empty($documentData['IS_ANNULLED']),
				annulEnabled: $isAnnulSingleActionEnabled,
			);
	}

	if (isset($documentData['ACTION']))
	{
		$type = $documentData['ACTION']['TYPE'];
		$actionData = $documentData['ACTION']['DATA'];
		if ($type === 'link')
		{
			$data['ACTION'] = $getActionButton($actionData['role'], $actionData['memberId']);
		}
		elseif ($type === 'file')
		{
			// In the process grid the signed result file lives in the "Action" column;
			// carry the annul metadata so a completed signer row can offer the annul
			// dropdown next to the download. The member uid is the only identifier the
			// annul endpoint accepts.
			$data['ACTION'] = $actionData === null
				? ''
				: $getDownloadResultFileTemplate(
					extensionName: $actionData['EXTENSION'],
					downloadUrl: $actionData['DOWNLOAD_URL'],
					name: Loc::getMessage('SIGN_DOCUMENT_GRID_COLUMN_ACTION_DOWNLOAD'),
					entityId: $data['ID'],
					downloadUrlForPrinted: $actionData['DOWNLOAD_URL_PRINTED'],
					viewUrl: $actionData['VIEW_URL'],
					title: $actionData['TITLE'],
					annulUid: (string)($documentData['MEMBER_UID'] ?? ''),
					canAnnul: !empty($documentData['CAN_ANNUL']),
					isAnnulled: !empty($documentData['IS_ANNULLED']),
					annulEnabled: $isAnnulSingleActionEnabled,
				);
		}
	}

	if (isset($documentData['MEMBER_STATUS']))
	{
		$memberStatus = $documentData['MEMBER_STATUS'];
		$data['MEMBER_STATUS'] = $getDataForLabels(
			(string)$memberStatus['TEXT'],
			(string)$memberStatus['COLOR'],
			(string)$memberStatus['IDENTIFIER'],
		);
	}

	if (isset($documentData['ROLE']))
	{
		$data['ROLE'] = $getText($documentData['ROLE']);
	}

	// Carry per-row annulment metadata (member uid, rights and state) so the
	// mass-action controller can resolve the selected records from the checkboxes.
	// The hidden span is embedded only into raw-HTML cells (title link, status label
	// or the member cell): prepending it to every column broke text/attribute cells
	// and leaked the uid as visible text. Each row carries its own member uid, so one
	// span per row is enough; the anchor columns present differ per grid (safe:
	// TITLE/MEMBER_STATUS, process: MEMBER/MEMBER_STATUS).
	if ($isAnnulSingleActionEnabled)
	{
		$metaSpan = sprintf(
			'<span class="sign-document-list__annul-meta" style="display:none" data-uid="%s" data-can-annul="%s" data-is-annulled="%s"></span>',
			htmlspecialcharsbx((string)($documentData['MEMBER_UID'] ?? '')),
			!empty($documentData['CAN_ANNUL']) ? '1' : '0',
			!empty($documentData['IS_ANNULLED']) ? '1' : '0',
		);

		foreach (['TITLE', 'MEMBER_STATUS', 'MEMBER'] as $htmlColumnId)
		{
			if (isset($data[$htmlColumnId]))
			{
				$data[$htmlColumnId] = $metaSpan . (string)$data[$htmlColumnId];
			}
		}
	}

	return $data;
};

$gridRows = [];
foreach ($arResult["DOCUMENTS"] as $documentData)
{
	// DTO-01: the Safe grid mixes folder rows and document rows. A folder row renders
	// a clickable title plus aggregate cells (role avatar stacks, companies, roles);
	// unrelated columns stay empty. Its row identity uses a non-numeric `folder-`
	// prefix (top-level `id`), so it never collides with a document row id: the mass
	// "move to folder" action keeps only integer ids (#getSelectedIds()), while the
	// export reads the `folder-{N}` ids separately (#getSelectedFolderIds()) and
	// exports the folder content. The row checkbox is enabled so a folder can be
	// selected for export; the "move" button is hidden as soon as a folder is in the
	// selection (folders are not bulk-movable).
	// The ID column shows the folder's own id, independent of the row identity above.
	if (($documentData['rowType'] ?? null) === 'folder')
	{
		$folderId = (int)$documentData['id'];

		// Folder-row aggregate cells (DTO-01, FP4.T2/T3/T4). Role people are shown as
		// clickable avatar stacks in their own columns (participant → Участник,
		// representative → Представитель, sender → Отправитель); companies and roles
		// as comma-separated lists. Popup titles reuse the actual grid column labels.
		$folderColumns = $arResult['COLUMNS'] ?? [];
		$getFolderColumnName = static fn(string $key): string => (string)($folderColumns[$key]['name'] ?? '');

		$folderCompanyTitles = [];
		foreach ((is_array($documentData['companies'] ?? null) ? $documentData['companies'] : []) as $company)
		{
			if (is_array($company) && isset($company['title']))
			{
				$folderCompanyTitles[] = (string)$company['title'];
			}
		}

		$folderRow = [
			'id' => 'folder-' . $folderId,
			'data' => [
				'ID' => htmlspecialcharsbx((string)$folderId),
				'TITLE' => $getFolderRowTitleTemplate($folderId, (string)($documentData['title'] ?? '')),
				'MEMBER' => $getFolderPeopleStackTemplate(
					$documentData['participants'] ?? [],
					(int)($documentData['participantCount'] ?? 0),
					$folderId,
					'participants',
					$getFolderColumnName('member'),
				),
				'INITIATOR' => $getFolderPeopleStackTemplate(
					$documentData['representatives'] ?? [],
					(int)($documentData['representativeCount'] ?? 0),
					$folderId,
					'representatives',
					$getFolderColumnName('initiator'),
				),
				'CREATED_BY' => $getFolderPeopleStackTemplate(
					$documentData['senders'] ?? [],
					(int)($documentData['senderCount'] ?? 0),
					$folderId,
					'senders',
					$getFolderColumnName('createdBy'),
				),
				'COMPANY' => $getFolderAggregateTextTemplate($folderCompanyTitles),
				'ROLE' => $getFolderAggregateTextTemplate($documentData['roles'] ?? []),
			],
		];

		// Per-row actions for a folder row (SC-006 rename/delete). Folder rows exist
		// only in the safe grid; the inline handlers resolve the `safeGrid` global
		// declared in this template. The folder title is user data escaped for the
		// JS string context; folderId is an int and safe to inline.
		if ($isSafeFolderGroupingAllowed)
		{
			$folderActions = [];
			if (!empty($documentData['canRename']))
			{
				$folderActions[] = [
					'text' => (string)Loc::getMessage('SIGN_DOCUMENT_LIST_SAFE_ROW_ACTION_RENAME_FOLDER'),
					'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_rename.svg',
					'dataset' => ['testid' => 'sign-safe-folder-row-action-rename'],
					'onclick' => 'safeGrid.renameFolder('
						. $folderId
						. ", '" . CUtil::JSEscape((string)($documentData['title'] ?? '')) . "')",
				];
			}
			if (!empty($documentData['canDelete']))
			{
				$folderActions[] = [
					'text' => (string)Loc::getMessage('SIGN_DOCUMENT_LIST_SAFE_ROW_ACTION_DELETE_FOLDER'),
					'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_remove.svg',
					'dataset' => ['testid' => 'sign-safe-folder-row-action-delete'],
					'onclick' => 'safeGrid.delete('
						. $folderId
						. ", '" . CUtil::JSEscape((string)($documentData['title'] ?? '')) . "')",
				];
			}
			// "Export to Excel" per-row action. Seeds the single-selection group panel:
			// when exactly one folder is checked, the action panel is built from the
			// row's own actions (buildPanelByItem), so the folder gets an export entry
			// without a "move" one (folders are not bulk-movable). The explicit folder id
			// also makes the ordinary row menu export this row regardless of other selection.
			$folderActions[] = [
				'text' => (string)Loc::getMessage('SIGN_DOCUMENT_LIST_TOOLBAR_EXPORT_TO_EXCEL'),
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_download.svg',
				'dataset' => ['testid' => 'sign-safe-folder-row-action-export'],
				'onclick' => 'safeGrid.exportToExcel(null, ' . $folderId . ')',
			];
			$folderRow['actions'] = $folderActions;
		}

		$gridRows[] = $folderRow;

		continue;
	}

	// Document row identity stays the member id (mass "move to folder" sends these
	// ids to API-05); the same member id is shown in the ID column via $prepareGridData.
	$documentRow = [
		'id' => (int)$documentData['ID'],
		'data' => $prepareGridData($documentData),
	];

	// Per-row "move to folder" action for a single document (safe grid only). The
	// member id is the same row id the mass move sends to the backend.
	if ($isSafeFolderGroupingAllowed)
	{
		$documentRow['actions'] = [
			[
				'text' => (string)Loc::getMessage('SIGN_DOCUMENT_LIST_SAFE_ROW_ACTION_MOVE_DOCUMENT'),
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_move.svg',
				'dataset' => ['testid' => 'sign-safe-document-row-action-move'],
				'onclick' => 'safeGrid.moveToFolder(' . (int)$documentData['ID'] . ')',
			],
			// "Export to Excel" per-row action. Its real purpose is to seed the
			// single-selection group panel: when exactly one row is checked, the
			// action panel is built from the row's own actions (buildPanelByItem),
			// not from ACTION_PANEL. The explicit member id also makes the ordinary row
			// menu export this row regardless of other selection.
			[
				'text' => (string)Loc::getMessage('SIGN_DOCUMENT_LIST_TOOLBAR_EXPORT_TO_EXCEL'),
				'icon' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_download.svg',
				'dataset' => ['testid' => 'sign-safe-document-row-action-export'],
				'onclick' => 'safeGrid.exportToExcel(' . (int)$documentData['ID'] . ')',
			],
		];
	}

	// Row actions for the shared action panel: with exactly one row selected the
	// engine builds the panel from the row's own actions (group actions are used
	// from two rows on). A row the annulment cannot apply to keeps an empty action
	// list here and stays selectable; the grid renders no actions button for it, so
	// the panel is kept from failing on the resulting null actions by
	// `sign.v2.grid.b2e.annul` on the client.
	if ($isAnnulMassActionsEnabled)
	{
		$documentRow['actions'] ??= [];
		$annulUid = (string)($documentData['MEMBER_UID'] ?? '');
		if (!empty($documentData['CAN_ANNUL']) && $annulUid !== '')
		{
			$isRowAnnulled = !empty($documentData['IS_ANNULLED']);
			$documentRow['actions'][] = [
				'text' => $isRowAnnulled
					? (string)Loc::getMessage('SIGN_DOCUMENT_LIST_MASS_ACTION_UNANNUL')
					: (string)Loc::getMessage('SIGN_DOCUMENT_LIST_MASS_ACTION_ANNUL')
				,
				'onclick' => sprintf(
					"signAnnulGrid.annulOne('%s', %s)",
					CUtil::JSEscape($annulUid),
					$isRowAnnulled ? 'false' : 'true',
				),
			];
		}
	}

	$gridRows[] = $documentRow;
}

$stub = null;
if (!$arResult['USE_DEFAULT_STUB'] && count($gridRows) === 0)
{
	$stub = $arResult['STUB'] ?? null;
}

// Group annul actions for the company safe and per-document process grids.
// Rendered only under the feature flag; per-row rights and the member role/status
// are re-checked by the batch endpoint.
$annulActionPanel = [];
if ($isAnnulMassActionsEnabled)
{
	$annulActionPanel = [
		'GROUPS' => [
			[
				'ITEMS' => [
					[
						'TYPE' => \Bitrix\Main\Grid\Panel\Types::BUTTON,
						'ID' => 'sign-document-list-annul-button',
						'TEXT' => Loc::getMessage('SIGN_DOCUMENT_LIST_MASS_ACTION_ANNUL'),
						'ONCHANGE' => [
							[
								'ACTION' => \Bitrix\Main\Grid\Panel\Actions::CALLBACK,
								'DATA' => [['JS' => 'signAnnulGrid.annulSelected();']],
							],
						],
					],
					[
						'TYPE' => \Bitrix\Main\Grid\Panel\Types::BUTTON,
						'ID' => 'sign-document-list-unannul-button',
						'TEXT' => Loc::getMessage('SIGN_DOCUMENT_LIST_MASS_ACTION_UNANNUL'),
						'ONCHANGE' => [
							[
								'ACTION' => \Bitrix\Main\Grid\Panel\Actions::CALLBACK,
								'DATA' => [['JS' => 'signAnnulGrid.unannulSelected();']],
							],
						],
					],
				],
			],
		],
	];
}


if (!empty($arResult['IS_SHOW_RESULT_STATUS_BUTTON']))
{
	$APPLICATION->IncludeComponent(
		'bitrix:sign.document.counter.panel',
		'',
		[
			'TYPE' => $arResult['GRID_TYPE'],
			'ITEMS' => $arResult['COUNTER_ITEMS'],
			'TITLE' => Loc::getMessage('SIGN_DOCUMENT_COUNTER_ITEMS_TITLE_MSG_1'),
			'FILTER_ID' => $arResult['FILTER_ID']
		]
	);
}

// The download banner is a root-only affordance in the Safe: it must not appear
// inside a folder's content. It stays untouched for every other grid mode/root.
if ($arResult['IS_SHOW_B2E_GRID_BANNER'] && !$isInsideSafeFolder):
$this->SetViewTarget('below_pagetitle', 0);
?>

<div class="sign-document-list__banner">
	<div class="sign-document-list__banner-icon"></div>
	<div class="sign-document-list__banner-content">
		<div class="sign-document-list__banner-title">
			<?= htmlspecialcharsbx(Loc::getMessage('SIGN_DOCUMENT_GRID_BANNER_TITLE'))?>
		</div>
		<div class="sign-document-list__banner-desc">
			<?php
			$placeholders = [
				'[helpdesklink]' => '<a href="javascript:top.BX.Helper.show(\'redirect=detail&code=20617048\');">',
				'[/helpdesklink]' => '</a>'
			];
			$replacedText = str_replace(
				array_keys($placeholders),
				array_values($placeholders),
				$arResult['BANNER_TEXT']
			);
			?>

			<?= nl2br($replacedText)?>
		</div>
	</div>
	<div class="ui-icon-set --cross-20 sign-document-list__banner-btn_close"></div>
</div>

<?php
$this->EndViewTarget();
endif;

if ($arResult['IS_SHOW_TOOLBAR_FILTER'])
{
	if ($arResult['TOOLBAR_MENU'] !== null) {
		Toolbar::addButton($arResult['TOOLBAR_MENU']);
	}

	Toolbar::addFilter([
		'GRID_ID' => $arResult['GRID_ID'],
		'FILTER_ID' => $arResult['FILTER_ID'],
		'FILTER' => $arResult['FILTER'],
		'FILTER_PRESETS' => $arResult['FILTER_PRESETS'],
		'DISABLE_SEARCH' => true,
		'ENABLE_LIVE_SEARCH' => true,
		'ENABLE_LABEL' => true,
		'THEME' => Bitrix\Main\UI\Filter\Theme::MUTED,
	]);
}

?>

<script>
	BX.namespace('BX.Sign.DocumentList');

	BX.Sign.DocumentList.viewDocument = async function(viewUrl, title, downloadUrl)
	{
		const node = BX.create('span', {
			attrs: {
				'data-viewer': '',
				'data-viewer-type': 'document',
				'data-src': viewUrl,
				'data-title': title,
				'data-actions': JSON.stringify([
					{
						type: 'download',
						href: downloadUrl,
					}
				])
			},
		});

		await top.BX.Runtime.loadExtension('ui.viewer');
		top.BX.UI.Viewer.Instance.openByNode(node);
	};
</script>

<div class="sign-document-list-wrapper">
	<?php
		$gridComponentParams = [
			'GRID_ID' => $arResult['GRID_ID'],
			'COLUMNS' => $arResult['COLUMNS'],
			'ROWS' => $gridRows,
			'NAV_OBJECT' => $arResult['NAVIGATION_OBJECT'],
			'SHOW_ROW_CHECKBOXES' => $isSafeFolderGroupingAllowed || $isAnnulMassActionsEnabled,
			'SHOW_TOTAL_COUNTER' => $arResult['SHOW_TOTAL_COUNTER'] ?? true,
			'TOTAL_ROWS_COUNT' => $arResult['TOTAL_COUNT'],
			'ALLOW_COLUMNS_SORT' => true,
			'ALLOW_SORT' => true,
			'ALLOW_COLUMNS_RESIZE' => true,
			'AJAX_MODE' => 'Y',
			'AJAX_OPTION_HISTORY' => 'N',
			// Without this the core appends `top.BX.scrollToNode('comp_...')` to every
			// reload response. In a side panel that node is not in `top`, so the call
			// throws, and the core runs a response's inline scripts as one program:
			// everything after it, including the row dropdown menus, never runs.
			'AJAX_OPTION_JUMP' => 'N',
			'STUB' => $stub,
		];

		if ($isSafeFolderGroupingAllowed)
		{
			$gridComponentParams['SHOW_ACTION_PANEL'] = false;
			// Render the per-row actions menu ("three dots") for folder/document rows.
			$gridComponentParams['SHOW_ROW_ACTIONS_MENU'] = true;
			// Render the group-action panel into the toolbar strip (as the templates
			// grid does), not into the grid's own container — otherwise it spans the
			// whole grid.
			$gridComponentParams['TOP_ACTION_PANEL_RENDER_TO'] = $actionPanelRenderTo;
			$gridComponentParams['ACTION_PANEL'] = [
				'GROUPS' => [
					[
						'ITEMS' => [
							[
								'TYPE' => \Bitrix\Main\Grid\Panel\Types::BUTTON,
								'ID' => $safeMoveToFolderButtonId,
								'TEXT' => Loc::getMessage('SIGN_DOCUMENT_LIST_SAFE_ACTION_MOVE_TO_FOLDER'),
								'ICON' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_move.svg',
								'ONCHANGE' => [
									[
										'ACTION' => \Bitrix\Main\Grid\Panel\Actions::CALLBACK,
										'DATA' => [
											[
												'JS' => 'safeGrid.moveToFolder();',
											],
										],
									],
								],
							],
							// "Export to Excel" in the group panel (2+ rows selected →
							// buildPanelByGroup reads ACTION_PANEL items). Mirrors the
							// move button; exportToExcel() posts only the selected ids.
							[
								'TYPE' => \Bitrix\Main\Grid\Panel\Types::BUTTON,
								'ID' => 'sign-safe-export-to-excel-button',
								'TEXT' => Loc::getMessage('SIGN_DOCUMENT_LIST_TOOLBAR_EXPORT_TO_EXCEL'),
								'ICON' => '/bitrix/js/ui/actionpanel/images/ui_icon_actionpanel_download.svg',
								'ONCHANGE' => [
									[
										'ACTION' => \Bitrix\Main\Grid\Panel\Actions::CALLBACK,
										'DATA' => [
											[
												'JS' => 'safeGrid.exportToExcel();',
											],
										],
									],
								],
							],
						],
					],
				],
			];
		}

		// Annul group actions share the single ACTION_PANEL with the folder ones: when
		// folder grouping is on, the annul buttons are appended to its group instead of
		// replacing the panel. On their own they keep the same contract as the folder
		// panel: registered but hidden until rows are selected (SHOW_ACTION_PANEL =
		// false), rendered into the toolbar strip above the grid. Keeping
		// SHOW_ACTION_PANEL enabled both left the panel always visible and broke the
		// CALLBACK initialization (eval error on click).
		if ($isAnnulMassActionsEnabled)
		{
			if (isset($gridComponentParams['ACTION_PANEL']['GROUPS'][0]['ITEMS']))
			{
				$gridComponentParams['ACTION_PANEL']['GROUPS'][0]['ITEMS'] = array_merge(
					$gridComponentParams['ACTION_PANEL']['GROUPS'][0]['ITEMS'],
					$annulActionPanel['GROUPS'][0]['ITEMS'],
				);
			}
			else
			{
				$gridComponentParams['SHOW_ACTION_PANEL'] = false;
				$gridComponentParams['TOP_ACTION_PANEL_RENDER_TO'] = $actionPanelRenderTo;
				$gridComponentParams['ACTION_PANEL'] = $annulActionPanel;
			}
		}

		$APPLICATION->IncludeComponent('bitrix:main.ui.grid', "", $gridComponentParams);
	?>
</div>
<?php if ($isSafeFolderGroupingAllowed): ?>
<script>
	// Company Safe grid controller: folder CRUD + single/bulk document move.
	// Declared at script top level (like the templates grid) so the grid
	// action-panel inline onclick handlers can resolve `safeGrid`.
	const safeGrid = new BX.Sign.V2.Grid.B2e.Safe('<?= CUtil::JSEscape($arResult['GRID_ID']) ?>');
	safeGrid.subscribeOnGridEvents();
	safeGrid.reloadAfterSliderClose();

	BX.ready(function ()
	{
		// Wire the toolbar "create folder" button once the toolbar is in the DOM.
		const createFolderButton = document.querySelector('.<?= CUtil::JSEscape($safeCreateFolderButtonClass) ?>');
		if (createFolderButton)
		{
			BX.Event.bind(createFolderButton, 'click', function ()
			{
				safeGrid.createFolder();
			});
		}
	});

	// Opens the content of a Safe folder in a side panel by folderId (folder
	// navigation, modeled on the templates grid). folderId is a server-rendered
	// integer.
	function signSafeOpenFolderContent(folderId)
	{
		if (window.event)
		{
			window.event.stopPropagation();
		}

		if (!folderId || !BX.SidePanel || !BX.SidePanel.Instance)
		{
			return;
		}

		const queryParams = new URLSearchParams(window.location.search);
		queryParams.set('folderId', String(folderId));

		BX.SidePanel.Instance.open(`?${queryParams.toString()}`, {
			width: 1650,
			cacheable: false,
			allowChangeHistory: true,
		});
	}
</script>
<?php endif; ?>

<?php if (!empty($arResult['SAFE_EXPORT_ERROR_MESSAGE'])): ?>
<script>
	BX.ready(() => {
		window.top.BX.UI.Notification.Center.notify({
			content: '<?= CUtil::JSEscape($arResult['SAFE_EXPORT_ERROR_MESSAGE']) ?>',
		});
	});
</script>
<?php endif; ?>

<?php if ($isAnnulSingleActionEnabled): ?>
<script>
	const signAnnulGrid = new BX.Sign.V2.Grid.B2e.Annul('<?= CUtil::JSEscape($arResult['GRID_ID']) ?>');
	signAnnulGrid.subscribeOnGridEvents();
</script>
<?php endif; ?>

<script>
	// A click anywhere in a row selects it for bulk actions, and the core grid skips
	// that only when the click target is a link or an input (main.ui.grid,
	// `_onClickOnRow`). Every other control here has its own click handler, so
	// clicking one both did its job and ticked the row.
	//
	// Controls are found by behaviour, not by a list of classes: a row holds buttons,
	// icons and split-buttons, and each new one would otherwise reintroduce the bug.
	//
	// The click must keep bubbling: the row's sign button is served by a handler
	// delegated to the grid node below, and a click stopped at the control never
	// reaches it. So the selection is dropped instead of the event - `clickPrevent`
	// is the core's own flag for exactly this, set by its double-click handler and
	// read (and reset) in the click timeout of `_onClickOnRow`.
	BX.ready(function ()
	{
		const gridNode = document.querySelector('#<?= CUtil::JSEscape($arResult['GRID_ID']) ?>');
		if (!gridNode)
		{
			return;
		}

		const isSkippedByCore = function (node)
		{
			// The core lets clicks on links and inputs through on its own, and content
			// nested in a link never becomes the click target (see style.css).
			return node.tagName === 'A'
				|| node.tagName === 'INPUT'
				|| node.tagName === 'LABEL'
				|| node.closest('a') !== null
			;
		};

		const isClickable = function (node)
		{
			return node.tagName === 'BUTTON'
				|| node.getAttribute('role') === 'button'
				|| getComputedStyle(node).cursor === 'pointer'
			;
		};

		const isRowControl = function (target)
		{
			const cell = target.closest('.main-grid-row-body td');
			if (cell === null)
			{
				return false;
			}

			for (let node = target; node !== null && node !== cell; node = node.parentElement)
			{
				if (isSkippedByCore(node))
				{
					return false;
				}

				if (isClickable(node))
				{
					return true;
				}
			}

			return false;
		};

		BX.Event.bind(gridNode, 'click', function (event)
		{
			if (!isRowControl(event.target))
			{
				return;
			}

			const grid = BX.Main.gridManager.getInstanceById('<?= CUtil::JSEscape($arResult['GRID_ID']) ?>');
			if (!grid)
			{
				return;
			}

			// The core resets the flag itself when it reads it 50ms later; the timeout
			// only covers the clicks it never gets to read (a text selection in the row).
			grid.clickPrevent = true;
			setTimeout(function ()
			{
				grid.clickPrevent = false;
			}, 100);
		});
	});
</script>

<script>
	BX.ready(function ()
	{
		const gridId = "<?= CUtil::JSEscape($arResult['GRID_ID']) ?>";

		function getGridContainer()
		{
			const grid = BX.Main.gridManager.getInstanceById(gridId);

			if (grid)
			{
				return grid.getContainer();
			}

			return document.getElementById(gridId);
		}

		function initHintsInGrid()
		{
			const container = getGridContainer();

			if (!container || !BX.UI || !BX.UI.Hint)
			{
				return;
			}

			BX.UI.Hint.init(container);
		}

		initHintsInGrid();

		BX.addCustomEvent('Grid::updated', function (grid)
		{
			if (!grid || typeof grid.getId !== "function" || grid.getId() !== gridId)
			{
				return;
			}

			initHintsInGrid();
		})
	});

</script>

<script>
	BX.ready(function ()
	{
		const bannerNode = document.querySelector('.sign-document-list__banner');
		if (bannerNode)
		{
			const closeIconNode = bannerNode.querySelector('.sign-document-list__banner-btn_close');
			closeIconNode.addEventListener('click', () =>
			{
				BX.Dom.remove(bannerNode);
				BX.ajax.runComponentAction(
					'bitrix:sign.document.list',
					'setBannerOptionClose',
					{
						mode: 'class',
						data: {
							type: '<?= CUtil::JSEscape($arResult['GRID_TYPE']) ?>',
						},
					}
				)
			})
		}

		if (typeof BX.PULL !== 'undefined')
		{
			BX.PULL.subscribe({
				type: BX.PullClient.SubscriptionType.Server,
				moduleId: 'sign',
				command: 'memberStatusChanged',
				callback: async (params) =>
				{
					if (params.isMemberReadyStatus)
					{
						const grid = BX.Main.gridManager.getInstanceById('<?= CUtil::JSescape($arResult['GRID_ID']) ?>');
						if (grid)
						{
							grid.reloadTable();

							return;
						}
					}

					if (params.memberId)
					{
						const label = document.querySelector(`.${params.labelId}`);
						if (!label)
						{
							return;
						}

						const response = await BX.ajax.runAction('sign.api_v1.document.member.loadStage', {json: {memberId: params.memberId}});
						const data = response.data;

						label.classList.remove('ui-label-danger');
						label.classList.remove('ui-label-success');
						label.classList.remove('ui-label-light');
						label.classList.remove('ui-label-secondary');
						label.classList.remove('ui-label-default');
						label.classList.remove('ui-label-warning');

						label.classList.add(BX.Text.encode(data.color));
						const textNode = label.querySelector('.sign-grid-member-status-text');
						textNode.innerText = data.text;

						const buttonNode = document.querySelector(`[data-member-id="${params.memberId}"]`);
						if (buttonNode && BX.Dom.hasClass(buttonNode, 'ui-btn'))
						{
							buttonNode.style.display = 'none';
						}
					}
				}
			});

			BX.PULL.subscribe({
				moduleId: 'sign',
				command: 'changeB2eCurrentCounters',
				callback: function (params) {
					const grid = BX.Main.gridManager.getInstanceById('DOCUMENT_GRID_ID_CURRENT');
					if (grid)
					{
						grid.reloadTable();
					}
				}
			});
		}
	});
<?php if (isset($arResult['COLUMNS']['action'])): ?>
	BX.ready(function ()
	{
		const gridContainer = document.querySelector('#<?= CUtil::JSescape($arResult['GRID_ID']) ?>');
		if (!gridContainer)
		{
			return;
		}

		gridContainer.addEventListener('click', async (event) => {
			let target = event.target;
			if (BX.Dom.hasClass(target, 'ui-btn-text'))
			{
				target = target.parentNode;
			}

			if (
				!target.classList.contains('ui-btn')
				|| !target.dataset.memberId
			)
			{
				return;
			}

			BX.Dom.addClass(target, 'ui-btn-wait');

			const memberId = Number(target.dataset.memberId);
			BX.Runtime.loadExtension('sign.v2.b2e.sign-link')
				.then((exports) => {
					return new exports.SignLink({memberId}).openSlider({
						target,
						events: {
							onClose: function ()
							{
								BX.ajax.runAction('sign.api_v1.B2e.Document.Member.callStatus', {json: {memberId}})
									.then(() => {
										const grid = BX.Main.gridManager.getInstanceById('<?= CUtil::JSescape($arResult['GRID_ID']) ?>');
										if (grid)
										{
											grid.reloadTable();
										}
								});
							}
						},
					});
				})
				.finally(() => {
					BX.Dom.removeClass(target, 'ui-btn-wait');
				})
			;

			event.preventDefault();
		});

	});
<?php endif; ?>
</script>
