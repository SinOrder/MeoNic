// src/db/dexieDb.ts
import Dexie, { type Table } from 'dexie';
import { Assignment, PortableAssignmentDraft } from '../types/assessment';
import { StudentSubmission } from '../types/submission';
import { UserProfile } from '../types/auth';

export class MeonicDatabase extends Dexie {
  drafts!: Table<PortableAssignmentDraft, string>;
  assignments!: Table<Assignment, string>;
  submissions!: Table<StudentSubmission, string>;
  userProfile!: Table<UserProfile, string>;

  constructor() {
    super('MeonicAcademicDB');
    this.version(1).stores({
      drafts: 'draftId, lastModifiedClient',
      assignments: 'assignmentId, courseId, accessMode, isPublished, dueDate',
      submissions: 'submissionId, assignmentId, studentId, status, submittedAt',
      userProfile: 'userId',
    });
  }
}

export const db = new MeonicDatabase();

// Default seed user
export const DEFAULT_USER: UserProfile = {
  userId: 'usr_inst_001',
  email: 'prof.lovelace@university.edu',
  name: 'Prof. Ada Lovelace',
  systemRole: 'instructor',
  linkedLmsAccounts: [
    {
      id: 'lms_link_canvas_01',
      lmsType: 'canvas',
      issuer: 'https://canvas.instructure.com',
      institutionName: 'MIT & Stanford Canvas Consortium',
      lmsUserId: 'canvas_usr_9921',
      lmsEmail: 'alovelace@university.edu',
      linkedAt: '2026-09-01T10:00:00Z',
    },
  ],
  enrolledCourses: [
    {
      courseId: 'crs_ee201',
      courseTitle: 'EE 201: Digital Logic & Computer Architecture',
      courseCode: 'EE201-FALL26',
      lmsType: 'canvas',
      role: 'Instructor',
      status: 'active',
    },
    {
      courseId: 'crs_cs102',
      courseTitle: 'CS 102: Data Structures & State Machines',
      courseCode: 'CS102-FALL26',
      lmsType: 'canvas',
      role: 'Instructor',
      status: 'active',
    },
  ],
};

