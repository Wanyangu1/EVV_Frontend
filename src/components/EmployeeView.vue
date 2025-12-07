<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/axiosconfig/axiosInstance';

const employees = ref([]);
const loading = ref(false);
const uploading = ref(false);
const checkingStatus = ref(false);
const showCustomForm = ref(false);
const uploadResult = ref(null);
const statusResult = ref(null);
const manualTransactionId = ref('');
const currentTransactionId = ref('');

const newEmployee = ref({
  employee_id: "",
  first_name: "",
  last_name: "",
  ssn: "",
  date_of_birth: "",
  hire_date: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip_code: "",
  phone: "",
  email: "",
  position: "",
  department: "",
  pay_rate: "",
  pay_type: "hourly",
  employment_type: "full-time",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relation: ""
});

const states = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];


// Fetch employees from backend
const fetchEmployees = async () => {
  loading.value = true;
  try {
    const res = await axiosInstance.get("/api/evv/employees/");
    employees.value = res.data;
  } catch (error) {
    console.error(error);
    alert("Failed to fetch employees");
  } finally {
    loading.value = false;
  }
};

// Add employee (POST to backend)
const addEmployee = async () => {
  // Required fields validation
  const requiredFields = [
    'employee_id', 'first_name', 'last_name', 'ssn',
    'date_of_birth', 'hire_date', 'address_line1',
    'city', 'state', 'zip_code', 'phone', 'email',
    'position', 'pay_rate', 'emergency_contact_name',
    'emergency_contact_phone'
  ];

  const missingFields = requiredFields.filter(field => !newEmployee.value[field]);
  if (missingFields.length > 0) {
    alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
    return;
  }

  // SSN must be exactly 9 digits
  if (!/^\d{9}$/.test(newEmployee.value.ssn)) {
    alert("SSN must be exactly 9 digits");
    return;
  }

  // Phone validation
  if (!/^\d{10}$/.test(newEmployee.value.phone.replace(/\D/g, ''))) {
    alert("Phone must be 10 digits");
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmployee.value.email)) {
    alert("Please enter a valid email address");
    return;
  }

  try {
    await axiosInstance.post("/api/evv/employees/", newEmployee.value);

    // Reset form
    newEmployee.value = {
      employee_id: "",
      first_name: "",
      last_name: "",
      ssn: "",
      date_of_birth: "",
      hire_date: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip_code: "",
      phone: "",
      email: "",
      position: "",
      department: "",
      pay_rate: "",
      pay_type: "hourly",
      employment_type: "full-time",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relation: ""
    };

    fetchEmployees();
    showCustomForm.value = false;
    alert("Employee added successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to add employee");
  }
};

// Format employee data for EVV API
const formatEmployeesForEVV = (employees) => {
  return employees.map((emp, index) => ({
    "ProviderIdentification": {
      "ProviderQualifier": "MedicaidID",
      "ProviderID": "211108"
    },
    "EmployeeQualifier": "EmployeeSSN",
    "EmployeeIdentifier": emp.ssn,
    "EmployeeSSN": emp.ssn,
    "EmployeeOtherID": emp.employee_id,
    "SequenceID": index + 1,
    "EmployeeFirstName": emp.first_name,
    "EmployeeLastName": emp.last_name
  }));
};

// Upload to EVV (Direct API upload)
const uploadToEVV = async () => {
  if (employees.value.length === 0) {
    alert("No employees to upload");
    return;
  }

  uploading.value = true;
  uploadResult.value = null;
  currentTransactionId.value = '';

  try {
    const formattedEmployees = formatEmployeesForEVV(employees.value);

    const res = await axiosInstance.post(
      "/api/evv/evv/employees/upload/",
      formattedEmployees
    );

    uploadResult.value = res.data;

    // Extract transaction ID from response
    const transactionId = getTransactionId(res.data);
    if (transactionId) {
      currentTransactionId.value = transactionId;
    }

    if (res.data.status_code >= 400) {
      alert(`EVV Upload Failed with status: ${res.data.status_code}`);
    } else {
      alert("Employees uploaded to EVV successfully!");
    }
  } catch (err) {
    console.error(err);
    uploadResult.value = {
      status_code: 500,
      response: { error: 'Failed to upload employees to EVV', details: err.message }
    };
  } finally {
    uploading.value = false;
  }
};

// Check upload status
const checkUploadStatus = async (transactionId) => {
  if (!transactionId) {
    alert('No transaction ID available to check status');
    return;
  }

  checkingStatus.value = true;
  try {
    const response = await axiosInstance.get(`/api/evv/evv/check-upload-status/${transactionId}/`);
    statusResult.value = response.data.status_check_result;
  } catch (error) {
    console.error('Error checking status:', error);
    statusResult.value = {
      error: 'Failed to check status',
      details: error.message
    };
  } finally {
    checkingStatus.value = false;
  }
};

