const { createRoot } = ReactDOM;
const { Table, Column, AutoSizer, ColumnSizer } = ReactVirtualized;

class sdTabela extends React.Component {
    constructor(props) 
    {
        super(props);

        const { id, options, structure, dados, target } = props;

        // No need to load saved column order since drag-and-drop is removed
        this.state = {
            sortBy: null,
            sortDirection: "ASC",
            filteredSearch: "",
            structure: structure,
            dados: dados,
            filteredData: dados
        }
        
        this.valueToBeFound = null
        this.cachedRowData = null
        this.findControl = 0
        this.lastFoundRow = null
        this.lastSelectedRow = null
        this.lastFocusInput = null
        this.useFilteredList = false
        this.searchTimeOut = false
        this.data = []
        this.customEvents = []
        this.avoidThClick = false
        this.theadSorts = {}
        this.options = {}
        this.currentPage = false
        this.filteredListLength = 0
        this.lastOrdedBy = {}
        this.rowHeight = 0

        this.tableId = id
        this.targetDivId = target
        this.elemTarget = document.querySelector(this.targetDivId)

        this.areaID = `${this.tableId}ContentArea`
        this.inputSearchID = `${this.tableId}ClusterizeSearch`
        this.findButtonID = `${this.tableId}ClusterizeBtnFind`
        this.gotoButtonID = `${this.tableId}ClusterizeBtnGoto`
        this.contextMenuID = `${this.tableId}ContextMenu`
        this.footerID = `${this.tableId}ClusterizeFooter`
        this.xlsID = `${this.tableId}XlsDownload`
        this.csvID = `${this.tableId}CsvDownload`
        this.layout = `${this.tableId}Layout`
        this.contextMenuElement = null

        this.programID = this.currentProgramID()
        this.programForm = `f${this.programID}`;

        this.events = []
        this.multipleRows = []
        this.multipleRowsMenu = null
        this.layoutsList = {}
        this.selectedLayout = ''
        this.searchIsActived = false
        this.searchAlertFiltered = false

        this.options = {
            debug: false,
            config: {
                showHeaderOptions: true,
                showFooterOptions: true,
                layout: null,
                row: {
                    enableMultipleSelect: false,
                    drag: false,
                },
                // determina se a busca ser&aacute; pelo cobol ou pelo registros na tabela
                cobolSearch: false,
                search: true,
                searchName: this.inputSearchID,
    
                // se cada espaco sera um item de busca
                eachSpaceIsASearch: false,
                // Busca sempre naquels filtrados
                keepSearching: true,
                // inicia com ordenacao
                orderby: false,
                // habilita se vai poder fazer o filtro por coluna
                sort: true,
                // botoes adicionais
                buttons: [],
                //
                enableFullScreen: false,
                // Quando habilitado cria a opcao de download no menu
                enableXlsDownload: false,
                // Quando habilitado cria a opcao de download Csv
                enableCsvDownload: false,
                // Quando habilitado cria a opcao de editacao no menu
                enableLayoutEditor: true,
                // cria um plus para expandir a linha
                datailView: false,
                // determina o layout da tabela sera fixo
                layoutFixed: false,
                // Foca na tabela, caso falso foca na document
                focusOnSelectedRow: true,
                enterAsDblClick: true,
                // Paginação
                pagination: { size: 50, enable: true },
                // Determina a quantidade de caracteres para iniciar o filtro da pesquisa
                amountSearch: 3,
                // Determina se realizar a busca em campos com visible = "N"
                searchInvisibleFields: false,
            },
    
            asideMenu: [
                  { "text": "Download Xls", ref: 'XlsDownload', attrs: { disabled: 'disabled', id: this.xlsID, onclick: () => this.generateXlsV2() } }
                , { "text": "Download Csv", ref: 'CsvDownload', attrs: { disabled: 'disabled', id: this.csvID, onclick: () => this.generateCsv() } }
                , { "text": "Editar Layout", ref: 'LayoutEditor', attrs: { disabled: 'disabled', id: this.layout, onclick: () => this.openLayoutEditor() } }
                , { "text": "Full Screen", ref: 'FullScreen', attrs: { disabled: 'disabled', onclick: () => this.fullScreenTable() } }
            ],
    
            contextMenu: {
                header: 'Menu'
                , buttons: [],
                footer: ''
            },
    
            callbacks: {},
            customTr: false,
            click: false,
    
            dblclick: false,
            customCss: ``,
            counter: {
                show: true,
                updateOnChange: true
            },
            fileViewer: {
                element: null
            },
            ...options
        }
    }

