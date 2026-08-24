export function withoutMeta<T extends { id: string; createdAt: string }>(
  row: T,
): Omit<T, 'id' | 'createdAt'> {
  const copy = { ...row } as Partial<T>
  delete copy.id
  delete copy.createdAt
  return copy as Omit<T, 'id' | 'createdAt'>
}
