// Google Drive API configuration
const DISCOVERY_DOC =
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// You'll need to replace these with your actual Google API credentials
// Get them from: https://console.developers.google.com/
const API_KEY = 'AIzaSyB9LhVDezk7mmH0V1tR1YhVIwf-RxYrg2s';
const CLIENT_ID =
  '582559453454-e67dabpgjpkiiufqkitnj2duunsh9p9r.apps.googleusercontent.com';

let gapi;
let tokenClient;
let gapiInited = false;
let gisInited = false;

// Signature canvas functionality
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let hasSignature = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  initializeSignatureCanvas();
  initializeFormValidation();
  initializeEventListeners();
});

// ====== SIGNATURE CANVAS FUNCTIONS ======

function initializeSignatureCanvas() {
  // Set up canvas
  canvas.style.width = '100%';
  canvas.style.maxWidth = '400px';
  canvas.style.height = '150px';

  // Adjust canvas size to match display size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

function startDrawing(e) {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;

  ctx.beginPath();
  ctx.moveTo(x, y);
}

function draw(e) {
  if (!isDrawing) return;

  e.preventDefault(); // Prevent scrolling on mobile

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;

  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2d3748';
  ctx.lineTo(x, y);
  ctx.stroke();

  hasSignature = true;
  checkFormValidity();
  console.log('Drawing - hasSignature:', hasSignature);
}

function stopDrawing() {
  isDrawing = false;
}

function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasSignature = false;
  checkFormValidity();
}

// ====== FORM VALIDATION ======

function initializeFormValidation() {
  // Add event listeners for form validation
  document
    .getElementById('fullName')
    .addEventListener('input', checkFormValidity);
  document.getElementById('email').addEventListener('input', checkFormValidity);
  document
    .getElementById('agreeTerms')
    .addEventListener('change', checkFormValidity);

  // Initial check
  checkFormValidity();
}

function checkFormValidity() {
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const agreeTerms = document.getElementById('agreeTerms').checked;
  const signButton = document.getElementById('signButton');

  const isValid = fullName && email && agreeTerms && hasSignature;
  signButton.disabled = !isValid;

  console.log('Form validity check:', {
    fullName: !!fullName,
    email: !!email,
    agreeTerms,
    hasSignature,
    isValid,
  });
}

// ====== EVENT LISTENERS ======

function initializeEventListeners() {
  // Signature canvas events
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  // Touch events for mobile
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
  });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDrawing();
  });

  // Clear signature button
  document
    .getElementById('clearSignature')
    .addEventListener('click', clearSignature);

  // Form submission - using click event instead of submit
  document
    .getElementById('signButton')
    .addEventListener('click', handleFormSubmission);

  // Close document viewer
  document.getElementById('closeDocument').addEventListener('click', () => {
    document.getElementById('documentViewer').classList.remove('active');
  });

  // Prevent right-click on document (basic protection)
  document
    .getElementById('documentViewer')
    .addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
}

// ====== FORM SUBMISSION ======

