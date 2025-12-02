<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/axiosconfig/axiosInstance';

const clients = ref([]);
const loading = ref(false);
const uploading = ref(false);
const checkingStatus = ref(false);
const showCustomForm = ref(false);
const uploadResult = ref(null);
const statusResult = ref(null);
const manualTransactionId = ref('');

const newClient = ref({
  client_id: "",
  first_name: "",
  last_name: "",
  dob: "",
  medicaid_id: "",
  timezone: "America/Phoenix",
  assent_plan: "Yes",
  // Enhanced fields
  middle_name: "",
  gender: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "AZ",
  zip_code: "",
  county: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relation: "",
  primary_diagnosis: "",
  secondary_diagnosis: "",
  physician_name: "",
  physician_phone: "",
  case_manager_name: "",
  case_manager_phone: "",
  service_location: "home",
  location_latitude: "",
  location_longitude: "",
  service_start_date: "",
  service_end_date: "",
  authorized_hours_weekly: "",
  payor: "Medicaid",
  insurance_id: "",
  language_preference: "English",
  mobility_requirements: "",
  special_instructions: ""
});

// Function to get current location
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        newClient.value.location_latitude = position.coords.latitude.toFixed(6);
        newClient.value.location_longitude = position.coords.longitude.toFixed(6);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location. Please enter coordinates manually.');
      }
    );
  } else {
    alert('Geolocation is not supported by this browser.');
  }
};

// Function to convert YYYY-MM-DD to MM/DD/YYYY
const formatDateForBackend = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

// Fetch clients from backend
const fetchClients = async () => {
  loading.value = true;
  try {
    const res = await axiosInstance.get("/api/evv/clients/");
    clients.value = res.data;
  } catch (error) {
    console.error(error);
    alert("Failed to fetch clients");
  } finally {
    loading.value = false;
  }
};

// Add client (POST to backend ONLY)
const addClient = async () => {
  // Required fields validation
  const requiredFields = [
    'client_id', 'first_name', 'last_name', 'dob',
    'medicaid_id', 'phone', 'address_line1', 'city',
    'state', 'zip_code', 'service_start_date',
    'authorized_hours_weekly'
  ];

  const missingFields = requiredFields.filter(field => !newClient.value[field]);
  if (missingFields.length > 0) {
    alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
    return;
  }

  try {
    await axiosInstance.post("/api/evv/clients/", {
      ...newClient.value,
      dob: formatDateForBackend(newClient.value.dob),  // Convert to MM/DD/YYYY
      service_start_date: formatDateForBackend(newClient.value.service_start_date),
      service_end_date: newClient.value.service_end_date ? formatDateForBackend(newClient.value.service_end_date) : null
    });

    // Clear form
    newClient.value = {
      client_id: "",
      first_name: "",
      last_name: "",
      dob: "",
      medicaid_id: "",
      timezone: "America/Phoenix",
      assent_plan: "Yes",
      middle_name: "",
      gender: "",
      email: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "AZ",
      zip_code: "",
      county: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relation: "",
      primary_diagnosis: "",
      secondary_diagnosis: "",
      physician_name: "",
      physician_phone: "",
      case_manager_name: "",
      case_manager_phone: "",
      service_location: "home",
      location_latitude: "",
      location_longitude: "",
      service_start_date: "",
      service_end_date: "",
      authorized_hours_weekly: "",
      payor: "Medicaid",
      insurance_id: "",
      language_preference: "English",
      mobility_requirements: "",
      special_instructions: ""
    };

    fetchClients();
    showCustomForm.value = false;
    alert("Client added successfully!");
  } catch (err) {
    console.error(err);
    if (err.response && err.response.data) {
      // Show specific error messages from backend
      const errors = err.response.data;
      let errorMessage = "Failed to add client:\n";
      for (const [field, messages] of Object.entries(errors)) {
        errorMessage += `${field}: ${messages.join(', ')}\n`;
      }
      alert(errorMessage);
    } else {
      alert("Failed to add client");
    }
  }
};

