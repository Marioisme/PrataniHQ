import React, { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  folderName: string | null;
  onConnectFolder: () => void;
  onRefreshData?: () => void;
  onOpenAddModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  folderName,
  onConnectFolder,
  onRefreshData,
  onOpenAddModal
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>('—');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentDateTime(`${dateStr} • ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div className="page-title">{title}</div>

      <div className="topbar-right">
        {/* Date badge matching standalone */}
        <div className="date-badge">{currentDateTime}</div>

        {/* Data folder indicator */}
        {folderName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="folder-path" title={folderName}>
              📂 {folderName}
            </span>
            {onRefreshData && (
              <button
                className="folder-btn-mini btn-refresh"
                onClick={onRefreshData}
                title="Refresh Data"
                style={{ padding: '3px 8px', height: '26px' }}
              >
                🔄
              </button>
            )}
          </div>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onConnectFolder}
            style={{ color: 'var(--yellow)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
          >
            📁 Hubungkan Folder
          </button>
        )}

        {/* Action Button */}
        {onOpenAddModal && (
          <button className="btn btn-primary btn-sm" onClick={onOpenAddModal}>
            + Catat Transaksi
          </button>
        )}
      </div>
    </header>
  );
};
