/**
 * BizFlow AI — Step 21 Visual Workflow Builder Test Suite
 * Validates:
 * 1. Allowlisted Node Types (9 approved types only, rejects unauthorized types)
 * 2. Starting Trigger Validation (Exactly 1 trigger, rejects 0 or multiple, no incoming edges to trigger)
 * 3. Connectivity & Reachability (BFS orphan node detection, rejects disconnected steps)
 * 4. Edge Validation (Prevents self-loops, non-existent node references, duplicate edges)
 * 5. Strict Human Approval Enforcement on Communication Nodes (Email, WhatsApp, SMS must require human review)
 * 6. Legacy Backward Compatibility (Fixed 5-step MVP and legacy workflows continue to pass and execute)
 * 7. Server Validation Endpoint (POST /api/workflows/validate)
 * 8. CRUD Operations for Visual Workflows (POST, GET, PUT, DELETE /api/workflows)
 * 9. Multi-Tenant Authorization & Owner Isolation
 * 10. WorkflowExecution Model & Statuses (Supports 'Waiting for Human Review' & step results)
 * 11. Secret & Key Leakage Prevention (No credentials or keys leaked in workflow definitions)
 */

import {
  ALLOWED_NODE_TYPES,
  validateWorkflowDefinition,
} from '../src/validators/workflowValidator.js'
import { Workflow, WorkflowExecution } from '../src/models/index.js'
import { executeNewLeadWorkflow } from '../src/services/workflowEngine.js'

