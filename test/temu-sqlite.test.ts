import { beforeEach } from 'vitest';
import { expect, expectTypeOf, test } from 'vitest';
import { create, diff } from '../src';

const db = create({
	tables: {},
	columns: {
		table: 'required',
		type: 'string',
		primaryKey: 'boolean',
		notNull: 'boolean',
		autoincrement: 'boolean?',
		default: 'string?',
		generated: {
			type: 'string',
			as: 'string',
		},
	},
	indexes: {
		table: 'required',
		columns: [{
			value: 'string',
			expression: 'boolean',
		}],
		isUnique: 'boolean',
		where: 'string?',
	},
	fks: {
		table: 'required',
		tableFrom: 'string',
		columnsFrom: 'string[]',
		tableTo: 'string',
		columnsTo: 'string[]',
		onUpdate: 'string?',
		onDelete: 'string?',
	},
	pks: {
		table: 'required',
		columns: 'string[]',
	},
	uniques: {
		table: 'required',
		columns: 'string[]',
	},
	checks: {
		table: 'required',
		value: 'string',
	},
	views: {
		definition: 'string?',
		isExisting: 'boolean',
	},
	viewColumns: {},
});

beforeEach(() => {
	db.entities.delete();
});

test('Insert & list multiple entities', () => {
	const inFirst = db.columns.insert({
		name: 'id',
		autoincrement: null,
		default: null,
		generated: {
			type: 'always',
			as: 'identity',
		},
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'string',
	});

	const inSecond = db.indexes.insert({
		columns: [{
			value: 'user_id',
			expression: false,
		}, {
			value: 'group_id',
			expression: false,
		}],
		table: 'users_to_groups',
		isUnique: true,
		name: 'utg_idx',
		where: null,
	});

	expect(inFirst).toStrictEqual({
		status: 'OK',
		data: {
			name: 'id',
			autoincrement: null,
			default: null,
			generated: {
				type: 'always',
				as: 'identity',
			},
			notNull: true,
			primaryKey: true,
			table: 'users',
			type: 'string',
			schema: null,
			entityType: 'columns',
		},
	});

	expect(inSecond).toStrictEqual({
		status: 'OK',
		data: {
			columns: [{
				value: 'user_id',
				expression: false,
			}, {
				value: 'group_id',
				expression: false,
			}],
			table: 'users_to_groups',
			isUnique: true,
			name: 'utg_idx',
			where: null,
			schema: null,
			entityType: 'indexes',
		},
	});

	expect(db.entities.list()).toStrictEqual([{
		name: 'id',
		autoincrement: null,
		default: null,
		generated: {
			type: 'always',
			as: 'identity',
		},
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'string',
		schema: null,
		entityType: 'columns',
	}, {
		columns: [{
			value: 'user_id',
			expression: false,
		}, {
			value: 'group_id',
			expression: false,
		}],
		table: 'users_to_groups',
		isUnique: true,
		name: 'utg_idx',
		where: null,
		schema: null,
		entityType: 'indexes',
	}]);

	expect(db.columns.list()).toStrictEqual([{
		name: 'id',
		autoincrement: null,
		default: null,
		generated: {
			type: 'always',
			as: 'identity',
		},
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'string',
		schema: null,
		entityType: 'columns',
	}]);

	expect(db.indexes.list()).toStrictEqual([{
		columns: [{
			value: 'user_id',
			expression: false,
		}, {
			value: 'group_id',
			expression: false,
		}],
		table: 'users_to_groups',
		isUnique: true,
		name: 'utg_idx',
		where: null,
		schema: null,
		entityType: 'indexes',
	}]);

	expect(db.views.list()).toStrictEqual([]);
});

test('Insert with common hash conflict', () => {
	const inFirst = db.columns.insert({
		name: 'id',
		autoincrement: null,
		default: null,
		generated: {
			type: 'always',
			as: 'identity',
		},
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'string',
	});

	const inSecond = db.columns.insert({
		name: 'id',
		autoincrement: null,
		default: null,
		generated: null,
		notNull: false,
		primaryKey: false,
		table: 'users',
		type: 'text',
	});

	expect(inFirst).toStrictEqual({
		status: 'OK',
		data: {
			name: 'id',
			autoincrement: null,
			default: null,
			generated: {
				type: 'always',
				as: 'identity',
			},
			notNull: true,
			primaryKey: true,
			table: 'users',
			type: 'string',
			schema: null,
			entityType: 'columns',
		},
	});

	expect(inSecond).toStrictEqual({
		status: 'CONFLICT',
		data: {
			name: 'id',
			autoincrement: null,
			default: null,
			generated: {
				type: 'always',
				as: 'identity',
			},
			notNull: true,
			primaryKey: true,
			table: 'users',
			type: 'string',
			schema: null,
			entityType: 'columns',
		},
	});

	expect(db.entities.list()).toStrictEqual([{
		name: 'id',
		autoincrement: null,
		default: null,
		generated: {
			type: 'always',
			as: 'identity',
		},
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'string',
		schema: null,
		entityType: 'columns',
	}]);

	expect(db.columns.list()).toStrictEqual([{
		name: 'id',
		autoincrement: null,
		default: null,
		generated: {
			type: 'always',
			as: 'identity',
		},
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'string',
		schema: null,
		entityType: 'columns',
	}]);
});

