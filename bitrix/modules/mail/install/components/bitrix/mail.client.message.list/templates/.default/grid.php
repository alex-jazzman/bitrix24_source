<?php

use Bitrix\Mail\Internal\Integration\Draft\ScheduledMessageDraftGateway;
use Bitrix\Mail\Service\ScheduledMessage\ScheduledMessageService;
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

/** @var \CMain $APPLICATION */
/** @var array $arResult */

/**
 * Shared grid renderer for every list of this template: messages, drafts and scheduled messages.
 * Keeping a single renderer is what makes the group action panel identical on all of them.
 */
$renderGrid = static function (
	array $gridData,
	array $headers,
	array $actionButtons,
	bool $draftMode,
	bool $withSelectAll = false,
) use ($APPLICATION): void
{
	// The panel of mass actions below belongs to the old path alone: the new grid builds the same panel of
	// the platform itself and leads it by calls.
	$vueGrid = $gridData['MESSAGE_GRID'] ?? null;
	if ($vueGrid !== null)
	{
		?>
		<div id="<?= htmlspecialcharsbx($vueGrid['containerId']) ?>"></div>
		<script>
			BX.ready(function()
			{
				(new BX.Mail.Client.MessageGrid.MessageGrid(
					<?= Main\Web\Json::encode($vueGrid) ?>
				)).start();
			});
		</script>
		<?php

		return;
	}
	?>
	<script>
		BX(function()
		{
			var container = document.querySelector(
				'.mail-msg-list-actionpanel-container-<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>'
			);
			if (container && !container.querySelector('.mail-msg-list-action-panel'))
			{
				var actionPanel = new BX.UI.ActionPanel({
					params: {
						gridId: '<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>',
					},
					pinnedMode: true,
					showResetAllBlock: <?= $withSelectAll ? 'true' : 'false' ?>,
					renderTo: container,
					className: 'mail-msg-list-action-panel',
					groupActions: <?= Main\Web\Json::encode([
						'GROUPS' => [
							['ITEMS' => $actionButtons],
						],
					]) ?>,
					maxHeight: 56,
				});
				var handleGridSelectItem = actionPanel.handleGridSelectItem.bind(actionPanel);
				// Every action of the panel acts on rows of its own: a row carries a mark per action, because
				// the author of a letter that stopped at an error may still call its send off while the send on
				// demand passes it by. The mark of the action is read here, so one reading serves them all.
				var scheduledActionMarks = {
					'scheduled-send-now': 'scheduledCanSendNow',
					'scheduled-cancel': 'scheduledCanCancel',
				};
				var getScheduledRows = function(eventGrid, selectedOnly, mark)
				{
					var rows = selectedOnly
						? eventGrid.getRows().getSelected()
						: eventGrid.getRows().getBodyChild();

					return Array.from(rows).filter(function(row)
					{
						var dataset = row.getNode?.()?.dataset;

						return dataset?.scheduledId !== undefined
							&& (mark === undefined || dataset[mark] === 'true');
					});
				};
				actionPanel.handleGridSelectItem = function(eventGrid)
				{
					if (!eventGrid || eventGrid.getId() !== '<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>')
					{
						return;
					}

					this.grid = eventGrid;
					handleGridSelectItem();
					if (this.selectAllCheckbox)
					{
						// the count is the one the reader sees ticked: an action that cannot take every ticked
						// letter says so itself instead of the panel quietly counting its own rows
						var selectedCount = getScheduledRows(eventGrid, true).length;
						var selectableCount = getScheduledRows(eventGrid, false).length;
						this.setTotalSelectedItems(selectedCount);
						this.selectAllCheckbox.checked = selectableCount > 0 && selectedCount === selectableCount;
						this.selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < selectableCount;
						// the panel builds its items anew on every change of the selection, so an action with no
						// row of its own is taken off the panel here: a click on it could only be refused
						Object.keys(scheduledActionMarks).forEach(function(id)
						{
							var item = actionPanel.getItemById(id);
							if (item && getScheduledRows(eventGrid, true, scheduledActionMarks[id]).length === 0)
							{
								item.hide();
							}
						});
					}
				};
				var uncheckSelectAll = function()
				{
					if (actionPanel.selectAllCheckbox)
					{
						actionPanel.selectAllCheckbox.checked = false;
						actionPanel.selectAllCheckbox.indeterminate = false;
					}
				};
				var hidePanel = actionPanel.hidePanel.bind(actionPanel);
				actionPanel.hidePanel = function(eventGrid)
				{
					var grid = BX.Main.gridManager.getInstanceById(
						'<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>'
					);
					if (eventGrid && eventGrid !== grid)
					{
						return;
					}
					if (!eventGrid && grid?.getRows().getSelectedIds().length > 0)
					{
						return;
					}

					uncheckSelectAll();
					hidePanel();
				};
				actionPanel.getPanelContainer().classList.add('mail-msg-list-action-panel');
				actionPanel.draw();
				<?php if ($withSelectAll): ?>
				actionPanel.getPanelContainer().dataset.testid = 'mail-scheduled-list-action-panel';
				// The items of the panel are marked by the panel itself, as 'ui-action-panel-item-<id>' built
				// out of the ID each group action arrives with (ui.actionpanel, Item.getTestId): the tests of
				// the section read them in that form, and a mark of our own here would only shadow it.

				// The grid header check-all is hidden by the mail template, so the panel carries one.
				// Markup repeats the message list check-all (user-interface-manager.js) so both look alike.
				var selectAllNode = document.createElement('input');
				selectAllNode.type = 'checkbox';
				selectAllNode.title = BX.message('INTERFACE_MAIL_CHECK_ALL') || '';
				// The checkbox carries no visible label, and a title alone is no name for a screen reader.
				selectAllNode.setAttribute('aria-label', selectAllNode.title);
				selectAllNode.setAttribute('data-mail-grid-check-all', '<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>');
				selectAllNode.setAttribute('data-testid', 'mail-scheduled-list-select-all');
				selectAllNode.style.verticalAlign = 'middle';
				selectAllNode.addEventListener('change', function()
				{
					var grid = BX.Main.gridManager.getInstanceById(
						'<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>'
					);
					if (!grid)
					{
						return;
					}

					// Only the own toggle of the grid announces a mass selection, and the panel counts on that
					// announcement to count the rows and enable its actions. The direction is set beforehand, so
					// the toggle repeats the state of this checkbox instead of flipping the one the grid holds.
					grid.lastRowAction = selectAllNode.checked ? 'select' : 'unselect';
					grid.toggleSelectionAll();
					grid.determinateCheckAllCheckboxes();
				});

				var selectAllBox = document.createElement('span');
				selectAllBox.style.display = 'inline-block';
				selectAllBox.style.height = '100%';
				selectAllBox.style.paddingLeft = '10px';
				var selectAllSpacer = document.createElement('span');
				selectAllSpacer.style.display = 'inline-block';
				selectAllSpacer.style.height = '100%';
				selectAllSpacer.style.verticalAlign = 'middle';
				selectAllBox.appendChild(selectAllNode);
				selectAllBox.appendChild(selectAllSpacer);

				actionPanel.selectAllCheckbox = selectAllNode;
				actionPanel.getPanelContainer().prepend(selectAllBox);

				var resetSelection = function()
				{
					var grid = BX.Main.gridManager.getInstanceById(
						'<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>'
					);
					if (grid)
					{
						grid.lastRowAction = 'unselect';
						grid.toggleSelectionAll();
						grid.determinateCheckAllCheckboxes();
					}

					uncheckSelectAll();
					// The panel counts the selection off its own layout, while the hide of the platform resets the
					// first counter of the document: on the message list that is the counter of another grid.
					actionPanel.setTotalSelectedItems(0);
					hidePanel();
				};

				// The cross beside the selection count is drawn by the mail styles as a pseudo element of the
				// whole block, so the block carries the reset, as the message list binds it too
				// (user-interface-manager.js).
				var totalSelectedNode = actionPanel.getPanelContainer().querySelector(
					'[data-role="action-panel-total"]'
				);
				if (totalSelectedNode)
				{
					totalSelectedNode.addEventListener('click', resetSelection);
				}

				// The panel announces the reset before it clears the grid, so the hide it runs itself still
				// sees the selected rows and stops at the guard above. The reset is carried out here instead.
				BX.addCustomEvent(actionPanel, 'BX.UI.ActionPanel:clickResetAllBlock', resetSelection);

				// The grid selects a row from a click on any cell of it, and the burger is a small icon inside a
				// wide cell: aiming at the menu and missing it toggled the selection. The cell of the burger is
				// kept out of the selection, the button itself is left to open its menu. The box of the grid
				// carries the listener: the click is still caught on the way down, above the row it belongs to,
				// and the subscription goes away with the grid this script has no place to take it off in.
				var gridBox = document.getElementById('<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>');
				gridBox?.addEventListener('click', function(event)
				{
					var actionCell = event.target.closest?.('.main-grid-cell-action');
					if (
						actionCell
						&& actionCell.closest('.main-grid-row[data-scheduled-id]')
						&& !event.target.closest('.main-grid-row-action-button')
					)
					{
						event.stopPropagation();
					}
				}, true);
				<?php endif; ?>
				<?php if ($draftMode): ?>
				container.appendChild(actionPanel.getPanelContainer());
				<?php endif; ?>
				BX.namespace('BX.Mail.Home');
				BX.Mail.Home.GridActionPanels = BX.Mail.Home.GridActionPanels || {};
				BX.Mail.Home.GridActionPanels['<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>'] = actionPanel;
			}
		});
	</script>
	<?php
	$emptyStub = null;
	if ($draftMode && (int)($gridData['TOTAL'] ?? 0) === 0)
	{
		$emptyStub = $gridData['EMPTY_STUB'] ?? sprintf(
			'<div class="mail-draft-list-empty" data-testid="mail-draft-list-empty">%s</div>',
			htmlspecialcharsbx(Loc::getMessage('MAIL_DRAFT_LIST_EMPTY')),
		);
	}

	$APPLICATION->includeComponent(
		'bitrix:main.ui.grid',
		'',
		[
			'GRID_ID' => $gridData['GRID_ID'],
			'MESSAGES' => $gridData['MESSAGES'] ?? [],
			'AJAX_MODE' => 'Y',
			'AJAX_OPTION_ADDITIONAL' => $gridData['GRID_ID'],
			'AJAX_OPTION_HISTORY' => 'N',
			'AJAX_OPTION_JUMP' => 'N',
			'AJAX_OPTION_STYLE' => 'N',
			'SHOW_ACTION_PANEL' => false,
			'HEADERS' => $headers,

			'ROWS' => $gridData['ROWS'],

			'SHOW_GRID_SETTINGS_MENU' => false,
			'ALLOW_COLUMNS_SORT' => false,
			'ALLOW_ROWS_SORT' => false,
			'SHOW_NAVIGATION_PANEL' => false,

			'SHOW_MORE_BUTTON' => true,
			'ENABLE_NEXT_PAGE' => !empty($gridData['ENABLE_NEXT_PAGE']),
			'NAV_PARAM_NAME' => $gridData['NAV_OBJECT']->getId(),
			'CURRENT_PAGE' => $gridData['NAV_OBJECT']->getCurrentPage(),
			'STUB' => $emptyStub,
			'ACTION_PANEL' => [
				'GROUPS' => [
					['ITEMS' => $actionButtons],
				],
			],
			'ACTION_PANEL_OPTIONS' => [
				'MAX_HEIGHT' => 56,
			],

			'SHOW_ROW_CHECKBOXES' => true,
			'SHOW_CHECK_ALL_CHECKBOXES' => true,
		],
	);
};

