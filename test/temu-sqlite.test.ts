import { beforeEach } from 'vitest';
import { create } from '../src';
import { expect, expectTypeOf, test } from 'vitest';

const db = create({
	entityOne: {
		type: 'string',
		email: 'string?',
	},
	entityTwo: {
		name: 'string',
		counter: 'number',
		array: 'string[]',
		verified: 'boolean?',
	},
});

beforeEach(() => {
	db.entities.delete();
});

test('Insert & list all', () => {
	db.entityTwo.insert(
		{
			array: ['one', 'two', 'three'],
			counter: 1,
			name: 'first',
			schema: 'public',
		},
		{
			array: ['four', 'five', 'six'],
			counter: 2,
			name: 'second',
			schema: 'public',
			table: 'private',
		},
	);
});
