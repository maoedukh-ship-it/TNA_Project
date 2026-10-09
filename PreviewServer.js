const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);

const previewBridge = `<script>
  (function() {
    var assessments = [
      { TNAID: 'PREVIEW-001', TNAReference: 'TNA-2026-0001', EmployeeID: 'EMP-001', CurrentStatus: 'PENDING_HOD_APPROVAL' },
      { TNAID: 'PREVIEW-002', TNAReference: 'TNA-2026-0002', EmployeeID: 'EMP-014', CurrentStatus: 'PENDING_EMPLOYEE_ACKNOWLEDGMENT' },
      { TNAID: 'PREVIEW-003', TNAReference: 'TNA-2026-0003', EmployeeID: 'EMP-022', CurrentStatus: 'APPROVED' }
    ];
    var users = [
      { FullName: 'Morgan Lee', Email: 'morgan.lee@example.com', EmployeeID: 'EMP-001', DepartmentID: 'People', AccountStatus: 'ACTIVE' },
      { FullName: 'Avery Chen', Email: 'avery.chen@example.com', EmployeeID: 'EMP-014', DepartmentID: 'Operations', AccountStatus: 'ACTIVE' },
      { FullName: 'Jordan Patel', Email: 'jordan.patel@example.com', EmployeeID: 'EMP-022', DepartmentID: 'Finance', AccountStatus: 'ACTIVE' }
    ];
    var responses = {
      initializeApp: { success: true, message: 'Preview system is ready.' },
      getAppState: { success: true, data: { user: { FullName: 'System Administrator', Email: 'admin@example.com' }, permissions: ['TNA_VIEW_ALL', 'USER_VIEW'] } },
      getDashboardSummary: { success: true, data: { totalAssessmentCount: 84, draftCount: 9, pendingEmployeeAcknowledgment: 12, pendingHodApproval: 16, returnedCount: 7, approvedCount: 40 } },
      listUsersForAdmin: { success: true, data: users },
      sendAssessmentReminder: { success: true, message: 'Preview reminder sent.' },
      createNewAssessment: { success: true, data: { TNAID: 'PREVIEW-NEW' }, message: 'Preview assessment created.' },
      saveAssessmentDraft: { success: true, data: { TNAID: 'PREVIEW-NEW' }, message: 'Preview draft saved.' },
      submitAssessment: { success: true, message: 'Preview assessment submitted.' },
      acknowledgeAssessment: { success: true, message: 'Preview assessment acknowledged.' },
      returnAssessmentForRevision: { success: true, message: 'Preview assessment returned.' },
      approveAssessment: { success: true, message: 'Preview assessment approved.' },
      hodReturnAssessment: { success: true, message: 'Preview assessment returned for revision.' }
    };

    function createRunner(successHandler, failureHandler) {
      return new Proxy({}, {
        get: function(target, property) {
        if (property === 'withSuccessHandler') {
            return function(handler) { return createRunner(handler, failureHandler); };
        }
        if (property === 'withFailureHandler') {
            return function(handler) { return createRunner(successHandler, handler); };
        }
        return function() {
          var response = property === 'getTNAForCurrentUser' ? assessments :
            property === 'loginAdmin' ? { success: true, data: { user: { FullName: 'System Administrator' } } } :
            responses[property] || { success: true, message: 'Preview action completed.' };
            window.setTimeout(function() {
              try {
                successHandler(response);
              } catch (error) {
                if (failureHandler) failureHandler(error);
                else console.error(error);
              }
            }, 120);
        };
        }
      });
    }

    window.google = { script: { run: createRunner(function() {}, function(error) { console.error(error); }) } };
  })();
</script>`;

function renderFragment(name) {
  if (!/^[A-Za-z0-9_-]+$/.test(name)) {
    throw new Error('Invalid preview fragment name.');
  }

  const fragmentPath = path.join(__dirname, name + '.html');
  const fragment = fs.readFileSync(fragmentPath, 'utf8');
  return fragment.replace(/<\?!=\s*include\('([^']+)'\);\s*\?>/g, function(match, nestedName) {
    return renderFragment(nestedName);
  });
}

function renderApp() {
  const indexPath = path.join(__dirname, 'Index.html');
  const index = fs.readFileSync(indexPath, 'utf8');
  const rendered = index.replace(/<\?!=\s*include\('([^']+)'\);\s*\?>/g, function(match, name) {
    return renderFragment(name);
  });
  return rendered.replace('</head>', previewBridge + '</head>');
}

http.createServer(function(request, response) {
  if (request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('TNA UI preview is running.');
    return;
  }

  if (request.method !== 'GET' || (request.url !== '/' && !request.url.startsWith('/?'))) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found.');
    return;
  }

  try {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(renderApp());
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Preview rendering failed: ' + error.message);
  }
}).listen(port, host, function() {
  console.log('TNA UI preview: http://' + host + ':' + port);
});