// Check status for current transaction
const checkCurrentStatus = async () => {
  if (!currentTransactionId.value) {
    alert('No transaction ID available. Please upload employees first.');
    return;
  }
  await checkUploadStatus(currentTransactionId.value);
};

// Check manual status
const checkManualStatus = async () => {
  if (!manualTransactionId.value.trim()) {
    alert('Please enter a transaction ID');
    return;
  }
  await checkUploadStatus(manualTransactionId.value);
};

// Check overall employee status in EVV system
const checkEmployeeStatus = async () => {
  checkingStatus.value = true;
  try {
    const response = await axiosInstance.get('/api/evv/evv/status/employees/');
    statusResult.value = response.data;
  } catch (error) {
    console.error('Error checking employee status:', error);
    statusResult.value = {
      error: 'Failed to check employee status',
      details: error.message
    };
  } finally {
    checkingStatus.value = false;
  }
};

// Test EVV connection
const testEVVConnection = async () => {
  try {
    const res = await axiosInstance.get("/api/evv/evv/test-connection/");
    alert(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err);
    alert("Failed to test EVV connection");
  }
};

// Get account info
const getAccountInfo = async () => {
  try {
    const res = await axiosInstance.get("/api/evv/evv/account-info/");
    alert(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err);
    alert("Failed to get account info");
  }
};

// Utility: mask SSN except last 4 digits
const maskSSN = (ssn) => {
  if (!ssn) return "N/A";
  return "*****" + ssn.substring(5);
};

// Helper functions
const getStatusClass = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return 'border-l-green-500 bg-green-50';
  if (statusCode >= 400 && statusCode < 500) return 'border-l-yellow-500 bg-yellow-50';
  return 'border-l-red-500 bg-red-50';
};

const getTransactionId = (response) => {
  // Extract transaction ID from response
  if (response.evv_response && response.evv_response.response) {
    return response.evv_response.response.transaction_id ||
      response.evv_response.response.upload_id ||
      response.evv_response.response.id;
  }
  return response.transaction_id || response.upload_id || response.id;
};

const isEmployeeReady = (employee) => {
  return employee.ssn && employee.first_name && employee.last_name;
};

