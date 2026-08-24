import type { FileRef } from './types'

const MAX_BYTES = 700_000

export async function readFileAsRef(file: File): Promise<FileRef> {
  const base: FileRef = {
    name: file.name,
    size: file.size,
    type: file.type,
  }

  if (file.size > MAX_BYTES) {
    return base
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  return { ...base, dataUrl }
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} o`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`
}
