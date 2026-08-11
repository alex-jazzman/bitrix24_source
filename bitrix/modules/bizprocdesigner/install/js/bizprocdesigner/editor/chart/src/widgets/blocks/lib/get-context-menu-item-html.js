export function getContextMenuItemHtml(text: string, shortcut: string): string
{
	return `
		<span class="editor-chart-block-control-menu-item">
			${text}
			<span class="editor-chart-block-control-menu-item__action-code">
				<span class="editor-chart-block-control-menu-item__action-code_text">
					${shortcut}
				</span>
			</span>
		</span>
	`;
}
