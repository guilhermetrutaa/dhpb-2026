export function optimizeCloudinaryUrl(url, { width = 820 } = {}) {
  if (!url || typeof url !== 'string') return url
  if (!url.includes('cloudinary.com') || !url.includes('/image/upload/')) return url
  if (url.includes('f_auto') || url.includes('q_auto')) return url

  const transform = `f_auto,q_auto,c_limit,w_${width}`
  return url.replace('/image/upload/', `/image/upload/${transform}/`)
}
