<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\User;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Exception\UserException;
use Sotbit\RestAPI\Localisation as l;

/**
 * Class User
 *
 * @package Sotbit\RestAPI\Controller
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 28.01.2021
 */
class User extends Base
{
    public function getCurrent(Request $request, Response $response, array $args): Response
    {
        $user = $this->getRepository()->get($this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $user, StatusCode::HTTP_OK);
    }

    public function getOne(Request $request, Response $response, array $args): Response
    {
        $user = $this->getRepository()->get((int) $args['id']);

        return $this->response($response, self::RESPONSE_SUCCESS, $user, StatusCode::HTTP_OK);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $input = (array)$request->getParsedBody() + $request->getUploadedFiles();
        if(isset($input['decoded'])) {
            unset($input['decoded']);
        }

        $user = $this->getRepository()->update($input, $this->getUserId($request));

        return $this->response($response, self::RESPONSE_SUCCESS, $user, StatusCode::HTTP_OK);
    }

}