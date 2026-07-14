<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Controller;

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\IO;
use Bitrix\Note\Infrastructure\Rest\V3\Controller\ActionFilter\NoteRestAccess;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\FileItemDto;
use Bitrix\Note\Infrastructure\Rest\V3\Exceptions\FileTooLargeException;
use Bitrix\Note\Infrastructure\Rest\V3\Exceptions\FileTypeNotAllowedException;
use Bitrix\Note\Infrastructure\Rest\V3\Request\AddFileRequest;
use Bitrix\Note\Infrastructure\Rest\V3\Request\GetFileRequest;
use Bitrix\Note\Internal\Exceptions\AccessDeniedException as DomainAccessDeniedException;
use Bitrix\Note\Internal\Exceptions\FileTooLargeException as DomainFileTooLargeException;
use Bitrix\Note\Internal\Exceptions\FileTypeNotAllowedException as DomainFileTypeNotAllowedException;
use Bitrix\Note\Internal\Repository\DocumentFileLinkRepository;
use Bitrix\Note\Internal\Service\DocumentFileService;
use Bitrix\Note\Public\Provider\DocumentProvider;
use Bitrix\Note\Public\Service\AccessService;
use Bitrix\Rest\V3\Attribute\DtoType;
use Bitrix\Rest\V3\Controller\RestController;
use Bitrix\Rest\V3\Exception\AccessDeniedException;
use Bitrix\Rest\V3\Exception\EntityNotFoundException;
use Bitrix\Rest\V3\Exception\Validation\RequestValidationException;
use Bitrix\Main\Error;
use Bitrix\Rest\V3\Interaction\Response\GetResponse;

#[DtoType(FileItemDto::class)]
class File extends RestController
{
	protected function getDefaultPreFilters(): array
	{
		return [
			...parent::getDefaultPreFilters(),
			new NoteRestAccess(),
		];
	}

	public function addAction(AddFileRequest $request): GetResponse
	{
		$ownership = (new DocumentProvider())->getOwnershipInfo($request->documentId);
		if ($ownership === null)
		{
			throw new EntityNotFoundException($request->documentId);
		}

		try
		{
			AccessService::assertCanEditDocument($request->documentId, $ownership['collectionId']);
		}
		catch (DomainAccessDeniedException)
		{
			throw new AccessDeniedException();
		}

		$binary = base64_decode($request->fileContent, strict: true);
		if ($binary === false || $binary === '')
		{
			throw new RequestValidationException([new Error('invalid base64 payload', 'fileContent')]);
		}

		$fileService = new DocumentFileService();
		try
		{
			$fileService->assertValidUpload($binary, $request->fileName);
		}
		catch (DomainFileTooLargeException)
		{
			throw new FileTooLargeException(DocumentFileService::getMaxNoteFileSize());
		}
		catch (DomainFileTypeNotAllowedException)
		{
			throw new FileTypeNotAllowedException();
		}

		$mime = $this->detectMime($binary, $request->fileName);

		// Write to bxtemp first — SaveFile reads through cloud-storage handlers
		// that require an on-disk tmp_name, not just an in-memory 'content' key.
		$tmpName = \CTempFile::GetFileName(IO\Path::getName($request->fileName));
		\CheckDirPath($tmpName);
		IO\File::putFileContents($tmpName, $binary);

		$fileArray = [
			'name' => IO\Path::getName($request->fileName),
			'type' => $mime,
			'tmp_name' => $tmpName,
			'size' => strlen($binary),
			'MODULE_ID' => 'note',
		];

		$fileId = (int)\CFile::SaveFile($fileArray, 'note/editor');
		if ($fileId <= 0)
		{
			throw new RequestValidationException([new Error('failed to persist file', 'fileContent')]);
		}

		(new DocumentFileLinkRepository())->link(
			$request->documentId,
			$fileId,
			$this->getCurrentUserId(),
		);

		return new GetResponse($this->buildFileDto($fileId, $request->documentId));
	}

	public function getAction(GetFileRequest $request): GetResponse
	{
		$ownership = (new DocumentProvider())->getOwnershipInfo($request->documentId);
		if ($ownership === null)
		{
			throw new EntityNotFoundException($request->documentId);
		}

		if (!AccessService::canViewDocument($request->documentId, $ownership['collectionId']))
		{
			throw new EntityNotFoundException($request->documentId);
		}

		if (!(new DocumentFileLinkRepository())->isLinked($request->documentId, $request->id))
		{
			throw new EntityNotFoundException($request->id);
		}

		return new GetResponse($this->buildFileDto($request->id, $request->documentId));
	}

	private function buildFileDto(int $fileId, int $documentId): FileItemDto
	{
		$fileArray = \CFile::GetFileArray($fileId);
		if (!is_array($fileArray))
		{
			throw new EntityNotFoundException($fileId);
		}

		$mime = (string)($fileArray['CONTENT_TYPE'] ?? '');
		$assetType = $this->resolveAssetType($mime);

		$dto = new FileItemDto();
		$dto->id = $fileId;
		$dto->documentId = $documentId;
		$dto->name = (string)($fileArray['ORIGINAL_NAME'] ?? $fileArray['FILE_NAME'] ?? '');
		$dto->size = (int)($fileArray['FILE_SIZE'] ?? 0);
		$dto->mimeType = $mime;
		$dto->assetType = $assetType;
		$dto->assetMarkdown = "[[{$assetType} fileId={$fileId}]]";

		return $dto;
	}

	private function detectMime(string $binary, string $fileName): string
	{
		$mime = '';
		if (function_exists('finfo_open'))
		{
			$finfo = finfo_open(FILEINFO_MIME_TYPE);
			if ($finfo !== false)
			{
				$detected = finfo_buffer($finfo, $binary);
				finfo_close($finfo);
				if (is_string($detected) && $detected !== '')
				{
					$mime = $detected;
				}
			}
		}

		if ($mime === '')
		{
			$mime = 'application/octet-stream';
		}

		return $mime;
	}

	private function resolveAssetType(string $mime): string
	{
		if (str_starts_with($mime, 'image/'))
		{
			return 'image';
		}

		if (str_starts_with($mime, 'video/'))
		{
			return 'video';
		}

		return 'file';
	}

	private function getCurrentUserId(): int
	{
		return (int)CurrentUser::get()->getId();
	}
}
