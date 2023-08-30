<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\SendingInQueue;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\PageNavigation;
use Rarus\Sms4b\DateTimeConverter;
use Rarus\Sms4b\Sendings\SendingInQueue\Message;
use Rarus\Sms4b\Tables\QueueTable;
use Rarus\Sms4b\Exceptions\Sms4bRepositoryException;

class Repository
{
    use DateTimeConverter;

    /**
     * @param int $sendingId
     *
     * @return SendingInQueue
     * @throws Sms4bRepositoryException
     */
    public function getSendingBySendingId(int $sendingId): SendingInQueue
    {
        $filter = [
            '=' . QueueTable::SENDING_ID => $sendingId
        ];

        $collection = $this->getByFilter($filter);
        return $collection->current();
    }

    /**
     * @param string $source
     *
     * @return Collection
     * @throws Sms4bRepositoryException
     */
    public function getNotSendWithSource(string $source): Collection
    {
        $filter = [
            '=' . QueueTable::STATUS_IN_QUEUE => Message\Status::NOT_PROCESSED,
            '=' . QueueTable::SENDING_SOURCE  => $source,
            [
                'LOGIC' => 'OR',

                '<' . QueueTable::DATE_START => self::phpDateTimeToBitrixDateTime(
                    (new \DateTime('now'))->add(new \DateInterval('PT' . 6 . 'H'))),
                QueueTable::DATE_START       => null
            ]
        ];

        $nav = new PageNavigation('');
        $nav->allowAllRecords(false)->setPageSize(100);
        $order = [QueueTable::SENDING_ID => 'ASC'];

        return $this->getByFilter($filter, $nav, $order);
    }

    /**
     * @return Collection
     * @throws Sms4bRepositoryException
     */
    public function getTransferredSendings(): Collection
    {
        $filter = [
            '=' . QueueTable::STATUS_IN_QUEUE => Message\Status::PROCESSED,
        ];

        $order = [QueueTable::SENDING_ID => 'ASC'];

        return $this->getByFilter($filter, null, $order);
    }

    /**
     * @param array               $filter
     * @param PageNavigation|null $nav
     * @param array|null          $order
     *
     * @return Collection
     * @throws Sms4bRepositoryException
     */
    private function getByFilter(array $filter, PageNavigation $nav = null, array $order = null): Collection
    {
        if ($order === null) {
            $order = [QueueTable::ID => 'DESC'];
        }

        $arParams = [
            'select' => [
                QueueTable::ID,
                QueueTable::SENDING_ID,
                QueueTable::GUID,
                QueueTable::GROUP_ID,
                QueueTable::SENDER,
                QueueTable::DESTINATION,
                QueueTable::TEXT,
                QueueTable::ENCODING,
                QueueTable::DATE_START,
                QueueTable::DATE_ACTUAL,
                QueueTable::ALLOWED_DELIVERY_INTERVAL,
                QueueTable::SENDING_SOURCE,
                QueueTable::RESULT,
                QueueTable::STATUS_IN_QUEUE,
            ],
            'filter' => $filter,
            'order'  => $order
        ];
        if ($nav instanceof PageNavigation) {
            $arParams['limit'] = $nav->getLimit();
            $arParams['offset'] = $nav->getOffset();
        }

        $sendingsInQueue = new Collection();
        $arSendings = [];
        try {
            $result = QueueTable::getList($arParams);
            while ($arMessage = $result->fetch()) {
                $arSendings[$arMessage[QueueTable::SENDING_ID]][] = $arMessage;
            }

            foreach ($arSendings as $item) {
                $sending = $this->createEntityFromArray($item);
                $sendingsInQueue->attach($sending);
            }

            $sendingsInQueue->rewind();

        } catch (\Exception $e) {
            throw new Sms4bRepositoryException(Loc::getMessage('SMS4B_SENDING_IN_QUEUE_GET_ERROR'), $e->getCode(), $e);
        }
        return $sendingsInQueue;
    }

    /**
     * @return array
     * @throws Sms4bRepositoryException
     */
    public function getSourcesFromNotSend()
    {
        try {
            $arParams = [
                'select' => [QueueTable::SENDING_SOURCE],
                'filter' => [
                    '=' . QueueTable::STATUS_IN_QUEUE => Message\Status::NOT_PROCESSED,
                    [
                        'LOGIC' => 'OR',

                        '<' . QueueTable::DATE_START => self::phpDateTimeToBitrixDateTime(
                            (new \DateTime('now'))->add(new \DateInterval('PT' . 6 . 'H'))),
                        QueueTable::DATE_START       => null
                    ]
                ],
                'group'  => [QueueTable::SENDING_SOURCE]
            ];

            $result = QueueTable::getList($arParams);

            $sources = [];
            while ($source = $result->fetch()) {
                $sources[] = $source[QueueTable::SENDING_SOURCE];
            }
            return $sources;
        } catch (\Exception $e) {
            throw new Sms4bRepositoryException(Loc::getMessage('SMS4B_SENDING_IN_QUEUE_GET_ERROR'), $e->getCode(), $e);
        }
    }

