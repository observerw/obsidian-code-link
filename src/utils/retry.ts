export async function withRetry<T>(
	fn: () => Promise<T>,
	retries = 3,
	delay = 1000,
	signal?: AbortSignal
): Promise<T> {
	try {
		if (signal?.aborted) {
			throw new Error("aborted");
		}
		return await fn();
	} catch (e) {
		if (retries <= 0 || (e instanceof Error && e.message === "aborted")) throw e;
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(resolve, delay);
			signal?.addEventListener("abort", () => {
				clearTimeout(timeout);
				reject(new Error("aborted"));
			}, { once: true });
		});
		return withRetry(fn, retries - 1, delay * 2, signal);
	}
}