$scheduledActionPanelActionButtons = [
	// each button acts on the rows of its own mark ('scheduledActionMarks' above): the author of a letter that
	// stopped at an error still calls its send off, and the send on demand leaves that letter to its repeat
	[
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => 'scheduled-send-now',
		'ICON' => $arResult['gridActionsData']['scheduledSendNow']['icon'],
		'TITLE' => $arResult['gridActionsData']['scheduledSendNow']['title'],
		'TEXT' => $arResult['gridActionsData']['scheduledSendNow']['text'],
		'ONCHANGE' => [
			[
				'ACTION' => Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					['JS' => 'BX.Mail.Client.Message.List.confirmSendNowSelectedScheduledMessages()'],
				],
			],
		],
	],
	[
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => 'scheduled-cancel',
		'ICON' => $arResult['gridActionsData']['scheduledCancel']['icon'],
		'TITLE' => $arResult['gridActionsData']['scheduledCancel']['title'],
		'TEXT' => $arResult['gridActionsData']['scheduledCancel']['text'],
		'ONCHANGE' => [
			[
				'ACTION' => Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					['JS' => 'BX.Mail.Client.Message.List.confirmDeleteSelectedScheduledMessages()'],
				],
			],
		],
	],
];

$scheduledGridHeaders = [
	['id' => 'FROM', 'name' => Loc::getMessage('MAIL_SCHEDULED_LIST_COLUMN_FROM'), 'default' => true, 'editable' => false],
	['id' => 'RECIPIENTS', 'name' => Loc::getMessage('MAIL_SCHEDULED_LIST_COLUMN_RECIPIENTS'), 'default' => true, 'editable' => false],
	['id' => 'SUBJECT', 'name' => Loc::getMessage('MAIL_SCHEDULED_LIST_COLUMN_SUBJECT'), 'default' => true, 'editable' => false],
	['id' => 'SCHEDULED_AT', 'name' => Loc::getMessage('MAIL_SCHEDULED_LIST_COLUMN_SCHEDULED_AT'), 'default' => true, 'editable' => false],
	['id' => 'STATUS', 'name' => Loc::getMessage('MAIL_SCHEDULED_LIST_COLUMN_STATUS'), 'default' => true, 'editable' => false],
];

