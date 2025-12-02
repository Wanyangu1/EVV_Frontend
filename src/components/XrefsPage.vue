<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/axiosconfig/axiosInstance';

const uploading = ref(false);
const loadingXrefs = ref(false);
const checkingStatus = ref(false);
const showCreateForm = ref(false);
const uploadResult = ref(null);
const statusResult = ref(null);
const manualTransactionId = ref('');
const xrefs = ref([]);

// Updated with required fields from error messages
const newXref = ref({
  clientId: '', // Must be in format A12345678
  employeeId: '', // Must be 9-digit SSN
  startDate: new Date().toISOString().split('T')[0],
  payerId: 'AZDDD',
  procedureCode: 'T1019',
  liveIn: 'No', // This will be handled as string
  relationship: 'Caregiver' // Changed from 'Primary Caregiver' to 'Caregiver'
});

// Approved values from EVV documentation
const approvedPayerIds = [
  'AZACH', 'AZBUFC', 'AZCCCS', 'AZCDMP', 'AZDDD',
  'AZMCC', 'AZMYC', 'AZSHC', 'AZUCP'
];

const approvedProcedureCodes = [
  'G0151', 'G0152', 'G0153', 'G0299', 'G0300',
  'S5125', 'S5130', 'S5135', 'S5136', 'S5150',
  'S5151', 'S5181', 'S9123', 'S9124', 'S9128',
  'S9129', 'S9131', 'T1019', 'T1021', 'T2017'
];

// Approved relationship values - these are the valid values EVV accepts
const approvedRelationships = [
  'Caregiver',
  'Parent',
  'Spouse',
  'Child',
  'Sibling',
  'Relative',
  'Friend',
  'Neighbor',
  'Guardian',
  'Representative',
  'Provider',
  'Other'
];

onMounted(() => {
  loadXrefs();
});

const sendXrefsToEVV = async () => {
  uploading.value = true;
  uploadResult.value = null;

  try {
    // CORRECTED ENDPOINT: Removed duplicate 'evv'
    const response = await axiosInstance.post('/api/evv/evv/xrefs/send/');
    uploadResult.value = response.data;

    // Refresh the list after upload
    if (response.data.status_code === 200) {
      loadXrefs();
    }

  } catch (error) {
    console.error('Error sending xrefs to EVV:', error);
    uploadResult.value = {
      status_code: 500,
      response: {
        error: 'Failed to send xrefs',
        details: error.response?.data || error.message
      }
    };
  } finally {
    uploading.value = false;
  }
};

const submitNewXref = async () => {
  if (!newXref.value.clientId || !newXref.value.employeeId) {
    alert('Please enter both Client ID and Employee ID');
    return;
  }

  // Validate client ID format (A + 8 digits)
  if (!/^A\d{8}$/.test(newXref.value.clientId)) {
    alert('Client ID must start with A followed by 8 digits (e.g., A12345678)');
    return;
  }

  // Validate employee ID format (9-digit SSN)
  if (!/^\d{9}$/.test(newXref.value.employeeId)) {
    alert('Employee ID must be a 9-digit number (SSN)');
    return;
  }

  uploading.value = true;

  try {
    // Create the payload with explicit string values to prevent boolean conversion
    const xrefData = [
      {
        ProviderIdentification: {
          ProviderQualifier: "MedicaidID",
          ProviderID: "211108"
        },
        XrefOtherID: `XREF_${Date.now()}`,
        SequenceID: 1,
        ClientIDQualifier: "ClientMedicaidID",
        ClientIdentifier: newXref.value.clientId,
        EmployeeQualifier: "EmployeeSSN",
        EmployeeIdentifier: newXref.value.employeeId,
        XRefStartDate: newXref.value.startDate,
        XRefEndDate: null,
        PayerID: newXref.value.payerId,
        PayerProgram: "AHCCCS",
        ProcedureCode: newXref.value.procedureCode,
        Modifier1: null,
        Modifier2: null,
        Modifier3: null,
        Modifier4: null,
        // FIX: Explicitly ensure LiveIn is sent as string "Yes" or "No"
        LiveIn: newXref.value.liveIn === 'Yes' ? 'Yes' : 'No',
        Relationship: newXref.value.relationship,
        XRefComments: "Manual relationship creation"
      }
    ];

    console.log('Sending Xref data:', JSON.stringify(xrefData, null, 2));

    // CORRECTED ENDPOINT: Removed duplicate 'evv'
    const response = await axiosInstance.post('/api/evv/evv/xrefs/upload/', xrefData);
    uploadResult.value = response.data;

    // Reset form and refresh list on success
    if (response.data.status_code === 200) {
      newXref.value = {
        clientId: '',
        employeeId: '',
        startDate: new Date().toISOString().split('T')[0],
        payerId: 'AZDDD',
        procedureCode: 'T1019',
        liveIn: 'No',
        relationship: 'Caregiver'
      };
      showCreateForm.value = false;
      loadXrefs();
    }

  } catch (error) {
    console.error('Error creating xref:', error);
    uploadResult.value = {
      status_code: 500,
      response: {
        error: 'Failed to create xref',
        details: error.response?.data || error.message
      }
    };
  } finally {
    uploading.value = false;
  }
};

