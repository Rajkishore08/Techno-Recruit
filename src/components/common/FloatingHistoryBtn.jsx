import React from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { useHistory } from '../../context/HistoryContext';

export default function FloatingHistoryBtn() {
  const { toggleSidebar, sidebarOpen } = useHistory();

  if (sidebarOpen) return null;

  return (
    <button className="floating-history-btn" onClick={toggleSidebar} title="View Saved Sessions">
      <HistoryIcon size={16} />
      <span>History</span>
    </button>
  );
}
