import { createContext, useContext } from 'react';
const AppContext = createContext();
export const AppProvider = ({ children }) => (
  <AppContext.Provider value={{}}>{children}</AppContext.Provider>
);
export const useApp = () => useContext(AppContext);