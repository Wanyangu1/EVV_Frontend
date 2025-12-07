<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

// Reactive state
const uploading = ref(false)
const loadingXrefs = ref(false)
const checkingStatus = ref(false)
const uploadResult = ref(null)
const statusResult = ref(null)
const manualTransactionId = ref('')
const xrefs = ref([])
const activeTab = ref('list') // 'list', 'create', 'upload', 'status'

// New state for dropdowns
const clients = ref([])
const employees = ref([])
const loadingClients = ref(false)
const loadingEmployees = ref(false)

// Constants from EVV specification
const APPROVED_PAYER_IDS = [
  'AZACH', 'AZBUFC', 'AZCCCS', 'AZCDMP', 'AZDDD',
  'AZMCC', 'AZMYC', 'AZSHC', 'AZUCP'
]

// From Section 10.10 - Services applicable for live-in caregiver
const APPROVED_PROCEDURE_CODES = [
  { code: 'S5125', description: 'Attendant Care' },
  { code: 'T2017', description: 'Habilitation' },
  { code: 'T1021', description: 'Home Health Aide' },
  { code: 'S5130', description: 'Homemaker' },
  { code: 'T1019', description: 'Personal Care' },
  { code: 'S5150', description: 'Respite (per 15 min)' },
  { code: 'S5151', description: 'Respite (per diem)' }
]

// From Xref table in spec - EXACT values EVV expects
const APPROVED_RELATIONSHIPS = [
  'Spouse',
  'Adult children/Stepchildren',
  'Son-in-law/Daughter-in-law',
  'Grandchildren',
  'Siblings/Step siblings',
  'Parents/Adoptive Parents/Legal Guardians',
  'Stepparents',
  'Grandparents',
  'Mother-in-law/Father-in-law',
  'Brother-in-law/Sister-in-law',
  'Other'
]

// Form data
const newXref = ref({
  clientId: '', // Selected from dropdown
  employeeId: '', // Selected from dropdown
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  payerId: 'AZDDD',
  payerProgram: 'AHCCCS',
  procedureCode: 'T1019',
  modifier1: '',
  modifier2: '',
  modifier3: '',
  modifier4: '',
  liveIn: 'No',
  relationship: 'Other'
})

// Computed properties
const formattedXrefs = computed(() => {
  return xrefs.value.map(xref => ({
    ...xref,
    formattedStartDate: xref.start_date ? new Date(xref.start_date).toLocaleDateString() : 'N/A',
    formattedEndDate: xref.end_date ? new Date(xref.end_date).toLocaleDateString() : 'Active',
    status: xref.end_date && new Date(xref.end_date) < new Date() ? 'Inactive' : 'Active',
    // Use the actual field names from the xref data
    clientDisplay: xref.client_medicaid_id || xref.client_id || 'N/A',
    employeeDisplay: xref.employee_ssn || xref.employee_id || 'N/A'
  }))
})

// Computed for dropdown options
const clientOptions = computed(() => {
  return clients.value.map(client => ({
    value: client.medicaid_id,
    label: `${client.medicaid_id} - ${client.first_name} ${client.last_name}`
  }))
})

const employeeOptions = computed(() => {
  return employees.value.map(employee => ({
    value: employee.ssn,
    label: `${employee.ssn} - ${employee.first_name} ${employee.last_name} (${employee.position})`
  }))
})

const uploadStatusClass = computed(() => {
  if (!uploadResult.value) return ''
  const status = uploadResult.value.evv_response?.status_code || uploadResult.value.status_code
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-800'
  if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
})

const hasInvalidRecords = computed(() => {
  return uploadResult.value?.invalid_records?.length > 0
})

const isMobile = computed(() => {
  return window.innerWidth < 768
})

// Lifecycle
onMounted(() => {
  loadXrefs()
  // Load dropdown data when create tab is active or on mount
  if (activeTab.value === 'create') {
    loadDropdownData()
  }
})

// Watch for tab changes to load dropdown data when needed
watch(activeTab, (newTab) => {
  if (newTab === 'create' && (clients.value.length === 0 || employees.value.length === 0)) {
    loadDropdownData()
  }
})