    getStructure()
    {
        return this.state.structure.filter((col) => col.visible == "S")
    }

    renderCell(cellData, rowIndex, dataKey)
    {
        const column = this.state.structure.find(col => col.ref === dataKey);

        if (!column) return null;

        if (`renderTypeCell_${column.type}` in this)
            return this[`renderTypeCell_${column.type}`](cellData, column)
        
        return this[`renderTypeCell_label`](cellData, column)
    }

    currentProgramID() 
    {
        const { pathname } = location;

        const [, progID] = pathname.match(/\/(\w+)\V.php/) || [];

        return progID || '';
    }

    renderTypeCell_input(value, coluna)
    {
        const alinhamento = coluna.align || 'left';
        const estilo = { textAlign: alinhamento };
        
        return React.createElement("input", {
            type: "text",
            value: value,
            "data-ref": coluna.ref,
            style: estilo
        });
    }

    renderTypeCell_checkbox(value, coluna)
    {
        const alinhamento = coluna.align || 'left';
        const estilo = { textAlign: alinhamento };

        return React.createElement("input", {
            type: "checkbox",
            checked: value,
            "data-ref": coluna.ref,
            style: estilo
        });
    }

    renderTypeCell_label(value, coluna)
    {
        const alinhamento = coluna.align || 'left';
        const estilo = { textAlign: alinhamento };

        return React.createElement("span", {
            style: estilo,
            "data-ref": coluna.ref,
            onDoubleClick: () => alert(`${coluna.back}: ${value}`),
        }, value);
    }

    // Simplified header renderer without drag-and-drop and resize functionality
    renderHeader(column, dataKey, sortBy, sortDirection) {
        const isSorted = sortBy === dataKey;
        
        let sortIcon = null;
        
        const ICON_IS_SORT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="12" height="12" color="#333333"><path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z"/></svg>`;
        const ICON_SORT_ASC = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="12" height="12" color="#333333"><path d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z"/></svg>`;
        const ICON_SORT_DESC = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="12" height="12" color="#333333"><path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z"/>`;

        if (isSorted) { 
            sortIcon = sortDirection === "ASC" ? ICON_SORT_ASC : ICON_SORT_DESC; 
        }

        const headerStyle = { 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            position: "relative" 
        };

        return React.createElement("div", {
                className: "TableHeader",
                style: headerStyle,
            }, 
            React.createElement("div", {
                    className: "header-content",
                },
                React.createElement("span", { 
                    style: { userSelect: "none", marginTop: '-1px' }, 
                    className: 'TableHeaderName' 
                }, column.name),
                React.createElement("span", { 
                    dangerouslySetInnerHTML: { __html: `${sortIcon || ICON_IS_SORT}` } 
                })
            )
        );
    }

    sortTable({ sortBy, sortDirection }) {
        const sortedData = [...this.state.filteredData].sort((a, b) => {
            const aValue = a[sortBy] || '';
            const bValue = b[sortBy] || '';
    
            if (aValue < bValue) return sortDirection === 'ASC' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'ASC' ? 1 : -1;
            return 0;
        });

        this.setState({
            ...this.state,
            filteredData: sortedData,
            sortBy: sortBy,
            sortDirection: sortDirection
        });
    }

    filterTable() {
        const lowerText = this.state.filteredSearch.toLowerCase();

        if(lowerText == "") {
            this.setState({
                ...this.state,
                filteredData: this.state.dados
            });
            
            return;
        }
        
        this.filteredData = this.state.dados.filter(row => {
            return Object.values(row).join("").toLowerCase().includes(lowerText);
        });

        this.setState({
            ...this.state,
            filteredData: this.filteredData
        });
    }

