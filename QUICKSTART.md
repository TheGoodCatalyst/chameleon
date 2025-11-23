# Chameleon Framework - Quick Reference

## 🚀 Getting Started

### Installation
```bash
npm install @chameleon/framework
```

### Basic Usage

```typescript
import { ChameleonRenderer } from '@chameleon/framework';
import '@chameleon/framework/styles';

const renderer = new ChameleonRenderer({
  container: '#app',
  mcpServerUrl: 'ws://localhost:3000',
  deploymentConfig: './deployment-config.json'
});

await renderer.start();
```

## 📋 Core Concepts

### 1. View Content
Components the agent can return instead of text:

```json
{
  "type": "component",
  "component_name": "card",
  "data": { "title": "Hello", "content": "World" },
  "layer": "focus"
}
```

### 2. State Deltas
Real-time UI updates:

```json
{
  "target_id": "chart-1",
  "operation": "update",
  "payload": { "data": [...] }
}
```

### 3. Multi-Layer HUD
- **Peripheral**: Status bars, progress
- **Focus**: Main content
- **Interrupt**: Modals, blockers

### 4. Deployment Config
Per-customer branding:

```json
{
  "brand": {
    "theme": {
      "colors": { "primary": "#6366f1" }
    }
  }
}
```

## 🧩 Components

| Component | Purpose | Example |
|-----------|---------|---------|
| `card` | Info containers | Profile cards, summaries |
| `chart` | Data viz | Line, bar, pie charts |
| `form` | Input collection | Task creation, settings |
| `gauge` | Single metric | Temperature, progress |
| `table` | Tabular data | Lists, comparisons |

## 📡 MCP Server (Python)

```python
from chameleon import MCPViewResponse, ViewContent

@mcp_tool
async def analyze(query: str):
    return MCPViewResponse(
        content=[
            ViewContent(
                type="component",
                component_name="chart",
                data={
                    "chart_type": "line",
                    "data": {...}
                }
            )
        ]
    )
```

## 🎨 Customization

### Custom Component

```typescript
import { defineComponent } from '@chameleon/framework';

const MyComponent = defineComponent('my-comp', (props, container) => {
  const el = document.createElement('div');
  el.textContent = props.text;
  container.appendChild(el);
  return { element: el };
});

renderer.getRegistry().register(MyComponent);
```

### Override in Deployment

```json
{
  "component_overrides": {
    "card": {
      "module": "./MyCard.tsx"
    }
  }
}
```

## 📁 File Structure

```
project/
├── deployment-config.json    # Brand & design config
├── index.html                # Client app
└── server.py                 # MCP server
```

## 🔗 Links

- [Full Documentation](./README.md)
- [Protocol Spec](./specs/README.md)
- [Examples](./examples/)
- [Walkthrough](./walkthrough.md)

## 💡 Tips

1. **Start Simple**: Use built-in components first
2. **Theme Smart**: CSS variables for dynamic theming
3. **Stream Wisely**: Use state deltas for real-time updates
4. **Layer Correctly**: Peripheral for status, Focus for content, Interrupt for blockers

---

**Need help?** Check the [examples](./examples/) directory for complete implementations.
