# 📋 Guia de Uso dos Partials - Hotel Paradise

## 🎯 **Objetivo**

Os partials foram criados para:
- **Reduzir duplicação** de código HTML
- **Facilitar manutenção** de componentes comuns
- **Padronizar** a estrutura das páginas
- **Diminuir tamanho** dos arquivos individuais

## 📁 **Estrutura dos Partials**

```
public/partials/
├── sidebar.html      # Sidebar com navegação
├── header.html       # Header com título e ações
├── loading.html      # Tela de carregamento
└── (futuros partials)

public/js/utils/
└── partials.js       # Utilitários para carregar partials

public/css/
└── partials.css      # Estilos específicos dos partials
```

## 🚀 **Como Usar**

### 1. **Estrutura HTML Base**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sua Página - Hotel Paradise</title>
    
    <!-- CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../css/dashboard.css" rel="stylesheet">
    <link href="../css/partials.css" rel="stylesheet">
    <link href="../css/sua-pagina.css" rel="stylesheet">
</head>

<body>
    <!-- Loading e Sidebar serão carregados via JavaScript -->
    
    <div class="dashboard-wrapper" id="dashboardContent" style="display: none;">
        <!-- Sidebar será carregado aqui -->
        
        <!-- Main Content -->
        <main class="main-content">
            <!-- Header será carregado aqui -->

            <!-- Seu conteúdo específico aqui -->
            <div class="dashboard-main">
                <!-- Conteúdo da página -->
            </div>
        </main>
    </div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../js/utils/partials.js"></script>
    <script src="../js/sua-pagina.js"></script>
</body>
</html>
```

### 2. **Inicialização JavaScript**

```javascript
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

async function initializePage() {
    // Verificar autenticação
    if (!checkAuthentication()) {
        return;
    }
    
    // Inicializar partials
    await initializePage({
        page: 'nome-da-pagina',           // Para ativar link na sidebar
        title: 'Título da Página',       // Título no header
        subtitle: 'Subtítulo da página', // Subtítulo no header
        icon: 'bi-icon-name',            // Ícone Bootstrap
        loadingText: 'Carregando...',    // Texto do loading
        headerButtons: `                 // Botões específicos da página
            <button class="btn btn-primary">
                <i class="bi bi-plus me-2"></i>Novo Item
            </button>
        `
    });
    
    // Configurar interface específica da página
    setupInterface();
    
    // Carregar dados
    await loadData();
}
```

## 🔧 **Funções Disponíveis**

### **initializePage(config)**
Inicializa todos os partials básicos e configura a página.

**Parâmetros:**
- `page`: Nome da página para ativar na sidebar
- `title`: Título da página
- `subtitle`: Subtítulo da página
- `icon`: Classe do ícone Bootstrap
- `loadingText`: Texto do loading
- `headerButtons`: HTML dos botões do header

### **loadPartial(path, target)**
Carrega um partial específico.

```javascript
await loadPartial('../partials/sidebar.html', '.dashboard-wrapper');
```

### **setActivePage(page)**
Define qual página está ativa na sidebar.

```javascript
setActivePage('reservas'); // Ativa o link de reservas
```

### **setPageTitle(title, subtitle, icon)**
Atualiza título, subtítulo e ícone da página.

```javascript
setPageTitle('Nova Página', 'Descrição da página', 'bi-star');
```

### **setHeaderButtons(html)**
Define os botões específicos da página no header.

```javascript
setHeaderButtons(`
    <button class="btn btn-primary" onclick="novaAcao()">
        <i class="bi bi-plus me-2"></i>Novo
    </button>
    <button class="btn btn-outline-secondary" onclick="exportar()">
        <i class="bi bi-download me-2"></i>Exportar
    </button>
`);
```

## 📝 **Exemplo Completo**

Veja o arquivo `public/pages/reservas-refactored.html` para um exemplo completo de como usar os partials.

## ✅ **Vantagens**

1. **Manutenção Centralizada**: Alterar a sidebar em um lugar atualiza todas as páginas
2. **Consistência**: Todas as páginas seguem o mesmo padrão
3. **Performance**: Carregamento assíncrono dos componentes
4. **Flexibilidade**: Cada página pode customizar título, botões, etc.
5. **Código Limpo**: Arquivos HTML menores e mais focados

## 🔄 **Migração de Páginas Existentes**

Para migrar uma página existente:

1. **Remover** HTML duplicado (sidebar, header, loading)
2. **Adicionar** `partials.js` e `partials.css`
3. **Configurar** `initializePage()` no JavaScript
4. **Testar** funcionalidade

## 🎨 **Customização**

### **Estilos Específicos**
Use classes CSS específicas para customizar partials:

```css
/* Customizar sidebar para página específica */
.page-reservas .sidebar {
    /* estilos específicos */
}

/* Customizar header para página específica */
.page-reservas .main-header {
    /* estilos específicos */
}
```

### **Novos Partials**
Para criar novos partials:

1. Criar arquivo HTML em `public/partials/`
2. Adicionar função de carregamento em `partials.js`
3. Documentar uso neste arquivo

## 🚨 **Considerações**

- **Compatibilidade**: Funciona com todas as páginas do dashboard
- **SEO**: Não afeta SEO pois é carregamento client-side
- **Performance**: Carregamento inicial ligeiramente mais lento, mas melhor cache
- **Debugging**: Usar DevTools para verificar carregamento dos partials

## 🎭 **Sistema de Modais Híbrido**

### **Modais Comuns (modals-common.html)**
Carregados automaticamente em todas as páginas:

```javascript
// Modal de confirmação
showConfirmModal({
    title: 'Confirmar Exclusão',
    message: 'Tem certeza que deseja excluir este item?',
    type: 'danger',
    confirmText: 'Excluir',
    onConfirm: () => { /* ação */ }
});

// Modal de loading
const loading = showLoadingModal({
    title: 'Processando...',
    message: 'Aguarde enquanto salvamos os dados.'
});
hideLoadingModal(); // Para ocultar

// Modal de alerta
showAlertModal({
    title: 'Sucesso!',
    message: 'Operação realizada com sucesso!',
    type: 'success'
});
```

### **Modais Específicos**
Carregados conforme a página:

```javascript
// Carregamento automático baseado na página
await loadPageModals('reservas'); // Carrega modals-reservas.html
await loadPageModals('quartos');  // Carrega modals-quartos.html
```

### **Estrutura de Arquivos de Modais**

```
public/partials/
├── modals-common.html      # ← Sempre carregado
├── modals-reservas.html    # ← Específico de reservas
├── modals-quartos.html     # ← Específico de quartos
└── modals-clientes.html    # ← Específico de clientes
```

---

**Próximos Passos:**
1. Migrar páginas existentes para usar partials
2. Criar modais específicos para quartos e clientes
3. Implementar cache de partials para melhor performance
