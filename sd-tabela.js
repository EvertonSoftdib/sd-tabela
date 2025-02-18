const { createRoot } = ReactDOM;
const { Table, Column, AutoSizer, ColumnSizer } = ReactVirtualized;

class sdTabela extends React.Component {
    constructor(props) 
    {
        super(props);

        const { id, options, structure, dados, target } = props;

        console.log(props)

        this.state = {
            sortBy: null,
            sortDirection: "ASC",
            filteredSearch: "",
            dados: [],
            filteredData: []
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
                    enableMultipleSelect: false,//lastCobolCall && lastCobolCall.value.startsWith('BTN-CONSULTAR-WEB'),
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
        }

        this.configureStructure(structure)
        this.configureData(dados)
    }

    // ######    ####    ######   #####    ##  ##   ######   ##  ##   #####      ##
    // ##       ##         ##     ##  ##   ##  ##     ##     ##  ##   ##  ##    ####
    // #####     ####      ##     ##  ##   ##  ##     ##     ##  ##   ##  ##   ##  ##
    // ##           ##     ##     #####    ##  ##     ##     ##  ##   #####    ##  ##
    // ##           ##     ##     ## ##    ##  ##     ##     ##  ##   ## ##    ######
    // ######    ####      ##     ##  ##   ######     ##     ######   ##  ##   ##  ##

    configureData(data = [])
    {
        // Remove a ultima linha que o COBOL manda em branco
        data.pop()

        this.dados = data
        this.filteredData = this.dados;
    }
    
    configureStructure(data = [{
        width: 200, 
        type: 'label', // input // checkbox 
        align: 'left', // center | right | left
        visible: 'S', // S | N
        mask: undefined, 
        ref: 'h02Produto', 
        back: 'Produto', 
        name: 'Produto'
    }])
    {
        this.structure = data
    }

    loadStructureSaved()
    {
        const savedWidths = JSON.parse(localStorage.getItem("tableWidths"));

        if (savedWidths) {
            this.structure = this.structure.map(col => {
                const savedCol = savedWidths.find(sc => sc.ref === col.ref);
                return savedCol ? { ...col, width: savedCol.width } : col;
            });
        }
    }

    getStructure()
    {
        this.loadStructureSaved()

        return this.structure.filter((col) => col.visible == "S")
    }

    //  ####    ######   ##       ##  ##   ##         ##
    // ##  ##   ##       ##       ##  ##   ##        ####
    // ##       #####    ##       ##  ##   ##       ##  ##
    // ##       ##       ##       ##  ##   ##       ##  ##
    // ##  ##   ##       ##       ##  ##   ##       ######
    //  ####    ######   ######   ######   ######   ##  ##

