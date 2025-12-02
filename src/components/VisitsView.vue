<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/axiosconfig/axiosInstance';

const uploading = ref(false);
const checkingStatus = ref(false);
const showScheduleForm = ref(false);
const uploadResult = ref(null);
const statusResult = ref(null);
const manualTransactionId = ref('');
const lastTransactionId = ref('');
const clients = ref([]);
const employees = ref([]);
const schedules = ref([]);
const loadingClients = ref(false);
const loadingEmployees = ref(false);
const loadingSchedules = ref(false);

// Fetch clients from API
const fetchClients = async () => {
  loadingClients.value = true;
  try {
    const response = await axiosInstance.get('/api/evv/clients/');
    clients.value = response.data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    alert('Failed to fetch clients');
  } finally {
    loadingClients.value = false;
  }
};

// Fetch employees from API
const fetchEmployees = async () => {
  loadingEmployees.value = true;
  try {
    const response = await axiosInstance.get('/api/evv/employees/');
    employees.value = response.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    alert('Failed to fetch employees');
  } finally {
    loadingEmployees.value = false;
  }
};

// Fetch existing schedules
const fetchSchedules = async () => {
  loadingSchedules.value = true;
  try {
    const response = await axiosInstance.get('/api/evv/visits/?schedule_only=true');
    schedules.value = response.data.filter(v => !v.calls || v.calls.length === 0);
  } catch (error) {
    console.error('Error fetching schedules:', error);
  } finally {
    loadingSchedules.value = false;
  }
};

// Schedule form - WITHOUT calls
const newSchedule = ref({
  clientId: '', // Selected from dropdown (Client ID - not Medicaid ID)
  employeeId: '', // Selected from dropdown (Employee ID - not SSN)
  scheduleDate: '',
  startTime: '09:00',
  endTime: '10:00',
  procedureCode: 'T1019',
  payerId: 'AZDDD',
  visitTimeZone: 'US/Arizona',
  billVisit: true,
  contingencyPlan: 'CP01'
});

// Approved values from EVV documentation
const approvedPayerIds = [
  'AZACH', 'AZBUFC', 'AZCCCS', 'AZCDMP', 'AZDDD',
  'AZMCC', 'AZMYC', 'AZSHP', 'AZSHC', 'AZUCP'
];

const approvedProcedureCodes = [
  'G0151', 'G0152', 'G0153', 'G0299', 'G0300',
  'S5125', 'S5130', 'S5135', 'S5136', 'S5150',
  'S5151', 'S5181', 'S9123', 'S9124', 'S9128',
  'S9129', 'S9131', 'T1019', 'T1021', 'T2017'
];

const approvedTimeZones = [
  'US/Alaska', 'US/Aleutian', 'US/Arizona', 'US/Central',
  'US/East-Indiana', 'US/Eastern', 'US/Hawaii', 'US/Indiana-Starke',
  'US/Michigan', 'US/Mountain', 'US/Pacific', 'US/Samoa',
  'America/Indiana/Indianapolis', 'America/Puerto_Rico'
];

const contingencyPlans = [
  { code: 'CP01', label: 'Reschedule within 2 Hours' },
  { code: 'CP02', label: 'Reschedule within 24 Hours' },
  { code: 'CP03', label: 'Reschedule within 48 Hours' },
  { code: 'CP04', label: 'Next Scheduled Visit' },
  { code: 'CP05', label: 'Non-Paid Caregiver' }
];

