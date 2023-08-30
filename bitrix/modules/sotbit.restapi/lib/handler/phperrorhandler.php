<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Handler;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Sotbit\RestAPI\Core;
use Sotbit\RestAPI\Localisation as l;

class PhpErrorHandler extends \Slim\Handlers\PhpError
{
    public function __invoke(
        Request $request,
        Response $response,
        $error
    ): Response {
        $statusCode = $this->getStatusCode($error);
        $className = new \ReflectionClass(get_class($error));

        if(\SotbitRestAPI::isDebug()) {
            $data = [
                'status'  => 'error',
                'message' => Core\Helper::convertEncodingToUtf8($error->getMessage()),
                'class'   => $className->getName(),
                'code'    => $statusCode,
                'file'    => $error->getFile(),
                'line'    => $error->getLine(),
            ];
        } else {
            $data = [
                'status'  => 'error',
                'message' => Core\Helper::convertEncodingToUtf8(l::get('ERROR_SERVER')),
            ];
        }

        // write log
        /*$logWriter = new Core\LogWriter();
        $logWriter->setRequest($request);
        $logWriter->add([
            'RESPONSE_HTTP_CODE' => $statusCode.':'.$data['status'],
        ]);*/


        $body = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        $response->getBody()->write($body);

        return $response
            ->withStatus($statusCode)
            ->withHeader('Content-type', 'application/problem+json');
    }

    private function getStatusCode($error): int
    {
        $statusCode = 500;
        if(is_int($error->getCode())
            && $error->getCode() >= 400
            && $error->getCode() <= 599
        ) {
            $statusCode = $error->getCode();
        }

        return $statusCode;
    }
}
