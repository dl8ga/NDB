import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './NodeDetail.module.css';  // ← CSS Modules
import { useDatabase } from '../../hooks/useDatabase';

const API_URL = 'http://localhost:8000';

const NodeDetail = () => {
  const { db, changeDb, setDb } = useDatabase();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [node, setNode] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [relatedNodes, setRelatedNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableDbs, setAvailableDbs] = useState([]);
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  useEffect(() => {
    fetchDatabases();
  }, []);
  
  useEffect(() => {
    if (db) {
      fetchNodeData();
    }
  }, [id, db]);
  
  const fetchDatabases = async () => {
    const res = await fetch(`${API_URL}/api/databases`);
    const data = await res.json();
    setAvailableDbs(data.databases || []);
    
    if (!db && data.databases?.length > 0) {
      setDb(data.databases[0]);  
    }
  };

  const fetchNodeData = async () => {
    if (!db) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const nodeRes = await fetch(`${API_URL}/api/database/${db}/node/${id}`);
      if (!nodeRes.ok) throw new Error(nodeRes.status === 404 ? 'Узел не найден' : 'Ошибка загрузки');
      const nodeData = await nodeRes.json();
      setNode(nodeData);

      const relRes = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: db,
          query: `MATCH (n)-[r]-(m) WHERE id(n) = '${id}' RETURN r, m`
        })
      });
      const relData = await relRes.json();
      
      const rels = [];
      const nodesMap = new Map();
      
      relData.relationships?.forEach((rel) => {
        rels.push(rel);
        const otherNodeId = rel.from === id ? rel.to : rel.from;
        const otherNode = relData.nodes?.find(n => n.id === otherNodeId);
        if (otherNode && !nodesMap.has(otherNodeId)) {
          nodesMap.set(otherNodeId, { 
            ...otherNode, 
            relType: rel.type, 
            relDirection: rel.from === id ? 'out' : 'in' 
          });
        }
      });
      
      setRelationships(rels);
      setRelatedNodes(Array.from(nodesMap.values()));
      
    } catch (err) {
      setError(err.message);
      setNode(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDbSelect = (newDb) => {
    changeDb(newDb);
    setLeftPanelOpen(false);
  };

  const handleRelatedNodeClick = (nodeId) => {
    navigate(`/node/${nodeId}`);
  };

  if (error && !node) {
    return (
      <div className={`${styles.container} ${styles.errorPage}`}>
        <div className={styles.errorContainer}>
          <h2>Ошибка</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={() => fetchNodeData()} className={styles.retryBtn}>Повторить</button>
          <Link to="/" className={styles.backLink}>← На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Левая панель */}
      <div className={`${styles.sidePanel} ${styles.left} ${leftPanelOpen ? styles.open : ''}`}>
        <div className={styles.panelHeader}>
          <h3>Базы данных</h3>
          <button className={styles.closeBtn} onClick={() => setLeftPanelOpen(false)}>×</button>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.currentDb}>
            <label>Текущая:</label>
            <span className={styles.dbName}>{db}</span>
          </div>
          <div className={styles.dbList}>
            {availableDbs.map(database => (
              <div 
                key={database} 
                className={`${styles.dbItem} ${database === db ? styles.active : ''}`}
                onClick={() => handleDbSelect(database)}
              >
                <span className={styles.dbStatusIndicator}></span>
                <span className={styles.dbName}>{database}</span>
                {database === db && <span className={styles.dbBadge}>active</span>}
              </div>
            ))}
          </div>
          <Link to="/" className={styles.navLink}>← На главную</Link>
        </div>
      </div>

      {/* Кнопка открытия левой панели */}
      {!leftPanelOpen && (
        <button 
          className={`${styles.panelToggle} ${styles.leftToggle}`}
          onClick={() => setLeftPanelOpen(true)}
          title="Базы данных"
        >
          →
        </button>
      )}

      {/* Центральная часть */}
      <div className={styles.mainContent}>
        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : node ? (
          <>
            {/* Шапка */}
            <div className={styles.headerBar}>
              <div className={styles.identity}>
                <span className={styles.nodeLabel}>{node.label}</span>
                <span className={styles.nodeId}>{node.id}</span>
              </div>
              
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Связей:</span>
                  <span className={styles.statValue}>{relationships.length}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Связанных узлов:</span>
                  <span className={styles.statValue}>{relatedNodes.length}</span>
                </div>
              </div>
            </div>

            {/* Свойства */}
            <div className={styles.content}>
              <section className={styles.propertiesSection}>
                <h2>Свойства</h2>
                <div className={styles.propertiesGrid}>
                  {Object.entries(node)
                    .filter(([k]) => !['id', 'label'].includes(k))
                    .map(([key, value]) => (
                      <div key={key} className={styles.propertyCard}>
                        <span className={styles.propKey}>{key}</span>
                        <span className={styles.propValue}>
                          {typeof value === 'object' 
                            ? JSON.stringify(value) 
                            : String(value)
                          }
                        </span>
                      </div>
                    ))}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>

      {/* Кнопка открытия правой панели */}
      {!rightPanelOpen && (
        <button 
          className={`${styles.panelToggle} ${styles.rightToggle}`}
          onClick={() => setRightPanelOpen(true)}
          title="Связанные узлы"
        >
          ←
        </button>
      )}

      {/* Правая панель */}
      <div className={`${styles.sidePanel} ${styles.right} ${rightPanelOpen ? styles.open : ''}`}>
        <div className={styles.panelHeader}>
          <h3>Связанные узлы</h3>
          <button className={styles.closeBtn} onClick={() => setRightPanelOpen(false)}>×</button>
        </div>
        <div className={styles.panelContent}>
          {relatedNodes.length === 0 ? (
            <p className={styles.emptyMessage}>Нет связей</p>
          ) : (
            <div className={styles.relatedNodesList}>
              {relatedNodes.map(relatedNode => (
                <div 
                  key={relatedNode.id}
                  className={styles.relatedNodeItem}
                  onClick={() => handleRelatedNodeClick(relatedNode.id)}
                >
                  <div className={styles.relDirection}>
                    <span className={relatedNode.relDirection === 'out' ? styles.outgoing : styles.incoming}>
                      {relatedNode.relDirection === 'out' ? '→' : '←'}
                    </span>
                    <span className={styles.relType}>{relatedNode.relType}</span>
                  </div>
                  <div className={styles.nodeInfo}>
                    <span className={styles.nodeLabel}>{relatedNode.label}</span>
                    <span className={styles.nodeIdShort}>{relatedNode.id.slice(0, 8)}...</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetail;