import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import './SearchableSelect.css';

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder,
  searchable = true,
  multi = false,
  displayKey = 'name',
  valueKey = 'code'
}) => {
  const { t } = useTranslation('dashboard');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  const effectivePlaceholder = placeholder || t('searchableSelect.placeholder');

  // Filtrar opções baseado na busca
  const filteredOptions = options.filter(option =>
    option[displayKey].toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Encontrar o label da opção selecionada
  const getSelectedLabel = () => {
    if (multi && Array.isArray(value)) {
      if (value.length === 0) return effectivePlaceholder;
      if (value.length === 1) {
        const selected = options.find(opt => opt[valueKey] === value[0]);
        return selected ? selected[displayKey] : effectivePlaceholder;
      }
      return t('searchableSelect.selectedCount', { count: value.length });
    } else if (value) {
      const selected = options.find(opt => opt[valueKey] === value);
      return selected ? selected[displayKey] : effectivePlaceholder;
    }
    return effectivePlaceholder;
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (multi) {
      const newValue = Array.isArray(value) ? value : [];
      const optionValue = option[valueKey];
      
      if (newValue.includes(optionValue)) {
        onChange(newValue.filter(v => v !== optionValue));
      } else {
        onChange([...newValue, optionValue]);
      }
    } else {
      onChange(option[valueKey]);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const isSelected = (option) => {
    const optionValue = option[valueKey];
    if (multi && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className="searchable-select" ref={selectRef}>
      <button
        className="searchable-select-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{getSelectedLabel()}</span>
        <ChevronDown size={18} className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <div className="searchable-select-dropdown">
          {searchable && (
            <div className="searchable-select-search">
              <input
                type="text"
                placeholder={t('searchableSelect.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">
                {t('searchableSelect.noOptions')}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  className={`searchable-select-option ${isSelected(option) ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                  type="button"
                >
                  {multi && (
                    <input
                      type="checkbox"
                      checked={isSelected(option)}
                      onChange={() => {}}
                      className="searchable-select-checkbox"
                    />
                  )}
                  <span>{option[displayKey]}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
