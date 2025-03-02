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
			entityType: 'indexes',
		},
	});

	expect(db.entities.one()).toStrictEqual({
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
		entityType: 'columns',
	});

	expect(db.pks.one()).toStrictEqual(null);

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
		entityType: 'indexes',
	}]);

	expect(db.views.list()).toStrictEqual([]);
});

test('Insert & list multiple entities via common function', () => {
	const inFirst = db.entities.insert({
		entityType: 'columns',
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

	const inSecond = db.entities.insert({
		entityType: 'indexes',
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
			entityType: 'indexes',
		},
	});

	expect(db.entities.one()).toStrictEqual({
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
		entityType: 'columns',
	});

	expect(db.pks.one()).toStrictEqual(null);

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
		entityType: 'indexes',
	}]);
});

test('Delete specific entities via common function', () => {
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

	const delFirst = db.entities.delete({
		entityType: 'columns',
	});

	const delSecond = db.entities.delete({
		entityType: 'indexes',
		columns: [{
			value: 'user_id',
			expression: false,
		}, {
			value: 'group_id',
			expression: false,
		}],
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
		entityType: 'indexes',
	}]);
});

test('Update entities', () => {
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

	const updFirst = db.columns.update({
		set: {
			type: 'bigint',
		},
	});

	const updSecond = db.indexes.update({
		set: {
			where: 'whereExp',
			columns: (c) => {
				return {
					...c,
					expression: true,
				};
			},
		},
		where: {
			columns: {
				CONTAINS: {
					value: 'user_id',
					expression: false,
				},
			},
		},
	});

	expect(updFirst).toStrictEqual([{
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
		type: 'bigint',
		entityType: 'columns',
	}, {
		name: 'name',
		autoincrement: null,
		default: null,
		generated: null,
		notNull: true,
		primaryKey: true,
		table: 'users',
		type: 'bigint',
		entityType: 'columns',
	}]);

	expect(updSecond).toStrictEqual([{
		columns: [{
			value: 'user_id',
			expression: true,
		}, {
			value: 'group_id',
			expression: true,
		}],
		table: 'users_to_groups',
		isUnique: true,
		name: 'utg_idx',
		where: 'whereExp',
		entityType: 'indexes',
	}]);

	expect(db.entities.list()).toStrictEqual([
		{
			autoincrement: null,
			default: null,
			entityType: 'columns',
			generated: {
				as: 'identity',
				type: 'always',
			},
			name: 'id',
			notNull: true,
			primaryKey: true,
			table: 'users',
			type: 'bigint',
		},
		{
			autoincrement: null,
			default: null,
			entityType: 'columns',
			generated: null,
			name: 'name',
			notNull: true,
			primaryKey: true,
			table: 'users',
			type: 'bigint',
		},
		{
			columns: [
				{
					expression: true,
					value: 'user_id',
				},
				{
					expression: true,
					value: 'group_id',
				},
			],
			entityType: 'indexes',
			isUnique: true,
			name: 'utg_idx',
			table: 'users_to_groups',
			where: 'whereExp',
		},
		{
			columns: [
				{
					expression: false,
					value: 'group_id',
				},
			],
			entityType: 'indexes',
			isUnique: false,
			name: 'utg_g_idx',
			table: 'users_to_groups',
			where: null,
		},
	]);

	expect(db.columns.list()).toStrictEqual(
		[
			{
				autoincrement: null,
				default: null,
				entityType: 'columns',
				generated: {
					as: 'identity',
					type: 'always',
				},
				name: 'id',
				notNull: true,
				primaryKey: true,
				table: 'users',
				type: 'bigint',
			},
			{
				autoincrement: null,
				default: null,
				entityType: 'columns',
				generated: null,
				name: 'name',
				notNull: true,
				primaryKey: true,
				table: 'users',
				type: 'bigint',
			},
		],
	);

	expect(db.indexes.list()).toStrictEqual(
		[
			{
				columns: [
					{
						expression: true,
						value: 'user_id',
					},
					{
						expression: true,
						value: 'group_id',
					},
				],
				entityType: 'indexes',
				isUnique: true,
				name: 'utg_idx',
				table: 'users_to_groups',
				where: 'whereExp',
			},
			{
				columns: [
					{
						expression: false,
						value: 'group_id',
					},
				],
				entityType: 'indexes',
				isUnique: false,
				name: 'utg_g_idx',
				table: 'users_to_groups',
				where: null,
			},
		],
	);
});

