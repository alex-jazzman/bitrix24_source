/**
 * @module mail/large-attachment/compose-state
 */
jn.define('mail/large-attachment/compose-state', (require, exports, module) => {
	const { Type } = require('type');
	const { stringify } = require('utils/string');

	/**
	 * A file placed in the Disk is reported by the object it became: the prefix of a new object plus the
	 * object id. Everything the scenario speaks of is that object, and the actions of the mail module
	 * take the bare number.
	 */
	const DISK_OBJECT_REFERENCE_PATTERN = /^n([1-9]\d*)$/;

	const BASE64_LINE_SIZE = 3;
	const BASE64_ENCODED_LINE_SIZE = 4;

	/**
	 * @param {*} reference
	 * @return {?number}
	 */
	function readDiskObjectId(reference)
	{
		if (!Type.isString(reference))
		{
			return null;
		}

		const matches = DISK_OBJECT_REFERENCE_PATTERN.exec(reference);

		return matches ? Number(matches[1]) : null;
	}

	/**
	 * @param {*} objectId
	 * @return {?number}
	 */
	function readExplicitDiskObjectId(objectId)
	{
		if (Type.isNumber(objectId) && Number.isInteger(objectId) && objectId > 0)
		{
			return objectId;
		}

		return readDiskObjectId(objectId);
	}

	/**
	 * The Disk object behind a value of the file field, or null while the upload has not finished. A file
	 * that failed to upload never becomes a part of a set either.
	 *
	 * @param {*} file
	 * @return {?number}
	 */
	function getAttachmentObjectId(file)
	{
		if (!Type.isPlainObject(file))
		{
			return readDiskObjectId(file);
		}

		if (file.isUploading === true || file.hasError === true)
		{
			return null;
		}

		return readDiskObjectId(file.serverFileId)
			?? readExplicitDiskObjectId(file.diskObjectId)
			?? readDiskObjectId(file.id);
	}

	/**
	 * The raw size of an attachment as the sources of the form report it. An unknown size counts as zero:
	 * an unknown size may not push the sum over the threshold on its own.
	 *
	 * @param {*} file
	 * @return {number}
	 */
	function getAttachmentSize(file)
	{
		if (!Type.isPlainObject(file))
		{
			return 0;
		}

		const size = Number(file.size ?? file.fileSize ?? file.customData?.size ?? 0);

		return Number.isFinite(size) && size > 0 ? size : 0;
	}

	/**
	 * Client mirror of the canonical server threshold (AttachmentSizeGuard of the mail module): the sum is
	 * compared after the base64 overhead the transport adds. The coefficient must stay identical on both
	 * sides, and the limit itself always comes from the server.
	 *
	 * @param {number} totalRawSize
	 * @param {number} maxSize
	 * @return {boolean}
	 */
	function exceedsAttachmentLimit(totalRawSize, maxSize)
	{
		const limit = Number(maxSize);
		const total = Number(totalRawSize);

		if (!Number.isFinite(limit) || limit <= 0 || !Number.isFinite(total) || total <= 0)
		{
			return false;
		}

		return limit <= Math.ceil(total / BASE64_LINE_SIZE) * BASE64_ENCODED_LINE_SIZE;
	}

	/**
	 * @param {Array} files
	 * @return {number[]}
	 */
	function getAttachmentObjectIds(files = [])
	{
		return (Array.isArray(files) ? files : [])
			.map((file) => getAttachmentObjectId(file))
			.filter((objectId) => objectId !== null)
		;
	}

	/**
	 * @param {Array} sets
	 * @return {number[]}
	 */
	function getConvertedFileIds(sets = [])
	{
		const fileIds = [];
		(Array.isArray(sets) ? sets : []).forEach((set) => {
			(Array.isArray(set?.fileIds) ? set.fileIds : []).forEach((fileId) => {
				const objectId = readExplicitDiskObjectId(Number(fileId));
				if (objectId !== null && !fileIds.includes(objectId))
				{
					fileIds.push(objectId);
				}
			});
		});

		return fileIds;
	}

	/**
	 * The object a copy of a restored draft was made from, by the object the form shows. The two live in
	 * separate spaces: the form shows the copies the draft made, while a set of the scenario is signed over
	 * the objects those copies came from. Naming a copy where a source belongs makes the server build an
	 * independent set instead of extending the one the draft already carries, and the draft drops that set
	 * on the next autosave.
	 *
	 * Two sources answer, and both come from the restoration of the draft:
	 * - a restored set carries its two spaces as positionally matched lists (fileIds are the copies,
	 *   sourceFileIds the objects they came from);
	 * - an attachment outside every set names its own source (sourceObjectId of the draft view).
	 *
	 * The set wins where both answer: it is the space its token was signed over. A mail module released
	 * before the source of a copy left the server simply reports none, and then a copy stands for itself
	 * exactly as it did before - the former behaviour, not an undefined.
	 *
	 * @param {Array} files
	 * @param {Array} sets
	 * @return {Object} source object id by object id of the form
	 */
	function buildSourceObjectIds(files = [], sets = [])
	{
		const sourceByObject = {};

		(Array.isArray(sets) ? sets : []).forEach((set) => {
			const objectIds = Array.isArray(set?.fileIds) ? set.fileIds : [];
			const sourceIds = Array.isArray(set?.sourceFileIds) ? set.sourceFileIds : [];
			// only the lists of a restoration are matched pair by pair; a saved set sorts its two lists
			// apart, so a length that does not match is no map at all
			if (sourceIds.length === 0 || sourceIds.length !== objectIds.length)
			{
				return;
			}

			objectIds.forEach((objectId, index) => {
				const object = readExplicitDiskObjectId(Number(objectId));
				const source = readExplicitDiskObjectId(Number(sourceIds[index]));
				if (object !== null && source !== null)
				{
					sourceByObject[object] = source;
				}
			});
		});

		(Array.isArray(files) ? files : []).forEach((file) => {
			const objectId = getAttachmentObjectId(file);
			const source = Type.isPlainObject(file)
				? readExplicitDiskObjectId(file.sourceObjectId)
				: null
			;
			if (objectId !== null && source !== null && sourceByObject[objectId] === undefined)
			{
				sourceByObject[objectId] = source;
			}
		});

		return sourceByObject;
	}

	/**
	 * What has to be converted for the current composition of attachments, or null when nothing
	 * has to be. The unit of a conversion is the whole current set of attachments, not the last upload.
	 *
	 * @param {LargeAttachmentPlanParams} params
	 * @return {?LargeAttachmentPlan}
	 */
	function planLargeAttachmentConversion(params = {})
	{
		const files = Array.isArray(params.files) ? params.files : [];
		const sets = Array.isArray(params.convertedSets) ? params.convertedSets : [];
		const objectIds = getAttachmentObjectIds(files);
		const totalRawSize = files.reduce(
			(total, file) => (getAttachmentObjectId(file) === null ? total : total + getAttachmentSize(file)),
			0,
		);

		if (!exceedsAttachmentLimit(totalRawSize, params.maxSize))
		{
			return null;
		}

		// an upload that has not finished has no object of the Disk yet: the whole set waits for it
		if (objectIds.length !== files.length)
		{
			return null;
		}

		if (objectIds.length === 0)
		{
			return null;
		}

		// the new set covers the whole composition, so every set held so far is replaced by it; the
		// server is asked to convert against the first of them and told about the rest on finalizing
		const replacementTokens = sets
			.map((set) => stringify(set?.token))
			.filter((token) => token !== '')
		;

		// the unit of a set is the source object of the Disk, not the element of the form. Two elements may
		// report one and the same object (a forwarded message carrying the same file twice gets one object of
		// the module storage for both), and two objects may name one and the same source (a copy of a restored
		// draft standing beside the object it was made from). The conversion deduplicates what it was given and
		// answers with the objects it converted, so naming a source twice would leave the answer forever
		// different from the plan, and the set would never cover the composition it was built for.
		//
		// The server is told the sources, the form keeps the objects it shows, and the two lists are built
		// together so that they stay matched pair by pair and the map between them stays one to one: a source
		// enters the plan once, for the first object that names it. The second object stays out of the set and
		// leaves as a plain attachment the server answers by its size - a reason a person can read - instead of
		// a map the answer of the conversion could never be translated back through.
		const sourceByObject = buildSourceObjectIds(files, sets);
		const formObjectIds = [];
		const sourceObjectIds = [];
		const objectIdBySourceId = {};
		[...new Set(objectIds)].forEach((objectId) => {
			const sourceObjectId = sourceByObject[objectId] ?? objectId;
			if (objectIdBySourceId[sourceObjectId] !== undefined)
			{
				return;
			}

			objectIdBySourceId[sourceObjectId] = objectId;
			formObjectIds.push(objectId);
			sourceObjectIds.push(sourceObjectId);
		});

		return {
			objectIds: formObjectIds,
			fileIds: sourceObjectIds,
			objectIdBySourceId,
			replacementToken: replacementTokens[0] ?? null,
			replacementTokens,
		};
	}

	/**
	 * Whether the plan asks for anything the converted sets do not already hold. Without this the
	 * coordinator would convert the very same composition again on every change of the form.
	 *
	 * The comparison stays in the space of the objects of the form on both sides: a set records the objects
	 * it covers in that space, and comparing them against the source objects the plan names would find the
	 * very same composition different on every change and convert it again.
	 *
	 * @param {?LargeAttachmentPlan} plan
	 * @param {Array} sets
	 * @return {boolean}
	 */
	function isConversionNeeded(plan, sets = [])
	{
		if (!plan)
		{
			return false;
		}

		const convertedFileIds = getConvertedFileIds(sets);
		if (convertedFileIds.length !== plan.objectIds.length)
		{
			return true;
		}

		return plan.objectIds.some((objectId) => !convertedFileIds.includes(objectId));
	}

	/**
	 * Whether the sets still describe the current composition. A set that holds a file the form no longer
	 * shows is stale, and stale sets are either replaced or dropped.
	 *
	 * @param {Array} files
	 * @param {Array} sets
	 * @return {Array} stale sets
	 */
	function findStaleLargeAttachments(files = [], sets = [])
	{
		const objectIds = getAttachmentObjectIds(files);

		return (Array.isArray(sets) ? sets : []).filter((set) => (
			(Array.isArray(set?.fileIds) ? set.fileIds : []).some((fileId) => !objectIds.includes(Number(fileId)))
		));
	}

	/**
	 * The address lives in the body as plain text, and the check of the send looks for it by an ordinary
	 * search. The escaped form is looked for as well: a body that reached the markup keeps the ampersand
	 * of the address encoded.
	 *
	 * @param {string} body
	 * @param {string} publicUrl
	 * @return {boolean}
	 */
	function isPublicUrlInBody(body, publicUrl)
	{
		const url = stringify(publicUrl);
		if (url === '')
		{
			return true;
		}

		const text = stringify(body);

		return text.includes(url) || text.includes(url.replaceAll('&', '&amp;'));
	}

	/**
	 * @param {string} body
	 * @param {Array} sets
	 * @return {Array} sets whose address the body no longer carries
	 */
	function findOrphanedLargeAttachments(body, sets = [])
	{
		return (Array.isArray(sets) ? sets : []).filter((set) => (
			stringify(set?.publicUrl) !== '' && !isPublicUrlInBody(body, set.publicUrl)
		));
	}

	/**
	 * Puts back the addresses the person removed before sending. Without a trusted address in the
	 * body the server refuses the send, so this is a condition of the send, not a convenience.
	 *
	 * @param {string} body
	 * @param {Array} sets
	 * @return {{ body: string, restored: Array }}
	 */
	function restoreOrphanedLargeAttachments(body, sets = [])
	{
		const orphans = findOrphanedLargeAttachments(body, sets);
		let nextBody = stringify(body);

		orphans.forEach((orphan) => {
			const separator = nextBody === '' ? '' : '\n';
			nextBody = `${nextBody}${separator}${orphan.publicUrl}`;
		});

		return { body: nextBody, restored: orphans };
	}

	/**
	 * @param {string} body
	 * @param {string} publicUrl
	 * @return {string}
	 */
	function removePublicUrlFromBody(body, publicUrl)
	{
		const url = stringify(publicUrl);
		const text = stringify(body);
		if (url === '' || !text.includes(url))
		{
			return text;
		}

		return text
			.split(url)
			.join('')
			.replaceAll(/[^\S\n]+\n/g, '\n')
			.replaceAll(/\n{3,}/g, '\n\n')
		;
	}

	/**
	 * What the send tells the server about the sets it carries. The token is signed against the source
	 * objects the set was built from, so a restored draft reports those and not the copies the draft made:
	 * a set with no source objects is a fresh one, whose files are the source objects themselves.
	 *
	 * The copies the draft made are not reported at all. Which copy a source object became is known to the
	 * server from the draft itself, and a send that could name a copy of its own would decide what leaves
	 * the message beside the set.
	 *
	 * @param {Array} sets
	 * @return {Array<{ token: string, fileIds: number[] }>}
	 */
	function buildLargeAttachmentSendContracts(sets = [])
	{
		return (Array.isArray(sets) ? sets : [])
			.filter((set) => stringify(set?.token) !== '')
			.map((set) => {
				const fileIds = (Array.isArray(set.fileIds) ? set.fileIds : []).map(Number);
				const sourceFileIds = Array.isArray(set.sourceFileIds) && set.sourceFileIds.length > 0
					? set.sourceFileIds.map(Number)
					: fileIds
				;

				return { token: String(set.token), fileIds: sourceFileIds };
			})
		;
	}

	/**
	 * The attachments of a forwarded message shaped the way the web shapes them: each one is reported by its
	 * disk object in the module storage (n<object>) with its size, so the compose form sees a set the large
	 * attachment scenario understands and converts a heavy forward the ordinary way, while a light one still
	 * attaches its files. An attachment without a disk object (the storage was unavailable when the message
	 * was loaded) is left as it is, and the send path attaches it by file id as before.
	 *
	 * The shape belongs to the scenario alone, so only a form the server marked as available may ask for it.
	 *
	 * @param {Array} files
	 * @return {Array}
	 */
	function buildForwardAttachments(files)
	{
		if (!Array.isArray(files))
		{
			return files;
		}

		return files.map((file) => {
			const objectId = Number(file?.objectId);
			if (!Number.isInteger(objectId) || objectId <= 0)
			{
				return file;
			}

			const serverFileId = `n${objectId}`;

			return {
				...file,
				id: serverFileId,
				serverFileId,
				objectId,
				fileId: Number(file.fileId) || objectId,
				size: Number(file.bytes ?? file.size) || 0,
			};
		});
	}

	/**
	 * @param {string} text
	 * @return {string}
	 */
	function encodeHtml(text)
	{
		return stringify(text)
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#039;')
		;
	}

	/**
	 * @param {string} text
	 * @return {string}
	 */
	function encodeHtmlFragment(text)
	{
		return encodeHtml(text)
			.replaceAll('\r\n', '\n')
			.replaceAll('\r', '\n')
			.split('\n')
			.join('<br>')
		;
	}

	/**
	 * @param {ServiceLink} link
	 * @return {string}
	 */
	function renderServiceLink(link)
	{
		const url = encodeHtml(link?.url);
		const title = stringify(link?.title) === '' ? url : encodeHtml(link.title);

		return `<a href="${url}">${title}</a>`;
	}

	/**
	 * @param {string} message
	 * @param {ServiceLink[]} links
	 * @param {number} position
	 * @return {?{ position: number, link: ServiceLink }}
	 */
	function findNextServiceLink(message, links, position)
	{
		return links.reduce((next, link) => {
			const linkPosition = message.indexOf(link.url, position);
			if (linkPosition === -1)
			{
				return next;
			}

			if (!next || linkPosition < next.position)
			{
				return { position: linkPosition, link };
			}

			return next;
		}, null);
	}

	/**
	 * The markup of the letter built around the service addresses it carries, or null when the body holds
	 * none of them. The plain text keeps the address itself, the markup turns it into a link with a title.
	 *
	 * @param {string} message
	 * @param {ServiceLink[]} serviceLinks
	 * @return {?string}
	 */
	function buildServiceLinkedHtml(message, serviceLinks = [])
	{
		const text = stringify(message);
		const links = (Array.isArray(serviceLinks) ? serviceLinks : [])
			.filter((link) => stringify(link?.url) !== '')
		;
		if (text === '' || links.length === 0)
		{
			return null;
		}

		let position = 0;
		let html = '';
		let hasLink = false;

		while (position < text.length)
		{
			const next = findNextServiceLink(text, links, position);
			if (!next)
			{
				break;
			}

			html += encodeHtmlFragment(text.slice(position, next.position));
			html += renderServiceLink(next.link);
			position = next.position + next.link.url.length;
			hasLink = true;
		}

		if (!hasLink)
		{
			return null;
		}

		return html + encodeHtmlFragment(text.slice(position));
	}

	module.exports = {
		getAttachmentObjectId,
		getAttachmentObjectIds,
		getAttachmentSize,
		getConvertedFileIds,
		buildSourceObjectIds,
		exceedsAttachmentLimit,
		planLargeAttachmentConversion,
		isConversionNeeded,
		findStaleLargeAttachments,
		isPublicUrlInBody,
		findOrphanedLargeAttachments,
		restoreOrphanedLargeAttachments,
		removePublicUrlFromBody,
		buildLargeAttachmentSendContracts,
		buildForwardAttachments,
		buildServiceLinkedHtml,
		encodeHtml,
		encodeHtmlFragment,
	};
});