const loadXrefs = async () => {
  loadingXrefs.value = true;
  try {
    const response = await axiosInstance.get('/api/xrefs/');
    xrefs.value = response.data;
  } catch (error) {
    console.error('Error loading xrefs:', error);
    xrefs.value = [];
  } finally {
    loadingXrefs.value = false;
  }
};

const deleteXref = async (xrefId) => {
  if (!confirm('Are you sure you want to delete this relationship?')) {
    return;
  }

  try {
    const response = await axiosInstance.delete(`/api/evv/xrefs/${xrefId}/`);

    if (response.status === 200 || response.status === 204) {
      loadXrefs(); // Refresh the list
    } else {
      alert('Failed to delete relationship');
    }
  } catch (error) {
    console.error('Error deleting xref:', error);
    alert('Error deleting relationship');
  }
};

const checkXrefStatus = async (transactionId) => {
  if (!transactionId) return;

  checkingStatus.value = true;
  try {
    // CORRECTED ENDPOINT: Removed duplicate 'evv'
    const response = await axiosInstance.get(`/api/evv/evv/check-upload-status/${transactionId}/`);
    statusResult.value = response.data.status_check_result;
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
  await checkXrefStatus(manualTransactionId.value);
};

const getStatusClass = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return 'status-success';
  if (statusCode >= 400 && statusCode < 500) return 'status-warning';
  return 'status-error';
};

const getTransactionId = (response) => {
  if (response.evv_response && response.evv_response.response) {
    return response.evv_response.response.transaction_id ||
      response.evv_response.response.upload_id ||
      response.evv_response.response.id;
  }
  return response.transaction_id || response.upload_id || response.id;
};
</script>