test('Update entities via common function', () => {
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

	const updFirst = db.entities.update({
		set: {
			table: 'upd_tbl',
		},
	});

	const updSecond = db.entities.update({
		set: {
			name: (n) => `${n}_upd`,
		},
		where: {
			columns: [
				{
					expression: false,
					value: 'user_id',
				},
				{
					expression: false,
					value: 'group_id',
				},
			],
		},
	});

	expect(updFirst).toStrictEqual([{
		name: 'id',
		autoincrement: null,
		default: null,
		generated: {
			type: 'always',
			as: 'identity',
		},
		notNull: true,
		primaryKey: true,
		table: 'upd_tbl',
		type: 'string',
		entityType: 'columns',
	}, {
		name: 'name',
		autoincrement: null,
		default: null,
		generated: null,
		notNull: true,
		primaryKey: true,
		table: 'upd_tbl',
		type: 'string',
		entityType: 'columns',
	}, {
		columns: [{
			value: 'user_id',
			expression: false,
		}, {
			value: 'group_id',
			expression: false,
		}],
		table: 'upd_tbl',
		isUnique: true,
		name: 'utg_idx_upd',
		where: null,
		entityType: 'indexes',
	}, {
		columns: [
			{
				expression: false,
				value: 'group_id',
			},
		],
		entityType: 'indexes',
		isUnique: false,
		name: 'utg_g_idx',
		table: 'upd_tbl',
		where: null,
	}]);

	expect(updSecond).toStrictEqual([{
		columns: [{
			value: 'user_id',
			expression: false,
		}, {
			value: 'group_id',
			expression: false,
		}],
		table: 'upd_tbl',
		isUnique: true,
		name: 'utg_idx_upd',
		where: null,
		entityType: 'indexes',
	}]);

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
		table: 'upd_tbl',
		type: 'string',
		entityType: 'columns',
	}, {
		name: 'name',
		autoincrement: null,
		default: null,
		generated: null,
		notNull: true,
		primaryKey: true,
		table: 'upd_tbl',
		type: 'string',
		entityType: 'columns',
	}, {
		columns: [{
			value: 'user_id',
			expression: false,
		}, {
			value: 'group_id',
			expression: false,
		}],
		table: 'upd_tbl',
		isUnique: true,
		name: 'utg_idx_upd',
		where: null,
		entityType: 'indexes',
	}, {
		columns: [
			{
				expression: false,
				value: 'group_id',
			},
		],
		entityType: 'indexes',
		isUnique: false,
		name: 'utg_g_idx',
		table: 'upd_tbl',
		where: null,
	}]);

	expect(db.columns.list()).toStrictEqual(
		[
			{
				name: 'id',
				autoincrement: null,
				default: null,
				generated: {
					type: 'always',
					as: 'identity',
				},
				notNull: true,
				primaryKey: true,
				table: 'upd_tbl',
				type: 'string',
				entityType: 'columns',
			},
			{
				name: 'name',
				autoincrement: null,
				default: null,
				generated: null,
				notNull: true,
				primaryKey: true,
				table: 'upd_tbl',
				type: 'string',
				entityType: 'columns',
			},
		],
	);

	expect(db.indexes.list()).toStrictEqual(
		[
			{
				columns: [{
					value: 'user_id',
					expression: false,
				}, {
					value: 'group_id',
					expression: false,
				}],
				table: 'upd_tbl',
				isUnique: true,
				name: 'utg_idx_upd',
				where: null,
				entityType: 'indexes',
			},
			{
				columns: [
					{
						expression: false,
						value: 'group_id',
					},
				],
				entityType: 'indexes',
				isUnique: false,
				name: 'utg_g_idx',
				table: 'upd_tbl',
				where: null,
			},
		],
	);
});

test('List with filters', () => {
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

	const listFirst = db.columns.list();

	const listSecond = db.indexes.list({
		columns: {
			CONTAINS: {
				value: 'user_id',
				expression: false,
			},
		},
	});

	expect(listFirst).toStrictEqual([{
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
		entityType: 'columns',
	}]);

	expect(listSecond).toStrictEqual([{
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
		entityType: 'indexes',
	}]);
});

