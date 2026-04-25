import React, { useState, useEffect } from 'react';
// import './DatabaseSidebar.css';

function DatabaseSidebar({ isOpen, onClose, currentDatabase, onDatabaseChange }) {
    const [databases, setDatabases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [newDbName, setNewDbName] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDatabases();
        }
    }, [isOpen]);

    const fetchDatabases = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/databases');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            const dbList = data.databases || data.database || [];
            setDatabases(dbList);
        } catch (err) {
            setError(err.message);
            setDatabases(['default', 'test']);
        } finally {
            setLoading(false);
        }
    };

    const createDatabase = async (e) => {
        e.preventDefault();
        if (!newDbName.trim()) return;
        
        try {
            const response = await fetch('http://localhost:8000/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newDbName }),
            });
            
            if (response.ok) {
                setNewDbName('');
                setShowCreateForm(false);
                fetchDatabases();
                onDatabaseChange(newDbName);
            } else {
                const err = await response.json();
                setError(err.detail || 'Failed to create');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteDatabase = async (dbName) => {
        if (!confirm(`Delete database "${dbName}"?`)) return;
        
        try {
            const response = await fetch(`http://localhost:8000/api/database/${dbName}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                fetchDatabases();
                if (currentDatabase === dbName) {
                    onDatabaseChange('default');
                }
            } else {
                const err = await response.json();
                setError(err.detail || 'Failed to delete');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div className="db-sidebar-overlay" onClick={onClose}  style={{ zIndex: 9999 }} />
            )}

            {/* Sidebar */}
            <div className={`db-sidebar ${isOpen ? 'open' : ''}` } style={{ zIndex: 10000 }}>
                <div className="db-sidebar-header">
                    <h3>Databases</h3>
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="db-sidebar-content">
                    {error && (
                        <div className="db-error">
                            {error}
                            <button onClick={() => setError(null)}>×</button>
                        </div>
                    )}

                    <div className="current-db">
                        <label>Current</label>
                        <div className="current-db-name">{currentDatabase}</div>
                    </div>

                    <button 
                        className="create-db-btn"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                    >
                        {showCreateForm ? 'Cancel' : '+ New Database'}
                    </button>

                    {showCreateForm && (
                        <form onSubmit={createDatabase} className="create-db-form">
                            <input
                                type="text"
                                value={newDbName}
                                onChange={(e) => setNewDbName(e.target.value)}
                                placeholder="Database name"
                                autoFocus
                            />
                            <button type="submit">Create</button>
                        </form>
                    )}

                    <div className="db-list">
                        <label>All Databases</label>
                        {loading ? (
                            <div className="db-loading">Loading...</div>
                        ) : databases.length === 0 ? (
                            <div className="db-empty">No databases found</div>
                        ) : (
                            databases.map(db => (
                                <div 
                                    key={db}
                                    className={`db-item ${db === currentDatabase ? 'active' : 'inactive'}`}
                                >
                                    <div 
                                        className="db-item-info"
                                        onClick={() => {
                                            onDatabaseChange(db);
                                            onClose();
                                        }}
                                    >
                                        <span className="db-status-indicator" />
                                        <span className="db-name">{db}</span>
                                        {db === currentDatabase && (
                                            <span className="db-badge">active</span>
                                        )}
                                    </div>
                                    
                                    {db !== 'default' && db !== 'test' && (
                                        <button 
                                            className="db-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteDatabase(db);
                                            }}
                                            title="Delete"
                                        >
                                            🗑
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <button 
                        className="refresh-btn"
                        onClick={fetchDatabases}
                        disabled={loading}
                    >
                        {loading ? '...' : '↻ Refresh'}
                    </button>
                </div>
            </div>
        </>
    );
}

export default DatabaseSidebar;