    renderCell(cellData, rowIndex, dataKey)
    {
        const column = this.structure.find(col => col.ref === dataKey);

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

    // ######   ######   #####     ####     ####
    //   ##       ##     ##  ##   ##  ##   ##
    //   ##       ##     ##  ##   ##  ##    ####
    //   ##       ##     #####    ##  ##       ##
    //   ##       ##     ##       ##  ##       ##
    //   ##     ######   ##        ####     ####

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

    //    ####     ####    ##       ##  ##   ##  ##     ##
    //   ##  ##   ##  ##   ##       ##  ##   ### ##    ####
    //   ##       ##  ##   ##       ##  ##   ######   ##  ##
    //   ##       ##  ##   ##       ##  ##   ######   ##  ##
    //   ##  ##   ##  ##   ##       ##  ##   ## ###   ######
    //    ####     ####    ######   ######   ##  ##   ##  ##

    renderHeader(column, dataKey, sortBy, sortDirection) {
        const isSorted = sortBy === dataKey;
        
        let sortIcon = null;

        const ICON_IS_SORT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="12" height="12"><path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z"/></svg>`
        const ICON_SORT_ASC = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="12" height="12"><path d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z"/></svg>`
        const ICON_SORT_DESC = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="12" height="12"><path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z"/>`

        if (isSorted) { sortIcon = sortDirection === "ASC" ? ICON_SORT_ASC : ICON_SORT_DESC; }

        return React.createElement("div", {
                className: "TableHeader",
                style: { display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" },
            }, 
            React.createElement("span", { style: { userSelect: "none"  }, className: 'TableHeaderName' }, column.name),
            React.createElement("span", { dangerouslySetInnerHTML: { __html: `${sortIcon || ICON_IS_SORT}` } }),
            React.createElement("div", {
                className: "resize-handle",
                style: { 
                    position: "absolute", 
                    right: 0, 
                    top: 0, 
                    width: "5px", 
                    height: "100%", 
                    cursor: "col-resize" 
                },
                onMouseDown: (e) => this.startResize(e, column.ref)
            })
        );
    }

    renderColumn(column)
    {
        let classes = [ "TableCol" ]

        if (column.align == "center")
            classes.push("TableColCenter")
        if (column.align == "right")
            classes.push("TableColRight")
        if (column.align == "left")
            classes.push("TableColLeft")

        return React.createElement(Column, {
            key: column.ref,
            label: column.name,
            dataKey: column.ref,
            className: classes.join(" "),
            disableSort: false,
            flexGrow: 1,
            width: column.width ? column.width : larguraColuna,
            cellRenderer: ({cellData, rowIndex, dataKey}) => this.renderCell(cellData, rowIndex, dataKey),
            headerRenderer: ({ dataKey, sortBy, sortDirection }) => this.renderHeader(column, dataKey, sortBy, sortDirection)
        })
    }
    treatmentGlobalNN() {
        globalNN.pop()

        base = globalNN
        maximo = this.structure().length

        try {
            var resultado = [[]];
            var grupo = 0;
    
            if (!base.length) return [];
    
            for (var indice = 0; indice < base.length; indice++) {
                if (resultado[grupo] === undefined) {
                    resultado[grupo] = [];
                }
    
                resultado[grupo].push(base[indice]);
    
                if ((indice + 1) % maximo === 0) {
                    grupo = grupo + 1;
                }
            }
    
            let structure = {}
            this.structure.map((item) => structure['ref'] = item.ref)
    
            let resultado_with_labels = [];
    
            resultado.forEach((item) => {
                let tmp_structure = { ...structure };
    
    
                Object.keys(structure).forEach((key, index) => {
                    // if (key == "coordenadas" && item[index] == "") {
                    // 	tmp_structure[key] = `${getRandomInRange(-180, 180, 3)}, ${getRandomInRange(-180, 180, 3)}`
                    // } else {
                    tmp_structure[key] = item[index]
                    // }
                })
    
                resultado_with_labels.push(tmp_structure)
            })
    
            return resultado_with_labels;
        } catch (error) {
            console.log(error)
        }
    }

    sortTable ({ sortBy, sortDirection }) {
        const sortedData = [...this.filteredData].sort((a, b) => {
            const aValue = a[sortBy] || '';
            const bValue = b[sortBy] || '';
    
            if (aValue < bValue) return sortDirection === 'ASC' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'ASC' ? 1 : -1;
            return 0;
        });
    
        this.filteredData = sortedData; // Atualiza os dados ordenados
        this.state.sortBy = sortBy;
        this.state.sortDirection = sortDirection;
    
        this.build(); // Re-renderiza a tabela
    };

    startResize(event, columnRef) {
        this.resizingColumn = columnRef;
        this.startX = event.clientX;
        this.startWidth = this.structure.find(col => col.ref === columnRef).width || 200;
    
        document.addEventListener("mousemove", this.onResize);
        document.addEventListener("mouseup", this.stopResize);
    }

    onResize = (event) => {
        if (!this.resizingColumn) return;
        
        const delta = event.clientX - this.startX;
        const newWidth = Math.max(50, this.startWidth + delta);
        
        this.structure = this.structure.map(col => 
            col.ref === this.resizingColumn ? { ...col, width: newWidth } : col
        );
    
        localStorage.setItem("tableWidths", JSON.stringify(this.structure.map(col => ({ ref: col.ref, width: col.width }))));
    
        this.build(); // Re-renderiza a tabela
    }

    stopResize = () => {
        document.removeEventListener("mousemove", this.onResize);
        document.removeEventListener("mouseup", this.stopResize);
        this.resizingColumn = null;
    };

    filterTable() {
        const lowerText = this.state.filteredSearch.toLowerCase();
    
        this.filteredData = this.dados.filter(row => 
            Object.values(row).some(value => 
                value && value.toString().toLowerCase().includes(lowerText)
            )
        );

        this.build(); // Re-renderiza a tabela com os dados filtrados
    }

    render() {
        return React.createElement("div", { className: "Painel" }, 
            React.createElement("div", { className: "PainelHeader"}, 
                React.createElement("div", { className: "PainelHeaderConfigs"}, 
                    React.createElement("span", { dangerouslySetInnerHTML: { __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/></svg>`}})
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
                ),    
            ),
            React.createElement("div", { className: "TableContainer" },
            React.createElement(AutoSizer, null, ({ width, height }) => {
                // 🔹 Divide a largura total de forma igual entre as colunas
                return React.createElement(Table, {
                    width: width,
                    height: height,
                    headerHeight: 40,
                    rowHeight: 30,
                    rowCount: this.filteredData.length,
                    rowGetter: ({ index }) => this.filteredData[index],
                    rowClassName: ({ index }) => (index % 2 === 0 ? "" : "TableColAlt"),
                    sort: this.sortTable.bind(this), // Adiciona a funcionalidade de ordenação
                    sortBy: this.state.sortBy,
                    sortDirection: this.state.sortDirection,
                    children: this.getStructure().map((col) => this.renderColumn(col))
                });
            })
        ));
    }
}

const renderTable = ({ id, options, structure, dados, target = "#sd-tabela" }) => {
    // Montando o componente no DOM
    const container = document.getElementById("sd-tabela");
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(sdTabela, id, options, structure, dados, target));
}
