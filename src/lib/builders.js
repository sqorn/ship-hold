'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _shipHoldQuerybuilder = require('ship-hold-querybuilder');

var _shipHoldQuerybuilder2 = _interopRequireDefault(_shipHoldQuerybuilder);

var _pgQueryStream = require('pg-query-stream');

var _pgQueryStream2 = _interopRequireDefault(_pgQueryStream);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const iterator = gen => (...args) => {
	const iter = gen(...args);
	iter.next();
	return iter;
};

const aggregateSink = iterator(function* (builder, consumer) {
	const sink = consumer();
	const [parser, ...subParsers] = [...(0, _util.createParser)(builder)];
	const currentKeyValues = new WeakMap(subParsers.map(sb => [sb, []]));
	let currentItem = null;
	let newItem = false;
	try {
		while (true) {
			const row = yield;

			if (parser.key(row) !== parser.key(currentItem)) {
				newItem = true;
				if (currentItem !== null) {
					sink.next(currentItem);
				}
				currentItem = parser.merge(row);
			}

			const diff = subParsers.filter(sp => currentKeyValues.get(sp).every(v => v !== sp.key(row)));

			for (const d of diff) {
				if (newItem === false) {
					currentItem = d.merge(row, currentItem);
				}
				const current = currentKeyValues.get(d) || [];
				currentKeyValues.set(d, current.concat(d.key(row)));
			}

			newItem = false;
		}
	} catch (e) {
		sink.throw(e);
	} finally {
		if (currentItem !== null) {
			sink.next(currentItem);
		}
		sink.return();
	}
});

exports.default = pool => {
	// Todo add async iterable.
	const runner = {
		stream(params = {}, consumer) {
			const stream = this._stream(params);
			const iter = aggregateSink(this, iterator(consumer));
			stream.on('data', row => iter.next(row));
			stream.on('error', err => iter.throw(err));
			stream.on('end', () => iter.return());
		},
		_stream(params = {}) {
			const { text, values } = this.build(params);
			const stream = new _pgQueryStream2.default(text, values);
			pool.connect().then(client => {
				const release = () => client.release();
				stream.on('end', release);
				stream.on('error', release);
				client.query(stream);
			});
			return stream;
		},
		run(params = {}) {
			const rows = [];
			return new Promise((resolve, reject) => {
				this.stream(params, function* () {
					try {
						while (true) {
							const r = yield;
							rows.push(r);
						}
					} catch (e) {
						reject(e);
					} finally {
						resolve(rows);
					}
				});
			});
		}
	};
	const delegateToBuilder = builder => (...args) => Object.assign(builder(...args), runner);
	return {
		select: delegateToBuilder(_shipHoldQuerybuilder2.default.select),
		update: delegateToBuilder(_shipHoldQuerybuilder2.default.update),
		delete: delegateToBuilder(_shipHoldQuerybuilder2.default.delete),
		insert: delegateToBuilder(_shipHoldQuerybuilder2.default.insert),
		if: (...args) => _shipHoldQuerybuilder2.default.condition().if(...args)
	};
};