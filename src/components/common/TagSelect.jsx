import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./TagSelect.css";

const TagSelect = ({
  options = [],
  selectedItems = [],
  onSelect,
  onRemove,
  placeholder = "Selecionar...",
  renderLabel,
  onTagClick,
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);

  // =========================
  // FECHAR AO CLICAR FORA
  // =========================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================
  // FILTRAR OPÇÕES
  // =========================
  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      const alreadySelected =
        selectedItems.includes(option);

      const matchesSearch = option
        .toLowerCase()
        .includes(search.toLowerCase());

      return !alreadySelected && matchesSearch;
    });
  }, [options, selectedItems, search]);

  // =========================
  // SELECIONAR ITEM
  // =========================
  const handleSelect = (item) => {
    onSelect(item);

    setSearch("");

    // FECHA APÓS SELECIONAR
    setIsOpen(false);
  };

  return (
    <div
      className="tag-select"
      ref={containerRef}
    >
      {/* TAGS */}
      <div className="selected-tags">
        {selectedItems.map((item) => (
          <div
            key={item}
            className="tag-item"
          >
            {/* onTagClick é opcional — usado por EditProfile pra abrir o
               mini seletor de nível CEFR sem interferir no botão de remover */}
            <span
              className={onTagClick ? "tag-item-label tag-item-label--clickable" : "tag-item-label"}
              onClick={onTagClick ? () => onTagClick(item) : undefined}
            >
              {renderLabel ? renderLabel(item) : item}
            </span>

            <button
              type="button"
              onClick={() => onRemove(item)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <input
        type="text"
        value={search}
        placeholder={placeholder}
        className="input tag-input"
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
      />

      {/* DROPDOWN */}
      {isOpen && (
        <div className="tag-dropdown">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option}
                className="tag-option"
                onClick={() =>
                  handleSelect(option)
                }
              >
                {option}
              </div>
            ))
          ) : (
            <div className="tag-empty">
              Nenhum resultado
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSelect;