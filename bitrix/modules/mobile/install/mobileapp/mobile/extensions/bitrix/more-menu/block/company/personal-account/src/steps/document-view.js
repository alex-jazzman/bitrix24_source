/**
 * @module more-menu/block/company/personal-account/src/steps/document-view
 */
jn.define('more-menu/block/company/personal-account/src/steps/document-view', (require, exports, module) => {
	const { Color, Component } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');

	const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	// Recognition thresholds are kept in step with the debug page
	// humanresources/dev/public/hcmlink-salary-vacation/index.php: both surfaces must treat the
	// same 1C value as encoded.
	const MIN_BASE64_LENGTH = 16;
	const MAX_BASE64_PADDING = 2;

	// Decoding materialises the payload twice - a byte array plus the decoded string - on the
	// main JS thread, so its cost grows with the incoming value. A measured payslip takes 30 KB
	// and MySQL caps the stored value at 65 535 bytes; only PostgreSQL leaves the size to 1C.
	// Past this ceiling - 17 times the measured payslip - the value is handed over undecoded
	// rather than spending unbounded memory and main-thread time on it.
	const MAX_DOCUMENT_LENGTH = 512 * 1024;

	const WHITESPACE_PATTERN = /\s/;

	const MIN_SURROGATE = 0xD800;
	const MAX_SURROGATE = 0xDFFF;
	const MAX_CODE_POINT = 0x10FFFF;

	/**
	 * 1C wraps its payload in line breaks, so whitespace is skipped in place. Neither a
	 * whitespace-free copy of the value nor a regular expression over it is taken: a greedy
	 * quantifier exhausts the regexp call stack on an anomalously long value, turning a
	 * rejection into a crash.
	 *
	 * @param {string} value - server-provided value, line breaks allowed
	 * @return {number[]|null} decoded bytes, or null when the value is not base64
	 */
	function decodeBase64(value)
	{
		const bytes = [];
		let buffer = 0;
		let bits = 0;
		let payloadLength = 0;
		let paddingLength = 0;

		for (let index = 0; index < value.length; index++)
		{
			const char = value.charAt(index);
			if (WHITESPACE_PATTERN.test(char))
			{
				continue;
			}

			if (char === '=')
			{
				paddingLength++;
				continue;
			}

			const sixBits = BASE64_ALPHABET.indexOf(char);
			if (sixBits === -1 || paddingLength > 0)
			{
				return null;
			}

			payloadLength++;
			buffer = ((buffer << 6) | sixBits) & 0xFFFFFF;
			bits += 6;

			if (bits >= 8)
			{
				bits -= 8;
				bytes.push((buffer >> bits) & 0xFF);
			}
		}

		// Leftover bits worth a whole base64 char mean a truncated tail.
		const isBase64 = payloadLength >= MIN_BASE64_LENGTH
			&& paddingLength <= MAX_BASE64_PADDING
			&& bits < 6;

		return isBase64 ? bytes : null;
	}

	// UTF-8 leading byte shapes: how to recognise one, how many continuation bytes follow and the
	// lowest code point the shape is allowed to carry.
	const UTF8_SHAPES = [
		{ mask: 0x80, marker: 0x00, payloadMask: 0x7F, continuationCount: 0, minCodePoint: 0x00 },
		{ mask: 0xE0, marker: 0xC0, payloadMask: 0x1F, continuationCount: 1, minCodePoint: 0x80 },
		{ mask: 0xF0, marker: 0xE0, payloadMask: 0x0F, continuationCount: 2, minCodePoint: 0x800 },
		{ mask: 0xF8, marker: 0xF0, payloadMask: 0x07, continuationCount: 3, minCodePoint: 0x10000 },
	];

	/**
	 * @param {number[]} bytes
	 * @return {string|null} decoded text, or null when the bytes are not valid UTF-8
	 */
	function decodeUtf8(bytes)
	{
		let result = '';
		let index = 0;

		while (index < bytes.length)
		{
			const leadingByte = bytes[index];
			const shape = UTF8_SHAPES.find(({ mask, marker }) => (leadingByte & mask) === marker);
			if (!shape || index + shape.continuationCount >= bytes.length)
			{
				return null;
			}

			let codePoint = leadingByte & shape.payloadMask;

			for (let offset = 1; offset <= shape.continuationCount; offset++)
			{
				const continuationByte = bytes[index + offset];
				if ((continuationByte & 0xC0) !== 0x80)
				{
					return null;
				}

				codePoint = (codePoint << 6) | (continuationByte & 0x3F);
			}

			const isOverlong = codePoint < shape.minCodePoint;
			const isSurrogate = codePoint >= MIN_SURROGATE && codePoint <= MAX_SURROGATE;
			if (isOverlong || isSurrogate || codePoint > MAX_CODE_POINT)
			{
				return null;
			}

			result += String.fromCodePoint(codePoint);
			index += shape.continuationCount + 1;
		}

		return result;
	}

	/**
	 * Full-screen document view. Renders the salary/vacation `documentHtml` in an
	 * isolated native WebView (no JS bridge, no session/token access) - safety is
	 * provided by the WebView isolation, not by server-side sanitisation. Both
	 * result types (payslip and vacation) are shown the same way.
	 *
	 * @class DocumentView
	 */
	class DocumentView extends LayoutComponent
	{
		#documentSource = null;
		#documentContent = null;

		/**
		 * @param {{ testId: string, documentHtml: string }} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: props.testId });
		}

		render()
		{
			return View(
				{
					testId: this.getTestId(),
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				WebView({
					testId: this.getTestId('webview'),
					style: {
						flex: 1,
						marginHorizontal: Component.paddingLrMore.toNumber(),
						borderRadius: 10,
					},
					scrollDisabled: false,
					data: {
						content: this.#getContent(),
						mimeType: 'text/html',
						charset: 'UTF-8',
					},
				}),
			);
		}

		/**
		 * @return {string} content for the WebView, parsed once per incoming value
		 */
		#getContent()
		{
			const { documentHtml } = this.props;

			if (this.#documentContent === null || documentHtml !== this.#documentSource)
			{
				this.#documentSource = documentHtml;
				this.#documentContent = DocumentView.wrapHtml(DocumentView.decodeDocument(documentHtml));
			}

			return this.#documentContent;
		}

		/**
		 * 1C delivers the document base64-encoded, wrapped in line breaks and often prefixed
		 * with a UTF-8 BOM. Anything that is not decodable base64 - plain markup included, and
		 * any value past MAX_DOCUMENT_LENGTH - is returned untouched.
		 *
		 * @param {string} documentHtml - server-provided document, encoded or plain
		 * @return {string}
		 */
		static decodeDocument(documentHtml)
		{
			if (typeof documentHtml !== 'string')
			{
				return '';
			}

			if (documentHtml.length > MAX_DOCUMENT_LENGTH)
			{
				return documentHtml;
			}

			const bytes = decodeBase64(documentHtml);
			const decoded = bytes === null ? null : decodeUtf8(bytes);

			return decoded === null ? documentHtml : decoded.replace(/^\uFEFF/, '');
		}

		/**
		 * @param {string} documentHtml - server-provided document, whole or fragment
		 * @return {string}
		 */
		static wrapHtml(documentHtml)
		{
			const content = typeof documentHtml === 'string' ? documentHtml : '';

			// Wrap a bare fragment; leave an already complete document untouched.
			if (/<html[\s>]/i.test(content))
			{
				return content;
			}

			return `<html><body>${content}</body></html>`;
		}
	}

	module.exports = { DocumentView };
});
