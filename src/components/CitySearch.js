// CitySearch.js
import React from 'react';

export const CitySearch = ({
  searchText,
  setSearchText,
  searchResults,
  showSearchResults,
  selectedCity,
  setSelectedCity,
  setShowSearchResults,
  centerOnCity
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      width: '300px'
    }}>
      <div style={{
        position: 'relative'
      }}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Поиск города..."
          style={{
            width: '100%',
            padding: '10px 15px',
            backgroundColor: 'rgba(20, 20, 50, 0.8)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            fontSize: '14px',
            backdropFilter: 'blur(5px)',
            outline: 'none'
          }}
        />
        {searchText && (
          <button
            onClick={() => {
              setSearchText('');
              setSelectedCity(null);
              setShowSearchResults(false);
            }}
            style={{
              position: 'absolute',
              right: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      {/* Результаты поиска */}
      {showSearchResults && (
        <div style={{
          marginTop: '5px',
          background: 'rgba(20, 20, 50, 0.9)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          {searchResults.map((city) => (
            <div
              key={city.city}
              onClick={() => centerOnCity(city)}
              style={{
                padding: '10px 15px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                transition: 'background-color 0.2s',
                backgroundColor: selectedCity && selectedCity.city === city.city 
                  ? 'rgba(100, 100, 255, 0.3)' 
                  : 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(100, 100, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 
                  selectedCity && selectedCity.city === city.city 
                    ? 'rgba(100, 100, 255, 0.3)' 
                    : 'transparent';
              }}
            >
              {city.city}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};