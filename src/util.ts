export const floor = (n: number, ndigits: number): number => {
  const shift = Math.pow(10, ndigits)
  return Math.floor(n * shift) / shift
}