test('Delete specific entities', () => {
	db.columns.insert({
		name: 'id',
		autoincrement: null,
		default: null,
		generated: {
			type: 'always',
			as: 'identity',
		},
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'string',
	});

	db.columns.insert({
		name: 'name',
		autoincrement: null,
		default: null,
		generated: null,
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'string',
	});

	db.indexes.insert({
		columns: [{
			value: 'user_id',
			expression: false,
		}, {
			value: 'group_id',
			expression: false,
		}],
		table: 'users_to_groups',
		isUnique: true,
		name: 'utg_idx',
		where: null,
	});

	db.indexes.insert({
		columns: [{
			value: 'group_id',
			expression: false,
		}],
		table: 'users_to_groups',
		isUnique: false,
		name: 'utg_g_idx',
		where: null,
	});

	const delFirst = db.columns.delete();

	const delSecond = db.indexes.delete({
		columns: {
			CONTAINS: {
				value: 'user_id',
				expression: false,
			},
		},
	});

	expect(delFirst).toStrictEqual([{
		name: 'id',
		autoincrement: null,
		default: null,
		generated: {
			type: 'always',
			as: 'identity',
		},
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'string',
		schema: null,
		entityType: 'columns',
	}, {
		name: 'name',
		autoincrement: null,
		default: null,
		generated: null,
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'string',
		schema: null,
		entityType: 'columns',
	}]);

	expect(delSecond).toStrictEqual([{
		columns: [{
			value: 'user_id',
			expression: false,
		}, {
			value: 'group_id',
			expression: false,
		}],
		table: 'users_to_groups',
		isUnique: true,
		name: 'utg_idx',
		where: null,
		schema: null,
		entityType: 'indexes',
	}]);

	expect(db.entities.list()).toStrictEqual([{
		columns: [{
			value: 'group_id',
			expression: false,
		}],
		table: 'users_to_groups',
		isUnique: false,
		name: 'utg_g_idx',
		where: null,
		schema: null,
		entityType: 'indexes',
	}]);

	expect(db.columns.list()).toStrictEqual([]);

	expect(db.indexes.list()).toStrictEqual([{
		columns: [{
			value: 'group_id',
			expression: false,
		}],
		table: 'users_to_groups',
		isUnique: false,
		name: 'utg_g_idx',
		where: null,
		schema: null,
		entityType: 'indexes',
	}]);
});

test('diff: update', () => {
	const cfg = {
		column: {
			type: 'string',
			pk: 'boolean?',
			table: 'required',
		},
	} as const;

	const original = create(cfg);
	const changed = create(cfg);

	original.column.insert({
		name: 'id',
		type: 'serial',
		pk: true,
		table: 'user',
	});
	original.column.insert({
		name: 'name',
		type: 'varchar',
		pk: false,
		table: 'user',
	});

	changed.column.insert({
		name: 'id',
		type: 'serial',
		pk: true,
		table: 'user',
	});
	changed.column.insert({
		name: 'name',
		type: 'text',
		pk: false,
		table: 'user',
	});

	const res = diff(original, changed, 'column', false);

	expect(res).toStrictEqual([{
		type: 'update',
		entityType: 'column',
		schema: null,
		table: 'user',
		name: 'name',
		changes: {
			type: {
				from: 'varchar',
				to: 'text',
			},
		},
	}]);
});

test('diff: insert', () => {
	const cfg = {
		column: {
			type: 'string',
			pk: 'boolean?',
			table: 'required',
		},
	} as const;

	const original = create(cfg);
	const changed = create(cfg);

	original.column.insert({
		name: 'id',
		type: 'serial',
		pk: true,
		table: 'user',
	});

	changed.column.insert({
		name: 'id',
		type: 'serial',
		pk: true,
		table: 'user',
	});
	changed.column.insert({
		name: 'name',
		type: 'varchar',
		pk: false,
		table: 'user',
	});

	const res = diff(original, changed, 'column');

	expect(res).toStrictEqual([{
		type: 'insert',
		entityType: 'column',
		name: 'name',
		schema: null,
		table: 'user',
		row: {
			type: 'varchar',
			pk: false,
		},
	}]);
});

test('diff: delete', () => {
	const cfg = {
		column: {
			type: 'string',
			pk: 'boolean?',
			table: 'required',
		},
	} as const;

	const original = create(cfg);
	const changed = create(cfg);

	original.column.insert({
		name: 'id',
		type: 'serial',
		pk: true,
		table: 'user',
	});
	original.column.insert({
		name: 'name',
		type: 'varchar',
		pk: false,
		table: 'user',
	});

	changed.column.insert({
		name: 'id',
		type: 'serial',
		pk: true,
		table: 'user',
	});
	const res = diff(original, changed, 'column');

	expect(res).toStrictEqual([{
		type: 'delete',
		entityType: 'column',
		name: 'name',
		table: 'user',
		schema: null,
		row: {
			type: 'varchar',
			pk: false,
		},
	}]);
});
