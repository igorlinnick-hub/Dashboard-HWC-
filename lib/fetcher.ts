/** Global SWR fetcher — used by all pages */
export const fetcher = (url: string) => fetch(url).then((res) => res.json());
