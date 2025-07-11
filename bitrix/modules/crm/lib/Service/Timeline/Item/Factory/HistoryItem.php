<?php

namespace Bitrix\Crm\Service\Timeline\Item\Factory;

use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Timeline\Context;
use Bitrix\Crm\Service\Timeline\Item;
use Bitrix\Crm\Service\Timeline\Item\Model;
use Bitrix\Crm\Timeline\AI;
use Bitrix\Crm\Timeline\Bizproc;
use Bitrix\Crm\Timeline\CalendarSharing;
use Bitrix\Crm\Timeline\DeliveryCategoryType;
use Bitrix\Crm\Timeline\LogMessageType;
use Bitrix\Crm\Timeline\OrderCategoryType;
use Bitrix\Crm\Timeline\OrderPaymentController;
use Bitrix\Crm\Timeline\ProductCompilationType;
use Bitrix\Crm\Timeline\Tasks;
use Bitrix\Crm\Timeline\TimelineMarkType;
use Bitrix\Crm\Timeline\TimelineType;
use CCrmOwnerType;

class HistoryItem
{
	public const MAX_PINNED_ITEMS_COUNT = 7;

	/**
	 * Create timeline item for history stream
	 *
	 * @param Context $context
	 * @param array $rawData
	 * @return Item
	 */
	public static function createItem(Context $context, array $rawData): Item
	{
		$assocEntityTypeId = (int)($rawData['ASSOCIATED_ENTITY_TYPE_ID'] ?? 0);
		$typeId = (int)($rawData['TYPE_ID'] ?? 0);
		$typeCategoryId = (int)($rawData['TYPE_CATEGORY_ID'] ?? LogMessageType::UNDEFINED);

		$model = Model::createFromArray($rawData);
		$model->setIsFixed($rawData['IS_FIXED'] === 'Y');

		if ($typeId === TimelineType::ACTIVITY && $assocEntityTypeId === CCrmOwnerType::Activity)
		{
			$responsibleId = (int)($rawData['ASSOCIATED_ENTITY']['RESPONSIBLE_ID'] ?? 0);
			if ($responsibleId > 0)
			{
				$model->setAuthorId($responsibleId);
			}

			$activityTypeId = (int)($rawData['ASSOCIATED_ENTITY']['TYPE_ID'] ?? 0);
			$activityProviderId = (string)($rawData['ASSOCIATED_ENTITY']['PROVIDER_ID'] ?? '');

			$item = Container::getInstance()->getTimelineActivityItemFactory()::create($activityTypeId, $activityProviderId, $context, $model);
			if ($item)
			{
				return $item;
			}
		}

		if ($typeId === TimelineType::CREATION)
		{
			if ($assocEntityTypeId === CCrmOwnerType::Deal)
			{
				if (!empty($model->getAssociatedEntityModel()?->get('ORDER')))
				{
					return new Item\LogMessage\DealCreationByOrder($context, $model);
				}
			}
			elseif ($assocEntityTypeId === CCrmOwnerType::OrderPayment)
			{
				return new Item\LogMessage\PaymentCreation($context, $model);
			}
			elseif ($assocEntityTypeId === CCrmOwnerType::OrderShipment)
			{
				return new Item\LogMessage\ShipmentCreation($context, $model);
			}

			return new Item\LogMessage\Creation($context, $model);
		}

		if ($typeId === TimelineType::MODIFICATION)
		{
			return new Item\LogMessage\Modification($context, $model);
		}

		if ($typeId === TimelineType::LINK)
		{
			return new Item\LogMessage\Binding\Link($context, $model);
		}

		if ($typeId === TimelineType::UNLINK)
		{
			return new Item\LogMessage\Binding\Unlink($context, $model);
		}

		if ($typeId === TimelineType::CONVERSION)
		{
			return new Item\LogMessage\Conversion($context, $model);
		}

		if ($typeId === TimelineType::RESTORATION)
		{
			return new Item\LogMessage\Restoration($context, $model);
		}

		if ($typeId === TimelineType::COMMENT)
		{
			return new Item\Comment($context, $model);
		}

		if ($typeId === TimelineType::SIGN_DOCUMENT && Item\SignDocument::isActive())
		{
			return new Item\SignDocument($context, $model);
		}

		if ($typeId === TimelineType::SIGN_DOCUMENT_LOG && Item\LogMessage\SignDocument::isActive())
		{
			return new Item\LogMessage\SignDocument($context, $model);
		}

		if ($typeId === TimelineType::SIGN_B2E_DOCUMENT && Item\SignB2eDocument::isActive())
		{
			return new Item\SignB2eDocument($context, $model);
		}

		if ($typeId === TimelineType::SIGN_B2E_DOCUMENT_LOG && Item\LogMessage\SignB2eDocument::isActive())
		{
			return new Item\LogMessage\SignB2eDocument($context, $model);
		}

		if ($typeId === TimelineType::LOG_MESSAGE)
		{
			switch ($typeCategoryId)
			{
				case LogMessageType::CALL_INCOMING:
					return new Item\LogMessage\CallIncoming($context, $model);
				case LogMessageType::OPEN_LINE_INCOMING:
					return new Item\LogMessage\OpenLineIncoming($context, $model);
				case LogMessageType::TODO_CREATED:
					return new Item\LogMessage\TodoCreated($context, $model);
				case LogMessageType::PING:
					$associatedActivityProvider = $rawData['ASSOCIATED_ENTITY']['PROVIDER_ID'] ?? '';
					if ($associatedActivityProvider === \Bitrix\Crm\Activity\Provider\CalendarSharing::getId())
					{
						return new Item\LogMessage\CalendarSharing\CalendarSharingPing($context, $model);
					}
					if ($associatedActivityProvider === \Bitrix\Crm\Activity\Provider\Tasks\Task::getId())
					{
						return new Item\LogMessage\Tasks\TaskPing($context, $model);
					}
					return new Item\LogMessage\Ping($context, $model);
				case LogMessageType::REST:
					return new Item\LogMessage\Rest($context, $model);
				case LogMessageType::SMS_STATUS:
					return new Item\LogMessage\SmsStatus($context, $model);
				case LogMessageType::CALENDAR_SHARING_NOT_VIEWED:
					return new Item\LogMessage\CalendarSharing\NotViewed($context, $model);
				case LogMessageType::CALENDAR_SHARING_VIEWED:
					return new Item\LogMessage\CalendarSharing\Viewed($context, $model);
				case LogMessageType::CALENDAR_SHARING_EVENT_CREATED:
					return new Item\LogMessage\CalendarSharing\EventCreated($context, $model);
				case LogMessageType::CALENDAR_SHARING_EVENT_DOWNLOADED:
					return new Item\LogMessage\CalendarSharing\EventDownloaded($context, $model);
				case LogMessageType::CALENDAR_SHARING_EVENT_CONFIRMED:
					return new Item\LogMessage\CalendarSharing\EventConfirmed($context, $model);
				case LogMessageType::CALENDAR_SHARING_LINK_COPIED:
					return new Item\LogMessage\CalendarSharing\LinkCopied($context, $model);
				case LogMessageType::EMAIL_ACTIVITY_STATUS_SUCCESSFULLY_DELIVERED:
					return new Item\LogMessage\EmailActivityStatuses\SuccessfullyDelivered($context, $model);
				case LogMessageType::CALENDAR_SHARING_RULE_UPDATED:
					return new Item\LogMessage\CalendarSharing\RuleUpdated($context, $model);
				case LogMessageType::EMAIL_NON_DELIVERED:
					return new Item\LogMessage\EmailActivityStatuses\NonDelivered($context, $model);
				case LogMessageType::EMAIL_INCOMING_MESSAGE:
					return new Item\LogMessage\EmailActivityStatuses\IncomingMessage($context, $model);
				case LogMessageType::AI_CALL_START_RECORD_TRANSCRIPT:
					return new Item\LogMessage\AI\Call\RecordTranscriptStarted($context, $model);
				case LogMessageType::AI_CALL_START_RECORD_TRANSCRIPT_SUMMARY:
					return new Item\LogMessage\AI\Call\RecordTranscriptSummaryStarted($context, $model);
				case LogMessageType::AI_CALL_START_FILLING_ENTITY_FIELDS:
					return new Item\LogMessage\AI\Call\FillingEntityFieldsStarted($context, $model);
				case LogMessageType::AI_CALL_FINISH_FILLING_ENTITY_FIELDS:
					return new Item\LogMessage\AI\Call\FillingEntityFieldsFinished($context, $model);
				case LogMessageType::AI_CALL_START_SCORING:
					return new Item\LogMessage\AI\Call\CallScoringResultStarted($context, $model);
				case LogMessageType::AI_CALL_SCORING_EMPTY:
					return new Item\LogMessage\AI\Call\CallScoringEmptyResult($context, $model);
				case LogMessageType::AI_CALL_LAUNCH_ERROR:
					return new Item\LogMessage\AI\Call\LaunchError($context, $model);
				case LogMessageType::AI_CALL_AUTOMATION_LAUNCH_ERROR:
					return new Item\LogMessage\AI\Call\AutomationLaunchError($context, $model);
				case LogMessageType::CALL_MOVED:
				case LogMessageType::OPEN_LINE_MOVED:
				case LogMessageType::EMAIL_INCOMING_MOVED:
					return new Item\LogMessage\Binding\Moved($context, $model);
				case LogMessageType::BOOKING_CREATED:
					return new Item\LogMessage\Booking\BookingCreated($context, $model);
				case LogMessageType::BOOKING_CREATION_ERROR:
					return new Item\LogMessage\Booking\BookingCreationError($context, $model);
				case LogMessageType::WAIT_LIST_ITEM_CREATED:
					return new Item\LogMessage\Booking\WaitListItemCreated($context, $model);
				case LogMessageType::WAIT_LIST_ITEM_DELETED:
					return new Item\LogMessage\Booking\WaitListItemDeleted($context, $model);
				case LogMessageType::RESTART_AUTOMATION:
					return new Item\LogMessage\RecordRestartAutomation($context, $model);
				case LogMessageType::BOOKING_MESSAGE_STATUS_UPDATE:
					return new Item\LogMessage\Booking\BookingMessageStatusUpdate($context, $model);
				case LogMessageType::BOOKING_STATUS_UPDATE:
					return new Item\LogMessage\Booking\BookingStatusUpdate($context, $model);
				case LogMessageType::REPEAT_SALE_CREATED:
					return new Item\LogMessage\RepeatSaleCreated($context, $model);
			}
		}

		if ($typeId === TimelineType::PRODUCT_COMPILATION)
		{
			switch ($typeCategoryId)
			{
				case ProductCompilationType::PRODUCT_LIST:
					return new Item\ProductCompilationSentToCustomer($context, $model);
				case ProductCompilationType::ORDER_EXISTS:
					return new Item\LogMessage\ProductCompilationOrderExists($context, $model);
				case ProductCompilationType::COMPILATION_VIEWED:
					return new Item\LogMessage\ProductCompilationViewed($context, $model);
				case ProductCompilationType::COMPILATION_NOT_VIEWED:
					return new Item\LogMessage\ProductCompilationNotViewed($context, $model);
				case ProductCompilationType::NEW_DEAL_CREATED:
					return new Item\LogMessage\ProductCompilationNewDealCreated($context, $model);
			}
		}

		if ($typeId === TimelineType::DOCUMENT)
		{
			if ($typeCategoryId === TimelineType::MODIFICATION && Item\LogMessage\DocumentViewed::isActive())
			{
				return new Item\LogMessage\DocumentViewed($context, $model);
			}

			if (Item\Document::isActive())
			{
				return new Item\Document($context, $model);
			}

			return new Item\NotAvailable($context, $model);
		}

		if ($typeId === TimelineType::MARK && $assocEntityTypeId === CCrmOwnerType::Order)
		{
			return new Item\LogMessage\OrderSynchronization($context, $model);
		}

		if ($typeId === TimelineType::ORDER)
		{
			$historyItemFields = $model->getHistoryItemModel()?->get('FIELDS');
			$historyItemFields = $historyItemFields ?? [];

			if ($typeCategoryId === TimelineType::CREATION)
			{
				if ($assocEntityTypeId === CCrmOwnerType::Order)
				{
					return new Item\LogMessage\OrderCreation($context, $model);
				}
			}
			elseif ($typeCategoryId === TimelineType::MODIFICATION)
			{
				if ($assocEntityTypeId === CCrmOwnerType::OrderPayment)
				{
					if (
						isset($historyItemFields[OrderPaymentController::PAY_SYSTEM_CLICK])
						&& $historyItemFields[OrderPaymentController::PAY_SYSTEM_CLICK] === 'Y'
					)
					{
						return new Item\LogMessage\CustomerSelectedPaymentMethod($context, $model);
					}

					if (
						isset($historyItemFields['NEED_MANUAL_ADD_CHECK'])
						&& $historyItemFields['NEED_MANUAL_ADD_CHECK'] === 'Y'
					)
					{
						return new Item\LogMessage\CheckManualCreation($context, $model);
					}


					if (isset($historyItemFields[OrderPaymentController::VIEWED_WAY_CUSTOMER_PAYMENT_PAY]))
					{
						if ($historyItemFields[OrderPaymentController::VIEWED_WAY_CUSTOMER_PAYMENT_PAY] === 'Y')
						{
							return new Item\LogMessage\PaymentViewed($context, $model);
						}

						return new Item\LogMessage\PaymentNotViewed($context, $model);
					}

					if (
						isset($historyItemFields[OrderPaymentController::SENT_TO_TERMINAL])
						&& $historyItemFields[OrderPaymentController::SENT_TO_TERMINAL] === 'Y'
					)
					{
						return new Item\LogMessage\PaymentSentToTerminal($context, $model);
					}

					if (
						isset($historyItemFields['STATUS_CODE'])
						&& $historyItemFields['STATUS_CODE'] === 'ERROR'
					)
					{
						return new Item\LogMessage\PaymentError($context, $model);
					}

					if (isset($historyItemFields['SENT']) &&  $historyItemFields['SENT'] === 'Y')
					{
						/**
						 * New blocks of this type are not created anymore
						 */
						return new Item\LogMessage\PaymentSent($context, $model);
					}

					if (isset($historyItemFields['ORDER_PAID']))
					{
						if ($historyItemFields['ORDER_PAID'] === 'Y')
						{
							return new Item\LogMessage\PaymentPaid($context, $model);
						}

						return new Item\LogMessage\PaymentNotPaid($context, $model);
					}
				}
				elseif ($assocEntityTypeId === CCrmOwnerType::OrderShipment)
				{
					if (isset($historyItemFields['ORDER_DEDUCTED']))
					{
						if ($historyItemFields['ORDER_DEDUCTED'] === 'Y')
						{
							return new Item\LogMessage\ShipmentDeducted($context, $model);
						}

						return new Item\LogMessage\ShipmentNotDeducted($context, $model);
					}
				}
				elseif ($assocEntityTypeId === CCrmOwnerType::Order)
				{
					if (
						isset($historyItemFields['MANUAL_CONTINUE_PAY'])
						&& $historyItemFields['MANUAL_CONTINUE_PAY'] === 'Y'
					)
					{
						return new Item\LogMessage\CustomerProceededWithOrder($context, $model);
					}

					if (isset($historyItemFields['ORDER_PAID']))
					{
						if ($historyItemFields['ORDER_PAID'] === 'Y')
						{
							return new Item\LogMessage\OrderPaid($context, $model);
						}

						return new Item\LogMessage\OrderNotPaid($context, $model);
					}

					if (isset($historyItemFields['ORDER_DEDUCTED']))
					{
						if ($historyItemFields['ORDER_DEDUCTED'] === 'Y')
						{
							return new Item\LogMessage\OrderDeducted($context, $model);
						}

						return new Item\LogMessage\OrderNotDeducted($context, $model);
					}
				}
			}
			elseif ($typeCategoryId === OrderCategoryType::ENCOURAGE_BUY_PRODUCTS)
			{
				return new Item\EncourageBuyProducts($context, $model);
			}
		}

		if (in_array($typeId, [TimelineType::FINAL_SUMMARY, TimelineType::FINAL_SUMMARY_DOCUMENTS], true))
		{
			if ($typeCategoryId === TimelineType::CREATION)
			{
				return new Item\FinalSummary($context, $model);
			}
		}

		if ($typeId === TimelineType::ORDER_CHECK)
		{
			if ($typeCategoryId === TimelineType::MARK)
			{
				if ($model->getHistoryItemModel()?->get('PRINTING') === 'Y')
				{
					return new Item\LogMessage\OrderCheckPrinting($context, $model);
				}

				return new Item\LogMessage\OrderCheckSent($context, $model);
			}

			if ($model->getAssociatedEntityId())
			{
				if ($model->getHistoryItemModel()?->get('PRINTED') === 'Y')
				{
					return new Item\OrderCheckPrinted($context, $model);
				}

				return new Item\OrderCheckNotPrinted($context, $model);
			}

			return new Item\LogMessage\OrderCheckCreationError($context, $model);
		}

		if ($typeId === TimelineType::STORE_DOCUMENT)
		{
			$item = HistoryItemStoreDocument::createItem($context, $model);
			if ($item)
			{
				return $item;
			}
		}

		if ($typeId === TimelineType::DELIVERY)
		{
			switch ($typeCategoryId)
			{
				// v3 delivery blocks
				case DeliveryCategoryType::UNIVERSAL:
				// v2 delivery blocks that are compatible with v3 version
				case DeliveryCategoryType::MESSAGE:
				case DeliveryCategoryType::DELIVERY_CALCULATION:
					return new Item\LogMessage\Delivery\Universal($context, $model);
				// v1 taxi blocks that are not compatible with v1 version
				case DeliveryCategoryType::TAXI_ESTIMATION_REQUEST:
					return new Item\LogMessage\Delivery\Taxi\EstimationRequest($context, $model);
				case DeliveryCategoryType::TAXI_CALL_REQUEST:
					return new Item\LogMessage\Delivery\Taxi\CallRequest($context, $model);
				case DeliveryCategoryType::TAXI_CANCELLED_BY_MANAGER:
					return new Item\LogMessage\Delivery\Taxi\CancelledByManager($context, $model);
				case DeliveryCategoryType::TAXI_CANCELLED_BY_DRIVER:
					return new Item\LogMessage\Delivery\Taxi\CancelledByDriver($context, $model);
				case DeliveryCategoryType::TAXI_PERFORMER_NOT_FOUND:
					return new Item\LogMessage\Delivery\Taxi\PerformerNotFound($context, $model);
				case DeliveryCategoryType::TAXI_SMS_PROVIDER_ISSUE:
					return new Item\LogMessage\Delivery\Taxi\SmsProviderIssue($context, $model);
				case DeliveryCategoryType::TAXI_RETURNED_FINISH:
					return new Item\LogMessage\Delivery\Taxi\ReturnedFinish($context, $model);
				// endregion
			}
		}

		if ($typeId === TimelineType::CALENDAR_SHARING)
		{
			switch ($typeCategoryId)
			{
				case CalendarSharing\Entry::SHARING_TYPE_INVITATION_SENT:
					return new Item\LogMessage\CalendarSharing\InvitationSent($context, $model);
			}
		}

		if ($typeId === TimelineType::TASK)
		{
			switch ($typeCategoryId)
			{
				case Tasks\CategoryType::DESCRIPTION_CHANGED:
					return new Item\LogMessage\Tasks\TaskDescriptionChanged($context, $model);

				case Tasks\CategoryType::RESULT_ADDED:
					return new Item\LogMessage\Tasks\TaskResultAdded($context, $model);

				case Tasks\CategoryType::CHECKLIST_ADDED:
					return new Item\LogMessage\Tasks\TaskChecklistAdded($context, $model);

				case Tasks\CategoryType::DEADLINE_CHANGED:
					return new Item\LogMessage\Tasks\TaskDeadlineChanged($context, $model);

				case Tasks\CategoryType::VIEWED:
					return new Item\LogMessage\Tasks\TaskViewed($context, $model);

				case Tasks\CategoryType::PING_SENT:
					return new Item\LogMessage\Tasks\TaskPingSent($context, $model);

				case Tasks\CategoryType::COMMENT_ADD:
					return new Item\LogMessage\Tasks\TaskCommentAdded($context, $model);

				case Tasks\CategoryType::ALL_COMMENT_VIEWED:
					return new Item\LogMessage\Tasks\TaskCommentsViewed($context, $model);

				case Tasks\CategoryType::TASK_ADDED:
					return new Item\LogMessage\Tasks\TaskCreation($context, $model);

				case Tasks\CategoryType::STATUS_CHANGED:
					return new Item\LogMessage\Tasks\TaskStatusChanged($context, $model);

				case Tasks\CategoryType::EXPIRED:
					return new Item\LogMessage\Tasks\TaskDeadlineExpired($context, $model);

				case Tasks\CategoryType::DISAPPROVED:
					return new Item\LogMessage\Tasks\TaskDisapproved($context, $model);

				case Tasks\CategoryType::RESPONSIBLE_CHANGED:
					return new Item\LogMessage\Tasks\TaskResponsibleChanged($context, $model);

				case Tasks\CategoryType::ACCOMPLICE_ADDED:
					return new Item\LogMessage\Tasks\TaskAccompliceAdded($context, $model);

				case Tasks\CategoryType::AUDITOR_ADDED:
					return new Item\LogMessage\Tasks\TaskAuditorAdded($context, $model);

				case Tasks\CategoryType::GROUP_CHANGED:
					return new Item\LogMessage\Tasks\TaskGroupChanged($context, $model);
			}
		}

		if ($typeId === TimelineType::AI_CALL_PROCESSING)
		{
			return match ($typeCategoryId)
			{
				AI\Call\CategoryType::RECORD_TRANSCRIPT_FINISHED => new Item\AI\Call\TranscriptResult($context, $model),
				AI\Call\CategoryType::RECORD_TRANSCRIPT_SUMMARY_FINISHED => new Item\AI\Call\TranscriptSummaryResult($context, $model),
				AI\Call\CategoryType::FILLING_ENTITY_FIELDS_FINISHED => new Item\AI\Call\EntityFieldsFillingResult($context, $model),
				AI\Call\CategoryType::CALL_SCORING_FINISHED => new Item\AI\Call\CallScoringResult($context, $model),
			};
		}

		if (
			$typeId === TimelineType::MARK
			&& in_array($typeCategoryId, [TimelineMarkType::SUCCESS, TimelineMarkType::FAILED], true)
		)
		{
			return new Item\LogMessage\ElementCompletion($context, $model);
		}

		if ($typeId === TimelineType::BIZPROC)
		{
			$status = $model->getHistoryItemModel()?->get('WORKFLOW_STATUS_NAME');
			if (empty($typeCategoryId) && isset($status))
			{
				return match ($status)
				{
					'Created' => new Item\Bizproc\WorkflowStarted($context, $model),
					'Completed' => new Item\Bizproc\WorkflowCompleted($context, $model),
					'Terminated' => new Item\Bizproc\WorkflowTerminated($context, $model),
				};
			}

			if (!empty($typeCategoryId))
			{
				return match ($typeCategoryId)
				{
					Bizproc\CategoryType::WORKFLOW_STARTED => new Item\Bizproc\WorkflowStarted($context, $model),
					Bizproc\CategoryType::WORKFLOW_COMPLETED => new Item\Bizproc\WorkflowCompleted($context, $model),
					Bizproc\CategoryType::WORKFLOW_TERMINATED => new Item\Bizproc\WorkflowTerminated($context, $model),
					Bizproc\CategoryType::TASK_ADDED => new Item\LogMessage\Bizproc\TaskCreation($context, $model),
					Bizproc\CategoryType::TASK_COMPLETED => new Item\LogMessage\Bizproc\TaskCompleted($context, $model),
					Bizproc\CategoryType::TASK_DELEGATED => new Item\LogMessage\Bizproc\TaskDelegated($context, $model),
					Bizproc\CategoryType::COMMENT_ADDED => new Item\LogMessage\Bizproc\CommentAdded($context, $model),
					Bizproc\CategoryType::COMMENT_READ => new Item\LogMessage\Bizproc\CommentRead($context, $model),
				};
			}
		}

		return new Item\Compatible\HistoryItem(
			$context,
			(new Item\Compatible\Model())
				->setData($rawData)
				->setId((int)$rawData['ID'])
				->setIsFixed($rawData['IS_FIXED'] === 'Y')
		);
	}

	/**
	 * Create empty item for deletion pull event
	 *
	 * @param Context $context
	 * @param int $id
	 * @return Item
	 */
	public static function createEmptyItem(Context $context, int $id): Item
	{
		$model = Model::createFromArray(['ID' => $id]);

		return new class($context, $model) extends Item
		{
			public function jsonSerialize(): ?array
			{
				return null;
			}

			public function getSort(): array
			{
				return [];
			}
		};
	}
}
