type Result<T, E> = { data: T; error: null } | { data: null; error: E };

export async function toretry<T, E>(f: () => PromiseLike<Result<T, E>>): Promise<T> {
  return await retry(3, async () => {
    const { data, error } = await f();
    if (error === null) return data as T;
    throw error;
  });
}
