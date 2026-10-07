/** A link to a page of this site that still works when it's deployed under a sub-path (`/lidar/privacy`). */
export const pagePath = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;
