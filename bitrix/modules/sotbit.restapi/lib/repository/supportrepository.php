<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository;

use Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\SupportException;
use Bitrix\Main\Loader;
use Bitrix\Main\Config\Option;
use Sotbit\RestAPI\Core;
use Sotbit\RestAPI\Localisation as l;

class SupportRepository extends BaseRepository
{
    public const TYPE_CATEGORY = 'C';
    public const TYPE_CRITICALITY = 'K';
    public const TYPE_STATUS = 'S';
    public const TYPE_ASSESSMENT = 'M';
    public const TYPE_DIFFICULTY = 'D';

    public const TYPE_CREATE_TICKET = 1;
    public const TYPE_CREATE_MESSAGE = 2;

    public const DICTIONARY_CATEGORY = 'CATEGORY';
    public const DICTIONARY_CRITICALITY = 'CRITICALITY';
    public const DICTIONARY_MARK = 'MARK';

    public const UPLOAD_DIR = '/upload/';

    public $user;

    /**
     * SupportRepository constructor.
     *
     * @throws SupportException
     * @throws \Bitrix\Main\LoaderException
     */
    public function __construct()
    {
        parent::__construct();
        if(!Loader::includeModule("support")) {
            throw new SupportException(l::get('ERROR_MODULE_SUPPORT'), StatusCode::HTTP_BAD_REQUEST);
        }

        $this->user = new UserRepository();
    }

    /**
     * Get tickets
     *
     * @param  array  $params
     *
     * @return array
     * @throws SupportException
     */
    public function getTickets(array $params): array
    {
        $result = [];
        $data = [];
        $params = $this->prepareNavigationSupport($params);

        $filter = array_merge(
            $params['filter'],
            [
                'CREATED_BY_EXACT_MATCH' => 'Y',
                'CREATED_BY'             => $params['user_id'],
            ]
        );
        $select = [
            'SELECT'     => ["UF_*"],
            'NAV_PARAMS' => [
                'nPageSize'          => $params['limit'],
                'iNumPage'           => $params['page'],
                'bShowAll'           => false,
                'bDescPageNumbering' => false,
            ],
        ];


        $filterAll = [
            'CREATED_BY_EXACT_MATCH' => 'Y',
            'CREATED_BY'             => $params['user_id'],
        ];
        $selectAll = [
            'NAV_PARAMS' => [
                'nPageSize'          => $params['limit'],
                'iNumPage'           => $params['page'],
                'bShowAll'           => false,
                'bDescPageNumbering' => false,
            ],
        ];

        // query
        $query = \CTicket::GetList(
            array_keys($params['order'])[0],
            array_values($params['order'])[0],
            $filter,
            $isFiltered,
            "N",
            "N",
            "N",
            false,
            $select
        );
        $queryAll = \CTicket::GetList(
            array_keys($params['order'])[0],
            array_values($params['order'])[0],
            $filterAll,
            $isFiltered,
            "N",
            "N",
            "N",
            false,
            $selectAll
        );


        $query->NavStart($params['limit']);

        /*if(!$query->NavRecordCount) {
            throw new SupportException(l::get('ERROR_SUPPORT_TICKET_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }*/

        if($query->NavRecordCount) {
            while($ticket = $query->NavNext()) {
                $ticket['OWNER_USER_ID_PHOTO'] = $this->getUserPhoto((int)$ticket['OWNER_USER_ID']);

                $data[$ticket['ID']] = $ticket;
            }
        }

        $result['data'] = $data;
        $result['info']['count_all'] = (int)$queryAll->NavRecordCount;
        $result['info']['count_select'] = count($data);

        return $result;
    }

