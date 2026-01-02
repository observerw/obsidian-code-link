export const memorize = (
	_target: unknown,
	_propertyKey: string,
	descriptor: PropertyDescriptor
): PropertyDescriptor => {
	const original = descriptor.get;
	const cache = new Map();
	descriptor.get = function () {
		if (!cache.has(this)) {
			cache.set(this, original?.call(this));
		}
		return cache.get(this);
	};
	return descriptor;
};