// Methods
const loadDropdownData = async () => {
  try {
    loadingClients.value = true
    loadingEmployees.value = true

    // Load clients
    const clientsResponse = await axiosInstance.get('/api/evv/clients/')
    clients.value = clientsResponse.data || []

    // Load employees
    const employeesResponse = await axiosInstance.get('/api/evv/employees/')
    employees.value = employeesResponse.data || []

  } catch (error) {
    console.error('Error loading dropdown data:', error)
    alert('Failed to load clients and employees data')
  } finally {
    loadingClients.value = false
    loadingEmployees.value = false
  }
}

const refreshDropdowns = () => {
  loadDropdownData()
}

const validateForm = () => {
  const errors = []

  // Validate client ID (A + 8 digits)
  if (!/^A\d{8}$/.test(newXref.value.clientId)) {
    errors.push('Client ID must start with "A" followed by 8 digits (e.g., A12345678)')
  }

  // Validate employee ID (9-digit SSN)
  if (!/^\d{9}$/.test(newXref.value.employeeId)) {
    errors.push('Employee ID must be a 9-digit SSN (e.g., 123456789)')
  }

  // Validate procedure code
  const validCodes = APPROVED_PROCEDURE_CODES.map(c => c.code)
  if (!validCodes.includes(newXref.value.procedureCode)) {
    errors.push(`Procedure code must be one of: ${validCodes.join(', ')}`)
  }

  // Validate relationship
  if (!APPROVED_RELATIONSHIPS.includes(newXref.value.relationship)) {
    errors.push('Please select a valid relationship type')
  }

  // Validate dates
  if (newXref.value.endDate && new Date(newXref.value.endDate) <= new Date(newXref.value.startDate)) {
    errors.push('End date must be after start date')
  }

  // Validate modifiers (if provided)
  const modifiers = [newXref.value.modifier1, newXref.value.modifier2, newXref.value.modifier3, newXref.value.modifier4]
  modifiers.forEach((mod, index) => {
    if (mod && !/^[A-Z0-9]{2}$/.test(mod)) {
      errors.push(`Modifier ${index + 1} must be exactly 2 alphanumeric characters`)
    }
  })

  return errors
}

const submitNewXref = async () => {
  const errors = validateForm()
  if (errors.length > 0) {
    alert(errors.join('\n'))
    return
  }

  uploading.value = true
  uploadResult.value = null

  try {
    // Build the EVV-compliant payload
    const xrefData = [{
      ProviderIdentification: {
        ProviderQualifier: "MedicaidID",
        ProviderID: "211108" // Should come from settings
      },
      ClientIDQualifier: "ClientMedicaidID",
      ClientIdentifier: newXref.value.clientId,
      EmployeeQualifier: "EmployeeSSN",
      EmployeeIdentifier: newXref.value.employeeId,
      XRefStartDate: newXref.value.startDate,
      XRefEndDate: newXref.value.endDate || null,
      PayerID: newXref.value.payerId,
      PayerProgram: newXref.value.payerProgram, // Must be "AHCCCS"
      ProcedureCode: newXref.value.procedureCode,
      Modifier1: newXref.value.modifier1 || null,
      Modifier2: newXref.value.modifier2 || null,
      Modifier3: newXref.value.modifier3 || null,
      Modifier4: newXref.value.modifier4 || null,
      LiveIn: newXref.value.liveIn, // "Yes" or "No" as string
      Relationship: newXref.value.relationship
    }]

    console.log('Sending Xref data to EVV:', JSON.stringify(xrefData, null, 2))

    // Step 1: Send to EVV using EVVUploadXrefs endpoint
    const evvResponse = await axiosInstance.post('/api/evv/evv/xrefs/upload/', xrefData)

    // Step 2: Create locally after successful EVV upload
    if (evvResponse.data.status_code === 200) {
      await createLocalXref()
      uploadResult.value = {
        ...evvResponse.data,
        message: 'Xref created and sent to EVV successfully'
      }

      resetForm()
      activeTab.value = 'upload'
      loadXrefs()

      // Auto-check status after 2 seconds
      setTimeout(() => {
        if (evvResponse.data.response?.transactionId) {
          checkXrefStatus(evvResponse.data.response.transactionId)
        }
      }, 2000)
    } else {
      uploadResult.value = evvResponse.data
    }

  } catch (error) {
    console.error('Error creating xref:', error)
    uploadResult.value = {
      status_code: 500,
      response: {
        error: 'Failed to create xref',
        details: error.response?.data || error.message
      }
    }
  } finally {
    uploading.value = false
  }
}