    /**
     * Get ticket detail info
     *
     * @param  int  $ticketId
     * @param  int  $userId
     *
     * @return array
     * @throws SupportException
     */
    public function getTicket(int $ticketId, int $userId): array
    {
        $filter = [
            'CREATED_BY_EXACT_MATCH' => 'Y',
            'CREATED_BY'             => $userId,
        ];

        if($ticketId) {
            $filter['ID'] = $ticketId;
        }

        $select = [
            "SELECT"     => ["UF_*"],
            'NAV_PARAMS' => [
                'nPageSize' => 1,
            ],
        ];


        $query = \CTicket::GetList($by = "ID", $order = "asc", $filter, $isFiltered, "N", "Y", "Y", false, $select);
        $ticket = $query->Fetch();

        if(!$ticket) {
            throw new SupportException(l::get('ERROR_SUPPORT_TICKET_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        $ticket['OWNER_USER_ID_PHOTO'] = $this->getUserPhoto((int)$ticket['OWNER_USER_ID']);

        return $ticket;
    }

    /**
     * Get all messages in a ticket
     *
     * @param  int  $ticketId
     * @param  array  $params
     *
     * @return array
     * @throws SupportException
     */
    public function getMessagesTicket(int $ticketId, array $params): array
    {
        $result = [];
        $data = [];
        $files = [];
        $aImg = ["gif", "png", "jpg", "jpeg", "bmp"];
        $params = $this->prepareNavigationSupport($params);

        // Check isset ticket
        $ticket = $this->getTicket($ticketId, $params['user_id']);

        $filter = array_merge(
            $params['filter'],
            [
                'TICKET_ID_EXACT_MATCH' => 'Y',
                'TICKET_ID'             => $ticketId,
                'CREATED_BY'            => $params['user_id'],
            ]
        );
        $filterNoLog = [
            'TICKET_ID_EXACT_MATCH' => 'Y',
            'TICKET_ID'             => $ticketId,
            'CREATED_BY'            => $params['user_id'],
            'IS_LOG'                => "N",
        ];
        $filterAll = [
            'TICKET_ID_EXACT_MATCH' => 'Y',
            'TICKET_ID'             => $ticketId,
            'CREATED_BY'            => $params['user_id'],
        ];

        /*$select = [
            'SELECT'     => $params['select'], // property - ["UF_*"])
            'NAV_PARAMS' => [
                'nPageSize'          => $params['limit'],
                'iNumPage'           => $params['page'],
                'bShowAll'           => false,
                'bDescPageNumbering' => false,
            ],
        ];*/

        $query = \CTicket::GetMessageList(
            array_keys($params['order'])[0],
            array_values($params['order'])[0],
            $filter,
            $isFiltered,
            "N",
            "Y"
        );

        $queryAll = \CTicket::GetMessageList(
            array_keys($params['order'])[0],
            array_values($params['order'])[0],
            $filterAll,
            $isFiltered,
            "N",
            "N"
        );
        $queryNoLog = \CTicket::GetMessageList(
            array_keys($params['order'])[0],
            array_values($params['order'])[0],
            $filterNoLog,
            $isFiltered,
            "N",
            "N"
        );

        $query->NavStart($params['limit'], true, $params['page']);

        if(!$query->SelectedRowsCount()) {
            throw new SupportException(l::get('ERROR_SUPPORT_MESSAGE_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }

        $rsFiles = \CTicket::GetFileList($v1 = "s_id", $v2 = "asc", ["TICKET_ID" => $ticketId], 'N');
        {
            while($arFile = $rsFiles->Fetch()) {
                $name = $arFile["ORIGINAL_NAME"] != '' ? $arFile["ORIGINAL_NAME"] : $arFile["FILE_NAME"];
                if($arFile["EXTENSION_SUFFIX"] != '') {
                    $suffix_length = strlen($arFile["EXTENSION_SUFFIX"]);
                    $name = substr($name, 0, strlen($name) - $suffix_length);
                }
                $path = self::UPLOAD_DIR.$arFile['SUBDIR'].'/'.$arFile['FILE_NAME'];
                $files[$arFile["MESSAGE_ID"]][] = [
                    "ID"        => $arFile['ID'],
                    "HASH"      => $arFile["HASH"],
                    "NAME"      => $name,
                    "PATH"      => $path,
                    "FILE_SIZE" => $arFile["FILE_SIZE"],
                ];
            }
        }

        while($message = $query->Fetch()) {
            $message['MESSAGE'] = $message['MESSAGE'] ? : null;
            $message['FILES'] = [];

            if($files[$message["ID"]]) {
                foreach($files[$message["ID"]] as $arFile) {
                    $arMessage = [];
                    $preview = false;
                    $isImage = in_array(strtolower(GetFileExtension($arFile["NAME"])), $aImg) ? true : false;
                    if($isImage) {
                        $url = $arFile["PATH"];
                        if(is_file($_SERVER['DOCUMENT_ROOT'].$url) && $arFile['ID']) {
                            $preview = \CFile::ResizeImageGet(
                                $arFile['ID'],
                                ["width" => self::IMAGE_PREVIEW, "height" => self::IMAGE_PREVIEW],
                                BX_RESIZE_IMAGE_PROPORTIONAL,
                                false
                            );
                        }
                    } else {
                        $url = str_replace('#HASH#', $arFile["HASH"], $params['router_file']);
                    }

                    $arMessage = [
                        'NAME'     => htmlspecialcharsbx($arFile["NAME"]),
                        'SIZE'     => (int)$arFile["FILE_SIZE"],
                        'IS_IMAGE' => $isImage,
                        'URL'      => $url,
                    ];
                    if($preview['src'] && $isImage) {
                        $arMessage['PREVIEW'] = $preview['src'];
                    }

                    $message['FILES'][$arFile['ID']] = $arMessage;
                }
            }

            // user photo
            $message['OWNER_USER_ID_PHOTO'] = $this->getUserPhoto((int)$message['OWNER_USER_ID']);

            $data[$message['ID']] = $message;
        }

        $result['data'] = $data;
        $result['info']['count_all'] = (int)$queryAll->SelectedRowsCount();
        $result['info']['count_no_log_all'] = (int)$queryNoLog->SelectedRowsCount();
        $result['info']['count_select'] = count($data);

        return $result;
    }

    /**
     * Get message by ID
     *
     * @param  int  $messageId
     *
     * @return array
     */
    public function getMessage(int $messageId, int $userId, string $routerFile): array
    {
        $result = [];
        $files = [];
        $aImg = ["gif", "png", "jpg", "jpeg", "bmp"];
        $by = $order = $is_filtered = null;

        $filter = [
            "ID"             => $messageId,
            "ID_EXACT_MATCH" => "Y",
        ];
        $query = \CTicket::GetMessageList($by, $order, $filter, $is_filtered, "N");
        $result = $query->Fetch();

        if(!$result || ((int)$result['CREATED_USER_ID'] !== $userId && (int)$result['OWNER_USER_ID'] !== $userId)) {
            throw new SupportException(l::get('ERROR_SUPPORT_MESSAGE_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }


        $rsFiles = \CTicket::GetFileList($v1 = "s_id", $v2 = "asc", ["MESSAGE_ID" => $messageId], 'N');
        {
            while($arFile = $rsFiles->Fetch()) {
                $name = $arFile["ORIGINAL_NAME"] != '' ? $arFile["ORIGINAL_NAME"] : $arFile["FILE_NAME"];
                if($arFile["EXTENSION_SUFFIX"] != '') {
                    $suffix_length = strlen($arFile["EXTENSION_SUFFIX"]);
                    $name = substr($name, 0, strlen($name) - $suffix_length);
                }
                $path = self::UPLOAD_DIR.$arFile['SUBDIR'].'/'.$arFile['FILE_NAME'];
                $files[] = [
                    "ID"        => $arFile['ID'],
                    "HASH"      => $arFile["HASH"],
                    "NAME"      => $name,
                    "PATH"      => $path,
                    "FILE_SIZE" => $arFile["FILE_SIZE"],
                ];
            }
        }

        if($files) {
            foreach($files as $arFile) {
                $arMessage = [];
                $preview = false;
                $isImage = in_array(strtolower(GetFileExtension($arFile["NAME"])), $aImg) ? true : false;
                if($isImage) {
                    $url = $arFile["PATH"];
                    if(is_file($_SERVER['DOCUMENT_ROOT'].$url) && $arFile['ID']) {
                        $preview = \CFile::ResizeImageGet(
                            $arFile['ID'],
                            ["width" => self::IMAGE_PREVIEW, "height" => self::IMAGE_PREVIEW],
                            BX_RESIZE_IMAGE_PROPORTIONAL,
                            false
                        );
                    }
                } else {
                    $url = str_replace('#HASH#', $arFile["HASH"], $routerFile);
                }

                $arMessage = [
                    'NAME'     => htmlspecialcharsbx($arFile["NAME"]),
                    'SIZE'     => (int)$arFile["FILE_SIZE"],
                    'IS_IMAGE' => $isImage,
                    'URL'      => $url,
                ];
                if($preview['src'] && $isImage) {
                    $arMessage['PREVIEW'] = $preview['src'];
                }

                $result['FILES'][$arFile['ID']] = $arMessage;
            }
        }

        // user photo
        $result['OWNER_USER_ID_PHOTO'] = $this->getUserPhoto((int)$result['OWNER_USER_ID']);

        return $result;
    }

    /**
     * Create ticket
     *
     * @param  array  $data
     * @param  int  $userId
     *
     * @return int
     * @throws SupportException
     */
    public function createTicket(array $data, int $userId): int
    {
        return $this->create(self::TYPE_CREATE_TICKET, $data, $userId);
    }

    /**
     * Create message to ticket
     *
     * @param  int  $ticketId
     * @param  array  $data
     * @param  int  $userId
     *
     * @return int
     * @throws SupportException
     */
    public function createMessage(int $ticketId, array $data, int $userId): int
    {
        $data['ticket_id'] = $ticketId;

        return $this->create(self::TYPE_CREATE_MESSAGE, $data, $userId);
    }


    /**
     * Create ticket and message to ticket
     *
     * @param  int  $type
     * @param  array  $data
     * @param  int  $userId
     *
     * @return int
     * @throws SupportException
     * @throws \Bitrix\Main\ArgumentNullException
     * @throws \Bitrix\Main\ArgumentOutOfRangeException
     */
    public function create(int $type, array $data, int $userId): int
    {
        global $APPLICATION;
        $messageId = $ticketId = false;
        $arFields = [];

        $userRepository = new UserRepository();
        $userSid = $userRepository->getUserSid($userId);

        $data['criticality_id'] = $data['criticality_id'] ? (int)$data['criticality'] : null;
        $data['mark_id'] = $data['mark_id'] ? (int)$data['mark_id'] : null;
        $data['message'] = $data['message'] ? Core\Helper::convertEncodingToSite($data['message']) : false;
        $data['files'] = $this->checkFiles($data['uploaded_files']);

        if($type === self::TYPE_CREATE_TICKET) {
            $data['title'] = Core\Helper::convertEncodingToSite($data['title']);
            $arFields['CREATED_MODULE_NAME'] = \SotbitRestAPI::MODULE_ID;
            $arFields['CATEGORY_ID'] = $data['category'] ? (int)$data['category'] : null;
        }

        if($type === self::TYPE_CREATE_MESSAGE) {
            $ticketId = $data['ticket_id'];
            $data['title'] = $this->getTicket($ticketId, $userId)['TITLE'];
            $arFields['MODIFIED_MODULE_NAME'] = \SotbitRestAPI::MODULE_ID;
            $arFields['MESSAGE_AUTHOR_USER_ID'] = $userId;
            $arFields['MESSAGE_AUTHOR_SID'] = $userSid;
        }

        $arFields = [
                'OWNER_SID'       => $userSid,
                'OWNER_USER_ID'   => $userId,
                'CREATED_USER_ID' => $userId,

                // Update
                //"MESSAGE_AUTHOR_SID"        => $userSid,
                //"MESSAGE_SOURCE_SID"        => "email",
                //'HIDDEN'					=> 'N',

                'TITLE'          => $data['title'],
                'MESSAGE'        => $data['message'],
                'CRITICALITY_ID' => (int)$data['criticality'],
                'MARK_ID'        => (int)$data['mark'],
                'FILES'          => $data['files'],
            ] + $arFields;

        $createId = \CTicket::Set($arFields, $messageId, $ticketId, "N");

        if($ex = $APPLICATION->GetException()) {
            throw new SupportException($ex->GetString(), StatusCode::HTTP_BAD_REQUEST);
        }

        return (int)$createId;
    }


    public function updateMessage(int $id, int $userId)
    {
        return false;
    }

    public function updateTicket(int $id, int $userId)
    {
        return false;
    }

    /**
     * Close my ticket
     *
     * @param  string  $id
     * @param  int  $userId
     *
     * @return array|null
     * @throws SupportException
     */
    public function closeTicket(string $id, int $userId): ?array
    {
        $return = [];
        $ids = explode(',', $id);

        foreach($ids as $_ids) {
            if(!$_ids) {
                continue;
            }
            $ticket = $this->getTicket((int)$_ids, $userId);
            $userRepository = new UserRepository();
            $userSid = $userRepository->getUserSid($userId);

            $return[] = (int)\CTicket::SetTicket(
                [
                    'MODIFIED_MODULE_NAME'   => \SotbitRestAPI::MODULE_ID,
                    'OWNER_SID'              => $userSid,
                    'OWNER_USER_ID'          => $userId,
                    'CREATED_USER_ID'        => $userId,
                    'MESSAGE_AUTHOR_USER_ID' => $userId,
                    'MESSAGE_AUTHOR_SID'     => $userSid,
                    'CLOSE'                  => 'Y',
                    'OPEN'                   => 'N',
                ],
                (int)$_ids,
                'N'
            );
        }

        return count($return) ? $return : null;
    }

    /**
     * Open my ticket
     *
     * @param  string  $id
     * @param  int  $userId
     *
     * @return array|null
     * @throws SupportException
     */
    public function openTicket(string $id, int $userId): ?array
    {
        $return = [];
        $ids = explode(',', $id);

        foreach($ids as $_ids) {
            if(!$_ids) {
                continue;
            }
            $ticket = $this->getTicket((int)$_ids, $userId);
            $userRepository = new UserRepository();
            $userSid = $userRepository->getUserSid($userId);

            $return[] = (int)\CTicket::SetTicket(
                [
                    'MODIFIED_MODULE_NAME'   => \SotbitRestAPI::MODULE_ID,
                    'OWNER_SID'              => $userSid,
                    'OWNER_USER_ID'          => $userId,
                    'CREATED_USER_ID'        => $userId,
                    'MESSAGE_AUTHOR_USER_ID' => $userId,
                    'MESSAGE_AUTHOR_SID'     => $userSid,
                    'CLOSE'                  => 'N',
                    'OPEN'                   => 'Y',
                ],
                (int)$_ids,
                'N'
            );
        }

        return count($return) ? $return : null;
    }

    /**
     * Check and collect uploaded files
     *
     * @param $files
     *
     * @return array
     * @throws SupportException
     * @throws \Bitrix\Main\ArgumentNullException
     * @throws \Bitrix\Main\ArgumentOutOfRangeException
     */
    public function checkFiles($files)
    {
        $returnFiles = [];
        $maxSize = (int)Option::get("support", "SUPPORT_MAX_FILESIZE") * 1024;
        $files = $files['files'];

        if($files) {
            // check and collect files into an array
            if(is_array($files)) {
                foreach($files as $uploadFile) {
                    if($uploadFile instanceof \Slim\Http\UploadedFile) {
                        if($uploadFile->getError() === UPLOAD_ERR_OK) {
                            $returnFiles[] = [
                                'name'      => Core\Helper::convertEncodingToSite($uploadFile->getClientFilename()),
                                'type'      => $uploadFile->getClientMediaType(),
                                'tmp_name'  => $uploadFile->file,
                                'error'     => $uploadFile->getError(),
                                'size'      => $uploadFile->getSize(),
                                "MODULE_ID" => "support",
                            ];
                        } else {
                            throw new SupportException($uploadFile->getError(), StatusCode::HTTP_BAD_REQUEST);
                        }
                    }
                }
            } else {
                if($files instanceof \Slim\Http\UploadedFile) {
                    if($files->getError() === UPLOAD_ERR_OK) {
                        $returnFiles[] = [
                            'name'      => Core\Helper::convertEncodingToSite($files->getClientFilename()),
                            'type'      => $files->getClientMediaType(),
                            'tmp_name'  => $files->file,
                            'error'     => $files->getError(),
                            'size'      => $files->getSize(),
                            "MODULE_ID" => "support",
                        ];
                    } else {
                        throw new SupportException($files->getError(), StatusCode::HTTP_BAD_REQUEST);
                    }
                }
            }

            // check filesize
            if($maxSize > 0 && count($returnFiles) > 0) {
                foreach($returnFiles as $returnFile) {
                    if((int)$returnFile['size'] > $maxSize) {
                        throw new SupportException(
                            l::get(
                                'ERROR_SUPPORT_FILE',
                                [
                                    '#FILE#' => $returnFile['name'],
                                    '#SIZE#' => round($maxSize / 1024 / 1024, 1),
                                ]
                            ), StatusCode::HTTP_BAD_REQUEST
                        );
                    }
                }
            }
        }

        return $returnFiles;
    }


    public function getFile(string $hash, int $userId): void
    {
        $rsFiles = \CTicket::GetFileList($v1 = "s_id", $v2 = "asc", ["HASH" => $hash], 'N');
        if($rsFiles && $arFile = $rsFiles->Fetch()) {
            $ticket = $this->getTicket((int)$arFile['TICKET_ID'], (int)$userId);
            set_time_limit(0);

            $options = [];
            $options["force_download"] = true;
            if(file_exists($_SERVER['DOCUMENT_ROOT'].self::UPLOAD_DIR.$arFile['SUBDIR'].'/'.$arFile['FILE_NAME'])) {
                $options["content_type"] = \CFile::GetContentType(
                    $_SERVER['DOCUMENT_ROOT'].self::UPLOAD_DIR.$arFile['SUBDIR'].'/'.$arFile['FILE_NAME']
                );
            }
            \CFile::ViewByUser($arFile, $options);
        } else {
            throw new SupportException(l::get('ERROR_SUPPORT_FILE_NOT_FOUND'), StatusCode::HTTP_NOT_FOUND);
        }
    }

    /**
     * @return array[]
     */
    public function getDictionary(): array
    {
        return [
            self::DICTIONARY_CATEGORY    => $this->getDictionaryCategories(),
            self::DICTIONARY_CRITICALITY => $this->getDictionaryLevelCriticality(),
            self::DICTIONARY_MARK        => $this->getDictionaryAssessmentResponses(),
        ];
    }

    /**
     * @return array
     */
    public function getDictionaryCategories(): array
    {
        $result = [];

        $dict = \CTicketDictionary::GetList($by, $order, ['TYPE' => self::TYPE_CATEGORY], $isFiltered);
        while($fetch = $dict->Fetch()) {
            $result[$fetch['ID']] = [
                'ID'   => $fetch['ID'],
                'NAME' => $fetch['NAME'],
                'SORT' => $fetch['C_SORT'],
            ];
        }

        return $result;
    }

    /**
     * @return array
     */
    public function getDictionaryLevelCriticality(): array
    {
        $result = [];

        $dict = \CTicketDictionary::GetList($by, $order, ['TYPE' => self::TYPE_CRITICALITY], $isFiltered);
        while($fetch = $dict->Fetch()) {
            $result[$fetch['ID']] = [
                'ID'   => $fetch['ID'],
                'NAME' => $fetch['NAME'],
                'SORT' => $fetch['C_SORT'],
            ];
        }

        return $result;
    }

    /**
     * @return array
     */
    public function getDictionaryAssessmentResponses(): array
    {
        $result = [];

        $dict = \CTicketDictionary::GetList($by, $order, ['TYPE' => self::TYPE_ASSESSMENT], $isFiltered);
        while($fetch = $dict->Fetch()) {
            $result[$fetch['ID']] = [
                'ID'   => $fetch['ID'],
                'NAME' => $fetch['NAME'],
                'SORT' => $fetch['C_SORT'],
            ];
        }

        return $result;
    }

    public function getUserPhoto(int $id)
    {
        $src = null;
        if($id) {
            $src = $this->user->getUserAvatarSrc($id);
            $src = empty($src) ? null : $src;
        }

        return $src;
    }

}