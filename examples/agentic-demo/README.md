# Agentic Visual Components - Examples

This directory contains examples demonstrating the agentic visual interaction system.

## 🎨 What Are Agentic Visuals?

Unlike traditional static UI components, agentic visuals are **living, breathing interfaces** that:
- React to agent state in real-time
- Use organic animations and physics
- Visualize thought processes, not just results
- Feel alive and conscious

---

## 📂 Examples

### [agentic-demo/](./agentic-demo/)

Interactive demo showcasing:

**1. Neural Pulse Network**
- Visualizes agent's "brain" as connected nodes
- Pulses flow when agent is thinking
- Nodes activate based on processing phase
- Hover to highlight connections

**2. Thought Particles**
- Particles represent ideas forming
- **Gather mode**: Spiral inward (collecting data)
- **Process mode**: Orbit (analyzing)
- **Generate mode**: Flow outward (creating)
- **Scatter mode**: Disperse (blocked/paused)

**3. Data Organism**
- Living chart that breathes
- Cells react to cursor (reach/retract)
- Morphs smoothly when data updates
- Feels like a living entity

---

## 🚀 Running the Demo

```bash
cd examples/agentic-demo
# Open index.html in browser (no build needed)
open index.html
```

---

## 🎯 Key Concepts

### Agent Phases

The visual system maps agent processing phases to animations:

| Agent Phase | Neural Network | Thought Particles | Visual Effect |
|-------------|----------------|-------------------|---------------|
| `idle` | Gentle breathing | Slow orbit | Calm, ambient |
| `researching` | Input nodes glow | Gather inward | Focused collection |
| `processing` | Analysis nodes fire | Medium orbit | Active thinking |
| `analyzing` | Network pulses | Tight orbit | Deep concentration |
| `generating` | Output nodes active | Flow outward | Creative burst |
| `blocked` | Decision node blinks | Scatter | Uncertainty |

### Animation Principles

1. **Organic Over Mechanical**: Curves, easing, natural motion
2. **Continuous Over Discrete**: Always breathing, never static
3. **Responsive Over Passive**: Reacts to cursor, clicks, state
4. **Expressive Over Efficient**: Show the process, not just results

---

## 🔧 Integration

### Using with MCP Server

```typescript
import { NeuralPulse, ThoughtParticles } from '@chameleon/framework';

// Create neural network viz
const neural = new NeuralPulse({
  container: document.getElementById('agent-brain'),
  autoStart: true,
});

// Connect to agent state
stateStream.on('status', (event) => {
  neural.setAgentPhase(event.data.phase);
});

// React to agent events
stateStream.on('ui_delta', (event) => {
  if (event.data.component) {
    neural.react('thinking');
  }
});
```

### Custom Agent Phases

```typescript
// Map your agent's states to visual phases
const phaseMap = {
  'web_search': 'researching',
  'code_analysis': 'analyzing',
  'writing_response': 'generating',
  'waiting_for_input': 'blocked',
};

agent.on('state_change', (state) => {
  const visualPhase = phaseMap[state];
  neural.setAgentPhase(visualPhase);
});
```

---

## 💡 Tips

1. **Start with Neural Pulse** - Most versatile, works for any agent
2. **Use Thought Particles** - Great for ideation/brainstorming agents
3. **Data Organism for Analytics** - Perfect for data analysis agents
4. **Combine Multiple** - Use different visuals for different agent subsystems

---

## 📚 Learn More

- [Agentic Animation Base Class](../../src/agentic/AgenticAnimation.ts)
- [NeuralPulse Implementation](../../src/agentic/NeuralPulse.ts)
- [Implementation Plan](../../docs/agentic-visuals.md)

---

**Built with Anime.js** - Lightweight, powerful animation library
