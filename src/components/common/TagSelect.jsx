import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import "./TagSelect.css";

const TagSelect = ({
  options = [],
  selectedItems = [],
  onSelect,
  onRemove,
  placeholder,
  renderLabel,
  onTagClick,
}) => {
  const { t } = useTranslation("dashboard");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const effectivePlaceholder = placeholder || t("tagSelect.placeholder");

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
  // A busca compara com o label EXIBIDO (renderLabel), não com o valor
  // bruto — senão, com o texto já traduzido na lista (ver DROPDOWN abaixo),
  // digitar em outro idioma não encontraria nada (ex: opção armazenada como
  // "Inglês", exibida como "English", buscar por "Eng" precisa bater com o
  // que está na tela).
  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      const alreadySelected =
        selectedItems.includes(option);

      const label = renderLabel ? renderLabel(option) : option;
      const matchesSearch = label
        .toLowerCase()
        .includes(search.toLowerCase());

      return !alreadySelected && matchesSearch;
    });
  }, [options, selectedItems, search, renderLabel]);

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
        placeholder={effectivePlaceholder}
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
                {renderLabel ? renderLabel(option) : option}
              </div>
            ))
          ) : (
            <div className="tag-empty">
              {t("tagSelect.noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSelect;