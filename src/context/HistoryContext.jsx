import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchCareerHistory, fetchGuideHistory } from '../services/api';

const HistoryContext = createContext();

export function HistoryProvider({ children }) {
  const { currentIdToken } = useAuth();
  const [careerHistory, setCareerHistory] = useState([]);
  const [guideHistory, setGuideHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshHistory = async () => {
    if (!currentIdToken) return;
    try {
      const cHist = await fetchCareerHistory(currentIdToken);
      setCareerHistory(cHist);
      const gHist = await fetchGuideHistory(currentIdToken);
      setGuideHistory(gHist);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  useEffect(() => {
    refreshHistory();
  }, [currentIdToken]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <HistoryContext.Provider value={{ 
      careerHistory, 
      guideHistory, 
      sidebarOpen, 
      toggleSidebar, 
      closeSidebar,
      refreshHistory 
    }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  return useContext(HistoryContext);
}
