export class VisuallyHidden extends HTMLElement
{
	connectedCallback()
	{
		Object.assign(this.style, {
			position: 'absolute',
			width: '1px',
			height: '1px',
			padding: '0',
			margin: '-1px',
			overflow: 'hidden',
			clip: 'rect(0, 0, 0, 0)',
			whiteSpace: 'nowrap',
			border: '0',
		});
	}
}

if (!customElements.get('visually-hidden'))
{
	customElements.define('visually-hidden', VisuallyHidden);
}