    render() {
        const visibleColumns = this.getStructure();

        console.log(this.options)
        
        return React.createElement("div", { className: "Painel" }, 
            React.createElement("div", { className: "PainelHeader"}, 
                React.createElement("div", { className: "PainelHeaderConfigs"}, 
                    React.createElement("span", { 
                        dangerouslySetInnerHTML: { 
                            __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/></svg>`
                        }
                    })
                ),    
                React.createElement("div", { className: "PainelHeaderSearch"}, 
                    React.createElement("input", { 
                        className: "PainelHeaderSearchInput",
                        placeholder: "Escreva e Pressione Enter para filtrar",
                        id: this.inputSearchID,
                        value: this.state.filteredSearch,
                        onChange: (e) => {
                            this.setState({...this.state, filteredSearch: e.target.value });
                        },
                        onKeyUp: (e) => {
                            if (e.key === "Enter") this.filterTable();
                        }
                    })
                )
            ),
            React.createElement("div", { className: "TableContainer" },
                React.createElement(AutoSizer, null, ({ width, height }) => {
                    // Calcular a largura total disponível (deixar margem para scroll)
                    const availableWidth = width - 20; // Reservar espaço para scrollbar
                    // Calcular a largura total definida das colunas
                    const totalDefinedWidth = visibleColumns.reduce((total, col) => total + (col.width || 100), 0);
                    
                    // Determinar o fator de escala para ajustar as colunas para preencher o espaço
                    const scaleFactor = totalDefinedWidth < availableWidth ? availableWidth / totalDefinedWidth : 1;
                    
                    return React.createElement(Table, {
                        width: width,
                        height: height,
                        headerHeight: 40,
                        rowHeight: 30,
                        rowCount: this.state.filteredData.length,
                        rowGetter: ({ index }) => this.state.filteredData[index],
                        rowClassName: ({ index }) => (index % 2 === 0 ? "" : "TableColAlt"),
                        sort: this.sortTable.bind(this),
                        sortBy: this.state.sortBy,
                        sortDirection: this.state.sortDirection,
                        overscanRowCount: 10, // Carregar mais linhas para evitar problemas de scroll
                        children: visibleColumns.map((col) => {
                            // Aplicar o fator de escala à largura da coluna
                            // Assegura que a largura mínima de cada coluna seja respeitada
                            const minColWidth = 80; // Largura mínima para ver o conteúdo
                            const baseWidth = col.width || 100;
                            const adjustedWidth = Math.max(minColWidth, Math.floor(baseWidth * scaleFactor));
                            
                            return React.createElement(Column, {
                                key: col.ref,
                                label: col.name,
                                dataKey: col.ref,
                                className: ["TableCol"],
                                disableSort: false,
                                width: adjustedWidth,
                                // Não utilize flexGrow para evitar colunas extras
                                flexGrow: 0,
                                flexShrink: 0,
                                cellRenderer: ({cellData, rowIndex, dataKey}) => 
                                    React.createElement('div', { 
                                        className: [
                                            "TableColContent", 
                                            col.align === "center" ? "TableColCenter" : 
                                            col.align === "right" ? "TableColRight" : "TableColLeft"
                                        ].join(" ") 
                                    }, this.renderCell(cellData, rowIndex, dataKey)),
                                headerRenderer: ({ dataKey, sortBy, sortDirection }) => 
                                    this.renderHeader(col, dataKey, sortBy, sortDirection)
                            });
                        })
                    });
                })
            ),
            React.createElement("div", { className: "TableFooter" }, 
                React.createElement("div", { className: "TableFooterTools"}),
                React.createElement("div", { className: "TableFooterCounter"},
                    React.createElement("span", { style: { marginRight: "2px" }}, this.state.filteredData.length ),
                    React.createElement("span", {}, "Registros"),
                )
            )
        );
    }
}

const renderTable = ({ id, options, structure, dados, target = "#sd-tabela" }) => {
    // Montando o componente no DOM
    const container = document.getElementById("sd-tabela");
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(sdTabela, { id, options, structure, dados, target }));
}