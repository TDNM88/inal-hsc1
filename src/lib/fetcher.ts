export const fetcher = (url: string) => {
  const token = localStorage.getItem("token")
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}
