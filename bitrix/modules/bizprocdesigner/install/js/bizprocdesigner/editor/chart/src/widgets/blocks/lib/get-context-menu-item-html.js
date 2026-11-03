// An item without a hotkey gets no caption at all: the caption is a bordered plate of its own, and an
// empty one would be drawn as a plate with nothing in it.
export function getContextMenuItemHtml(text: string, shortcut: string = ''): string
{
	const caption = shortcut === ''
		? ''
		: `
			<span class="editor-chart-block-control-menu-item__action-code">
				<span class="editor-chart-block-control-menu-item__action-code_text">
					${shortcut}
				</span>
			</span>
		`
	;

	return `
		<span class="editor-chart-block-control-menu-item">
			${text}
			${caption}
		</span>
	`;
}