    /**
     * @param SendingInQueue $sending
     *
     * @return SendingInQueue
     * @throws Sms4bRepositoryException
     */
    public function save(SendingInQueue $sending): SendingInQueue
    {
        try {
            $arSending = $this->sendingToArray($sending);

            foreach ($sending->getMessages() as $message) {
                $arMessage = $this->messageToArray($message);
                $item = array_merge($arSending, $arMessage);

                if ($message->getId() === null) {
                    $result = QueueTable::add($item);
                    $message->setId($result->getId());
                } else {
                    QueueTable::update($message->getId(), $item);
                }
            }

            return $sending;
        } catch (\Exception $e) {
            throw new Sms4bRepositoryException(Loc::getMessage('SMS4B_SENDING_IN_QUEUE_SAVE_ERROR'), $e->getCode(), $e);
        }

    }

    /**
     * @param int $id
     *
     * @throws Sms4bRepositoryException
     */
    public function deleteElementById(int $id): void
    {
        try {
            QueueTable::delete($id);
        } catch (\Exception $e) {
            throw new Sms4bRepositoryException(Loc::getMessage('SMS4B_SENDING_IN_QUEUE_DELETE_ERROR'), $e->getCode(), $e);
        }
    }

    /**
     * @param SendingInQueue $sending
     *
     * @return array
     * @throws \Exception
     */
    private function sendingToArray(SendingInQueue $sending): array
    {
        return [
            QueueTable::SENDING_ID                => $sending->getSendingId(),
            QueueTable::GROUP_ID                  => $sending->getGroupId(),
            QueueTable::SENDER                    => $sending->getSender(),
            QueueTable::DATE_START                => self::phpDateTimeToBitrixDateTime($sending->getStartDate()),
            QueueTable::DATE_ACTUAL               => self::phpDateTimeToBitrixDateTime($sending->getActualDate()),
            QueueTable::ALLOWED_DELIVERY_INTERVAL => $sending->getAllowedDeliveryInterval(),
            QueueTable::SENDING_SOURCE            => $sending->getSendingSource()
        ];
    }

    /**
     * @param Message\Message $message
     *
     * @return array
     */
    private function messageToArray(Message\Message $message): array
    {
        return [
            QueueTable::ID              => $message->getId(),
            QueueTable::GUID            => $message->getGuid(),
            QueueTable::DESTINATION     => $message->getDestination(),
            QueueTable::TEXT            => $message->getText(),
            QueueTable::ENCODING        => $message->getEncoding(),
            QueueTable::RESULT          => $message->getResult(),
            QueueTable::STATUS_IN_QUEUE => $message->getStatusInQueue()->getStatus()
        ];
    }

    /**
     * @param array $arSending
     *
     * @return SendingInQueue
     * @throws \Exception
     */
    private function createEntityFromArray(array $arSending): SendingInQueue
    {
        $collection = new Message\Collection();
        foreach ($arSending as $item) {
            $message = new Message\Message(
                $item[QueueTable::GUID],
                $item[QueueTable::DESTINATION],
                $item[QueueTable::TEXT],
                (int)$item[QueueTable::ENCODING],
                new Message\Status((int)$item[QueueTable::STATUS_IN_QUEUE])
            );
            if (array_key_exists(QueueTable::ID, $item)) {
                $message->setId((int)$item[QueueTable::ID]);
            }

            $collection->attach($message);
        }

        $sending = array_shift($arSending);
        $sendingInQueue = new SendingInQueue(
            (int)$sending[QueueTable::SENDING_ID],
            $sending[QueueTable::SENDER],
            self::bitrixDateTimeToPhpDateTime($sending[QueueTable::DATE_START]),
            self::bitrixDateTimeToPhpDateTime($sending[QueueTable::DATE_ACTUAL]),
            $sending[QueueTable::ALLOWED_DELIVERY_INTERVAL],
            $sending[QueueTable::SENDING_SOURCE],
            $collection
        );
        $sendingInQueue->setGroupId((int)$sending[QueueTable::GROUP_ID]);
        return $sendingInQueue;
    }

}