/**
 * The server names the reason of a refused cancellation with a code, and its own message is a technical one:
 * the text the user reads is chosen here, and both scheduled pages pass the same map to the list. The cancellation
 * returns the letter to the drafts, so the codes of the draft gateway belong to the map as well; the screen of a
 * single letter reads the same refusals by the same codes and words them the same way.
 */
$scheduledCancelErrorReasons = [
	ScheduledMessageService::ERROR_ALREADY_SENDING => Loc::getMessage('MAIL_SCHEDULED_LIST_CANCEL_ERROR_ALREADY_SENDING'),
	ScheduledMessageService::ERROR_ALREADY_SENT => Loc::getMessage('MAIL_SCHEDULED_LIST_CANCEL_ERROR_ALREADY_SENT'),
	ScheduledMessageService::ERROR_ALREADY_CANCELLED => Loc::getMessage('MAIL_SCHEDULED_LIST_CANCEL_ERROR_ALREADY_CANCELLED'),
	ScheduledMessageService::ERROR_REVISION_CONFLICT => Loc::getMessage('MAIL_SCHEDULED_LIST_CANCEL_ERROR_REVISION_CONFLICT'),
	ScheduledMessageService::ERROR_ACCESS_DENIED => Loc::getMessage('MAIL_SCHEDULED_LIST_CANCEL_ERROR_ACCESS_DENIED'),
	ScheduledMessageService::ERROR_NOT_FOUND => Loc::getMessage('MAIL_SCHEDULED_LIST_CANCEL_ERROR_NOT_FOUND'),
	ScheduledMessageDraftGateway::ERROR_DRAFT_UNAVAILABLE => Loc::getMessage('MAIL_SCHEDULED_LIST_CANCEL_ERROR_DRAFT_UNAVAILABLE'),
	ScheduledMessageDraftGateway::ERROR_DRAFT_SAVE_FAILED => Loc::getMessage('MAIL_SCHEDULED_LIST_CANCEL_ERROR_DRAFT_SAVE_FAILED'),
];

