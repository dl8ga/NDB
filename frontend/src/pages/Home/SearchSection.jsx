import React, { useState, useRef, useEffect } from 'react';

const SearchSection = ({ onSearch, onOpenDatabaseSidebar, currentDatabase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const textareaRef = useRef(null);
  const hiddenDivRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current && hiddenDivRef.current) {
      hiddenDivRef.current.textContent = searchTerm || ' ';
      const baseHeight = hiddenDivRef.current.scrollHeight;
      textareaRef.current.style.height = Math.max(baseHeight, 30) + 'px';
    }
  }, [searchTerm]);

  const handleSearch = async (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleInput = (e) => setSearchTerm(e.target.value);

  const getLineNumbers = (text) => {
    const lines = text ? text.split('\n').length : 1;
    return Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  };


  return (
    <div className="search-section">
      <form onSubmit={handleSearch} className="search-form">
        <div className="main-search-wrapper">
          {/* Database Button - показывает текущую БД */}
          <button
            type="button"
            className="db-menu-toggle"
            onClick={onOpenDatabaseSidebar}
            title="Open Database Manager"
          >
            <span className="db-icon">🗄</span>
            <span className="db-text">{currentDatabase}</span>
          </button>


          {/* Query Input */}
          <div className="textarea-wrapper">
            <div className="line-numbers" aria-hidden="true">
              {getLineNumbers(searchTerm)}
            </div>
            <textarea
              ref={textareaRef}
              value={searchTerm}
              onInput={handleInput}
              placeholder="Enter your Cypher query here..."
              className="search-textarea"
            />
            <div ref={hiddenDivRef} className="hidden-textarea" />
          </div>

          <button type="submit" className="search-button">
            Search
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchSection;