/* eslint-disable */
type DocumentProcessLinkOptions = {
	containerId: string;
	documentId: number;
};

declare namespace BX.Sign.V2.B2e {
	/**
	 * The line "Created by the process ..." on the page of a document of the KEDO section - the second half of
	 * the link between a document and the process that created it, the first being the deal in the timeline.
	 *
	 * The card of the document itself is a component of crm and takes nothing from outside, so the line stands
	 * on the page sign owns (Q-4).
	 */
	class DocumentProcessLink {
		static mount(options: DocumentProcessLinkOptions): Promise<void>;
	}
}