const createLocalXref = async () => {
  try {
    // Create in local database
    const localXrefData = {
      client_medicaid_id: newXref.value.clientId,
      employee_ssn: newXref.value.employeeId,
      start_date: newXref.value.startDate,
      end_date: newXref.value.endDate || null,
      payer_id: newXref.value.payerId,
      payer_program: newXref.value.payerProgram,
      procedure_code: newXref.value.procedureCode,
      live_in: newXref.value.liveIn,
      relationship: newXref.value.relationship,
      modifier1: newXref.value.modifier1,
      modifier2: newXref.value.modifier2,
      modifier3: newXref.value.modifier3,
      modifier4: newXref.value.modifier4
    }

    const response = await axiosInstance.post('/api/evv/xrefs/', localXrefData)
    console.log('Local xref created:', response.data)
    return response.data
  } catch (error) {
    console.error('Error creating local xref:', error)
    // Don't fail the whole operation if local creation fails
    return null
  }
}

const resetForm = () => {
  newXref.value = {
    clientId: '',
    employeeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    payerId: 'AZDDD',
    payerProgram: 'AHCCCS',
    procedureCode: 'T1019',
    modifier1: '',
    modifier2: '',
    modifier3: '',
    modifier4: '',
    liveIn: 'No',
    relationship: 'Other'
  }
}

const loadXrefs = async () => {
  loadingXrefs.value = true
  try {
    const response = await axiosInstance.get('/api/evv/xrefs/')
    xrefs.value = response.data
  } catch (error) {
    console.error('Error loading xrefs:', error)
    xrefs.value = []
  } finally {
    loadingXrefs.value = false
  }
}

const sendBatchXrefsToEVV = async () => {
  uploading.value = true
  uploadResult.value = null
  activeTab.value = 'upload'

  try {
    const response = await axiosInstance.post('/api/evv/evv/xrefs/send/')
    uploadResult.value = response.data

    // Refresh the list after upload
    if (response.data.evv_response?.status_code === 200) {
      loadXrefs()

      // Auto-check status
      setTimeout(() => {
        if (response.data.evv_response?.response?.transactionId) {
          checkXrefStatus(response.data.evv_response.response.transactionId)
        }
      }, 2000)
    }

  } catch (error) {
    console.error('Error sending xrefs to EVV:', error)
    uploadResult.value = {
      status_code: 500,
      response: {
        error: 'Failed to send xrefs',
        details: error.response?.data || error.message
      }
    }
  } finally {
    uploading.value = false
  }
}

const deleteXref = async (xrefId) => {
  if (!confirm('Are you sure you want to delete this relationship?')) {
    return
  }

  try {
    await axiosInstance.delete(`/api/xrefs/${xrefId}/`)
    loadXrefs()
  } catch (error) {
    console.error('Error deleting xref:', error)
    alert('Error deleting relationship')
  }
}

const endRelationship = async (xref) => {
  const endDate = prompt('Enter end date (YYYY-MM-DD):', new Date().toISOString().split('T')[0])
  if (!endDate) return

  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    alert('Please enter a valid date in YYYY-MM-DD format')
    return
  }

  try {
    const response = await axiosInstance.put(`/api/evv/xrefs/update/${xref.xref_other_id}/`, {
      end_date: endDate
    })

    if (response.data) {
      loadXrefs()
      alert('Relationship ended and update sent to EVV')
    }
  } catch (error) {
    console.error('Error ending relationship:', error)
    alert('Error ending relationship')
  }
}

const checkXrefStatus = async (transactionId) => {
  if (!transactionId) return

  checkingStatus.value = true
  activeTab.value = 'status'

  try {
    const response = await axiosInstance.get(`/api/evv/check-upload-status/${transactionId}/`)
    statusResult.value = response.data.status_check_result || response.data
  } catch (error) {
    console.error('Error checking status:', error)
    statusResult.value = {
      error: 'Failed to check status',
      details: error.response?.data || error.message
    }
  } finally {
    checkingStatus.value = false
  }
}