/**
 * The same codes read by a reader who asked for the letter to be sent again. The refusals are the ones the
 * cancellation meets — the server checks the letter the same way for both — but each of them is worded for the
 * action that was actually pressed: a reader who asked to repeat a send must not be told to try cancelling.
 */
$scheduledRetryErrorReasons = [
	ScheduledMessageService::ERROR_ALREADY_SENDING => Loc::getMessage('MAIL_SCHEDULED_LIST_RETRY_ERROR_ALREADY_SENDING'),
	ScheduledMessageService::ERROR_ALREADY_SENT => Loc::getMessage('MAIL_SCHEDULED_LIST_RETRY_ERROR_ALREADY_SENT'),
	ScheduledMessageService::ERROR_ALREADY_CANCELLED => Loc::getMessage('MAIL_SCHEDULED_LIST_RETRY_ERROR_ALREADY_CANCELLED'),
	ScheduledMessageService::ERROR_REVISION_CONFLICT => Loc::getMessage('MAIL_SCHEDULED_LIST_RETRY_ERROR_REVISION_CONFLICT'),
	ScheduledMessageService::ERROR_ACCESS_DENIED => Loc::getMessage('MAIL_SCHEDULED_LIST_RETRY_ERROR_ACCESS_DENIED'),
	ScheduledMessageService::ERROR_NOT_FOUND => Loc::getMessage('MAIL_SCHEDULED_LIST_RETRY_ERROR_NOT_FOUND'),
];