function handleFormSubmission(e) {
  e.preventDefault();

  console.log('Sign button clicked');

  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const company = document.getElementById('company').value.trim();
  const agreeTerms = document.getElementById('agreeTerms').checked;

  console.log('Form data:', {
    fullName,
    email,
    company,
    agreeTerms,
    hasSignature,
  });

  // Final validation
  if (!fullName || !email || !agreeTerms || !hasSignature) {
    alert('Please complete all required fields and provide your signature.');
    return;
  }

  console.log('Validation passed, processing...');

  // Simulate processing
  const signButton = document.getElementById('signButton');
  signButton.innerHTML = '⏳ Processing...';
  signButton.disabled = true;

  setTimeout(() => {
    console.log('Processing complete, showing success message');

    // Store signing data for PDF generation
    const signingData = {
      fullName,
      email,
      company,
      timestamp: new Date().toISOString(),
      signature: canvas.toDataURL(),
    };

    // Show success message with download option
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `
            <strong>✅ NDA Successfully Signed!</strong><br>
            Thank you, ${fullName}. You now have access to the confidential VibeMatch App Plan.
            <br><br>
            <button type="button" onclick="showDocument()" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                📄 View Document Now
            </button>
            
            <div class="download-section">
                <h3>📋 Signed Agreement Copy</h3>
                <p>Download your signed NDA agreement for your records</p>
                <button type="button" onclick="generateSignedNDA({
                    fullName: '${fullName}',
                    email: '${email}',
                    company: '${company}',
                    timestamp: '${signingData.timestamp}',
                    signature: '${signingData.signature}'
                }, false)" class="btn-download">
                    📥 Download PDF
                </button>
                <button type="button" onclick="generateSignedNDA({
                    fullName: '${fullName}',
                    email: '${email}',
                    company: '${company}',
                    timestamp: '${signingData.timestamp}',
                    signature: '${signingData.signature}'
                }, true)" class="btn-drive" id="driveBtn">
                    📂 Save to Google Drive
                </button>
                <div id="driveStatus"></div>
                <small style="color: #718096; margin-top: 10px; display: block;">
                    This PDF contains your digital signature and serves as legal proof of the signed agreement.
                </small>
            </div>
        `;

    const ndaForm = document.getElementById('ndaForm');
    const form = document.getElementById('signatureForm');
    ndaForm.insertBefore(successMessage, form);
    form.style.display = 'none';

    // Initialize Google APIs after success message is shown
    setTimeout(() => {
      if (typeof gapi !== 'undefined') {
        gapiLoaded();
      }
      if (typeof google !== 'undefined') {
        gisLoaded();
      }
    }, 500);

    // Auto-show document after 3 seconds
    setTimeout(() => {
      showDocument();
    }, 3000);
  }, 1000);
}

// ====== DOCUMENT VIEWER ======

function showDocument() {
  console.log('Showing document');
  const viewer = document.getElementById('documentViewer');
  viewer.style.display = 'block';
  viewer.classList.add('active');
}

// ====== GOOGLE DRIVE API FUNCTIONS ======

// Initialize Google APIs
async function gapiLoaded() {
  gapi = window.gapi;
  await gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    console.log('Google APIs initialized');
  }
}

// Upload PDF to Google Drive
async function uploadToGoogleDrive(pdfBlob, filename, signerData) {
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        reject(resp);
        return;
      }

      try {
        const statusDiv = document.getElementById('driveStatus');
        statusDiv.innerHTML =
          '<div class="drive-status">📤 Uploading to Google Drive...</div>';

        // Create file metadata
        const metadata = {
          name: filename,
          description: `Signed NDA agreement for ${signerData.fullName} - VibeMatch App Plan Access`,
          parents: [], // You can specify a folder ID here if needed
        };

        // Convert PDF to base64
        const reader = new FileReader();
        reader.onload = async function () {
          const base64Data = reader.result.split(',')[1];

          // Upload file
          const form = new FormData();
          form.append(
            'metadata',
            new Blob([JSON.stringify(metadata)], { type: 'application/json' })
          );
          form.append('file', pdfBlob);

          const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
              method: 'POST',
              headers: new Headers({
                Authorization: `Bearer ${gapi.client.getToken().access_token}`,
              }),
              body: form,
            }
          );

          if (response.ok) {
            const result = await response.json();
            statusDiv.innerHTML = `
                            <div class="drive-status success">
                                ✅ Successfully uploaded to Google Drive!<br>
                                File ID: ${result.id}<br>
                                <a href="https://drive.google.com/file/d/${result.id}/view" target="_blank" style="color: #3182ce;">
                                    📂 Open in Google Drive
                                </a>
                            </div>
                        `;
            resolve(result);
          } else {
            throw new Error(`Upload failed: ${response.status}`);
          }
        };
        reader.readAsDataURL(pdfBlob);
      } catch (error) {
        console.error('Upload error:', error);
        document.getElementById('driveStatus').innerHTML = `
                    <div class="drive-status error">
                        ❌ Upload failed: ${error.message}
                    </div>
                `;
        reject(error);
      }
    };

    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

// ====== PDF GENERATION ======