// Helper function to format date to UTC ISO string
const formatToUTC = (dateString, timeString) => {
  const dateTime = new Date(`${dateString}T${timeString}`);
  return dateTime.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

// Generate SequenceID as timestamp (YYYYMMDDHHMMSS)
const generateSequenceID = () => {
  const now = new Date();
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
};

// Generate unique VisitOtherID
const generateVisitOtherID = () => {
  const timestamp = Date.now();
  return `SCH${timestamp.toString().slice(-9)}`;
};

// Create a new schedule (without calls)
const createSchedule = async () => {
  // Validate required fields
  if (!newSchedule.value.clientId || !newSchedule.value.employeeId ||
    !newSchedule.value.scheduleDate || !newSchedule.value.procedureCode) {
    alert('Please fill all required fields: Client, Employee, Date, and Procedure Code');
    return;
  }

  // Validate date is in future
  const scheduleDate = new Date(newSchedule.value.scheduleDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (scheduleDate <= today) {
    alert('Schedule date must be in the future');
    return;
  }

  // Validate times
  const startTime = new Date(`${newSchedule.value.scheduleDate}T${newSchedule.value.startTime}`);
  const endTime = new Date(`${newSchedule.value.scheduleDate}T${newSchedule.value.endTime}`);

  if (endTime <= startTime) {
    alert('End time must be after start time');
    return;
  }

  uploading.value = true;

  try {
    // FIXED: Send client ID and employee ID (integers), not Medicaid ID/SSN
    const scheduleData = {
      client: parseInt(newSchedule.value.clientId), // Convert to integer
      employee: parseInt(newSchedule.value.employeeId), // Convert to integer
      visit_type: 'scheduled', // Use 'scheduled' instead of 'visit_status'
      schedule_start_time: formatToUTC(newSchedule.value.scheduleDate, newSchedule.value.startTime),
      schedule_end_time: formatToUTC(newSchedule.value.scheduleDate, newSchedule.value.endTime),
      procedure_code: newSchedule.value.procedureCode,
      payer_id: newSchedule.value.payerId,
      visit_time_zone: newSchedule.value.visitTimeZone,
      bill_visit: newSchedule.value.billVisit,
      contingency_plan: newSchedule.value.contingencyPlan
      // REMOVED: visit_other_id and sequence_id - let backend generate them
    };

    console.log('Sending schedule data:', scheduleData);

    // Save schedule to local database
    const response = await axiosInstance.post('/api/evv/visits/', scheduleData);

    showScheduleForm.value = false;
    fetchSchedules();
    alert('Schedule created successfully!');

    // Reset form
    newSchedule.value = {
      clientId: '',
      employeeId: '',
      scheduleDate: '',
      startTime: '09:00',
      endTime: '10:00',
      procedureCode: 'T1019',
      payerId: 'AZDDD',
      visitTimeZone: 'US/Arizona',
      billVisit: true,
      contingencyPlan: 'CP01'
    };

  } catch (error) {
    console.error('Error creating schedule:', error);
    console.error('Error response:', error.response?.data);
    alert('Failed to create schedule: ' + (error.response?.data?.detail || error.message));
  } finally {
    uploading.value = false;
  }
};

// Send schedules to EVV (schedule only, no calls)
const sendSchedulesToEVV = async () => {
  if (schedules.value.length === 0) {
    alert('No schedules to send. Create schedules first.');
    return;
  }

  uploading.value = true;
  uploadResult.value = null;

  try {
    const response = await axiosInstance.post('/api/evv/evv/visits/send/', {
      send_type: 'schedules_only'
    });

    uploadResult.value = response.data;

    // Store the transaction ID for automatic status checking
    if (response.data.evv_response?.response?.id) {
      lastTransactionId.value = response.data.evv_response.response.id;
      // Auto-check status after 5 seconds
      setTimeout(() => {
        checkVisitStatus(lastTransactionId.value);
      }, 5000);
    }

  } catch (error) {
    console.error('Error sending schedules to EVV:', error);
    uploadResult.value = {
      status_code: 500,
      response: {
        error: 'Failed to send schedules',
        details: error.response?.data || error.message
      }
    };
  } finally {
    uploading.value = false;
  }
};

// Send completed visits (with calls) to EVV
const sendCompletedVisitsToEVV = async () => {
  uploading.value = true;
  uploadResult.value = null;

  try {
    const response = await axiosInstance.post('/api/evv/evv/visits/send/', {
      send_type: 'completed_visits'
    });

    uploadResult.value = response.data;

    if (response.data.evv_response?.response?.id) {
      lastTransactionId.value = response.data.evv_response.response.id;
      setTimeout(() => {
        checkVisitStatus(lastTransactionId.value);
      }, 5000);
    }

  } catch (error) {
    console.error('Error sending completed visits to EVV:', error);
    uploadResult.value = {
      status_code: 500,
      response: {
        error: 'Failed to send completed visits',
        details: error.response?.data || error.message
      }
    };
  } finally {
    uploading.value = false;
  }
};

const checkVisitStatus = async (transactionId) => {
  if (!transactionId) return;

  checkingStatus.value = true;
  try {
    const response = await axiosInstance.get(`/api/evv/evv/check-upload-status/${transactionId}/`);
    statusResult.value = response.data.status_check_result;

    // If still processing, check again in 10 seconds
    if (statusResult.value.response?.message?.includes('not ready yet')) {
      setTimeout(() => {
        checkVisitStatus(transactionId);
      }, 10000);
    }
  } catch (error) {
    console.error('Error checking status:', error);
    statusResult.value = {
      error: 'Failed to check status',
      details: error.response?.data || error.message
    };
  } finally {
    checkingStatus.value = false;
  }
};

const checkManualStatus = async () => {
  if (!manualTransactionId.value.trim()) {
    alert('Please enter a transaction ID');
    return;
  }
  await checkVisitStatus(manualTransactionId.value);
};

const getStatusClass = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return 'border-l-green-500 bg-green-50';
  if (statusCode >= 400 && statusCode < 500) return 'border-l-yellow-500 bg-yellow-50';
  return 'border-l-red-500 bg-red-50';
};

const getTransactionId = (response) => {
  if (response.evv_response && response.evv_response.response) {
    return response.evv_response.response.transaction_id ||
      response.evv_response.response.upload_id ||
      response.evv_response.response.id;
  }
  return response.transaction_id || response.upload_id || response.id;
};

const getUploadStatusMessage = (result) => {
  if (!result) return '';

  const response = result.evv_response?.response || result.response;
  if (!response) return '';

  if (response.status === 'SUCCESS') {
    return '✅ Upload successful! Processing completed.';
  } else if (response.status === 'FAILED') {
    return '❌ Upload failed. Please check the errors below.';
  } else if (response.message?.includes('not ready yet')) {
    return '⏳ Data is being processed. Please check status again in a few moments.';
  } else if (response.reason === 'Transaction Received.') {
    return '✅ Data accepted! Transaction received and being processed.';
  }

  return response.message || response.reason || '';
};

// Format client display for dropdown - SHOW BOTH ID AND MEDICAID ID
const formatClientDisplay = (client) => {
  return `[ID: ${client.id}] ${client.medicaid_id} - ${client.first_name} ${client.last_name}`;
};

// Format employee display for dropdown - SHOW BOTH ID AND SSN
const formatEmployeeDisplay = (employee) => {
  return `[ID: ${employee.id}] ${employee.ssn} - ${employee.first_name} ${employee.last_name}`;
};

// Find client by Medicaid ID (for backward compatibility if needed)
const findClientByMedicaidId = (medicaidId) => {
  return clients.value.find(client => client.medicaid_id === medicaidId);
};

// Find employee by SSN (for backward compatibility if needed)
const findEmployeeBySSN = (ssn) => {
  return employees.value.find(employee => employee.ssn === ssn);
};

onMounted(() => {
  fetchClients();
  fetchEmployees();
  fetchSchedules();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">EVV Schedule Management</h1>
        <p class="text-lg text-gray-600">Create schedules and manage EVV data</p>
      </div>

      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="p-6">
          <!-- Create Schedule Section -->
          <div class="mb-8 pb-6 border-b border-gray-200">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold text-gray-800">Create New Schedule</h2>
              <button @click="showScheduleForm = !showScheduleForm"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {{ showScheduleForm ? 'Cancel' : 'Create Schedule' }}
              </button>
            </div>

            <!-- Schedule Creation Form -->
            <div v-if="showScheduleForm" class="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Schedule Details</h3>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Client Selection - FIXED: Use client ID -->
                <div class="sm:col-span-2">
                  <label for="clientId" class="block text-sm font-medium text-gray-700">Select Client *</label>
                  <select v-model="newSchedule.clientId" id="clientId"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select a Client</option>
                    <option v-for="client in clients" :key="client.id" :value="client.id">
                      {{ formatClientDisplay(client) }}
                    </option>
                  </select>
                  <div v-if="loadingClients" class="mt-1 text-sm text-gray-500">Loading clients...</div>
                  <p class="mt-1 text-xs text-gray-500">Select by Client ID (not Medicaid ID)</p>
                </div>

                <!-- Employee Selection - FIXED: Use employee ID -->
                <div class="sm:col-span-2">
                  <label for="employeeId" class="block text-sm font-medium text-gray-700">Select Employee *</label>
                  <select v-model="newSchedule.employeeId" id="employeeId"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select an Employee</option>
                    <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                      {{ formatEmployeeDisplay(employee) }}
                    </option>
                  </select>
                  <div v-if="loadingEmployees" class="mt-1 text-sm text-gray-500">Loading employees...</div>
                  <p class="mt-1 text-xs text-gray-500">Select by Employee ID (not SSN)</p>
                </div>

                <!-- Schedule Date -->
                <div>
                  <label for="scheduleDate" class="block text-sm font-medium text-gray-700">Schedule Date *</label>
                  <input v-model="newSchedule.scheduleDate" type="date" id="scheduleDate"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                  <p class="mt-1 text-xs text-gray-500">Must be a future date</p>
                </div>

                <!-- Start Time -->
                <div>
                  <label for="startTime" class="block text-sm font-medium text-gray-700">Start Time *</label>
                  <input v-model="newSchedule.startTime" type="time" id="startTime"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <!-- End Time -->
                <div>
                  <label for="endTime" class="block text-sm font-medium text-gray-700">End Time *</label>
                  <input v-model="newSchedule.endTime" type="time" id="endTime"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <!-- Procedure Code -->
                <div>
                  <label for="procedureCode" class="block text-sm font-medium text-gray-700">Procedure Code *</label>
                  <select v-model="newSchedule.procedureCode" id="procedureCode"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option v-for="code in approvedProcedureCodes" :key="code" :value="code">
                      {{ code }}
                    </option>
                  </select>
                </div>

                <!-- Payer ID -->
                <div>
                  <label for="payerId" class="block text-sm font-medium text-gray-700">Payer ID *</label>
                  <select v-model="newSchedule.payerId" id="payerId"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option v-for="payer in approvedPayerIds" :key="payer" :value="payer">
                      {{ payer }}
                    </option>
                  </select>
                </div>

                <!-- Time Zone -->
                <div>
                  <label for="visitTimeZone" class="block text-sm font-medium text-gray-700">Time Zone *</label>
                  <select v-model="newSchedule.visitTimeZone" id="visitTimeZone"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option v-for="tz in approvedTimeZones" :key="tz" :value="tz">
                      {{ tz }}
                    </option>
                  </select>
                </div>

                <!-- Contingency Plan -->
                <div>
                  <label for="contingencyPlan" class="block text-sm font-medium text-gray-700">Contingency Plan</label>
                  <select v-model="newSchedule.contingencyPlan" id="contingencyPlan"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option v-for="plan in contingencyPlans" :key="plan.code" :value="plan.code">
                      {{ plan.label }}
                    </option>
                  </select>
                </div>

                <!-- Bill Visit -->
                <div class="flex items-center">
                  <input v-model="newSchedule.billVisit" type="checkbox" id="billVisit"
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label for="billVisit" class="ml-2 block text-sm text-gray-700">
                    Bill this visit
                  </label>
                </div>
              </div>

              <div class="mt-6">
                <button @click="createSchedule" :disabled="uploading"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ uploading ? 'Creating...' : 'Create Schedule' }}
                </button>
                <p class="mt-2 text-xs text-gray-500">
                  💡 <strong>Note:</strong> The backend will automatically generate unique Visit ID and Sequence ID
                </p>
              </div>
            </div>
          </div>

          <!-- Send Data to EVV Section -->
          <div class="mb-8 pb-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Send Data to EVV System</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <!-- Send Schedules Card -->
              <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div class="flex items-center mb-4">
                  <div class="bg-blue-100 p-3 rounded-full">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 class="ml-4 text-lg font-medium text-blue-900">Send Schedules</h3>
                </div>
                <p class="text-sm text-blue-700 mb-4">Send future visit schedules to AHCCCS EVV system.</p>
                <div class="bg-white p-3 rounded border border-blue-100 mb-4">
                  <p class="text-sm font-medium text-gray-700">Ready to send: <span class="text-blue-600">{{
                    schedules.length }} schedules</span></p>
                </div>
                <button @click="sendSchedulesToEVV" :disabled="uploading || schedules.length === 0"
                  class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ uploading ? 'Sending...' : 'Send Schedules to EVV' }}
                </button>
              </div>

              <!-- Send Completed Visits Card -->
              <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                <div class="flex items-center mb-4">
                  <div class="bg-green-100 p-3 rounded-full">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 class="ml-4 text-lg font-medium text-green-900">Send Completed Visits</h3>
                </div>
                <p class="text-sm text-green-700 mb-4">Send visits with clock in/out times to AHCCCS EVV system.</p>
                <div class="bg-white p-3 rounded border border-green-100 mb-4">
                  <p class="text-sm font-medium text-gray-700">Status: <span class="text-green-600">Caregiver app
                      collects visit data</span></p>
                </div>
                <button @click="sendCompletedVisitsToEVV" :disabled="uploading"
                  class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ uploading ? 'Sending...' : 'Send Completed Visits' }}
                </button>
              </div>
            </div>

            <div class="text-sm text-gray-500">
              <p>💡 <strong>How it works:</strong></p>
              <ol class="list-decimal ml-5 mt-2 space-y-1">
                <li>Create schedules for future visits</li>
                <li>Caregivers use the mobile app to clock in/out</li>
                <li>Send schedules to EVV (schedule-only)</li>
                <li>Send completed visits to EVV (with calls)</li>
              </ol>
            </div>
          </div>

          <!-- Results Section -->
          <div v-if="uploadResult" class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Upload Results</h3>
            <div class="border border-gray-200 rounded-lg p-4"
              :class="getStatusClass(uploadResult.evv_response?.status_code || uploadResult.status_code)">
              <h4 class="font-medium mb-2">{{ getUploadStatusMessage(uploadResult) }}</h4>

              <!-- Summary Information -->
              <div v-if="uploadResult.count_sent !== undefined"
                class="bg-white p-3 rounded border border-gray-200 mb-4">
                <p class="text-sm"><strong>Records Sent:</strong> {{ uploadResult.count_sent }}</p>
                <p class="text-sm"><strong>Invalid Records:</strong> {{ uploadResult.invalid_count }}</p>
                <p class="text-sm"><strong>Message:</strong> {{ uploadResult.message }}</p>
              </div>

              <!-- Transaction Info -->
              <div v-if="getTransactionId(uploadResult)" class="mt-4 pt-4 border-t border-gray-200">
                <p class="text-sm"><strong>Transaction ID:</strong>
                  <span class="ml-2 bg-gray-100 px-2 py-1 rounded font-mono text-red-600">{{
                    getTransactionId(uploadResult) }}</span>
                </p>
                <button @click="checkVisitStatus(getTransactionId(uploadResult))"
                  class="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Check Processing Status
                </button>
              </div>
            </div>
          </div>

          <!-- Manual Status Check -->
          <div class="pt-6 border-t border-gray-200">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Check Upload Status</h3>
            <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div class="flex-grow">
                <label for="manualTransactionId" class="block text-sm font-medium text-gray-700 mb-1">Transaction
                  ID</label>
                <input v-model="manualTransactionId" type="text" id="manualTransactionId"
                  class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Transaction ID" />
              </div>
              <button @click="checkManualStatus" :disabled="checkingStatus"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ checkingStatus ? 'Checking...' : 'Check Status' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
