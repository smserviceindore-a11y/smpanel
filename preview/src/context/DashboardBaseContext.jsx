import { createContext, useContext } from 'react';

/** Base path for the current dashboard panel (`/admin` or `/super-admin`). */
export const DashboardBaseContext = createContext('/admin');

export function useDashboardBase() {
  return useContext(DashboardBaseContext);
}
