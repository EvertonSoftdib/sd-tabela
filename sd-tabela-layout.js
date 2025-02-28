// Componente para o Editor de Layout (sem JSX)
class LayoutEditor extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            columns: [...props.structure],
            layoutName: '',
            availableLayouts: [],
            selectedLayout: '',
            isDragging: false,
            draggedIndex: null
        };
        
        // Vincular métodos ao 'this'
        this.loadSavedLayouts = this.loadSavedLayouts.bind(this);
        this.handleColumnVisibilityChange = this.handleColumnVisibilityChange.bind(this);
        this.handleColumnWidthChange = this.handleColumnWidthChange.bind(this);
        this.handleColumnStickyChange = this.handleColumnStickyChange.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.toggleAllColumns = this.toggleAllColumns.bind(this);
        this.saveLayout = this.saveLayout.bind(this);
        this.saveAsDefault = this.saveAsDefault.bind(this);
        this.loadLayout = this.loadLayout.bind(this);
        this.deleteLayout = this.deleteLayout.bind(this);
        this.applyLayout = this.applyLayout.bind(this);
        this.closeEditor = this.closeEditor.bind(this);
    }

    componentDidMount() {
        // Carregar layouts salvos do localStorage
        this.loadSavedLayouts();
    }

    loadSavedLayouts() {
        // Obter todos os layouts salvos no localStorage
        const layoutKeys = Object.keys(localStorage).filter(key => key.startsWith(`layout_${this.props.tableId}_`));
        const layouts = layoutKeys.map(key => {
            const name = key.replace(`layout_${this.props.tableId}_`, '');
            return { name, key };
        });
        
        // Verificar se existe layout padrão
        const hasDefaultLayout = layouts.some(layout => layout.name === 'default');
        
        this.setState({ availableLayouts: layouts, hasDefaultLayout });
    }

    handleColumnVisibilityChange(index) {
        const updatedColumns = [...this.state.columns];
        updatedColumns[index].visible = updatedColumns[index].visible === 'S' ? 'N' : 'S';
        this.setState({ columns: updatedColumns });
    }

    handleColumnWidthChange(index, value) {
        const updatedColumns = [...this.state.columns];
        updatedColumns[index].width = parseInt(value, 10);
        this.setState({ columns: updatedColumns });
    }

    handleColumnStickyChange(index) {
        const updatedColumns = [...this.state.columns];
        updatedColumns[index].sticky = updatedColumns[index].sticky ? undefined : true;
        this.setState({ columns: updatedColumns });
    }

    // Funções para arrastar e soltar
    handleDragStart(index) {
        this.setState({ isDragging: true, draggedIndex: index });
    }

    handleDragOver(e, index) {
        e.preventDefault();
        if (this.state.isDragging && this.state.draggedIndex !== index) {
            const columns = [...this.state.columns];
            const draggedColumn = columns[this.state.draggedIndex];
            
            // Remover a coluna arrastada
            columns.splice(this.state.draggedIndex, 1);
            // Inserir na nova posição
            columns.splice(index, 0, draggedColumn);
            
            this.setState({ columns, draggedIndex: index });
        }
    }

    handleDragEnd() {
        this.setState({ isDragging: false, draggedIndex: null });
    }

    toggleAllColumns(checked) {
        const updatedColumns = [...this.state.columns];
        updatedColumns.forEach(col => {
            col.visible = checked ? 'S' : 'N';
        });
        this.setState({ columns: updatedColumns });
    }

    saveLayout() {
        const { layoutName, columns } = this.state;
        const { tableId } = this.props;
        
        // Nome do layout (padrão se não for especificado)
        const name = layoutName.trim() || 'layout_' + Date.now();
        
        // Salvar no localStorage
        localStorage.setItem(`layout_${tableId}_${name}`, JSON.stringify(columns));
        
        // Atualizar a lista de layouts
        this.loadSavedLayouts();
        
        // Limpar o campo de nome
        this.setState({ layoutName: '' });
        
        // Avisar o componente pai sobre a alteração
        if (this.props.onLayoutChange) {
            this.props.onLayoutChange(columns);
        }
    }

    saveAsDefault() {
        const { columns } = this.state;
        const { tableId } = this.props;
        
        // Salvar como layout padrão
        localStorage.setItem(`layout_${tableId}_default`, JSON.stringify(columns));
        
        // Atualizar a lista de layouts
        this.loadSavedLayouts();
        
        // Avisar o componente pai sobre a alteração
        if (this.props.onLayoutChange) {
            this.props.onLayoutChange(columns);
        }
    }

    loadLayout(e) {
        const layoutKey = e.target.value;
        if (!layoutKey) return;
        
        // Carregar layout do localStorage
        const layoutData = localStorage.getItem(layoutKey);
        if (layoutData) {
            try {
                const columns = JSON.parse(layoutData);
                this.setState({ columns, selectedLayout: layoutKey });
                
                // Avisar o componente pai sobre a alteração
                if (this.props.onLayoutChange) {
                    this.props.onLayoutChange(columns);
                }
            } catch (error) {
                console.error('Erro ao carregar layout:', error);
            }
        }
    }

    deleteLayout() {
        const { selectedLayout } = this.state;
        if (!selectedLayout) return;
        
        // Remover do localStorage
        localStorage.removeItem(selectedLayout);
        
        // Atualizar a lista de layouts
        this.loadSavedLayouts();
        
        this.setState({ selectedLayout: '' });
    }

    applyLayout() {
        // Aplicar o layout atual ao componente pai
        if (this.props.onLayoutChange) {
            this.props.onLayoutChange(this.state.columns);
        }
        
        // Fechar o editor
        this.closeEditor();
    }
    
    closeEditor() {
        // Se houver uma função onClose nas props, chamá-la
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    render() {
        const { columns, layoutName, availableLayouts, selectedLayout } = this.state;
        
        const modalStyle = {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        };
        
        const contentStyle = {
            backgroundColor: 'white',
            borderRadius: '4px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        };
        
        const headerStyle = {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid #eee',
            paddingBottom: '10px'
        };
        
        const closeButtonStyle = {
            border: 'none',
            background: 'none',
            fontSize: '20px',
            cursor: 'pointer'
        };
        
        const columnRowStyle = {
            display: 'flex',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid #f0f0f0'
        };
        
        const columnRowHoverStyle = {
            backgroundColor: '#f9f9f9',
            cursor: 'grab'
        };
        
        const actionButtonStyle = {
            padding: '8px 16px',
            margin: '0 4px',
            borderRadius: '4px',
            cursor: 'pointer',
            border: '1px solid #ddd'
        };
        
        const saveButtonStyle = {
            padding: '8px 16px',
            margin: '0 4px',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none'
        };
        
        const applyButtonStyle = {
            padding: '8px 16px',
            margin: '0 4px',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none'
        };
        
        const deleteButtonStyle = {
            padding: '8px 16px',
            margin: '0 4px',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none'
        };
        
        const defaultButtonStyle = {
            padding: '8px 16px',
            margin: '0 4px',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: '#607D8B',
            color: 'white',
            border: 'none'
        };
        
        // Criando o modal com React.createElement (sem JSX)
        return React.createElement("div", { 
            style: modalStyle,
            onClick: this.closeEditor // Fechar ao clicar fora do modal
        }, 
            React.createElement("div", { 
                style: contentStyle,
                onClick: (e) => e.stopPropagation() // Impedir que cliques no conteúdo fechem o modal
            }, 
                // Cabeçalho
                React.createElement("div", { style: headerStyle }, 
                    React.createElement("h2", null, "Editar Layout"),
                    React.createElement("button", { 
                        style: closeButtonStyle,
                        onClick: this.closeEditor
                    }, "×")
                ),
                
                // Mensagem informativa
                React.createElement("div", { 
                    className: "alert alert-info", 
                    style: { 
                        padding: '10px', 
                        backgroundColor: '#e1f5fe', 
                        borderRadius: '4px', 
                        marginBottom: '15px' 
                    } 
                }, "Ordene as colunas movendo e oculte desmarcando as caixas de seleção"),
                
                // Controles gerais
                React.createElement("div", { 
                    style: { 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '15px', 
                        justifyContent: 'space-between' 
                    } 
                },
                    // Marcar/Desmarcar todos
                    React.createElement("div", null, 
                        React.createElement("label", null, 
                            React.createElement("input", { 
                                type: "checkbox",
                                checked: columns.every(col => col.visible === 'S'),
                                onChange: (e) => this.toggleAllColumns(e.target.checked)
                            }),
                            " Marcar/Desmarcar todos"
                        )
                    ),
                    
                    // Seleção de layout
                    React.createElement("div", null, 
                        React.createElement("label", null, "Selecione um layout: "),
                        React.createElement("select", { 
                            value: selectedLayout,
                            onChange: this.loadLayout
                        }, 
                            React.createElement("option", { value: "" }, "Selecione"),
                            availableLayouts.map((layout, idx) => 
                                React.createElement("option", { 
                                    key: idx,
                                    value: layout.key
                                }, layout.name)
                            )
                        )
                    )
                ),
                
                // Lista de colunas
                React.createElement("div", { 
                    style: { 
                        maxHeight: '400px', 
                        overflow: 'auto', 
                        marginBottom: '20px' 
                    } 
                }, 
                    columns.map((column, index) => 
                        React.createElement("div", {
                            key: index,
                            style: {
                                ...columnRowStyle,
                                ...(this.state.isDragging ? columnRowHoverStyle : {})
                            },
                            draggable: true,
                            onDragStart: () => this.handleDragStart(index),
                            onDragOver: (e) => this.handleDragOver(e, index),
                            onDragEnd: this.handleDragEnd
                        }, 
                            // Ícone de arrasto
                            React.createElement("div", { 
                                style: { width: '30px', textAlign: 'center' } 
                            }, 
                                React.createElement("span", { 
                                    style: { cursor: 'grab' } 
                                }, "⋮⋮")
                            ),
                            
                            // Checkbox de visibilidade
                            React.createElement("div", { 
                                style: { width: '30px', textAlign: 'center' } 
                            }, 
                                React.createElement("input", { 
                                    type: "checkbox",
                                    checked: column.visible === 'S',
                                    onChange: () => this.handleColumnVisibilityChange(index)
                                })
                            ),
                            
                            // Nome da coluna
                            React.createElement("div", { 
                                style: { flexGrow: 1, paddingLeft: '10px' } 
                            }, column.name),
                            
                            // Controles da coluna (sticky e largura)
                            React.createElement("div", { 
                                style: { 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    width: '200px' 
                                } 
                            }, 
                                // Botão sticky
                                React.createElement("button", { 
                                    type: "button",
                                    style: { 
                                        border: 'none', 
                                        background: 'none', 
                                        cursor: 'pointer', 
                                        padding: '0 4px' 
                                    },
                                    onClick: () => this.handleColumnStickyChange(index)
                                }, column.sticky ? '📌' : '📍'),
                                
                                // Controle deslizante de largura
                                React.createElement("input", { 
                                    type: "range",
                                    min: "50",
                                    max: "500",
                                    value: column.width || 100,
                                    onChange: (e) => this.handleColumnWidthChange(index, e.target.value),
                                    style: { flexGrow: 1, margin: '0 10px' }
                                }),
                                
                                // Valor da largura
                                React.createElement("span", null, `${column.width || 100}px`)
                            )
                        )
                    )
                ),
                
                // Rodapé com botões
                React.createElement("div", { 
                    style: { 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        borderTop: '1px solid #eee', 
                        paddingTop: '20px' 
                    } 
                }, 
                    // Parte esquerda - Salvar layout
                    React.createElement("div", null, 
                        React.createElement("input", { 
                            type: "text",
                            placeholder: "Nome do layout",
                            value: layoutName,
                            onChange: (e) => this.setState({ layoutName: e.target.value }),
                            style: { 
                                padding: '8px', 
                                marginRight: '10px', 
                                borderRadius: '4px', 
                                border: '1px solid #ddd' 
                            }
                        }),
                        React.createElement("button", { 
                            style: saveButtonStyle,
                            onClick: this.saveLayout
                        }, "Salvar layout")
                    ),
                    
                    // Parte direita - Ações adicionais
                    React.createElement("div", null, 
                        React.createElement("button", { 
                            style: deleteButtonStyle,
                            onClick: this.deleteLayout,
                            disabled: !selectedLayout
                        }, "Remover layout"),
                        React.createElement("button", { 
                            style: defaultButtonStyle,
                            onClick: this.saveAsDefault
                        }, "Salvar layout como padrão do usuário"),
                        React.createElement("button", { 
                            style: applyButtonStyle,
                            onClick: this.applyLayout
                        }, "Aplicar layout")
                    )
                )
            )
        );
    }
}