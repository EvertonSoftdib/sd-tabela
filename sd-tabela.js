const { createRoot } = ReactDOM;
const { Table, Column, AutoSizer, ColumnSizer } = ReactVirtualized;

class sdTabela // extends GlobalNN
{
    structure = {}

    constructor({id, options, structure, target = "#sd-tabela"}) 
    {
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

        this.configureStructure(this.structure)
    }

    // ######    ####    ######   #####    ##  ##   ######   ##  ##   #####      ##
    // ##       ##         ##     ##  ##   ##  ##     ##     ##  ##   ##  ##    ####
    // #####     ####      ##     ##  ##   ##  ##     ##     ##  ##   ##  ##   ##  ##
    // ##           ##     ##     #####    ##  ##     ##     ##  ##   #####    ##  ##
    // ##           ##     ##     ## ##    ##  ##     ##     ##  ##   ## ##    ######
    // ######    ####      ##     ##  ##   ######     ##     ######   ##  ##   ##  ##
    
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

    getStructure()
    {
        return this.structure.filter((col) => col.visible == "S")
    }

    //  ####    ######   ##       ##  ##   ##         ##
    // ##  ##   ##       ##       ##  ##   ##        ####
    // ##       #####    ##       ##  ##   ##       ##  ##
    // ##       ##       ##       ##  ##   ##       ##  ##
    // ##  ##   ##       ##       ##  ##   ##       ######
    //  ####    ######   ######   ######   ######   ##  ##

    renderCell({cellData, rowIndex, dataKey})
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
            width: column.width ? column.width : larguraColuna,
            cellRenderer: renderizarCelula
        })
    }

    // ######     ##     #####    ######   ##         ##
    //   ##      ####    ##  ##   ##       ##        ####
    //   ##     ##  ##   #####    #####    ##       ##  ##
    //   ##     ##  ##   ##  ##   ##       ##       ##  ##
    //   ##     ######   ##  ##   ##       ##       ######
    //   ##     ##  ##   #####    ######   ######   ##  ##

    renderTable()
    {
        return React.createElement("div", { className: "TableContainer" },
            React.createElement(AutoSizer, null, ({ width, height }) => {
                // 🔹 Divide a largura total de forma igual entre as colunas
                return React.createElement(Table, {
                    width: width,
                    height: height,
                    headerHeight: 50,
                    rowHeight: 30,
                    rowCount: dados.length,
                    rowGetter: ({ index }) => dados[index],
                    rowClassName: ({ index }) => (index % 2 === 0 ? "" : "TableColAlt"),
                    children: this.getStructure().map(this.renderColumn)
                });
            })
        );
    }

    build()
    {
        const target = this.targetDivId.replace('#', '')
        const rootElement = document.getElementById(target);

        const root = createRoot(rootElement);

        root.render(React.createElement(this.renderTable()));
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
}