<template>
  <div class="xrefs-page">
    <div class="page-header">
      <h1>EVV Client-Employee Relationships</h1>
      <p>Manage client-employee cross-references (Xrefs)</p>
    </div>

    <div class="content-section">
      <!-- Upload Xrefs Section -->
      <div class="upload-section">
        <h2>Upload Xrefs to EVV</h2>

        <div class="upload-options">
          <button @click="sendXrefsToEVV" :disabled="uploading" class="btn btn-primary">
            {{ uploading ? 'Sending...' : 'Send All Xrefs to EVV' }}
          </button>

          <button @click="showCreateForm = !showCreateForm" class="btn btn-secondary">
            {{ showCreateForm ? 'Cancel' : 'Create New Xref' }}
          </button>
        </div>

        <!-- Info Box -->
        <div class="info-box">
          <h4>How this works:</h4>
          <ul>
            <li>Fetches all client-employee relationships from your database</li>
            <li>Validates client Medicaid IDs and employee SSNs</li>
            <li>Builds EVV-compliant Xref records</li>
            <li>Sends formatted data to AHCCCS EVV system</li>
          </ul>
        </div>

        <!-- Create Xref Form -->
        <div v-if="showCreateForm" class="create-form">
          <h3>Create New Client-Employee Relationship</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Client Medicaid ID *</label>
              <input v-model="newXref.clientId" type="text" placeholder="e.g., A12345678" class="form-input" />
              <small class="form-help">Must start with 'A' followed by 8 digits</small>
            </div>
            <div class="form-group">
              <label>Employee SSN *</label>
              <input v-model="newXref.employeeId" type="text" placeholder="e.g., 123456789" class="form-input" />
              <small class="form-help">Must be 9-digit SSN</small>
            </div>
            <div class="form-group">
              <label>Start Date *</label>
              <input v-model="newXref.startDate" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label>Payer ID *</label>
              <select v-model="newXref.payerId" class="form-input">
                <option v-for="payer in approvedPayerIds" :key="payer" :value="payer">
                  {{ payer }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Procedure Code *</label>
              <select v-model="newXref.procedureCode" class="form-input">
                <option v-for="code in approvedProcedureCodes" :key="code" :value="code">
                  {{ code }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Live In *</label>
              <select v-model="newXref.liveIn" class="form-input">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div class="form-group">
              <label>Relationship *</label>
              <select v-model="newXref.relationship" class="form-input">
                <option v-for="rel in approvedRelationships" :key="rel" :value="rel">
                  {{ rel }}
                </option>
              </select>
              <small class="form-help">Must be from approved list</small>
            </div>
          </div>
          <button @click="submitNewXref" class="btn btn-success">
            Create Relationship
          </button>
        </div>
      </div>

      <!-- Results Section -->
      <div v-if="uploadResult" class="results-section">
        <h3>Upload Results</h3>
        <div class="result-card"
          :class="getStatusClass(uploadResult.evv_response?.status_code || uploadResult.status_code)">
          <h4>Status: {{ uploadResult.evv_response?.status_code || uploadResult.status_code }}</h4>
          <pre>{{ JSON.stringify(uploadResult.evv_response?.response || uploadResult.response, null, 2) }}</pre>

          <div class="summary-info">
            <p><strong>Xrefs Sent:</strong> {{ uploadResult.count_sent }}</p>
            <p><strong>Invalid Records:</strong> {{ uploadResult.invalid_count }}</p>
          </div>

          <div v-if="getTransactionId(uploadResult)" class="transaction-info">
            <p><strong>Transaction ID:</strong> {{ getTransactionId(uploadResult) }}</p>
            <button @click="checkXrefStatus(getTransactionId(uploadResult))" class="btn btn-info">
              Check Upload Status
            </button>
          </div>

          <!-- Show invalid records if any -->
          <div v-if="uploadResult.invalid_records && uploadResult.invalid_records.length > 0" class="invalid-records">
            <h5>Invalid Records:</h5>
            <div v-for="record in uploadResult.invalid_records" :key="record.xref_id" class="invalid-record">
              <p><strong>{{ record.xref_id }}</strong> - Client: {{ record.client_id }}, Employee: {{ record.employee_id
              }}</p>
              <ul>
                <li v-for="error in record.errors" :key="error">{{ error }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Check Results -->
      <div v-if="statusResult" class="status-section">
        <h3>Status Check Results</h3>
        <div class="result-card">
          <pre>{{ JSON.stringify(statusResult, null, 2) }}</pre>
        </div>
      </div>

      <!-- Manual Status Check -->
      <div class="manual-status-check">
        <h3>Check Upload Status</h3>
        <div class="status-form">
          <input v-model="manualTransactionId" type="text" placeholder="Enter Transaction ID" class="form-input" />
          <button @click="checkManualStatus" :disabled="checkingStatus" class="btn btn-info">
            {{ checkingStatus ? 'Checking...' : 'Check Status' }}
          </button>
        </div>
      </div>

      <!-- Xref List Section -->
      <div class="xref-list-section">
        <h3>Existing Relationships ({{ xrefs.length }})</h3>
        <button @click="loadXrefs" class="btn btn-outline">Refresh List</button>

        <div v-if="loadingXrefs" class="loading">Loading relationships...</div>

        <div v-else-if="xrefs.length > 0" class="xrefs-table">
          <table>
            <thead>
              <tr>
                <th>Client ID</th>
                <th>Employee ID</th>
                <th>Relationship Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="xref in xrefs" :key="xref.id">
                <td>{{ xref.clientId }}</td>
                <td>{{ xref.employeeId }}</td>
                <td>{{ xref.relationshipType }}</td>
                <td>
                  <button @click="deleteXref(xref.id)" class="btn btn-danger btn-sm">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="no-data">
          No client-employee relationships found.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Your existing CSS styles remain the same */
.xrefs-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
  font-weight: 600;
}

.page-header p {
  color: #7f8c8d;
  font-size: 1.2rem;
  margin: 0;
}

.content-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
}

.upload-section {
  margin-bottom: 30px;
  padding-bottom: 25px;
  border-bottom: 2px solid #f8f9fa;
}

.upload-section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 600;
}

.upload-options {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-transform: none;
  min-width: 140px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3, #004085);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d, #545b62);
  color: white;
  box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #545b62, #3d4246);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #28a745, #1e7e34);
  color: white;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, #1e7e34, #155724);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
}