onMounted(fetchEmployees);
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-4 md:px-0 lg:px-6">
    <div class="max-w-5xl mx-auto">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">EVV Employees Management</h1>
        <p class="text-lg text-gray-600">Manage and upload employee data to EVV system</p>
      </div>

      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="p-4">
          <!-- Add Employee Section -->
          <div class="mb-8 pb-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Add New Employee</h2>

            <div class="mb-4">
              <button @click="showCustomForm = !showCustomForm"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {{ showCustomForm ? 'Cancel' : 'Add New Employee' }}
              </button>
            </div>

            <!-- Employee Form -->
            <div v-if="showCustomForm" class="mt-6 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Employee Onboarding Form</h3>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Personal Information -->
                <div class="sm:col-span-2 lg:col-span-3">
                  <h4 class="text-md font-medium text-gray-700 mb-3 border-b pb-2">Personal Information</h4>
                </div>

                <div>
                  <label for="employee_id" class="block text-sm font-medium text-gray-700">Employee ID *</label>
                  <input v-model="newEmployee.employee_id" type="text" id="employee_id"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., EMP00001" />
                </div>

                <div>
                  <label for="first_name" class="block text-sm font-medium text-gray-700">First Name *</label>
                  <input v-model="newEmployee.first_name" type="text" id="first_name"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="First Name" />
                </div>

                <div>
                  <label for="last_name" class="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input v-model="newEmployee.last_name" type="text" id="last_name"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Last Name" />
                </div>

                <div>
                  <label for="ssn" class="block text-sm font-medium text-gray-700">SSN (9 digits) *</label>
                  <input v-model="newEmployee.ssn" type="text" id="ssn" maxlength="9"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123456789" />
                  <p class="mt-1 text-xs text-gray-500">Exactly 9 digits required</p>
                </div>

                <div>
                  <label for="date_of_birth" class="block text-sm font-medium text-gray-700">Date of Birth *</label>
                  <input v-model="newEmployee.date_of_birth" type="date" id="date_of_birth"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <!-- Contact Information -->
                <div class="sm:col-span-2 lg:col-span-3 mt-4">
                  <h4 class="text-md font-medium text-gray-700 mb-3 border-b pb-2">Contact Information</h4>
                </div>

                <div class="sm:col-span-2">
                  <label for="address_line1" class="block text-sm font-medium text-gray-700">Address Line 1 *</label>
                  <input v-model="newEmployee.address_line1" type="text" id="address_line1"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Street address" />
                </div>

                <div class="sm:col-span-2">
                  <label for="address_line2" class="block text-sm font-medium text-gray-700">Address Line 2</label>
                  <input v-model="newEmployee.address_line2" type="text" id="address_line2"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Apartment, suite, etc." />
                </div>

                <div>
                  <label for="city" class="block text-sm font-medium text-gray-700">City *</label>
                  <input v-model="newEmployee.city" type="text" id="city"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City" />
                </div>

                <div>
                  <label for="state" class="block text-sm font-medium text-gray-700">State *</label>
                  <select v-model="newEmployee.state" id="state" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3
                        focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option disabled value="">Select State</option>

                    <option v-for="state in states" :key="state" :value="state">
                      {{ state }}
                    </option>
                  </select>
                </div>

                <div>
                  <label for="zip_code" class="block text-sm font-medium text-gray-700">ZIP Code *</label>
                  <input v-model="newEmployee.zip_code" type="text" id="zip_code"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ZIP Code" />
                </div>

                <div>
                  <label for="phone" class="block text-sm font-medium text-gray-700">Phone *</label>
                  <input v-model="newEmployee.phone" type="tel" id="phone"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number" />
                </div>

                <div class="sm:col-span-2">
                  <label for="email" class="block text-sm font-medium text-gray-700">Email *</label>
                  <input v-model="newEmployee.email" type="email" id="email"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email address" />
                </div>

                <!-- Employment Information -->
                <div class="sm:col-span-2 lg:col-span-3 mt-4">
                  <h4 class="text-md font-medium text-gray-700 mb-3 border-b pb-2">Employment Information</h4>
                </div>

                <div>
                  <label for="hire_date" class="block text-sm font-medium text-gray-700">Hire Date *</label>
                  <input v-model="newEmployee.hire_date" type="date" id="hire_date"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label for="position" class="block text-sm font-medium text-gray-700">Position *</label>
                  <input v-model="newEmployee.position" type="text" id="position"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Job title" />
                </div>

                <div>
                  <label for="department" class="block text-sm font-medium text-gray-700">Department</label>
                  <input v-model="newEmployee.department" type="text" id="department"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Department" />
                </div>

                <div>
                  <label for="pay_rate" class="block text-sm font-medium text-gray-700">Pay Rate *</label>
                  <input v-model="newEmployee.pay_rate" type="text" id="pay_rate"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 15.00" />
                </div>

                <div>
                  <label for="pay_type" class="block text-sm font-medium text-gray-700">Pay Type</label>
                  <select v-model="newEmployee.pay_type" id="pay_type"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="hourly">Hourly</option>
                    <option value="salary">Salary</option>
                  </select>
                </div>

                <div>
                  <label for="employment_type" class="block text-sm font-medium text-gray-700">Employment Type</label>
                  <select v-model="newEmployee.employment_type" id="employment_type"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <!-- Emergency Contact -->
                <div class="sm:col-span-2 lg:col-span-3 mt-4">
                  <h4 class="text-md font-medium text-gray-700 mb-3 border-b pb-2">Emergency Contact</h4>
                </div>

                <div>
                  <label for="emergency_contact_name" class="block text-sm font-medium text-gray-700">Contact Name
                    *</label>
                  <input v-model="newEmployee.emergency_contact_name" type="text" id="emergency_contact_name"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full name" />
                </div>

                <div>
                  <label for="emergency_contact_phone" class="block text-sm font-medium text-gray-700">Contact Phone
                    *</label>
                  <input v-model="newEmployee.emergency_contact_phone" type="tel" id="emergency_contact_phone"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number" />
                </div>

                <div>
                  <label for="emergency_contact_relation"
                    class="block text-sm font-medium text-gray-700">Relationship</label>
                  <input v-model="newEmployee.emergency_contact_relation" type="text" id="emergency_contact_relation"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Spouse, Parent" />
                </div>
              </div>

              <div class="mt-6">
                <button @click="addEmployee"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Add Employee
                </button>
              </div>
            </div>
          </div>

          <!-- Upload to EVV Section -->
          <div class="mb-8 pb-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Upload Employees to EVV</h2>

            <div class="flex flex-wrap gap-3 mb-4">
              <button @click="uploadToEVV" :disabled="uploading || employees.length === 0"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ uploading ? 'Uploading...' : 'Direct Upload to EVV' }}
              </button>

              <button @click="checkEmployeeStatus" :disabled="checkingStatus"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ checkingStatus ? 'Checking...' : 'Check Employee Status' }}
              </button>
            </div>

            <div class="bg-blue-50 p-4 rounded-md mb-4 border-l-4 border-blue-400">
              <p class="text-sm text-blue-700"><strong>Direct Upload:</strong> Direct API upload with formatted data</p>
            </div>

            <div v-if="employees.length === 0" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <p class="text-sm text-yellow-700">No employees available to upload. Please add employees first.</p>
            </div>

            <div v-else class="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
              <p class="text-sm text-green-700">
                <strong>Ready for EVV:</strong> {{ employees.filter(isEmployeeReady).length }} of {{ employees.length }}
                employees
              </p>
            </div>
          </div>

          <!-- Upload Results Section -->
          <div v-if="uploadResult" class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Upload Results</h3>
            <div class="border border-gray-200 rounded-lg p-4"
              :class="getStatusClass(uploadResult.evv_response?.status_code || uploadResult.status_code)">
              <h4 class="font-medium mb-2">
                Status: {{ uploadResult.evv_response?.status_code || uploadResult.status_code }}
              </h4>

              <div v-if="uploadResult.debug_payload" class="mt-4">
                <h5 class="text-sm font-medium text-gray-700 mb-1">Debug Payload:</h5>
                <pre
                  class="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-xs max-h-60 overflow-y-auto">{{ JSON.stringify(uploadResult.debug_payload, null, 2) }}</pre>
              </div>

              <div class="mt-4">
                <h5 class="text-sm font-medium text-gray-700 mb-1">Response Details:</h5>
                <pre
                  class="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-xs max-h-60 overflow-y-auto">{{ JSON.stringify(uploadResult.evv_response?.response || uploadResult.response, null, 2) }}</pre>
              </div>

              <div class="mt-4 pt-4 border-t border-gray-200">
                <div v-if="currentTransactionId" class="mb-3">
                  <p class="text-sm"><strong>Current Transaction ID:</strong>
                    <span class="ml-2 bg-gray-100 px-2 py-1 rounded font-mono text-red-600">{{ currentTransactionId
                      }}</span>
                  </p>
                  <button @click="checkCurrentStatus" :disabled="checkingStatus"
                    class="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ checkingStatus ? 'Checking...' : 'Check Upload Status' }}
                  </button>
                </div>

                <div v-else>
                  <p class="text-sm text-gray-500">No transaction ID available for status check</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Check Results -->
          <div v-if="statusResult" class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Status Check Results</h3>
            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <pre
                class="overflow-x-auto text-xs max-h-60 overflow-y-auto">{{ JSON.stringify(statusResult, null, 2) }}</pre>
            </div>
          </div>

          <!-- Manual Status Check -->
          <div class="mb-8 pt-6 border-t border-gray-200">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Check Upload Status Manually</h3>
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

          <!-- Additional EVV Actions -->
          <div class="mb-8 bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900 mb-3">EVV System Actions</h3>
            <div class="flex flex-wrap gap-3">
              <button @click="testEVVConnection"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Test Connection
              </button>
              <button @click="getAccountInfo"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Account Info
              </button>
            </div>
          </div>

          <!-- Employees Table -->
          <div>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 mb-2 sm:mb-0">Local Employees ({{ employees.length }})</h3>
              <button @click="fetchEmployees"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Refresh List
              </button>
            </div>

            <div v-if="loading" class="text-center py-8 text-gray-500 italic">
              Loading employees...
            </div>

            <div v-else-if="employees.length > 0" class="overflow-x-auto border border-gray-200 rounded-lg">
              <div class="overflow-x-auto w-full">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>

                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Name
                      </th>

                      <!-- Hidden on small screens -->
                      <th
                        class="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Name
                      </th>

                      <!-- Hidden on small screens -->
                      <th
                        class="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SSN
                      </th>

                      <!-- Hidden on small screens -->
                      <th
                        class="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>

                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        EVV Ready
                      </th>
                    </tr>
                  </thead>

                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="employee in employees" :key="employee.id"
                      :class="{ 'bg-green-50': isEmployeeReady(employee) }" class="hover:bg-gray-50">
                      <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {{ employee.employee_id }}
                      </td>

                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {{ employee.first_name }}
                      </td>

                      <td class="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {{ employee.last_name }}
                      </td>

                      <td class="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {{ maskSSN(employee.ssn) }}
                      </td>

                      <td class="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {{ employee.position || 'N/A' }}
                      </td>

                      <td class="px-4 py-4 whitespace-nowrap">
                        <span v-if="isEmployeeReady(employee)"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ready
                        </span>

                        <span v-else
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Missing Data
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-else class="text-center py-8 text-gray-500 italic">
              No employees found. Add your first employee above.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