test('List via common function with filters', () => {
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

	const listFirst = db.entities.list({
		entityType: 'columns',
	});

	const listSecond = db.entities.list({
		entityType: 'indexes',
		columns: [{
			value: 'user_id',
			expression: false,
		}, {
			value: 'group_id',
			expression: false,
		}],
	});

	expect(listFirst).toStrictEqual([{
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
		entityType: 'columns',
	}]);

	expect(listSecond).toStrictEqual([{
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

	const res = diff.alters(original, changed, 'column');

	expect(diff.all(original, changed, 'column')).toStrictEqual([{
		$diffType: 'alter',
		entityType: 'column',
		table: 'user',
		name: 'name',
		type: {
			from: 'varchar',
			to: 'text',
		},
	}]);
	expect(diff.all(original, changed)).toStrictEqual([{
		$diffType: 'alter',
		entityType: 'column',
		table: 'user',
		name: 'name',
		type: {
			from: 'varchar',
			to: 'text',
		},
	}]);
	expect(diff.drops(original, changed, 'column')).toStrictEqual([]);
	expect(diff.drops(original, changed)).toStrictEqual([]);
	expect(diff.alters(original, changed, 'column')).toStrictEqual([{
		$diffType: 'alter',
		entityType: 'column',
		table: 'user',
		name: 'name',
		type: {
			from: 'varchar',
			to: 'text',
		},
	}]);
	expect(diff.alters(original, changed)).toStrictEqual([{
		$diffType: 'alter',
		entityType: 'column',
		table: 'user',
		name: 'name',
		type: {
			from: 'varchar',
			to: 'text',
		},
	}]);
	expect(diff.creates(original, changed, 'column')).toStrictEqual([]);
	expect(diff.creates(original, changed)).toStrictEqual([]);

	expect(res).toStrictEqual([{
		$diffType: 'alter',
		entityType: 'column',
		table: 'user',
		name: 'name',
		type: {
			from: 'varchar',
			to: 'text',
		},
	}]);
});

test('diff: update object', () => {
	const cfg = {
		column: {
			type: 'string',
			pk: 'boolean?',
			table: 'required',
			obj: {
				subfield: 'string',
				subArr: 'string[]',
			},
		},
	} as const;

	const original = create(cfg);
	const changed = create(cfg);

	original.column.insert({
		name: 'id',
		type: 'serial',
		pk: true,
		table: 'user',
		obj: {
			subArr: ['s3', 's4'],
			subfield: 'sf_value_upd',
		},
	});
	original.column.insert({
		name: 'name',
		type: 'varchar',
		pk: false,
		table: 'user',
		obj: {
			subArr: ['s1', 's2'],
			subfield: 'sf_value',
		},
	});

	changed.column.insert({
		name: 'id',
		type: 'serial',
		pk: true,
		table: 'user',
		obj: null,
	});
	changed.column.insert({
		name: 'name',
		type: 'text',
		pk: false,
		table: 'user',
		obj: {
			subArr: ['s3', 's4'],
			subfield: 'sf_value',
		},
	});

	const res = diff.alters(original, changed, 'column');

	expect(res).toStrictEqual([{
		$diffType: 'alter',
		entityType: 'column',
		table: 'user',
		name: 'id',
		obj: {
			from: {
				subArr: ['s3', 's4'],
				subfield: 'sf_value_upd',
			},
			to: null,
		},
	}, {
		$diffType: 'alter',
		entityType: 'column',
		table: 'user',
		name: 'name',
		type: {
			from: 'varchar',
			to: 'text',
		},
		obj: {
			from: {
				subArr: ['s1', 's2'],
				subfield: 'sf_value',
			},
			to: {
				subArr: ['s3', 's4'],
				subfield: 'sf_value',
			},
		},
	}]);
});

test('diff: update object array', () => {
	const original = create({
		column: {
			type: 'string',
			pk: 'boolean?',
			table: 'required',
			obj: [{
				subfield: 'string',
				subArr: 'string[]',
			}],
		},
	});
	const changed = create({
		column: {
			type: 'string',
			pk: 'boolean?',
			table: 'required',
			obj: [{
				subfield: 'string',
				subArr: 'string[]',
			}],
		},
	});

	original.column.insert({
		name: 'id',
		type: 'serial',
		pk: true,
		table: 'user',
		obj: [{
			subArr: ['s3', 's4'],
			subfield: 'sf_value',
		}],
	});
	original.column.insert({
		name: 'name',
		type: 'varchar',
		pk: false,
		table: 'user',
		obj: [{
			subArr: ['s1', 's2'],
			subfield: 'sf_value',
		}],
	});

	changed.column.insert({
		name: 'id',
		type: 'serial',
		pk: true,
		table: 'user',
		obj: [{
			subArr: ['s3', 's4'],
			subfield: 'sf_value',
		}, {
			subArr: ['s1', 's2'],
			subfield: 'sf_value',
		}],
	});
	changed.column.insert({
		name: 'name',
		type: 'text',
		pk: false,
		table: 'user',
		obj: [{
			subArr: ['s1', 's2'],
			subfield: 'sf_value_upd',
		}],
	});

	const res = diff.alters(original, changed, 'column');

	expect(res).toStrictEqual([{
		$diffType: 'alter',
		entityType: 'column',
		table: 'user',
		name: 'id',
		obj: {
			from: [{
				subArr: ['s3', 's4'],
				subfield: 'sf_value',
			}],
			to: [{
				subArr: ['s3', 's4'],
				subfield: 'sf_value',
			}, {
				subArr: ['s1', 's2'],
				subfield: 'sf_value',
			}],
		},
	}, {
		$diffType: 'alter',
		entityType: 'column',
		table: 'user',
		name: 'name',
		type: {
			from: 'varchar',
			to: 'text',
		},
		obj: {
			from: [{
				subArr: ['s1', 's2'],
				subfield: 'sf_value',
			}],
			to: [{
				subArr: ['s1', 's2'],
				subfield: 'sf_value_upd',
			}],
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

	expect(diff.all(original, changed, 'column')).toStrictEqual([{
		$diffType: 'create',
		entityType: 'column',
		name: 'name',
		table: 'user',
		type: 'varchar',
		pk: false,
	}]);
	expect(diff.all(original, changed)).toStrictEqual([{
		$diffType: 'create',
		entityType: 'column',
		name: 'name',
		table: 'user',
		type: 'varchar',
		pk: false,
	}]);
	expect(diff.drops(original, changed, 'column')).toStrictEqual([]);
	expect(diff.drops(original, changed)).toStrictEqual([]);
	expect(diff.alters(original, changed, 'column')).toStrictEqual([]);
	expect(diff.alters(original, changed)).toStrictEqual([]);
	expect(diff.creates(original, changed, 'column')).toStrictEqual([{
		$diffType: 'create',
		entityType: 'column',
		name: 'name',
		table: 'user',
		type: 'varchar',
		pk: false,
	}]);
	expect(diff.creates(original, changed)).toStrictEqual([{
		$diffType: 'create',
		entityType: 'column',
		name: 'name',
		table: 'user',
		type: 'varchar',
		pk: false,
	}]);

	expect(res).toStrictEqual([{
		$diffType: 'create',
		entityType: 'column',
		name: 'name',
		table: 'user',
		type: 'varchar',
		pk: false,
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

	expect(diff.all(original, changed, 'column')).toStrictEqual([{
		$diffType: 'drop',
		entityType: 'column',
		name: 'name',
		table: 'user',
		type: 'varchar',
		pk: false,
	}]);
	expect(diff.all(original, changed)).toStrictEqual([{
		$diffType: 'drop',
		entityType: 'column',
		name: 'name',
		table: 'user',
		type: 'varchar',
		pk: false,
	}]);
	expect(diff.drops(original, changed, 'column')).toStrictEqual([{
		$diffType: 'drop',
		entityType: 'column',
		name: 'name',
		table: 'user',
		type: 'varchar',
		pk: false,
	}]);
	expect(diff.drops(original, changed)).toStrictEqual([{
		$diffType: 'drop',
		entityType: 'column',
		name: 'name',
		table: 'user',
		type: 'varchar',
		pk: false,
	}]);
	expect(diff.alters(original, changed, 'column')).toStrictEqual([]);
	expect(diff.alters(original, changed)).toStrictEqual([]);
	expect(diff.creates(original, changed, 'column')).toStrictEqual([]);
	expect(diff.creates(original, changed)).toStrictEqual([]);

	expect(res).toStrictEqual([{
		$diffType: 'drop',
		entityType: 'column',
		name: 'name',
		table: 'user',
		type: 'varchar',
		pk: false,
	}]);
});