// Comprehensive Demo Assignment featuring all 7 Question Sub-Part types
export const DEMO_ASSIGNMENT: Assignment = {
  assignmentId: 'asg_digital_logic_midterm',
  courseId: 'crs_ee201',
  lmsCourseName: 'EE 201: Digital Logic & Computer Architecture',
  authorId: 'usr_inst_001',
  authorName: 'Prof. Ada Lovelace',
  title: 'Midterm Examination: Digital Logic, Circuit Schematics & Computer Systems',
  instructionsMarkdown:
    'Welcome to the EE201 Midterm. This assessment is **local-first and offline-resilient**; your responses are autosaved to local browser storage continuously. When complete, submit your work to run the hybrid deterministic/AI evaluation pipeline.',
  accessMode: 'LMS_GATED',
  dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
  latePenaltyPolicy: {
    ruleType: 'percentage',
    deductionRate: 10, // 10% per day
    intervalUnit: 'day',
    gracePeriodMinutes: 15,
    maxCapPercent: 40,
  },
  isPublished: true,
  totalPoints: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  questions: [
    {
      questionId: 'q1_boolean_foundations',
      orderIndex: 0,
      title: 'Question 1: Foundations of Logic & Memory Timing',
      promptMarkdown: 'Answer the following multi-part questions analyzing basic gates and flip-flop timing.',
      parts: [
        {
          partId: 'q1_p1_mcq',
          partIndex: 0,
          partType: 'multiple_choice',
          prompt: 'Which of the following logic gates produce a high output (1) when BOTH inputs are low (0)? (Select all that apply)',
          pointsMax: 10,
          gradingMode: 'deterministic',
          rubricCriteria: [
            { criterionId: 'c1', title: 'Correct Gate Selection', description: 'Selected NOR and XNOR', maxPoints: 10 },
          ],
          referenceSolution: {
            schemaType: 'mcq',
            allowMultiSelect: true,
            options: [
              { id: 'opt_and', text: 'AND Gate' },
              { id: 'opt_nor', text: 'NOR Gate' },
              { id: 'opt_xor', text: 'XOR Gate' },
              { id: 'opt_xnor', text: 'XNOR Gate' },
              { id: 'opt_nand', text: 'NAND Gate' },
            ],
            correctOptionIds: ['opt_nor', 'opt_xnor', 'opt_nand'],
          },
        },
        {
          partId: 'q1_p2_descriptive',
          partIndex: 1,
          partType: 'descriptive',
          prompt: 'Define **Setup Time ($t_{su}$)** and **Hold Time ($t_h$)** in a D flip-flop. What electrical hazard occurs if either timing constraint is violated?',
          pointsMax: 15,
          gradingMode: 'ai_assisted',
          rubricCriteria: [
            { criterionId: 'c2', title: 'Setup Time Definition', description: 'Data stable before clock active edge', maxPoints: 5 },
            { criterionId: 'c3', title: 'Hold Time Definition', description: 'Data stable after clock active edge', maxPoints: 5 },
            { criterionId: 'c4', title: 'Metastability Hazard', description: 'Identification of metastability and undefined logic state', maxPoints: 5 },
          ],
          referenceSolution: {
            schemaType: 'text',
            modelAnswer: 'Setup time is the minimum duration the data input must remain stable before the arrival of the clock edge. Hold time is the minimum duration the data must remain stable after the clock edge. Violating either constraint results in metastability, where the flip-flop output enters an indeterminate voltage level for a non-deterministic settling time.',
            keyConcepts: ['setup time before edge', 'hold time after edge', 'metastability', 'undefined intermediate state', 'settling delay'],
          },
        },
        {
          partId: 'q1_p3_numerical',
          partIndex: 2,
          partType: 'numerical',
          prompt: 'Calculate the RC time constant $\\tau$ (in milliseconds) for a circuit with $R = 4.7\\,\\text{k}\\Omega$ and $C = 2.2\\,\\mu\\text{F}$.',
          pointsMax: 10,
          gradingMode: 'deterministic',
          rubricCriteria: [
            { criterionId: 'c5', title: 'Accurate RC Calculation', description: 'Formula tau = R * C with correct units', maxPoints: 10 },
          ],
          referenceSolution: {
            schemaType: 'num',
            targetValue: 10.34,
            unit: 'ms',
            toleranceMode: 'absolute',
            toleranceValue: 0.15,
          },
        },
      ],
    },
    {
      questionId: 'q2_digital_arithmetic_kmap',
      orderIndex: 1,
      title: 'Question 2: Binary Arithmetic & Karnaugh Map Optimization',
      promptMarkdown: 'Solve the binary addition scratchpad and perform 4-variable K-Map prime implicant grouping.',
      parts: [
        {
          partId: 'q2_p1_binary',
          partIndex: 0,
          partType: 'binary_arithmetic',
          prompt: 'Add the two 4-bit signed two\'s complement numbers: `A = 0110` (+6) and `B = 0101` (+5). Fill in all intermediate carry bits, the 4-bit sum, and specify whether signed overflow occurred.',
          pointsMax: 20,
          gradingMode: 'hybrid',
          rubricCriteria: [
            { criterionId: 'c6', title: 'Carry Bit Tracking', description: 'Carries computed correctly from LSB to MSB', maxPoints: 8 },
            { criterionId: 'c7', title: 'Final Sum Bits', description: 'Sum is 1011 (-5 in two\'s complement)', maxPoints: 8 },
            { criterionId: 'c8', title: 'Signed Overflow Flag', description: 'Identified that overflow occurred (positive + positive = negative)', maxPoints: 4 },
          ],
          referenceSolution: {
            schemaType: 'binary_arithmetic',
            bitWidth: 4,
            representation: 'twos_complement',
            operation: 'addition',
            operands: ['0110', '0101'],
            expectedResult: '1011',
            expectedCarryBits: '0100', // C3=0, C2=1, C1=0, C0=0
            expectedCarryOutFlag: false,
            expectedOverflowFlag: true,
          },
        },
        {
          partId: 'q2_p2_kmap',
          partIndex: 1,
          partType: 'karnaugh_map',
          prompt: 'Optimize the 4-variable Boolean function $F(A,B,C,D) = \\sum m(0, 2, 8, 10, 13, 15) + d(5, 7)$. Use the interactive K-Map to populate minterms, select the four corners and center groupings, and provide the minimal Sum of Products (SOP) expression.',
          pointsMax: 20,
          gradingMode: 'hybrid',
          rubricCriteria: [
            { criterionId: 'c9', title: 'Cell Population', description: 'Correct placement of 1s and Xs', maxPoints: 5 },
            { criterionId: 'c10', title: 'Toroidal Four-Corners Group', description: 'Identified group [0, 2, 8, 10] as B\'D\'', maxPoints: 6 },
            { criterionId: 'c11', title: 'Don\'t Care Inclusion', description: 'Grouped [5, 7, 13, 15] utilizing don\'t cares to form BD', maxPoints: 5 },
            { criterionId: 'c12', title: 'Minimal Expression', description: 'Minimal SOP: B\'D\' + BD', maxPoints: 4 },
          ],
          referenceSolution: {
            schemaType: 'karnaugh_map',
            variableCount: 4,
            variables: ['A', 'B', 'C', 'D'],
            minterms: [0, 2, 8, 10, 13, 15],
            dontCares: [5, 7],
            expressionForm: 'SOP',
            canonicalExpressions: ["B'D' + BD", "BD + B'D'"],
            essentialPrimeImplicants: [
              { groupName: 'Four Corners', minterms: [0, 2, 8, 10], implicantTerm: "B'D'" },
              { groupName: 'Center Quad', minterms: [5, 7, 13, 15], implicantTerm: 'BD' },
            ],
          },
        },
      ],
    },
    {
      questionId: 'q3_circuits_and_diagrams',
      orderIndex: 2,
      title: 'Question 3: Schematic Design & State Machine Architecture',
      promptMarkdown: 'Design an inverting op-amp schematic and model a 2-bit counter state diagram.',
      parts: [
        {
          partId: 'q3_p1_schematex',
          partIndex: 0,
          partType: 'schematics',
          prompt: 'Write the Schematex code for an Inverting Operational Amplifier with input resistor $R_{in} = 1\\,\\text{k}\\Omega$ and feedback resistor $R_f = 10\\,\\text{k}\\Omega$. Connect non-inverting terminal to Ground.',
          pointsMax: 15,
          gradingMode: 'ai_assisted',
          rubricCriteria: [
            { criterionId: 'c13', title: 'Op-Amp Topology', description: 'Inverting input with feedback loop', maxPoints: 8 },
            { criterionId: 'c14', title: 'Component Values & Ground', description: 'Correct Rin, Rf, and ground connection', maxPoints: 7 },
          ],
          referenceSolution: {
            schemaType: 'schematex',
            sourceCode: `// Inverting Op-Amp
VIN in 0 AC 1V
R_IN in inv 1k
RF inv out 10k
OP1 0 inv out OPAMP
RL out 0 10k
GND 0`,
          },
        },
        {
          partId: 'q3_p2_mermaid',
          partIndex: 1,
          partType: 'diagrams',
          prompt: 'Use Mermaid.js to write a `stateDiagram-v2` representing a 2-bit Gray Code counter with states `S00`, `S01`, `S11`, `S10` that loops indefinitely upon receiving a `CLK` trigger.',
          pointsMax: 10,
          gradingMode: 'ai_assisted',
          rubricCriteria: [
            { criterionId: 'c15', title: 'State Definition', description: 'All 4 Gray code states defined', maxPoints: 5 },
            { criterionId: 'c16', title: 'Cyclic Transitions', description: 'Correct single-bit transitions on CLK', maxPoints: 5 },
          ],
          referenceSolution: {
            schemaType: 'mermaid',
            diagramType: 'stateDiagram-v2',
            sourceCode: `stateDiagram-v2
    [*] --> S00
    S00 --> S01: CLK
    S01 --> S11: CLK
    S11 --> S10: CLK
    S10 --> S00: CLK`,
          },
        },
      ],
    },
  ],
};

// Seed database on first launch
export async function seedDatabaseIfEmpty() {
  const userCount = await db.userProfile.count();
  if (userCount === 0) {
    await db.userProfile.put(DEFAULT_USER);
  }

  const assignmentCount = await db.assignments.count();
  if (assignmentCount === 0) {
    await db.assignments.put(DEMO_ASSIGNMENT);
  }
}
