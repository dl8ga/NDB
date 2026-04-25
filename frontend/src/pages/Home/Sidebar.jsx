import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../../hooks/useDatabase';

const Sidebar = ({ selectedItem }) => {
  // ← useDatabase внутри компонента!
  const { db } = useDatabase();
  
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const resizeRef = useRef(null);

  const startResizing = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 200 && newWidth < 800) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // ← ОДНА функция renderValue с поддержкой ссылок
  const renderValue = (key, value, depth = 0) => {
    // Если это поле id — делаем ссылку
    if (key === 'id' && typeof value === 'string') {
      return (
        <Link 
          to={`/node/${value}?db=${db}`}
          className="node-id-link"
        >
          {value}
        </Link>
      );
    }
    
    // from/to тоже делаем ссылками
    if ((key === 'from' || key === 'to') && typeof value === 'string') {
      return (
        <Link 
          to={`/node/${value}?db=${db}`}
          className="node-id-link"
        >
          {value}
        </Link>
      );
    }
    
    // Остальные типы как раньше
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return (
        <div style={{ marginLeft: depth > 0 ? 12 : 0 }}>
          {value.map((item, idx) => (
            <div key={idx} className="array-item">
              • {renderValue(null, item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <div style={{ marginLeft: depth > 0 ? 12 : 0, fontSize: '0.9em' }}>
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="nested-property">
              <span className="property-key">{k}:</span>
              {renderValue(k, v, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    
    return String(value);
  };

  if (!selectedItem) {
    return (
      <div className="sidebar" ref={sidebarRef} style={{ width: `${sidebarWidth}px` }}>
        <div className="resize-handle" ref={resizeRef} onMouseDown={startResizing} />
        <h3>Details Panel</h3>
        <p>Select a node or edge to view details</p>
      </div>
    );
  }

  const { type, data } = selectedItem;
  
  const systemFields = type === 'node' 
    ? ['id', 'label'] 
    : ['id', 'type', 'from', 'to'];
  
  const allEntries = Object.entries(data);
  const systemEntries = allEntries.filter(([key]) => systemFields.includes(key));
  const propEntries = allEntries.filter(([key]) => !systemFields.includes(key));

  return (
    <div className="sidebar" ref={sidebarRef} style={{ width: `${sidebarWidth}px` }}>
      <div className="resize-handle" ref={resizeRef} onMouseDown={startResizing} />
      <h3>{type === 'node' ? 'Node Details' : 'Edge Details'}</h3>

      {/* Системные поля */}
      <div className="system-section">
        {systemEntries.map(([key, value]) => (
          <div key={key} className="detail-row">
            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
            <span>{renderValue(key, value)}</span>  {/* ← передаём key! */}
          </div>
        ))}
      </div>

      {/* Все остальные свойства */}
      {propEntries.length > 0 && (
        <div className="properties-section">
          <h4>Properties ({propEntries.length}):</h4>
          <div className="properties-list">
            {propEntries.map(([key, value]) => (
              <div key={key} className="property-item">
                <span className="property-key">{key}:</span>
                <span className="property-value">{renderValue(key, value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;