.btn-info {
  background: linear-gradient(135deg, #17a2b8, #138496);
  color: white;
  box-shadow: 0 2px 4px rgba(23, 162, 184, 0.3);
}

.btn-info:hover:not(:disabled) {
  background: linear-gradient(135deg, #138496, #0f6674);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(23, 162, 184, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #c82333, #a71e2a);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
}

.btn-outline {
  background: white;
  border: 2px solid #007bff;
  color: #007bff;
  padding: 10px 20px;
}

.btn-outline:hover:not(:disabled) {
  background: #007bff;
  color: white;
  transform: translateY(-2px);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 12px;
  min-width: auto;
}

.info-box {
  background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
  border: 1px solid #bbdefb;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info-box h4 {
  margin-top: 0;
  color: #1976d2;
  font-size: 1.2rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.info-box ul {
  margin-bottom: 0;
  padding-left: 20px;
}

.info-box li {
  margin-bottom: 8px;
  color: #455a64;
  line-height: 1.5;
}

.create-form {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border: 2px solid #dee2e6;
  border-radius: 12px;
  padding: 25px;
  margin-top: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.create-form h3 {
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #495057;
  font-size: 14px;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  transform: translateY(-1px);
}

.form-help {
  color: #6c757d;
  font-size: 0.75rem;
  margin-top: 6px;
  font-style: italic;
}

.results-section,
.status-section {
  margin-top: 30px;
}

.results-section h3,
.status-section h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.4rem;
  font-weight: 600;
}

.result-card {
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 20px;
  margin-top: 15px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.status-success {
  border-left: 6px solid #28a745;
  background: linear-gradient(135deg, #f8fff9, #e8f5e8);
}

.status-warning {
  border-left: 6px solid #ffc107;
  background: linear-gradient(135deg, #fffef0, #fff9e6);
}

.status-error {
  border-left: 6px solid #dc3545;
  background: linear-gradient(135deg, #fff5f5, #ffe6e6);
}

.result-card h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 1.2rem;
}

.result-card pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12px;
  border: 1px solid #333;
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
}

.summary-info {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.summary-info p {
  margin: 8px 0;
  font-weight: 600;
  color: #495057;
}

.transaction-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px dashed #dee2e6;
}

.transaction-info p {
  margin-bottom: 15px;
  font-weight: 600;
  color: #495057;
}

.invalid-records {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px dashed #dee2e6;
}

.invalid-records h5 {
  color: #dc3545;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.invalid-record {
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  border-left: 4px solid #f56565;
}

.invalid-record p {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #2d3748;
}

.invalid-record ul {
  margin: 0;
  padding-left: 20px;
}

.invalid-record li {
  color: #e53e3e;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.manual-status-check {
  margin-top: 30px;
  padding-top: 25px;
  border-top: 2px solid #f8f9fa;
}

.manual-status-check h3 {
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

.status-form {
  display: flex;
  gap: 15px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.status-form .form-input {
  flex: 1;
  min-width: 300px;
}

.xref-list-section {
  margin-top: 40px;
  padding-top: 25px;
  border-top: 2px solid #f8f9fa;
}

.xref-list-section h3 {
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.xrefs-table {
  margin-top: 20px;
  overflow-x: auto;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 14px;
}

th,
td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

th {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  font-weight: 700;
  color: #2c3e50;
  border-bottom: 2px solid #dee2e6;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tbody tr {
  transition: background-color 0.3s ease;
}

tbody tr:hover {
  background-color: #f8f9fa;
  transform: scale(1.01);
}

tbody tr:last-child td {
  border-bottom: none;
}

.loading,
.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
  font-style: italic;
  font-size: 1.1rem;
  background: #f8f9fa;
  border-radius: 10px;
  margin-top: 20px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .xrefs-page {
    padding: 15px;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .content-section {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .upload-options {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    margin-bottom: 10px;
  }

  .status-form {
    flex-direction: column;
    align-items: stretch;
  }

  .status-form .form-input {
    min-width: auto;
  }

  .xrefs-table {
    font-size: 0.8rem;
  }

  table {
    display: block;
    overflow-x: auto;
  }

  th,
  td {
    padding: 12px 8px;
  }
}

@media (max-width: 480px) {
  .xrefs-page {
    padding: 10px;
  }

  .content-section {
    padding: 15px;
  }

  .page-header h1 {
    font-size: 1.8rem;
  }

  .result-card pre {
    font-size: 10px;
    padding: 15px;
  }
}
</style>
