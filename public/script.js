let canvas, ctx;
let isDrawing = false;
let hasSignature = false;

document.addEventListener('DOMContentLoaded', function () {
  canvas = document.getElementById('signatureCanvas');
  ctx = canvas.getContext('2d');

  setupCanvas();
  setupForm();
  setupEventListeners();
});

function setupCanvas() {
  canvas.style.width = '100%';
  canvas.style.maxWidth = '400px';
  canvas.style.height = '150px';

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

function startDrawing(e) {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
  const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

  ctx.beginPath();
  ctx.moveTo(x, y);
}

function draw(e) {
  if (!isDrawing) return;
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
  const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2d3748';
  ctx.lineTo(x, y);
  ctx.stroke();

  hasSignature = true;
  checkForm();
}

function stopDrawing() {
  isDrawing = false;
}

function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasSignature = false;
  checkForm();
}

function setupForm() {
  document.getElementById('fullName').addEventListener('input', checkForm);
  document.getElementById('email').addEventListener('input', checkForm);
  document.getElementById('agreeTerms').addEventListener('change', checkForm);
  checkForm();
}

function checkForm() {
  const name = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const agree = document.getElementById('agreeTerms').checked;
  const button = document.getElementById('signButton');

  const valid = name && email && agree && hasSignature;
  button.disabled = !valid;
}

function setupEventListeners() {
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDrawing);

  document
    .getElementById('clearSignature')
    .addEventListener('click', clearSignature);
  document.getElementById('signButton').addEventListener('click', signNDA);
  document.getElementById('closeDocument').addEventListener('click', () => {
    document.getElementById('documentViewer').classList.remove('active');
  });
}

function signNDA(e) {
  e.preventDefault();

  const name = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const company = document.getElementById('company').value.trim();

  const button = document.getElementById('signButton');
  button.innerHTML = '⏳ Processing...';
  button.disabled = true;

  setTimeout(() => {
    const signingData = {
      fullName: name,
      email: email,
      company: company,
      timestamp: new Date().toISOString(),
      signature: canvas.toDataURL(),
    };

    uploadToLocalServer(signingData);
    scrollToDocument();
  }, 1000);
}

function scrollToDocument() {
  window.location.hash = '#documentViewer';
  document.getElementById('documentViewer').classList.add('active');
}

function uploadToLocalServer(signingData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont('helvetica');
  doc.setFontSize(20);
  doc.text('NON-DISCLOSURE AGREEMENT', 105, 30, { align: 'center' });

  doc.setFontSize(14);
  doc.text('Signed Copy - VibeMatch App Plan Access', 105, 40, {
    align: 'center',
  });

  doc.setFontSize(12);
  doc.text(`Signer: ${signingData.fullName}`, 20, 70);
  doc.text(`Email: ${signingData.email}`, 20, 80);
  if (signingData.company) {
    doc.text(`Company: ${signingData.company}`, 20, 90);
  }
  doc.text(
    `Signed: ${new Date(signingData.timestamp).toLocaleString()}`,
    20,
    100
  );

  if (signingData.signature) {
    doc.text('Digital Signature:', 20, 120);
    try {
      doc.addImage(signingData.signature, 'PNG', 20, 125, 80, 30);
    } catch {
      doc.text('[Signature provided]', 20, 140);
    }
  }

  doc.setFontSize(10);
  const terms = [
    '',
    'This Non-Disclosure Agreement ("Agreement") is entered into by and between the disclosing party and the receiving party for the purpose of preventing the unauthorized disclosure of Confidential Information as defined below.',
    '',
    'Definition of Confidential Information: For purposes of this Agreement, "Confidential Information" shall include all information or material that has or could have commercial value or other utility in the business in which the disclosing party is engaged, including but not limited to:',
    '• Business plans, strategies, and concepts',
    '• Product designs, specifications, and development plans',
    '• Marketing strategies and customer information',
    '• Financial information and projections',
    '',
    'OBLIGATIONS:',
    '• Hold information in strict confidence',
    '• Not disclose to third parties',
    '• Use only for evaluation purposes',
    '',
    'This agreement is valid for 5 years from signing date.',
  ];

  let yPos = 170;
  terms.forEach((term) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 30;
    }
    doc.text(term, 20, yPos);
    yPos += 10;
  });

  const pdfBlob = doc.output('blob');
  const filename = `NDA_Signed_${signingData.fullName.replace(
    /\s+/g,
    '_'
  )}.pdf`;

  const formData = new FormData();
  formData.append('file', pdfBlob, filename);
  formData.append('name', signingData.fullName);
  formData.append('email', signingData.email);

  fetch('/upload', {
    method: 'POST',
    body: formData,
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      console.log('✅ Uploaded successfully');
    })
    .catch((err) => {
      console.error('❌ Upload failed:', err);
    });
}

window.scrollToDocument = scrollToDocument;
