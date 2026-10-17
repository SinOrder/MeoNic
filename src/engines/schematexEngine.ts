// src/engines/schematexEngine.ts

export interface SchematicComponent {
  id: string;
  type: 'R' | 'C' | 'L' | 'V' | 'OPAMP' | 'AND' | 'OR' | 'NOT' | 'XOR' | 'GND' | 'WIRE';
  name: string;
  nodes: string[];
  value?: string;
  x: number;
  y: number;
}

export interface SchematicCircuit {
  title: string;
  components: SchematicComponent[];
  wires: Array<{ from: string; to: string }>;
  nodes: string[];
  rawCode: string;
  parseErrors: string[];
}

/**
 * Parses Schematex netlist-like syntax into an interactive circuit graph.
 * Example syntax:
 *   VIN in 0 AC 1V
 *   R_IN in inv 1k
 *   RF inv out 10k
 *   OP1 0 inv out OPAMP
 *   GND 0
 */
export function parseSchematex(code: string): SchematicCircuit {
  const lines = code.split('\n');
  const components: SchematicComponent[] = [];
  const wires: Array<{ from: string; to: string }> = [];
  const nodesSet = new Set<string>();
  const parseErrors: string[] = [];

  let currentX = 80;
  let currentY = 120;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('//') || rawLine.startsWith('#')) {
      continue;
    }

    const tokens = rawLine.split(/\s+/);
    const designator = tokens[0].toUpperCase();

    try {
      if (designator.startsWith('R') || designator.startsWith('RES')) {
        // Resistor: R1 nodeA nodeB 10k
        const nodeA = tokens[1] || 'n1';
        const nodeB = tokens[2] || 'n2';
        const val = tokens[3] || '1k';
        nodesSet.add(nodeA);
        nodesSet.add(nodeB);
        components.push({
          id: `comp_${i}`,
          type: 'R',
          name: tokens[0],
          nodes: [nodeA, nodeB],
          value: val,
          x: currentX,
          y: currentY,
        });
        currentX += 90;
      } else if (designator.startsWith('C') || designator.startsWith('CAP')) {
        // Capacitor: C1 nodeA nodeB 1uF
        const nodeA = tokens[1] || 'n1';
        const nodeB = tokens[2] || 'n2';
        const val = tokens[3] || '1uF';
        nodesSet.add(nodeA);
        nodesSet.add(nodeB);
        components.push({
          id: `comp_${i}`,
          type: 'C',
          name: tokens[0],
          nodes: [nodeA, nodeB],
          value: val,
          x: currentX,
          y: currentY,
        });
        currentX += 90;
      } else if (designator.startsWith('V') || designator.startsWith('SRC')) {
        // Voltage Source: V1 in 0 5V
        const nodeA = tokens[1] || 'in';
        const nodeB = tokens[2] || '0';
        const val = tokens.slice(3).join(' ') || '5V';
        nodesSet.add(nodeA);
        nodesSet.add(nodeB);
        components.push({
          id: `comp_${i}`,
          type: 'V',
          name: tokens[0],
          nodes: [nodeA, nodeB],
          value: val,
          x: 60,
          y: 200,
        });
      } else if (designator.includes('OPAMP') || designator.startsWith('OP')) {
        // OpAmp: OP1 non_inv inv out OPAMP
        const nonInv = tokens[1] || '0';
        const inv = tokens[2] || 'inv';
        const out = tokens[3] || 'out';
        nodesSet.add(nonInv);
        nodesSet.add(inv);
        nodesSet.add(out);
        components.push({
          id: `comp_${i}`,
          type: 'OPAMP',
          name: tokens[0],
          nodes: [nonInv, inv, out],
          value: 'Op-Amp',
          x: currentX + 60,
          y: currentY + 40,
        });
        currentX += 130;
      } else if (designator.startsWith('GND')) {
        // Ground: GND 0
        const node = tokens[1] || '0';
        nodesSet.add(node);
        components.push({
          id: `comp_${i}`,
          type: 'GND',
          name: 'GND',
          nodes: [node],
          x: 60,
          y: 280,
        });
      } else if (['AND', 'OR', 'NOT', 'XOR'].some(g => designator.startsWith(g))) {
        // Logic Gate: AND1 inA inB out
        const gateType = (designator.startsWith('AND') ? 'AND' :
                          designator.startsWith('OR') ? 'OR' :
                          designator.startsWith('NOT') ? 'NOT' : 'XOR') as any;
        const nList = tokens.slice(1);
        nList.forEach(n => nodesSet.add(n));
        components.push({
          id: `comp_${i}`,
          type: gateType,
          name: tokens[0],
          nodes: nList,
          value: gateType,
          x: currentX,
          y: currentY,
        });
        currentX += 100;
      } else {
        // Generic wire or connection
        if (tokens.length >= 3) {
          wires.push({ from: tokens[1], to: tokens[2] });
        }
      }
    } catch (err: any) {
      parseErrors.push(`Line ${i + 1}: ${err.message || 'Syntax error'}`);
    }
  }

  return {
    title: 'Schematex Live Circuit',
    components,
    wires,
    nodes: Array.from(nodesSet),
    rawCode: code,
    parseErrors,
  };
}