// Upload clients to EVV
const sendToEVV = async () => {
  uploading.value = true;
  uploadResult.value = null;

  try {
    const res = await axiosInstance.post("/api/evv/evv/clients/send/");
    uploadResult.value = res.data;

    if (res.data.message) {
      alert(res.data.message);
    }
  } catch (err) {
    console.error(err);
    uploadResult.value = {
      status_code: 500,
      response: { error: 'Failed to upload clients to EVV', details: err.message }
    };
  } finally {
    uploading.value = false;
  }
};

// Check upload status
const checkUploadStatus = async (transactionId) => {
  if (!transactionId) return;

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

// Check manual status
const checkManualStatus = async () => {
  if (!manualTransactionId.value.trim()) {
    alert('Please enter a transaction ID');
    return;
  }
  await checkUploadStatus(manualTransactionId.value);
};

// Check overall client status in EVV system
const checkClientStatus = async () => {
  checkingStatus.value = true;
  try {
    const response = await axiosInstance.get('/api/evv/evv/clients/status/');
    statusResult.value = response.data.status_result;
  } catch (error) {
    console.error('Error checking client status:', error);
    statusResult.value = {
      error: 'Failed to check client status',
      details: error.message
    };
  } finally {
    checkingStatus.value = false;
  }
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

onMounted(fetchClients);
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">EVV Clients Management</h1>
        <p class="text-lg text-gray-600">Manage and upload client data to EVV system</p>
      </div>

      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="p-6">
          <!-- Add Client Section -->
          <div class="mb-8 pb-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Add New Client</h2>

            <div class="mb-4">
              <button @click="showCustomForm = !showCustomForm"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {{ showCustomForm ? 'Cancel' : 'Add New Client' }}
              </button>
            </div>

            <!-- Client Form -->
            <div v-if="showCustomForm" class="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Client Onboarding Form</h3>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Personal Information -->
                <div class="sm:col-span-2 lg:col-span-3">
                  <h4 class="text-md font-medium text-gray-700 mb-3 border-b pb-2">Personal Information</h4>
                </div>

                <div>
                  <label for="client_id" class="block text-sm font-medium text-gray-700">Client ID *</label>
                  <input v-model="newClient.client_id" type="text" id="client_id"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CL000001" />
                </div>

                <div>
                  <label for="first_name" class="block text-sm font-medium text-gray-700">First Name *</label>
                  <input v-model="newClient.first_name" type="text" id="first_name"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="First Name" />
                </div>

                <div>
                  <label for="last_name" class="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input v-model="newClient.last_name" type="text" id="last_name"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Last Name" />
                </div>

                <div>
                  <label for="middle_name" class="block text-sm font-medium text-gray-700">Middle Name</label>
                  <input v-model="newClient.middle_name" type="text" id="middle_name"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Middle Name" />
                </div>

                <div>
                  <label for="dob" class="block text-sm font-medium text-gray-700">Date of Birth *</label>
                  <input v-model="newClient.dob" type="date" id="dob"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label for="gender" class="block text-sm font-medium text-gray-700">Gender</label>
                  <select v-model="newClient.gender" id="gender"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <!-- Contact Information -->
                <div class="sm:col-span-2 lg:col-span-3 mt-4">
                  <h4 class="text-md font-medium text-gray-700 mb-3 border-b pb-2">Contact Information</h4>
                </div>

                <div>
                  <label for="phone" class="block text-sm font-medium text-gray-700">Phone *</label>
                  <input v-model="newClient.phone" type="tel" id="phone"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number" />
                </div>

                <div class="sm:col-span-2">
                  <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                  <input v-model="newClient.email" type="email" id="email"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email address" />
                </div>

                <div class="sm:col-span-2">
                  <label for="address_line1" class="block text-sm font-medium text-gray-700">Address Line 1 *</label>
                  <input v-model="newClient.address_line1" type="text" id="address_line1"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Street address" />
                </div>

                <div class="sm:col-span-2">
                  <label for="address_line2" class="block text-sm font-medium text-gray-700">Address Line 2</label>
                  <input v-model="newClient.address_line2" type="text" id="address_line2"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Apartment, suite, etc." />
                </div>

                <div>
                  <label for="city" class="block text-sm font-medium text-gray-700">City *</label>
                  <input v-model="newClient.city" type="text" id="city"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City" />
                </div>

                <div>
                  <label for="state" class="block text-sm font-medium text-gray-700">State *</label>
                  <select v-model="newClient.state" id="state"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="AZ">Arizona</option>
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="HI">Hawaii</option>
                    <option value="ID">Idaho</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="IA">Iowa</option>
                    <option value="KS">Kansas</option>
                    <option value="KY">Kentucky</option>
                    <option value="LA">Louisiana</option>
                    <option value="ME">Maine</option>
                    <option value="MD">Maryland</option>
                    <option value="MA">Massachusetts</option>
                    <option value="MI">Michigan</option>
                    <option value="MN">Minnesota</option>
                    <option value="MS">Mississippi</option>
                    <option value="MO">Missouri</option>
                    <option value="MT">Montana</option>
                    <option value="NE">Nebraska</option>
                    <option value="NV">Nevada</option>
                    <option value="NH">New Hampshire</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NM">New Mexico</option>
                    <option value="NY">New York</option>
                    <option value="NC">North Carolina</option>
                    <option value="ND">North Dakota</option>
                    <option value="OH">Ohio</option>
                    <option value="OK">Oklahoma</option>
                    <option value="OR">Oregon</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="RI">Rhode Island</option>
                    <option value="SC">South Carolina</option>
                    <option value="SD">South Dakota</option>
                    <option value="TN">Tennessee</option>
                    <option value="TX">Texas</option>
                    <option value="UT">Utah</option>
                    <option value="VT">Vermont</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="WV">West Virginia</option>
                    <option value="WI">Wisconsin</option>
                    <option value="WY">Wyoming</option>
                  </select>
                </div>

                <div>
                  <label for="zip_code" class="block text-sm font-medium text-gray-700">ZIP Code *</label>
                  <input v-model="newClient.zip_code" type="text" id="zip_code"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ZIP Code" />
                </div>

                <div>
                  <label for="county" class="block text-sm font-medium text-gray-700">County</label>
                  <input v-model="newClient.county" type="text" id="county"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="County" />
                </div>

                <!-- Location Information -->
                <div class="sm:col-span-2 lg:col-span-3 mt-4">
                  <h4 class="text-md font-medium text-gray-700 mb-3 border-b pb-2">Service Location & GPS</h4>
                </div>

                <div>
                  <label for="service_location" class="block text-sm font-medium text-gray-700">Service Location</label>
                  <select v-model="newClient.service_location" id="service_location"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="home">Home</option>
                    <option value="facility">Facility</option>
                    <option value="community">Community</option>
                    <option value="work">Work</option>
                    <option value="school">School</option>
                  </select>
                </div>

                <div>
                  <label for="location_latitude" class="block text-sm font-medium text-gray-700">Latitude</label>
                  <input v-model="newClient.location_latitude" type="text" id="location_latitude"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 33.4484" />
                </div>

                <div>
                  <label for="location_longitude" class="block text-sm font-medium text-gray-700">Longitude</label>
                  <input v-model="newClient.location_longitude" type="text" id="location_longitude"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., -112.0740" />
                </div>

                <div class="sm:col-span-2 lg:col-span-3">
                  <button @click="getCurrentLocation" type="button"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Get Current Location
                  </button>
                </div>

                <!-- Medical & Insurance Information -->
                <div class="sm:col-span-2 lg:col-span-3 mt-4">
                  <h4 class="text-md font-medium text-gray-700 mb-3 border-b pb-2">Medical & Insurance Information</h4>
                </div>

                <div>
                  <label for="medicaid_id" class="block text-sm font-medium text-gray-700">Medicaid ID *</label>
                  <input v-model="newClient.medicaid_id" type="text" id="medicaid_id"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., A12345678" />
                </div>

                <div>
                  <label for="payor" class="block text-sm font-medium text-gray-700">Payor</label>
                  <select v-model="newClient.payor" id="payor"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="Medicaid">Medicaid</option>
                    <option value="Medicare">Medicare</option>
                    <option value="Private">Private Insurance</option>
                    <option value="Self Pay">Self Pay</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label for="insurance_id" class="block text-sm font-medium text-gray-700">Insurance ID</label>
                  <input v-model="newClient.insurance_id" type="text" id="insurance_id"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Insurance ID" />
                </div>

                <div class="sm:col-span-2">
                  <label for="primary_diagnosis" class="block text-sm font-medium text-gray-700">Primary
                    Diagnosis</label>
                  <input v-model="newClient.primary_diagnosis" type="text" id="primary_diagnosis"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Primary diagnosis" />
                </div>

                <div class="sm:col-span-2">
                  <label for="secondary_diagnosis" class="block text-sm font-medium text-gray-700">Secondary
                    Diagnosis</label>
                  <input v-model="newClient.secondary_diagnosis" type="text" id="secondary_diagnosis"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Secondary diagnosis" />
                </div>

                <!-- Service Information -->
                <div class="sm:col-span-2 lg:col-span-3 mt-4">
                  <h4 class="text-md font-medium text-gray-700 mb-3 border-b pb-2">Service Information</h4>
                </div>

                <div>
                  <label for="service_start_date" class="block text-sm font-medium text-gray-700">Service Start Date
                    *</label>
                  <input v-model="newClient.service_start_date" type="date" id="service_start_date"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label for="service_end_date" class="block text-sm font-medium text-gray-700">Service End Date</label>
                  <input v-model="newClient.service_end_date" type="date" id="service_end_date"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label for="authorized_hours_weekly" class="block text-sm font-medium text-gray-700">Authorized
                    Hours/Week *</label>
                  <input v-model="newClient.authorized_hours_weekly" type="number" id="authorized_hours_weekly"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 40" />
                </div>

                <div>
                  <label for="timezone" class="block text-sm font-medium text-gray-700">Timezone</label>
                  <select v-model="newClient.timezone" id="timezone"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="America/Phoenix">America/Phoenix</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="America/Denver">America/Denver</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                  </select>
                </div>

                <div>
                  <label for="assent_plan" class="block text-sm font-medium text-gray-700">Assent Plan</label>
                  <select v-model="newClient.assent_plan" id="assent_plan"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <!-- Additional Information -->
                <div class="sm:col-span-2 lg:col-span-3 mt-4">
                  <h4 class="text-md font-medium text-gray-700 mb-3 border-b pb-2">Additional Information</h4>
                </div>

                <div class="sm:col-span-2">
                  <label for="physician_name" class="block text-sm font-medium text-gray-700">Physician Name</label>
                  <input v-model="newClient.physician_name" type="text" id="physician_name"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Physician name" />
                </div>

                <div class="sm:col-span-2">
                  <label for="physician_phone" class="block text-sm font-medium text-gray-700">Physician Phone</label>
                  <input v-model="newClient.physician_phone" type="tel" id="physician_phone"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Physician phone" />
                </div>

                <div class="sm:col-span-2">
                  <label for="case_manager_name" class="block text-sm font-medium text-gray-700">Case Manager
                    Name</label>
                  <input v-model="newClient.case_manager_name" type="text" id="case_manager_name"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Case manager name" />
                </div>

                <div class="sm:col-span-2">
                  <label for="case_manager_phone" class="block text-sm font-medium text-gray-700">Case Manager
                    Phone</label>
                  <input v-model="newClient.case_manager_phone" type="tel" id="case_manager_phone"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Case manager phone" />
                </div>

                <div class="sm:col-span-2">
                  <label for="emergency_contact_name" class="block text-sm font-medium text-gray-700">Emergency Contact
                    Name</label>
                  <input v-model="newClient.emergency_contact_name" type="text" id="emergency_contact_name"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Emergency contact name" />
                </div>

                <div class="sm:col-span-2">
                  <label for="emergency_contact_phone" class="block text-sm font-medium text-gray-700">Emergency Contact
                    Phone</label>
                  <input v-model="newClient.emergency_contact_phone" type="tel" id="emergency_contact_phone"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Emergency contact phone" />
                </div>

                <div class="sm:col-span-2">
                  <label for="emergency_contact_relation" class="block text-sm font-medium text-gray-700">Emergency
                    Contact Relation</label>
                  <input v-model="newClient.emergency_contact_relation" type="text" id="emergency_contact_relation"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Spouse, Parent" />
                </div>

                <div class="sm:col-span-2">
                  <label for="language_preference" class="block text-sm font-medium text-gray-700">Language
                    Preference</label>
                  <select v-model="newClient.language_preference" id="language_preference"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div class="sm:col-span-2">
                  <label for="mobility_requirements" class="block text-sm font-medium text-gray-700">Mobility
                    Requirements</label>
                  <input v-model="newClient.mobility_requirements" type="text" id="mobility_requirements"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mobility requirements" />
                </div>

                <div class="sm:col-span-2 lg:col-span-3">
                  <label for="special_instructions" class="block text-sm font-medium text-gray-700">Special
                    Instructions</label>
                  <textarea v-model="newClient.special_instructions" id="special_instructions" rows="3"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special instructions or notes"></textarea>
                </div>
              </div>

              <div class="mt-6">
                <button @click="addClient"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Add Client
                </button>
              </div>
            </div>
          </div>

          <!-- Upload to EVV Section -->
          <div class="mb-8 pb-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Upload Clients to EVV</h2>

            <div class="flex flex-wrap gap-3 mb-4">
              <button @click="sendToEVV" :disabled="uploading || clients.length === 0"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ uploading ? 'Uploading...' : `Upload ${clients.length} Clients to EVV` }}
              </button>

              <button @click="checkClientStatus" :disabled="checkingStatus"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ checkingStatus ? 'Checking...' : 'Check Client Status' }}
              </button>
            </div>

            <div v-if="clients.length === 0" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <p class="text-sm text-yellow-700">No clients available to upload. Please add clients first.</p>
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

              <div v-if="uploadResult.count_sent !== undefined"
                class="bg-white p-3 rounded border border-gray-200 mb-4">
                <p class="text-sm"><strong>Clients Sent:</strong> {{ uploadResult.count_sent }}</p>
                <p class="text-sm"><strong>Invalid Records:</strong> {{ uploadResult.invalid_count }}</p>
              </div>

              <div class="mt-4">
                <h5 class="text-sm font-medium text-gray-700 mb-1">Response Details:</h5>
                <pre
                  class="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-xs max-h-60 overflow-y-auto">{{ JSON.stringify(uploadResult.evv_response?.response || uploadResult.response, null, 2) }}</pre>
              </div>

              <div v-if="uploadResult.invalid_records && uploadResult.invalid_records.length > 0" class="mt-4">
                <h5 class="text-sm font-medium text-gray-700 mb-1">Invalid Records:</h5>
                <div v-for="record in uploadResult.invalid_records" :key="record.pk"
                  class="bg-white p-3 rounded border border-yellow-200 mb-2">
                  <p class="text-sm"><strong>Client ID:</strong> {{ record.client_id }} (PK: {{ record.pk }})</p>
                  <ul class="mt-1 ml-4">
                    <li v-for="error in record.errors" :key="error" class="text-xs text-red-600">{{ error }}</li>
                  </ul>
                </div>
              </div>

              <div v-if="getTransactionId(uploadResult)" class="mt-4 pt-4 border-t border-gray-200">
                <p class="text-sm"><strong>Transaction ID:</strong>
                  <span class="ml-2 bg-gray-100 px-2 py-1 rounded font-mono text-red-600">{{
                    getTransactionId(uploadResult) }}</span>
                </p>
                <button @click="checkUploadStatus(getTransactionId(uploadResult))"
                  class="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Check Upload Status
                </button>
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

          <!-- Clients Table -->
          <div>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 mb-2 sm:mb-0">Local Clients ({{ clients.length }})</h3>
              <button @click="fetchClients"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Refresh List
              </button>
            </div>

            <div v-if="loading" class="text-center py-8 text-gray-500 italic">
              Loading clients...
            </div>

            <div v-else-if="clients.length > 0" class="overflow-x-auto border border-gray-200 rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client ID
                    </th>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name
                    </th>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name
                    </th>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicaid ID
                    </th>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timezone
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="client in clients" :key="client.id" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ client.client_id }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.first_name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.last_name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.dob }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.medicaid_id || 'N/A' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.phone || 'N/A' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.timezone ||
                      'America/Phoenix' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="text-center py-8 text-gray-500 italic">
              No clients found. Add your first client above.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
