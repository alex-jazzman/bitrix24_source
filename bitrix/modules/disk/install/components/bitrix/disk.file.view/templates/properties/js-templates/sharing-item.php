<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die(); ?>
<script id="disk-file-view-properties-sharing-item" type="text/html">
	<div class="disk-detail-properties-owner" id="sharing-item-{{id}}" data-entity="sharing-item" data-testid="disk-detail-sharing-item" data-id="{{id}}">
		<div class="disk-detail-properties-owner-avatar" {{#entity.avatar}} style="background-image: url('{{#encodeURI}}{{entity.avatar}}{{/encodeURI}}')"{{/entity.avatar}}></div>
		<div class="disk-detail-properties-owner-name">
			<div class="disk-detail-properties-user-access-name-block">
				<a class="disk-detail-properties-owner-link" data-testid="disk-detail-sharing-item-link" href="{{entity.link}}">{{entity.name}}</a>
				{{#sharing.canDelete}}
				<div class="disk-detail-properties-user-access-remove" data-entity="sharing-item-delete" data-testid="disk-detail-sharing-item-remove"></div>
				{{/sharing.canDelete}}
			</div>
			<div class="disk-detail-properties-owner-position" {{#sharing.canChange}} data-entity="sharing-item-change-right" data-testid="disk-detail-sharing-item-right" role="button" tabindex="0" aria-haspopup="menu" {{/sharing.canChange}} >{{sharing.name}}</div>
		</div>
	</div>
</script>