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

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('NON-DISCLOSURE AGREEMENT', pageWidth / 2, y, { align: 'center' });

  doc.setFont('helvetica');
  doc.setFontSize(12);
  y += 10;

  const centerTextBlock = (label, lines) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.setFont(undefined, 'normal');
    lines.forEach((line) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 6;
    });
    y += 5;
  };

  centerTextBlock(`This Non-Disclosure Agreement ("Agreement")`, [
    'is entered into by and between the disclosing party and the receiving party',
    'to prevent the unauthorized disclosure of Confidential Information as defined below.',
  ]);

  centerTextBlock('Definition of Confidential Information:', [
    '"Confidential Information" includes:',
    '• Business plans, strategies, and concepts',
    '• Product designs, specifications, and development plans',
    '• Marketing strategies and customer information',
    '• Financial information and projections',
    '• Technical data and know-how',
  ]);

  centerTextBlock('Obligations of Receiving Party:', [
    'The receiving party agrees to:',
    '• Hold and maintain the Confidential Information in strict confidence',
    '• Not disclose it to any third parties',
    '• Not use it for any purpose other than evaluation',
    '• Return or destroy all Confidential Information upon request',
  ]);

  centerTextBlock('Term:', [
    'This Agreement shall remain in effect for 5 years from the date of signing.',
  ]);

  centerTextBlock('Signer Details:', [
    `Name: ${signingData.fullName}`,
    `Email: ${signingData.email}`,
    `Company: ${signingData.company || '(none)'}`,
    `Signed on: ${new Date(signingData.timestamp).toLocaleString()}`,
  ]);

  if (signingData.signature) {
    doc.text('Signature:', pageWidth / 2, y, { align: 'center' });
    try {
      doc.addImage(
        signingData.signature,
        'PNG',
        (pageWidth - 80) / 2,
        y + 5,
        80,
        30
      );
    } catch {
      doc.text('[Signature could not be rendered]', pageWidth / 2, y + 15, {
        align: 'center',
      });
    }
  }

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
    .then((res) => res.json())
    .then((data) => {
      console.log('✅ Uploaded successfully');
    })
    .catch((err) => {
      console.error('❌ Upload failed:', err);
    });

  window.lastPDF = { doc, filename };
}

window.scrollToDocument = scrollToDocument;