/**
 * The same codes read by a reader who asked for the letter to leave now. The server checks the letter for the
 * send on demand exactly as it checks it for the cancellation, so the refusals are the same ones; the words are
 * not, because a reader who asked to send a letter must not be answered about calling its send off. The letter
 * is never written to the drafts by this action, so the codes of the draft gateway do not belong here.
 */
$scheduledSendNowErrorReasons = [
	ScheduledMessageService::ERROR_ALREADY_SENDING => Loc::getMessage('MAIL_SCHEDULED_LIST_SEND_NOW_ERROR_ALREADY_SENDING'),
	ScheduledMessageService::ERROR_ALREADY_SENT => Loc::getMessage('MAIL_SCHEDULED_LIST_SEND_NOW_ERROR_ALREADY_SENT'),
	ScheduledMessageService::ERROR_ALREADY_CANCELLED => Loc::getMessage('MAIL_SCHEDULED_LIST_SEND_NOW_ERROR_ALREADY_CANCELLED'),
	ScheduledMessageService::ERROR_REVISION_CONFLICT => Loc::getMessage('MAIL_SCHEDULED_LIST_SEND_NOW_ERROR_REVISION_CONFLICT'),
	ScheduledMessageService::ERROR_ACCESS_DENIED => Loc::getMessage('MAIL_SCHEDULED_LIST_SEND_NOW_ERROR_ACCESS_DENIED'),
	ScheduledMessageService::ERROR_NOT_FOUND => Loc::getMessage('MAIL_SCHEDULED_LIST_SEND_NOW_ERROR_NOT_FOUND'),
];

/**
 * The phrases of the group actions that name a number of letters. The number is only known once the reader has
 * ticked the rows, so the forms travel to the client whole and `Loc.getMessagePlural` picks one there: the
 * panel appears on a single ticked row as well, and a plural phrase would read as broken Russian on it.
 *
 * How many forms a language has is the business of that language, so every form the locale declares is taken.
 */
$scheduledPluralPhrases = [];
foreach ([
	'MAIL_SCHEDULED_LIST_CANCEL_MANY_CONFIRM',
	'MAIL_SCHEDULED_LIST_CANCEL_MANY_DESCRIPTION',
	'MAIL_SCHEDULED_LIST_SEND_NOW_MANY_CONFIRM',
	'MAIL_SCHEDULED_LIST_SEND_NOW_MANY_DESCRIPTION',
	'MAIL_SCHEDULED_LIST_SEND_NOW_MANY_SUCCESS',
	'MAIL_SCHEDULED_LIST_SEND_NOW_SKIPPED',
	'MAIL_SCHEDULED_LIST_CANCEL_SKIPPED',
] as $phraseId)
{
	for ($form = 0; $form < 6; $form++)
	{
		$formId = sprintf('%s_PLURAL_%d', $phraseId, $form);
		$formText = (string)Loc::getMessage($formId);
		if ($formText !== '')
		{
			$scheduledPluralPhrases[$formId] = $formText;
		}
	}
}

$scheduledEmptyStub = sprintf(
	'<div class="mail-draft-list-empty" data-testid="mail-scheduled-list-empty">%s</div>',
	htmlspecialcharsbx(Loc::getMessage('MAIL_SCHEDULED_LIST_EMPTY')),
);