function generateSignedNDA(signerData, uploadToDrive = false) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Set up fonts and colors
  doc.setFont('helvetica');

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('NON-DISCLOSURE AGREEMENT', 105, 30, { align: 'center' });

  // Subtitle
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('Signed Copy - VibeMatch App Plan Access', 105, 40, {
    align: 'center',
  });

  // Agreement details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);

  let yPos = 60;

  // Signing information box
  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.5);
  doc.rect(20, yPos - 5, 170, 35);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AGREEMENT EXECUTION DETAILS', 25, yPos + 5);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Signer Name: ${signerData.fullName}`, 25, yPos + 15);
  doc.text(`Email Address: ${signerData.email}`, 25, yPos + 22);
  if (signerData.company) {
    doc.text(`Company/Organization: ${signerData.company}`, 25, yPos + 29);
  }

  yPos += 50;

  // Timestamp and signature info
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Signed on: ${new Date(signerData.timestamp).toLocaleString()}`,
    25,
    yPos
  );
  doc.text(`Digital signature provided and verified`, 25, yPos + 7);

  yPos += 25;

  // NDA Terms
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('AGREEMENT TERMS', 25, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const terms = [
    'This Non-Disclosure Agreement is entered into between the disclosing party and',
    'the receiving party for the purpose of preventing unauthorized disclosure of',
    'Confidential Information.',
    '',
    'CONFIDENTIAL INFORMATION includes:',
    '• Business plans, strategies, and concepts',
    '• Product designs, specifications, and development plans',
    '• Marketing strategies and customer information',
    '• Financial information and projections',
    '• Technical data and know-how',
    '',
    'OBLIGATIONS OF RECEIVING PARTY:',
    '• Hold and maintain the Confidential Information in strict confidence',
    '• Not disclose the Confidential Information to any third parties',
    '• Not use the Confidential Information for any purpose other than evaluation',
    '• Return or destroy all Confidential Information upon request',
    '',
    'TERM: This Agreement shall remain in effect for a period of 5 years',
    'from the date of signing.',
    '',
    'GOVERNING LAW: This Agreement shall be governed by applicable laws.',
    '',
    'The receiving party acknowledges that they have read, understood, and',
    'agree to be bound by the terms of this Non-Disclosure Agreement.',
  ];

  terms.forEach((term) => {
    if (yPos > 270) {
      // Add new page if needed
      doc.addPage();
      yPos = 30;
    }
    doc.text(term, 25, yPos);
    yPos += 5;
  });

  // Add signature image if available
  if (signerData.signature) {
    yPos += 15;
    if (yPos > 250) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('DIGITAL SIGNATURE:', 25, yPos);

    try {
      // Add signature image
      doc.addImage(signerData.signature, 'PNG', 25, yPos + 5, 80, 30);
    } catch (error) {
      console.log('Could not add signature image:', error);
      doc.setFont('helvetica', 'italic');
      doc.text('[Digital signature provided]', 25, yPos + 15);
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'This document was digitally signed and is legally binding.',
    105,
    280,
    { align: 'center' }
  );
  doc.text(`Document ID: NDA-${Date.now()}`, 105, 285, { align: 'center' });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `NDA_Signed_${signerData.fullName.replace(
    /\s+/g,
    '_'
  )}_${timestamp}.pdf`;

  if (uploadToDrive) {
    // Convert to blob for upload
    const pdfBlob = doc.output('blob');
    uploadToGoogleDrive(pdfBlob, filename, signerData);
  } else {
    // Save the PDF locally
    doc.save(filename);
  }

  return filename;
}

// ====== GLOBAL FUNCTIONS ======

// Make functions globally available
window.showDocument = showDocument;
window.generateSignedNDA = generateSignedNDA;

// Load Google APIs when page loads
window.addEventListener('load', () => {
  // Load Google APIs script
  const script1 = document.createElement('script');
  script1.src = 'https://accounts.google.com/gsi/client';
  script1.onload = gisLoaded;
  document.head.appendChild(script1);

  // Initialize GAPI
  if (typeof gapi !== 'undefined') {
    gapiLoaded();
  }
});
