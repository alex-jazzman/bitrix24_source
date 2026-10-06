<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_documentgenerator_template')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->char('ACTIVE', 1)->notNull()->default('Y');
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 50);
	$columns->varchar('REGION', 50);
	$columns->int('SORT')->notNull()->default('500');
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->datetime('UPDATE_TIME');
	$columns->int('CREATED_BY');
	$columns->int('UPDATED_BY');
	$columns->varchar('MODULE_ID', 50)->notNull();
	$columns->int('FILE_ID')->notNull();
	$columns->varchar('BODY_TYPE', 255)->notNull();
	$columns->int('NUMERATOR_ID');
	$columns->char('WITH_STAMPS', 1)->notNull()->default('N');
	$columns->char('PRODUCTS_TABLE_VARIANT', 7)->notNull()->default('');
	$columns->char('IS_DELETED', 1)->notNull()->default('N');
	$columns->char('IS_DEFAULT', 1)->notNull()->default('N');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_documentgenerator_template_file', ['FILE_ID']);
});

$migration->table('b_documentgenerator_template_provider')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('PROVIDER', 255)->notNull();
	$table->addUniqueIndex('ux_docgen_templ_ent', ['TEMPLATE_ID', 'PROVIDER']);
	$table->addIndex('ux_docgen_templ_ent_type', ['PROVIDER']);
});

$migration->table('b_documentgenerator_template_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 100);
	$table->addUniqueIndex('ux_docgen_templ_users', ['TEMPLATE_ID', 'ACCESS_CODE']);
	$table->addIndex('ux_docgen_templ_users_code', ['ACCESS_CODE']);
});

$migration->table('b_documentgenerator_field')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('TEMPLATE_ID');
	$columns->varchar('TITLE', 50);
	$columns->varchar('PLACEHOLDER', 255)->notNull();
	$columns->varchar('PROVIDER', 255);
	$columns->varchar('PROVIDER_NAME', 255);
	$columns->text('VALUE');
	$columns->char('REQUIRED', 1)->notNull()->default('N');
	$columns->char('HIDE_ROW', 1)->notNull()->default('N');
	$columns->varchar('TYPE', 255);
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->datetime('UPDATE_TIME');
	$columns->int('CREATED_BY');
	$columns->int('UPDATED_BY');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_docgen_field_ph', ['PLACEHOLDER']);
	$table->addUniqueIndex('ux_docgen_field_templ_ph', ['TEMPLATE_ID', 'PLACEHOLDER']);
});

$migration->table('b_documentgenerator_spreadsheet')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('FIELD_ID')->notNull();
	$columns->varchar('TITLE', 50);
	$columns->varchar('PLACEHOLDER', 255);
	$columns->varchar('PROVIDER_NAME', 255);
	$columns->text('VALUE');
	$columns->int('SORT')->notNull()->default('500');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_docgen_spr_field', ['FIELD_ID']);
});

$migration->table('b_documentgenerator_document')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->varchar('NUMBER', 255)->notNull();
	$columns->int('TEMPLATE_ID')->notNull();
	$columns->varchar('PROVIDER', 255)->notNull();
	$columns->text('VALUE')->notNull();
	$columns->int('FILE_ID')->notNull();
	$columns->int('IMAGE_ID');
	$columns->int('PDF_ID');
	$columns->datetime('CREATE_TIME')->notNull();
	$columns->datetime('UPDATE_TIME')->notNull();
	$columns->int('CREATED_BY');
	$columns->int('UPDATED_BY');
	$columns->text('VALUES');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_docgen_doc_templ_val', ['TEMPLATE_ID', 'VALUE(10)']);
	$table->addIndex('ix_docgen_doc_val_prov', ['VALUE(10)', 'PROVIDER']);
	$table->addIndex('ix_docgen_doc_file', ['FILE_ID']);
	$table->addIndex('ix_documentgenerator_document_image', ['IMAGE_ID']);
	$table->addIndex('ix_documentgenerator_document_pdf', ['PDF_ID']);
});

$migration->table('b_documentgenerator_file')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('STORAGE_TYPE', 255)->notNull();
	$columns->varchar('STORAGE_WHERE', 255)->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_documentgenerator_external_link')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('DOCUMENT_ID')->notNull();
	$columns->varchar('HASH', 32)->notNull();
	$columns->datetime('VIEWED_TIME');
	$table->addPrimaryKey('ID');
	$table->addIndex('ix_docgen_ext_link_doc', ['DOCUMENT_ID']);
	$table->addIndex('ix_docgen_ext_link_hash', ['HASH']);
});

$migration->table('b_documentgenerator_region')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->varchar('TITLE', 255)->notNull();
	$columns->char('LANGUAGE_ID', 2);
	$columns->varchar('FORMAT_DATE', 255);
	$columns->varchar('FORMAT_DATETIME', 255);
	$columns->varchar('FORMAT_NAME', 255);
	$table->addPrimaryKey('ID');
});

$migration->table('b_documentgenerator_region_phrase')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('REGION_ID')->notNull();
	$columns->varchar('CODE', 255)->notNull();
	$columns->text('PHRASE');
	$table->addPrimaryKey('ID');
});

$migration->table('b_documentgenerator_role')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->varchar('NAME', 255)->notNull();
	$columns->varchar('CODE', 255);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DOCGEN_PERM_CODE', ['CODE']);
});

$migration->table('b_documentgenerator_role_permission')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ROLE_ID')->notNull();
	$columns->varchar('ENTITY', 50)->notNull();
	$columns->varchar('ACTION', 50)->notNull();
	$columns->char('PERMISSION', 1);
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DOCGEN_PERM_ROLE_ID', ['ROLE_ID']);
});

$migration->table('b_documentgenerator_role_access')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->notNull()->autoincrement();
	$columns->int('ROLE_ID')->notNull();
	$columns->varchar('ACCESS_CODE', 100)->notNull();
	$table->addPrimaryKey('ID');
	$table->addIndex('IX_DOCGEN_ACCESS_ROLE_ID', ['ROLE_ID']);
});

$migration->table('b_documentgenerator_document_binding')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('ID')->unsigned()->notNull()->autoincrement();
	$columns->int('DOCUMENT_ID')->unsigned()->notNull();
	$columns->varchar('ENTITY_NAME', 255)->notNull();
	$columns->int('ENTITY_ID')->notNull();
	$table->addPrimaryKey('ID');
});

$migration->table('b_documentgenerator_actualize_queue')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$columns = $table->addColumn();
	$columns->int('DOCUMENT_ID')->unsigned()->notNull();
	$columns->datetime('ADDED_TIME')->notNull();
	$columns->int('USER_ID')->unsigned();
	$table->addPrimaryKey('DOCUMENT_ID');
});