const checkManualStatus = async () => {
  if (!manualTransactionId.value.trim()) {
    alert('Please enter a transaction ID')
    return
  }
  await checkXrefStatus(manualTransactionId.value)
}

const getProcedureDescription = (code) => {
  const procedure = APPROVED_PROCEDURE_CODES.find(p => p.code === code)
  return procedure ? procedure.description : ''
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  alert('Copied to clipboard!')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile Header -->
    <div class="lg:hidden bg-white shadow">
      <div class="px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900">EVV Xrefs</h1>
            <p class="text-xs text-gray-600">Client-Employee Relationships</p>
          </div>
          <div class="flex space-x-2">
            <button @click="activeTab = 'list'; loadXrefs()" class="p-2 text-gray-600 hover:text-gray-900">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button @click="activeTab = 'create'" class="p-2 text-blue-600 hover:text-blue-800">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Tabs -->
        <div class="mt-4">
          <div class="grid grid-cols-4 gap-2">
            <button @click="activeTab = 'list'" :class="[
              activeTab === 'list'
                ? 'bg-blue-100 text-blue-700 border-blue-500'
                : 'bg-gray-100 text-gray-700 border-transparent',
              'py-2 text-xs font-medium rounded-lg border'
            ]">
              List
            </button>
            <button @click="activeTab = 'create'" :class="[
              activeTab === 'create'
                ? 'bg-blue-100 text-blue-700 border-blue-500'
                : 'bg-gray-100 text-gray-700 border-transparent',
              'py-2 text-xs font-medium rounded-lg border'
            ]">
              Create
            </button>
            <button @click="activeTab = 'upload'" :class="[
              activeTab === 'upload'
                ? 'bg-blue-100 text-blue-700 border-blue-500'
                : 'bg-gray-100 text-gray-700 border-transparent',
              'py-2 text-xs font-medium rounded-lg border'
            ]">
              Upload
            </button>
            <button @click="activeTab = 'status'" :class="[
              activeTab === 'status'
                ? 'bg-blue-100 text-blue-700 border-blue-500'
                : 'bg-gray-100 text-gray-700 border-transparent',
              'py-2 text-xs font-medium rounded-lg border'
            ]">
              Status
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Header -->
    <div class="hidden lg:block bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">EVV Client-Employee Relationships</h1>
            <p class="mt-2 text-sm text-gray-600">Manage client-employee cross-references (Xrefs) for AHCCCS EVV</p>
          </div>
          <div class="mt-4 sm:mt-0">
            <div class="flex space-x-3">
              <button @click="activeTab = 'list'; loadXrefs()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg class="mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View All
              </button>
              <button @click="activeTab = 'create'"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create New
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop Tabs -->
        <div class="mt-6">
          <nav class="flex space-x-8">
            <button @click="activeTab = 'list'" :class="[
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm'
            ]">
              Relationships List
            </button>
            <button @click="activeTab = 'create'" :class="[
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm'
            ]">
              Create Relationship
            </button>
            <button @click="activeTab = 'upload'" :class="[
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm'
            ]">
              Upload to EVV
            </button>
            <button @click="activeTab = 'status'" :class="[
              activeTab === 'status'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm'
            ]">
              Check Status
            </button>
          </nav>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto md:px-4 lg:px-8 py-8">
      <!-- Relationships List - Mobile -->
      <div v-if="activeTab === 'list' && isMobile" class="space-y-4">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Relationships</h3>
            <div class="flex space-x-2">
              <button @click="loadXrefs" class="p-2 text-gray-600 hover:text-gray-900">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <span class="text-sm text-gray-500">{{ formattedXrefs.length }}</span>
            </div>
          </div>

          <div v-if="loadingXrefs" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-500">Loading...</p>
          </div>

          <div v-else-if="formattedXrefs.length > 0" class="space-y-3">
            <div v-for="xref in formattedXrefs" :key="xref.id" class="border rounded-lg p-3">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ xref.clientDisplay }}</p>
                  <p class="text-xs text-gray-500 truncate">SSN: {{ xref.employeeDisplay }}</p>
                  <div class="flex items-center space-x-2 mt-1">
                    <span :class="[
                      xref.live_in === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
                      'text-xs px-2 py-0.5 rounded-full'
                    ]">
                      {{ xref.live_in }}
                    </span>
                    <span :class="[
                      xref.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                      'text-xs px-2 py-0.5 rounded-full'
                    ]">
                      {{ xref.status }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-600 mt-1">{{ xref.relationship }}</p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ xref.formattedStartDate }} - {{ xref.formattedEndDate }}
                  </p>
                </div>
                <div class="flex space-x-1 ml-2">
                  <button v-if="xref.status === 'Active'" @click="endRelationship(xref)"
                    class="p-1 text-yellow-600 hover:text-yellow-800">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button @click="deleteXref(xref.id)" class="p-1 text-red-600 hover:text-red-800">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.181-.028-.362-.056-.543-.084a20.91 20.91 0 00-2.772-.382C16.724 12.5 14.5 11 12 11s-4.724 1.5-5.685 1.914a20.91 20.91 0 00-2.772.382c-.181.028-.362.056-.543.084m0 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No relationships</h3>
            <p class="mt-1 text-sm text-gray-500">Create a new relationship to get started.</p>
            <button @click="activeTab = 'create'"
              class="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Create New
            </button>
          </div>
        </div>
      </div>

      <!-- Relationships List - Desktop -->
      <div v-else-if="activeTab === 'list'" class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 class="text-lg font-medium text-gray-900">
              Existing Relationships
              <span class="ml-2 text-sm font-normal text-gray-500">
                ({{ formattedXrefs.length }} total)
              </span>
            </h3>
            <div class="mt-3 sm:mt-0">
              <button @click="loadXrefs"
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div class="px-4 py-5 sm:p-6">
          <div v-if="loadingXrefs" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-sm text-gray-500">Loading relationships...</p>
          </div>

          <div v-else-if="formattedXrefs.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client ID
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee SSN
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relationship
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Live In
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="xref in formattedXrefs" :key="xref.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ xref.clientDisplay }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ xref.employeeDisplay }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ xref.relationship }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="[
                      xref.live_in === 'Yes'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800',
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
                    ]">
                      {{ xref.live_in }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Start: {{ xref.formattedStartDate }}</div>
                    <div>End: {{ xref.formattedEndDate }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="[
                      xref.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800',
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
                    ]">
                      {{ xref.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <button v-if="xref.status === 'Active'" @click="endRelationship(xref)"
                        class="text-yellow-600 hover:text-yellow-900 text-sm">
                        End
                      </button>
                      <button @click="deleteXref(xref.id)" class="text-red-600 hover:text-red-900 text-sm">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.181-.028-.362-.056-.543-.084a20.91 20.91 0 00-2.772-.382C16.724 12.5 14.5 11 12 11s-4.724 1.5-5.685 1.914a20.91 20.91 0 00-2.772.382c-.181.028-.362.056-.543.084m0 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No relationships</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating a new client-employee relationship.</p>
            <div class="mt-6">
              <button @click="activeTab = 'create'"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg class="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                New Relationship
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Form -->
      <div v-else-if="activeTab === 'create'" class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-medium text-gray-900">Create New Client-Employee Relationship</h3>
            <button @click="refreshDropdowns" :disabled="loadingClients || loadingEmployees"
              class="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800">
              <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Lists
            </button>
          </div>

          <form @submit.prevent="submitNewXref">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
              <!-- Client ID Dropdown -->
              <div class="col-span-1 md:col-span-1">
                <label for="clientId" class="block text-sm font-medium text-gray-700 mb-1">
                  Client Medicaid ID *
                </label>
                <div class="relative">
                  <select id="clientId" v-model="newXref.clientId"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required>
                    <option value="">Select a client...</option>
                    <option v-for="client in clientOptions" :key="client.value" :value="client.value">
                      {{ client.label }}
                    </option>
                  </select>
                  <div v-if="loadingClients" class="absolute right-3 top-2.5">
                    <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                  <span v-if="clientOptions.length > 0">{{ clientOptions.length }} clients available</span>
                  <span v-else>No clients found. Please refresh or add clients first.</span>
                </div>
              </div>

              <!-- Employee SSN Dropdown -->
              <div class="col-span-1 md:col-span-1">
                <label for="employeeId" class="block text-sm font-medium text-gray-700 mb-1">
                  Employee SSN *
                </label>
                <div class="relative">
                  <select id="employeeId" v-model="newXref.employeeId"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required>
                    <option value="">Select an employee...</option>
                    <option v-for="employee in employeeOptions" :key="employee.value" :value="employee.value">
                      {{ employee.label }}
                    </option>
                  </select>
                  <div v-if="loadingEmployees" class="absolute right-3 top-2.5">
                    <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                  <span v-if="employeeOptions.length > 0">{{ employeeOptions.length }} employees available</span>
                  <span v-else>No employees found. Please refresh or add employees first.</span>
                </div>
              </div>

              <!-- Dates -->
              <div class="col-span-1 md:col-span-1">
                <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input id="startDate" v-model="newXref.startDate" type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required />
              </div>

              <div class="col-span-1 md:col-span-1">
                <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input id="endDate" v-model="newXref.endDate" type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                <p class="mt-1 text-xs text-gray-500">Leave empty for ongoing relationship</p>
              </div>

              <!-- Payer ID -->
              <div class="col-span-1 md:col-span-1">
                <label for="payerId" class="block text-sm font-medium text-gray-700 mb-1">
                  Payer ID *
                </label>
                <select id="payerId" v-model="newXref.payerId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required>
                  <option v-for="payer in APPROVED_PAYER_IDS" :key="payer" :value="payer">
                    {{ payer }}
                  </option>
                </select>
              </div>

              <!-- Procedure Code -->
              <div class="col-span-1 md:col-span-1">
                <label for="procedureCode" class="block text-sm font-medium text-gray-700 mb-1">
                  Procedure Code *
                </label>
                <select id="procedureCode" v-model="newXref.procedureCode"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required>
                  <option v-for="procedure in APPROVED_PROCEDURE_CODES" :key="procedure.code" :value="procedure.code">
                    {{ procedure.code }} - {{ procedure.description }}
                  </option>
                </select>
                <p class="mt-1 text-xs text-gray-500">Only specific codes allowed for live-in caregiver</p>
              </div>

              <!-- Live In -->
              <div class="col-span-1 md:col-span-1">
                <label for="liveIn" class="block text-sm font-medium text-gray-700 mb-1">
                  Live In Caregiver? *
                </label>
                <select id="liveIn" v-model="newXref.liveIn"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <!-- Relationship -->
              <div class="col-span-1 md:col-span-1">
                <label for="relationship" class="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <select id="relationship" v-model="newXref.relationship"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required>
                  <option v-for="rel in APPROVED_RELATIONSHIPS" :key="rel" :value="rel">
                    {{ rel }}
                  </option>
                </select>
              </div>

              <!-- Modifiers -->
              <div class="col-span-1 md:col-span-1">
                <label for="modifier1" class="block text-sm font-medium text-gray-700 mb-1">
                  Modifier 1 (Optional)
                </label>
                <input id="modifier1" v-model="newXref.modifier1" type="text" maxlength="2" placeholder="e.g., U3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>

              <div class="col-span-1 md:col-span-1">
                <label for="modifier2" class="block text-sm font-medium text-gray-700 mb-1">
                  Modifier 2 (Optional)
                </label>
                <input id="modifier2" v-model="newXref.modifier2" type="text" maxlength="2" placeholder="e.g., U4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button type="button" @click="activeTab = 'list'"
                class="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cancel
              </button>
              <button type="submit" :disabled="uploading || loadingClients || loadingEmployees"
                class="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg v-if="uploading" class="animate-spin mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                {{ uploading ? 'Creating...' : 'Create and Send to EVV' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Upload Section -->
      <div v-else-if="activeTab === 'upload'" class="space-y-6">
        <!-- Upload Card -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Upload Relationships to EVV</h3>

            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-blue-700">
                    This will send all active client-employee relationships to the AHCCCS EVV system.
                    Each relationship will be validated and formatted according to EVV specifications.
                  </p>
                </div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <p class="text-sm text-gray-500">
                  {{ formattedXrefs.length }} active relationships found
                </p>
              </div>
              <button @click="sendBatchXrefsToEVV" :disabled="uploading || formattedXrefs.length === 0"
                class="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg v-if="uploading" class="animate-spin mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                {{ uploading ? 'Uploading...' : 'Upload All to EVV' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div v-if="uploadResult" class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <h3 class="text-lg font-medium text-gray-900">Upload Results</h3>
              <span :class="[
                uploadStatusClass,
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
              ]">
                Status: {{ uploadResult.evv_response?.status_code || uploadResult.status_code }}
              </span>
            </div>

            <!-- Summary -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm font-medium text-gray-500">Xrefs Sent</p>
                <p class="mt-1 text-2xl font-semibold text-gray-900">
                  {{ uploadResult.count_sent || 0 }}
                </p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm font-medium text-gray-500">Invalid Records</p>
                <p class="mt-1 text-2xl font-semibold text-gray-900">
                  {{ uploadResult.invalid_count || 0 }}
                </p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm font-medium text-gray-500">Transaction ID</p>
                <p class="mt-1 text-sm font-mono text-gray-900 truncate">
                  {{ uploadResult.evv_response?.response?.transactionId || 'N/A' }}
                </p>
              </div>
            </div>

            <!-- Response Details -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-900 mb-2">EVV Response</h4>
              <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre class="text-xs text-gray-100">
{{ JSON.stringify(uploadResult.evv_response?.response || uploadResult.response, null, 2) }}
                </pre>
              </div>
              <div class="mt-2 flex justify-end">
                <button
                  @click="copyToClipboard(JSON.stringify(uploadResult.evv_response?.response || uploadResult.response, null, 2))"
                  class="text-sm text-blue-600 hover:text-blue-800">
                  Copy to clipboard
                </button>
              </div>
            </div>

            <!-- Invalid Records -->
            <div v-if="hasInvalidRecords" class="border-t pt-6">
              <h4 class="text-sm font-medium text-red-700 mb-4">Invalid Records</h4>
              <div class="space-y-3">
                <div v-for="record in uploadResult.invalid_records" :key="record.xref_id"
                  class="bg-red-50 border-l-4 border-red-400 p-4">
                  <div class="flex">
                    <div class="ml-3">
                      <p class="text-sm font-medium text-red-800">
                        {{ record.xref_id }} - Client: {{ record.client_id }}, Employee: {{ record.employee_id }}
                      </p>
                      <ul class="mt-2 list-disc list-inside text-sm text-red-700">
                        <li v-for="error in record.errors" :key="error">{{ error }}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Status Check -->
            <div v-if="uploadResult.evv_response?.response?.transactionId" class="border-t pt-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <div>
                  <h4 class="text-sm font-medium text-gray-900">Check Upload Status</h4>
                  <p class="text-sm text-gray-500 truncate">
                    Transaction ID: {{ uploadResult.evv_response.response.transactionId }}
                  </p>
                </div>
                <button @click="checkXrefStatus(uploadResult.evv_response.response.transactionId)"
                  class="w-full sm:w-auto inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Check Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Check -->
      <div v-else-if="activeTab === 'status'" class="space-y-6">
        <!-- Manual Check Card -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Check Upload Status</h3>
            <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <div class="flex-grow">
                <input v-model="manualTransactionId" type="text" placeholder="Enter Transaction ID"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <button @click="checkManualStatus" :disabled="checkingStatus"
                class="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg v-if="checkingStatus" class="animate-spin mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                {{ checkingStatus ? 'Checking...' : 'Check Status' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Status Results -->
        <div v-if="statusResult" class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <h3 class="text-lg font-medium text-gray-900">Status Results</h3>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {{ new Date().toLocaleString() }}
              </span>
            </div>

            <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre class="text-xs text-gray-100">
{{ JSON.stringify(statusResult, null, 2) }}
              </pre>
            </div>
            <div class="mt-2 flex justify-end">
              <button @click="copyToClipboard(JSON.stringify(statusResult, null, 2))"
                class="text-sm text-blue-600 hover:text-blue-800">
                Copy to clipboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="text-center text-sm text-gray-500">
          <p class="text-xs sm:text-sm">EVV Xref Management System • Compliant with AHCCCS EVV Specifications v1.3</p>
          <p class="mt-1 text-xs">Ensure all data follows EVV requirements before submission</p>
        </div>
      </div>
    </footer>
  </div>
</template>
