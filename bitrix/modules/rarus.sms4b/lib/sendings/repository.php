<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\PageNavigation;
use Rarus\Sms4b\Exceptions\Sms4bRepositoryException;
use Rarus\Sms4b\Sendings\Messages;
use Rarus\Sms4b\Sendings\Source\Source;
use Rarus\Sms4b\Tables\MessagesTable;
use Rarus\Sms4b\Tables\SendingsTable;

class Repository
{
    use \Rarus\Sms4b\DateTimeConverter;
    /**
     * @var Messages\Repository
     */
    private $repository;

    public function __construct()
    {
        $this->repository = new Messages\Repository();
    }

    /**
     * @param Sending $sending
     *
     * @return Sending
     * @throws Sms4bRepositoryException
     */
    public function save(Sending $sending): Sending
    {
        try {
            $arSending = $this->sendingToArray($sending);

            if ($sending->getId() === null) {
                $result = SendingsTable::add($arSending);
                $sending->setId($result->getId());
            } else {
                SendingsTable::update($sending->getId(), $arSending);
            }

            foreach ($sending->getMessages() as $message) {
                /**
                 * @var Messages\Message $message
                 */
                $message->setSendingId($sending->getId());

            }

            $this->repository->save($sending->getMessages());

            return $sending;
        } catch (\Exception $e) {
            throw new Sms4bRepositoryException(Loc::getMessage('SMS4B_SENDING_SAVE_ERROR'), $e->getCode(), $e);
        }
    }

    /**
     * @param array $arSending
     *
     * @return Sending
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    private function createEntityFromArray(array $arSending): Sending
    {
        $collection = new Messages\Collection();
        foreach ($arSending as $item) {
            $message = new Messages\Message(
                $item[SendingsTable::DESTINATION],
                $item[SendingsTable::GUID],
                $item[SendingsTable::TEXT],
                new Messages\Status((int)$item[SendingsTable::STATUS]),
                (int)$item[SendingsTable::ENCODING],
                (int)$item[SendingsTable::ENTITY_ID],
                self::bitrixDateTimeToPhpDateTime($item[SendingsTable::LAST_MODIFIED])
            );
            $message->setId((int)$item[SendingsTable::MESSAGE_ID]);
            $message->setResult($item[SendingsTable::RESULT]);

            $collection->attach($message);
        }

        $sending = array_shift($arSending);
        $sendings = new Sending(
            $sending[SendingsTable::SENDER],
            $collection,
            self::bitrixDateTimeToPhpDateTime($sending[SendingsTable::DATE_START_FOR_USER]),
            Source::createSourceInstance((int)$sending[SendingsTable::SOURCE_ID]),
            self::bitrixDateTimeToPhpDateTime($sending[SendingsTable::DATE_START]),
            self::bitrixDateTimeToPhpDateTime($sending[SendingsTable::DATE_ACTUAL]),
            $sending[SendingsTable::ALLOWED_DELIVERY_INTERVAL],
            $sending[SendingsTable::MAIL_EVENT]
        );
        $sendings->setId((int)$sending[SendingsTable::ID]);
        return $sendings;
    }

    /**
     * @param Sending $sending
     *
     * @return array
     */
    private function sendingToArray(Sending $sending)
    {
        return [
            SendingsTable::ID                        => $sending->getId(),
            SendingsTable::SENDER                    => $sending->getSender(),
            SendingsTable::DATE_START_FOR_USER       => self::phpDateTimeToBitrixDateTime($sending->getDateStartForUser()),
            SendingsTable::DATE_START                => self::phpDateTimeToBitrixDateTime($sending->getDateStart()),
            SendingsTable::DATE_ACTUAL               => self::phpDateTimeToBitrixDateTime($sending->getDateActual()),
            SendingsTable::ALLOWED_DELIVERY_INTERVAL => $sending->getAllowedDeliveryInterval(),
            SendingsTable::SOURCE_ID                 => $sending->getSource()->getCode(),
            SendingsTable::MAIL_EVENT                => $sending->getEvent()
        ];
    }

    /**
     * @param array               $filter
     * @param PageNavigation|null $nav
     * @param array               $order
     *
     * @return Collection
     * @throws Sms4bRepositoryException
     */
    public function getByFilter(array $filter, ?PageNavigation $nav = null, array $order = []): Collection
    {
        $arParams = [
            'select' => [
                SendingsTable::ID,
                SendingsTable::SENDER,
                SendingsTable::DATE_START_FOR_USER,
                SendingsTable::DATE_START,
                SendingsTable::DATE_ACTUAL,
                SendingsTable::SOURCE_ID,
                SendingsTable::MAIL_EVENT,
                SendingsTable::MESSAGE_ID    => 'MESSAGES.' . MessagesTable::ID,
                SendingsTable::SENDING_ID    => 'MESSAGES.' . MessagesTable::SENDING_ID,
                SendingsTable::STATUS        => 'MESSAGES.' . MessagesTable::STATUS,
                SendingsTable::DESTINATION   => 'MESSAGES.' . MessagesTable::DESTINATION,
                SendingsTable::TEXT          => 'MESSAGES.' . MessagesTable::TEXT,
                SendingsTable::GUID          => 'MESSAGES.' . MessagesTable::GUID,
                SendingsTable::ENCODING      => 'MESSAGES.' . MessagesTable::ENCODING,
                SendingsTable::LAST_MODIFIED => 'MESSAGES.' . MessagesTable::LAST_MODIFIED,
                SendingsTable::RESULT        => 'MESSAGES.' . MessagesTable::RESULT,
                SendingsTable::ENTITY_ID     => 'MESSAGES.' . MessagesTable::ENTITY_ID,
            ],
            'filter' => $filter,
            'order'  => $order
        ];

        if ($nav instanceof PageNavigation) {
            $arParams['count_total'] = true;
            $arParams['limit'] = $nav->getLimit();
            $arParams['offset'] = $nav->getOffset();
        }

        $sendings = new Collection;
        try {
            $result = SendingsTable::getList($arParams);

            while ($arMessage = $result->fetch()) {
                $arSendings[$arMessage[SendingsTable::SENDING_ID]][] = $arMessage;
            }
            if (!empty($arSendings)) {
                foreach ($arSendings as $item) {
                    $sending = $this->createEntityFromArray($item);
                    $sendings->attach($sending);
                }

                $sendings->rewind();

                if ($nav instanceof PageNavigation) {
                    $nav->setRecordCount($result->getCount());
                }
            }

        } catch (\Exception $e) {
            throw new Sms4bRepositoryException(Loc::getMessage('SMS4B_SENDING_GET_ERROR'), $e->getCode(), $e);
        }
        return $sendings;
    }

    /**
     * @param int   $sendingId
     * @param array $arGuids
     *
     * @return Sending | null
     * @throws Sms4bRepositoryException
     */
    public function getSendingByIdAndGuids(int $sendingId, array $arGuids): ?Sending
    {
        $filter = [
            SendingsTable::ID   => $sendingId,
            SendingsTable::GUID => $arGuids
        ];
        return $this->getByFilter($filter)->current();
    }
}
