import React, { useCallback, useState } from 'react';
import GraphVisualization from './GraphVisualization.jsx'
import SearchSection from './SearchSection.jsx';
import Sidebar from './Sidebar.jsx';
import DatabaseSidebar from './DatabaseSidebar.jsx';
import { useDatabase } from '../../hooks/useDatabase.js';

function Home() {
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
    const [selectedItem, setSelectedItem] = useState(null);
    const [error, setError] = useState(null);
    const [searchResults, setSearchResults] = useState(null);
    const [activeTab, setActiveTab] = useState('graph');
    const [searchLoading, setSearchLoading] = useState(false);
    const [database, setDatabase] = useState('default');
    const [isDbSidebarOpen, setIsDbSidebarOpen] = useState(false);

    const handleSearch = async (query) => {
        if (!query.trim()) return;
        setSearchLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    database: database,
                    query: query 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const formattedData = {
                nodes: data.nodes || [],
                edges: data.relationships || []
            };

            setGraphData(formattedData);
            setSearchResults(data);

            const hasNodes = formattedData.nodes.length > 0;
            const hasEdges = formattedData.edges.length > 0;
            if (!hasNodes && !hasEdges) setActiveTab('table');
        } catch (err) {
            setError(err.message);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleNodeSelect = useCallback((nodeData) => {
        setSelectedItem(nodeData === null ? null : { type: 'node', data: nodeData });
    }, []);

    const handleEdgeSelect = useCallback((edgeData) => {
        setSelectedItem(edgeData ? { type: 'edge', data: edgeData } : null);
    }, []);

    const openDatabaseSidebar = () => setIsDbSidebarOpen(true);
    const closeDatabaseSidebar = () => setIsDbSidebarOpen(false);

    return (
        <div className="app-container">
            {/* Сайдбар без кнопки - управляется извне */}
            <DatabaseSidebar 
                isOpen={isDbSidebarOpen}
                onClose={closeDatabaseSidebar}
                currentDatabase={database}
                onDatabaseChange={setDatabase}
            />

            <div className="search-and-tabs-container">
                <div className="search-header">
                    <SearchSection 
                        onSearch={handleSearch}
                        onOpenDatabaseSidebar={openDatabaseSidebar}
                        currentDatabase={database}
                    />
                </div>
                
                <div className="tab-switch-container">
                    <div 
                        className={`tab-switch ${activeTab === 'graph' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('graph')}
                    >
                        Graph ({graphData.nodes.length})
                    </div>
                    <div 
                        className={`tab-switch ${activeTab === 'table' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('table')}
                    >
                        Table
                    </div>
                </div>
            </div>

            {error && <div className="error-banner">Error: {error}</div>}

            <div className="main-content">
                <div className="visualization-container">
                    {searchLoading ? (
                        <div className="search-loading">Searching...</div>
                    ) : (
                        <>
                            {activeTab === 'graph' ? (
                                <GraphVisualization
                                    data={graphData}
                                    onNodeSelect={handleNodeSelect}
                                    onEdgeSelect={handleEdgeSelect}
                                />
                            ) : (
                                <div className="table-visualization">
                                    <h3>Search Results</h3>
                                    {searchResults ? (
                                        <div className="results-container">
                                            {searchResults.nodes?.length > 0 && (
                                                <div className="results-section">
                                                    <h4>Nodes ({searchResults.nodes.length})</h4>
                                                    <table className="results-table">
                                                        <thead>
                                                            <tr>
                                                                <th>ID</th>
                                                                <th>Label</th>
                                                                <th>Name</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {[...new Map(searchResults.nodes.map(n => [n.id, n])).values()]  // ← убираем дубликаты
                                                              .map((node) => (
                                                              <tr
                                                                  key={node.id}
                                                                  onClick={() => setSelectedItem({ type: 'node', data: node })}
                                                                  className="table-row-clickable"
                                                              >
                                                                  <td>{node.id}</td>
                                                                  <td>{node.label}</td>
                                                                  <td>{node.name || 'N/A'}</td>
                                                              </tr>
                                                          ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            
                                            {searchResults.relationships?.length > 0 && (
                                                <div className="results-section">
                                                    <h4>Relationships ({searchResults.relationships.length})</h4>
                                                    <table className="results-table">
                                                        <thead>
                                                            <tr>
                                                                <th>ID</th>
                                                                <th>From</th>
                                                                <th>To</th>
                                                                <th>Type</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {[...new Map(searchResults.relationships.map(r => [r.id, r])).values()]  // ← убираем дубликаты
                                                                .map((rel) => (
                                                                <tr
                                                                    key={rel.id}
                                                                    onClick={() => setSelectedItem({ type: 'edge', data: rel })}
                                                                    className="table-row-clickable"
                                                                >
                                                                    <td>{rel.id}</td>
                                                                    <td>{rel.from}</td>
                                                                    <td>{rel.to}</td>
                                                                    <td>{rel.type}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            
                                            {!searchResults.nodes?.length && !searchResults.relationships?.length && (
                                                <p>No results found</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p>Run a search to see results</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
                <Sidebar selectedItem={selectedItem} />
            </div>
        </div>
    );
}

export default Home;