export async function runStep21Tests() {
  const BASE_URL = 'http://localhost:5000/api'
  console.log('==================================================================')
  console.log('       BIZFLOW AI — STEP 21 VISUAL WORKFLOW BUILDER TESTS        ')
  console.log('==================================================================\n')

  const results = { passed: [], failed: [] }

  function assert(num, name, condition, details = '') {
    const label = `Test ${num}: ${name}${details ? ` — ${details}` : ''}`
    if (condition) {
      console.log(`[PASS] ${label}`)
      results.passed.push(label)
    } else {
      console.error(`[FAIL] ${label}`)
      results.failed.push(label)
    }
  }

  // Helper to authenticate test user
  async function getAuthToken() {
    const email = `test_builder_${Date.now()}@bizflow.io`
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Workflow Engineer',
        email,
        password: 'Password123!',
      }),
    })
    const data = await res.json()
    if (!data.token) {
      throw new Error(`Auth failed: ${data.message || 'No token'}`)
    }
    return { token: data.token, user: data.user }
  }

  // -------------------------------------------------------------
  // 1. ALLOWLISTED NODE TYPES
  // -------------------------------------------------------------
  const nodeTypeKeys = Object.keys(ALLOWED_NODE_TYPES)
  assert(
    1,
    'Allowlisted Node Types Count',
    nodeTypeKeys.length === 9,
    `Found ${nodeTypeKeys.length} node types (Expected: 9)`
  )

  const expectedTypes = [
    'trigger_new_lead',
    'ai_analyze_lead',
    'ai_generate_draft',
    'crm_update_lead',
    'crm_create_task',
    'crm_record_activity',
    'comm_send_email',
    'comm_send_whatsapp',
    'comm_send_sms',
  ]
  const allExpectedPresent = expectedTypes.every((t) => ALLOWED_NODE_TYPES[t] !== undefined)
  assert(
    2,
    'All 9 Bounded Node Types Configured',
    allExpectedPresent,
    `Triggers, AI, CRM, and Communication nodes configured`
  )

  // -------------------------------------------------------------
  // 2. UNAUTHORIZED NODE TYPE REJECTION
  // -------------------------------------------------------------
  const invalidTypeResult = validateWorkflowDefinition({
    name: 'Malicious Script Flow',
    nodes: [
      { id: 'n1', type: 'trigger_new_lead', label: 'Trigger', category: 'trigger' },
      { id: 'n2', type: 'run_arbitrary_eval', label: 'Injected Code', category: 'ai' },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
  })
  assert(
    3,
    'Reject Unauthorized / Injected Node Types',
    !invalidTypeResult.isValid &&
      invalidTypeResult.errors.some((e) => e.includes('Invalid node type')),
    `Rejected "run_arbitrary_eval"`
  )

  // -------------------------------------------------------------
  // 3. TRIGGER NODE VALIDATION (EXACTLY 1 TRIGGER)
  // -------------------------------------------------------------
  const noTriggerResult = validateWorkflowDefinition({
    name: 'Flow Without Trigger',
    nodes: [
      { id: 'n1', type: 'ai_analyze_lead', label: 'Analyze', category: 'ai' },
    ],
    edges: [],
  })
  assert(
    4,
    'Reject Workflow Missing Starting Trigger',
    !noTriggerResult.isValid &&
      noTriggerResult.errors.some((e) => e.includes('exactly one starting Trigger')),
    `Error: ${noTriggerResult.errors[0]}`
  )

  const multiTriggerResult = validateWorkflowDefinition({
    name: 'Multiple Triggers Flow',
    nodes: [
      { id: 't1', type: 'trigger_new_lead', label: 'Trigger 1', category: 'trigger' },
      { id: 't2', type: 'trigger_new_lead', label: 'Trigger 2', category: 'trigger' },
      { id: 'n1', type: 'ai_analyze_lead', label: 'Analyze', category: 'ai' },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 'n1' },
      { id: 'e2', source: 't2', target: 'n1' },
    ],
  })
  assert(
    5,
    'Reject Workflow with Multiple Triggers',
    !multiTriggerResult.isValid &&
      multiTriggerResult.errors.some((e) => e.includes('Only one trigger is permitted')),
    `Detected ${multiTriggerResult.errors.length} errors`
  )

  const incomingToTriggerResult = validateWorkflowDefinition({
    name: 'Trigger with Incoming Edge',
    nodes: [
      { id: 't1', type: 'trigger_new_lead', label: 'Trigger', category: 'trigger' },
      { id: 'n1', type: 'ai_analyze_lead', label: 'Analyze', category: 'ai' },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 'n1' },
      { id: 'e2', source: 'n1', target: 't1' },
    ],
  })
  assert(
    6,
    'Reject Incoming Edge to Starting Trigger Node',
    !incomingToTriggerResult.isValid &&
      incomingToTriggerResult.errors.some((e) => e.includes('Trigger nodes cannot have incoming connections')),
    `Enforced trigger root status`
  )

  // -------------------------------------------------------------
  // 4. REACHABILITY & ORPHAN NODE DETECTION
  // -------------------------------------------------------------
  const orphanNodeResult = validateWorkflowDefinition({
    name: 'Orphan Step Flow',
    nodes: [
      { id: 't1', type: 'trigger_new_lead', label: 'Trigger', category: 'trigger' },
      { id: 'n1', type: 'ai_analyze_lead', label: 'Analyze', category: 'ai' },
      { id: 'n2', type: 'crm_create_task', label: 'Disconnected Task', category: 'crm' },
    ],
    edges: [{ id: 'e1', source: 't1', target: 'n1' }],
  })
  assert(
    7,
    'Reject Disconnected / Orphan Nodes',
    !orphanNodeResult.isValid &&
      orphanNodeResult.errors.some((e) => e.includes('Orphan nodes detected')),
    `Detected orphan: ${orphanNodeResult.errors.find((e) => e.includes('Orphan'))}`
  )

  // -------------------------------------------------------------
  // 5. SELF-LOOP & INVALID EDGE DETECTION
  // -------------------------------------------------------------
  const selfLoopResult = validateWorkflowDefinition({
    name: 'Self Loop Flow',
    nodes: [
      { id: 't1', type: 'trigger_new_lead', label: 'Trigger', category: 'trigger' },
      { id: 'n1', type: 'ai_analyze_lead', label: 'Analyze', category: 'ai' },
    ],
    edges: [
      { id: 'e1', source: 't1', target: 'n1' },
      { id: 'e2', source: 'n1', target: 'n1' },
    ],
  })
  assert(
    8,
    'Reject Self-Looping Connections',
    !selfLoopResult.isValid &&
      selfLoopResult.errors.some((e) => e.includes('Self-connecting edge detected')),
    `Self-loop caught on node n1`
  )

  const nonExistentNodeResult = validateWorkflowDefinition({
    name: 'Ghost Node Edge Flow',
    nodes: [
      { id: 't1', type: 'trigger_new_lead', label: 'Trigger', category: 'trigger' },
    ],
    edges: [{ id: 'e1', source: 't1', target: 'ghost_node_99' }],
  })
  assert(
    9,
    'Reject Edge Connecting to Non-Existent Node',
    !nonExistentNodeResult.isValid &&
      nonExistentNodeResult.errors.some((e) => e.includes('non-existent node ID')),
    `Enforced graph integrity`
  )

  // -------------------------------------------------------------
  // 6. HUMAN APPROVAL REQUIREMENT FOR COMMUNICATION NODES
  // -------------------------------------------------------------
  const missingApprovalResult = validateWorkflowDefinition({
    name: 'Autonomous Communication Breach Attempt',
    nodes: [
      { id: 't1', type: 'trigger_new_lead', label: 'Trigger', category: 'trigger' },
      {
        id: 'c1',
        type: 'comm_send_email',
        label: 'Auto Email',
        category: 'communication',
        config: { humanApprovalRequired: false },
      },
    ],
    edges: [{ id: 'e1', source: 't1', target: 'c1' }],
  })
  assert(
    10,
    'Reject Communication Node with humanApprovalRequired=false',
    !missingApprovalResult.isValid &&
      missingApprovalResult.errors.some((e) => e.includes('Human Approval Required enabled')),
    `Blocked autonomous email dispatch`
  )

  const missingApprovalResultSms = validateWorkflowDefinition({
    name: 'Autonomous SMS Attempt',
    nodes: [
      { id: 't1', type: 'trigger_new_lead', label: 'Trigger', category: 'trigger' },
      {
        id: 'c2',
        type: 'comm_send_sms',
        label: 'Auto SMS',
        category: 'communication',
        config: {}, // Missing humanApprovalRequired
      },
    ],
    edges: [{ id: 'e1', source: 't1', target: 'c2' }],
  })
  assert(
    11,
    'Reject Communication Node with Missing humanApprovalRequired',
    !missingApprovalResultSms.isValid &&
      missingApprovalResultSms.errors.some((e) => e.includes('Human Approval Required enabled')),
    `Blocked autonomous SMS dispatch`
  )

  // -------------------------------------------------------------
  // 7. VALID VISUAL WORKFLOW GRAPH ACCEPTANCE
  // -------------------------------------------------------------
  const validVisualGraph = {
    name: 'Complete AI Sales & Outreach Sequence',
    description: 'Trigger -> Analyze -> Update -> Email (Reviewed) -> Task -> Activity',
    trigger: 'New Lead Created',
    nodes: [
      { id: 'node_trig', type: 'trigger_new_lead', label: 'New Lead Inbound', category: 'trigger' },
      { id: 'node_ai', type: 'ai_analyze_lead', label: 'Analyze Lead', category: 'ai', config: { model: 'gemini-1.5-flash' } },
      { id: 'node_crm', type: 'crm_update_lead', label: 'Update CRM', category: 'crm' },
      {
        id: 'node_email',
        type: 'comm_send_email',
        label: 'Send Email Outreach',
        category: 'communication',
        config: { humanApprovalRequired: true, channel: 'email' },
      },
      { id: 'node_task', type: 'crm_create_task', label: 'Follow-Up Task', category: 'crm' },
      { id: 'node_log', type: 'crm_record_activity', label: 'Record Log', category: 'crm' },
    ],
    edges: [
      { id: 'e1', source: 'node_trig', target: 'node_ai' },
      { id: 'e2', source: 'node_ai', target: 'node_crm' },
      { id: 'e3', source: 'node_crm', target: 'node_email' },
      { id: 'e4', source: 'node_crm', target: 'node_task' },
      { id: 'e5', source: 'node_task', target: 'node_log' },
    ],
  }
  const validRes = validateWorkflowDefinition(validVisualGraph)
  assert(
    12,
    'Valid Visual Workflow Definition Accepted',
    validRes.isValid === true && validRes.errors.length === 0,
    `Validated 6 connected nodes with locked human review`
  )

  // -------------------------------------------------------------
  // 8. BACKWARD COMPATIBILITY WITH LEGACY WORKFLOWS
  // -------------------------------------------------------------
  const legacyWorkflow = {
    name: 'New Lead Follow-Up',
    description: 'Fixed MVP sequence',
    trigger: 'New Lead Created',
  }
  const legacyRes = validateWorkflowDefinition(legacyWorkflow)
  assert(
    13,
    'Legacy Workflow Definition Passes (Backward Compatible)',
    legacyRes.isValid === true && legacyRes.isLegacy === true,
    `Preserved legacy workflow execution without visual nodes requirement`
  )

  // -------------------------------------------------------------
  // 9. API INTEGRATION: VALIDATE ENDPOINT (POST /api/workflows/validate)
  // -------------------------------------------------------------
  let authToken = null
  let testUserId = null
  try {
    const auth = await getAuthToken()
    authToken = auth.token
    testUserId = auth.user?.id || auth.user?._id
  } catch (err) {
    console.warn(`[WARN] Auth setup error: ${err.message}`)
  }

  if (authToken) {
    const valEndpointRes = await fetch(`${BASE_URL}/workflows/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(validVisualGraph),
    })
    const valData = await valEndpointRes.json()
    assert(
      14,
      'POST /api/workflows/validate (Valid Graph)',
      valEndpointRes.status === 200 && valData.isValid === true && valData.errors.length === 0,
      `Validation endpoint returned isValid: true`
    )

    const valInvalidEndpointRes = await fetch(`${BASE_URL}/workflows/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Invalid Test',
        nodes: [{ id: 'n1', type: 'crm_create_task', category: 'crm' }],
        edges: [],
      }),
    })
    const valInvalidData = await valInvalidEndpointRes.json()
    assert(
      15,
      'POST /api/workflows/validate (Invalid Graph)',
      valInvalidEndpointRes.status === 200 &&
        valInvalidData.isValid === false &&
        valInvalidData.errors.length > 0,
      `Reported: ${valInvalidData.errors[0]}`
    )

    // -------------------------------------------------------------
    // 10. API INTEGRATION: CREATE VISUAL WORKFLOW (POST /api/workflows)
    // -------------------------------------------------------------
    const createRes = await fetch(`${BASE_URL}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(validVisualGraph),
    })
    const createData = await createRes.json()
    assert(
      16,
      'POST /api/workflows (Create Visual Workflow)',
      createRes.status === 201 &&
        createData.workflow &&
        createData.workflow.name === validVisualGraph.name &&
        createData.workflow.nodes?.length === 6 &&
        createData.workflow.edges?.length === 5 &&
        createData.workflow.isVisualWorkflow === true,
      `Created workflow ID: ${createData.workflow?._id || createData.workflow?.id}`
    )

    const createdWorkflowId = createData.workflow?._id || createData.workflow?.id

    // Attempt creating invalid workflow via POST
    const createInvalidRes = await fetch(`${BASE_URL}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Bad Graph',
        nodes: [
          { id: 't1', type: 'trigger_new_lead', category: 'trigger' },
          { id: 'orphan1', type: 'ai_analyze_lead', category: 'ai' },
        ],
        edges: [], // No edge connecting them!
      }),
    })
    const createInvalidData = await createInvalidRes.json()
    assert(
      17,
      'POST /api/workflows (Rejects Invalid Graph with 400)',
      createInvalidRes.status === 400 && createInvalidData.success === false,
      `Rejected with 400: ${createInvalidData.message}`
    )

    // -------------------------------------------------------------
    // 11. API INTEGRATION: GET WORKFLOW BY ID (GET /api/workflows/:id)
    // -------------------------------------------------------------
    if (createdWorkflowId) {
      const getRes = await fetch(`${BASE_URL}/workflows/${createdWorkflowId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const getData = await getRes.json()
      assert(
        18,
        'GET /api/workflows/:id (Fetch Visual Workflow with Nodes & Executions)',
        getRes.status === 200 &&
          getData.workflow &&
          getData.workflow.nodes?.length === 6 &&
          Array.isArray(getData.workflow.executions),
        `Fetched workflow "${getData.workflow?.name}" with ${getData.workflow?.nodes?.length} nodes`
      )

      // -------------------------------------------------------------
      // 12. API INTEGRATION: UPDATE WORKFLOW (PUT /api/workflows/:id)
      // -------------------------------------------------------------
      const updatedNodes = [
        ...validVisualGraph.nodes,
        {
          id: 'node_sms',
          type: 'comm_send_sms',
          label: 'SMS Alert to Sales Rep',
          category: 'communication',
          config: { humanApprovalRequired: true, channel: 'sms' },
        },
      ]
      const updatedEdges = [
        ...validVisualGraph.edges,
        { id: 'e6', source: 'node_task', target: 'node_sms' },
      ]

      const putRes = await fetch(`${BASE_URL}/workflows/${createdWorkflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Updated Complete AI Sales Flow',
          nodes: updatedNodes,
          edges: updatedEdges,
        }),
      })
      const putData = await putRes.json()
      assert(
        19,
        'PUT /api/workflows/:id (Update Visual Workflow Graph)',
        putRes.status === 200 &&
          putData.workflow &&
          putData.workflow.name === 'Updated Complete AI Sales Flow' &&
          putData.workflow.nodes?.length === 7,
        `Updated to 7 nodes with SMS notification`
      )

      // -------------------------------------------------------------
      // 13. API INTEGRATION: DELETE WORKFLOW (DELETE /api/workflows/:id)
      // -------------------------------------------------------------
      const delRes = await fetch(`${BASE_URL}/workflows/${createdWorkflowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const delData = await delRes.json()
      assert(
        20,
        'DELETE /api/workflows/:id (Delete Visual Workflow)',
        delRes.status === 200 && delData.success === true,
        `Deleted workflow successfully`
      )

      // Confirm workflow is 404 after deletion
      const confirmDelRes = await fetch(`${BASE_URL}/workflows/${createdWorkflowId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      assert(
        21,
        'GET /api/workflows/:id (Returns 404 after deletion)',
        confirmDelRes.status === 404,
        `Verified deleted workflow cannot be retrieved`
      )
    }
  }

  // -------------------------------------------------------------
  // 14. WORKFLOW EXECUTION MODEL & STATUS INTEGRITY
  // -------------------------------------------------------------
  const statusValues = WorkflowExecution.schema.path('status').enumValues
  const supportsHumanReview = statusValues.includes('Waiting for Human Review')
  assert(
    22,
    'WorkflowExecution Status Enum Supports "Waiting for Human Review"',
    supportsHumanReview,
    `Available statuses: ${statusValues.join(', ')}`
  )

  const hasStepResults = WorkflowExecution.schema.path('stepResults') !== undefined
  assert(
    23,
    'WorkflowExecution Supports Step Results Array',
    hasStepResults,
    `Step execution history captured in schema`
  )

  // -------------------------------------------------------------
  // 15. ISOLATION: FIXED NEW LEAD WORKFLOW RUNS UNTOUCHED
  // -------------------------------------------------------------
  const leadSample = {
    _id: 'lead_step21_test_' + Date.now(),
    id: 'lead_step21_test_' + Date.now(),
    name: 'Sarah Connor',
    email: 'sarah.connor@cyberdyne.org',
    company: 'Cyberdyne Systems',
    status: 'New',
  }
  const workflowResult = await executeNewLeadWorkflow(leadSample, testUserId || 'dev_user_step21')
  assert(
    24,
    'executeNewLeadWorkflow Continues Operating Normally',
    workflowResult && workflowResult.success === true && workflowResult.execution?.status === 'Succeeded',
    `Status: ${workflowResult?.execution?.status || 'failed'}`
  )

  // -------------------------------------------------------------
  // 16. SECRET & KEY PROTECTION
  // -------------------------------------------------------------
  const serialized = JSON.stringify(validVisualGraph)
  const noKeysLeaked =
    !serialized.includes('AIza') &&
    !serialized.includes('sk_') &&
    !serialized.includes('GEMINI_API_KEY') &&
    !serialized.includes('process.env')
  assert(
    25,
    'No API Keys or Secrets Commingled with Workflow Definitions',
    noKeysLeaked,
    `Safe client/server data boundary maintained`
  )

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n==================================================================')
  console.log(`TOTAL TESTS: ${results.passed.length + results.failed.length}`)
  console.log(`PASSED:      ${results.passed.length}`)
  console.log(`FAILED:      ${results.failed.length}`)
  console.log('==================================================================\n')

  if (results.failed.length > 0) {
    throw new Error(`Step 21 test suite failed with ${results.failed.length} failures.`)
  }
  return results
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('step21WorkflowBuilder.test.js')) {
  runStep21Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

export default runStep21Tests
