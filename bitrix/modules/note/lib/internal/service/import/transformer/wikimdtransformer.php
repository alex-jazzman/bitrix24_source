<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Transformer;

/**
 * Resolves wiki file/image markers emitted by WikiMarkupConverter (ALG-01):
 *   ![name](wiki-asset://{fileId})   and   [name](wiki-asset://{fileId})
 *
 * The attachmentId is the Bitrix file id (digits only). The base transformer
 * enriches the marker into the note asset syntax once the file is linked, and
 * DownloadAttachmentsStep passes the same id to WikiSource::downloadAttachment.
 */
class WikiMdTransformer extends ImportMdTransformer
{
	protected function getPattern(): string
	{
		return '/(?P<linkPart>!?\[[^\]]*\])\((?P<url>wiki-asset:\/\/(?P<attachmentId>\d+))\)(?!\{)/u';
	}
}
