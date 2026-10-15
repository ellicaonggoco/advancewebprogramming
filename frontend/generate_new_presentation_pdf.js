import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

async function generatePdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  }

  function drawPageHeader() {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, 0.6, 'F');
    y += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('AttendEase • Complete 4-Person Presentation Guide & Defense Script', margin, y);
    doc.text('Advance Web Programming • Oct 15, 2026', pageWidth - margin, y, { align: 'right' });
    y += 5;
  }

  function drawFooter() {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      doc.text('CONFIDENTIAL • PROJECT DEFENSE SCRIPT', margin, pageHeight - 5);
      doc.text('ACADEMIC YEAR 2026', pageWidth - margin, pageHeight - 5, { align: 'right' });
    }
  }

  // === COVER / TITLE BANNER ===
  doc.setFillColor(24, 20, 27); // Dark brand color
  doc.roundedRect(margin, y, contentWidth, 36, 3, 3, 'F');

  // Accent bar
  doc.setFillColor(223, 192, 144); // Gold brand accent (#DFC090)
  doc.rect(margin, y, 4, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('AttendEase: Institutional Attendance & Workforce System', margin + 8, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(226, 232, 240);
  doc.text('Official 4-Person Presentation Guide, Module Division & Live Speaking Script', margin + 8, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(223, 192, 144);
  doc.text('Course: Advance Web Programming • Target Presentation Length: 7 to 10 Minutes', margin + 8, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Updated for Defense: Oct 15, 2026 • Real-Time DTR Engine & MongoDB Atlas Cloud Sync', margin + 8, y + 32);

  y += 42;

  // === SECTION: 4-REPORTER MODULE DIVISION TABLE ===
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 6.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. MODULE DIVISION & TIMELINE (4 REPORTERS)', margin + 3, y + 4.5);
  y += 10;

  const summaryRows = [
    {
      rep: 'Reporter 1',
      title: 'Project Context, Tech Stack, Authentication & Profile Settings',
      time: '1.5 - 2.0 mins',
      scope: 'Admin & Employee'
    },
    {
      rep: 'Reporter 2',
      title: 'Dashboard Metrics, Real-Time TimeClock DTR Engine & Overtime Authorization',
      time: '2.0 - 2.5 mins',
      scope: 'Admin & Employee'
    },
    {
      rep: 'Reporter 3',
      title: 'Attendance Records / My Attendance & Leave Management Workflow (Auto-Sync)',
      time: '2.0 - 2.5 mins',
      scope: 'Admin & Employee'
    },
    {
      rep: 'Reporter 4',
      title: 'Employee Directory, Admin Delegation, Departments, Reports & Q&A Wrap-Up',
      time: '2.0 - 2.5 mins',
      scope: 'Admin Only'
    }
  ];

  summaryRows.forEach(row => {
    checkPageBreak(13);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(row.rep + ' • ' + row.time, margin + 4, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text('[' + row.scope + ']', pageWidth - margin - 4, y + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(row.title, margin + 4, y + 8.5);

    y += 13;
  });

  y += 4;

  // === HELPER TO RENDER A REPORTER SECTION ===
  function renderReporterSection(repNum, repTitle, contextText, modules, turnoverText) {
    checkPageBreak(30);

    // Section Header Banner
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`REPORTER ${repNum}: ${repTitle.toUpperCase()}`, margin + 4, y + 5.5);
    y += 12;

    if (contextText) {
      checkPageBreak(25);
      doc.setFillColor(254, 252, 232); // amber-50
      doc.setDrawColor(254, 240, 138); // amber-200
      doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14); // amber-800
      doc.text('Opening Script / Project Context (Sasabihin sa mikropono):', margin + 4, y + 4.5);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const splitContext = doc.splitTextToSize(contextText, contentWidth - 8);
      doc.text(splitContext, margin + 4, y + 9);
      y += 26;
    }

    modules.forEach(mod => {
      checkPageBreak(35);

      // Module Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      
      const screenLines = doc.splitTextToSize(`UI Demo Action: ${mod.action}`, contentWidth - 8);
      const scriptLines = doc.splitTextToSize(mod.script, contentWidth - 8);
      const boxHeight = 12 + (screenLines.length * 3.5) + (scriptLines.length * 3.5);

      checkPageBreak(boxHeight + 4);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

      // Module Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`• Module: ${mod.name}`, margin + 4, y + 5);

      let innerY = y + 9.5;

      // Screen Action
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text(screenLines, margin + 4, innerY);
      innerY += (screenLines.length * 3.5) + 1.5;

      // Script
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(scriptLines, margin + 4, innerY);

      y += boxHeight + 4;
    });

    if (turnoverText) {
      checkPageBreak(15);
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208); // emerald-200
      doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(21, 128, 61); // emerald-700
      doc.text('Transition / Turnover Line sa susunod na reporter:', margin + 4, y + 4.5);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52);
      const splitTurnover = doc.splitTextToSize(turnoverText, contentWidth - 8);
      doc.text(splitTurnover, margin + 4, y + 8.5);
      y += 16;
    }

    y += 2;
  }

  // === RENDER REPORTER 1 ===
  renderReporterSection(
    1,
    'Project Context, Tech Stack, Authentication & Profile Settings',
    '"Magandang araw po sa ating guro at mga kaklase. Ang ipiprisinta po namin ay ang AttendEase, isang Modern Employee Attendance & Workforce Compliance Management System. Binuo po namin ito upang solusyonan ang manual timekeeping, buddy punching, at magulong payroll computation. Ginawa po namin itong centralized at automated gamit ang modern MERN Stack: React at Tailwind CSS sa Frontend, Node.js at Express sa Backend, at MongoDB Atlas Cloud Database. Ngayong araw, bawat isa po sa aming apat ay magpapaliwanag ng mga eksaktong modules ng system."',
    [
      {
        name: 'Authentication & Access Control (Login Screen)',
        action: 'Pumunta sa Login Page (/login). Ipakita ang validation kapag username lang ang inilagay, at ipakita ang Forgot Password modal.',
        script: 'Talking Points: "Dito po sa Login screen, mapapansin ninyo na Workplace Email Address ang hinihingi at hindi username lang upang sumunod sa corporate cybersecurity standards. Kapag generic username lang ang inilagay, bina-block ito ng system. Mayroon din po itong Forgot Password na may cryptographically verified 15-minute token. Bukod dito, mayroon tayong Role-Based Access Control: 7 modules ang visible sa Admin habang 4 modules lamang sa regular Employee upang protektahan ang company records."'
      },
      {
        name: 'Profile Settings (/settings)',
        action: 'Mag-login bilang Employee (herzsel.datul@company.com) at buksan ang Settings page. I-highlight ang naka-lock na Workplace Email.',
        script: 'Talking Points: "Sa Profile Settings, maaaring mag-update ng Contact Phone, Bio, Profile Avatar, at Password. Napaka-importante po ng aming Admin Email Lock Protection: Naka-disable at may lock badge ang Workplace Email Address. Tanging ang System Administrator lamang ang may karapatang magpalit ng corporate email upang maiwasan ang pandaraya o unverified account transfer."'
      }
    ],
    '"Ngayong naipakita na po natin ang secure authentication at profile settings, ipapasa ko po ang screen kay Reporter 2 upang ipaliwanag ang ating Live Dashboard at ang automated TimeClock DTR engine."'
  );

  // === RENDER REPORTER 2 ===
  renderReporterSection(
    2,
    'Live Dashboard, Real-Time TimeClock DTR Engine & Overtime Authorization',
    null,
    [
      {
        name: 'Real-Time Dashboard (/dashboard)',
        action: 'Ipakita ang Dashboard ng Admin (buong workforce metrics) vs Dashboard ng Employee (personal stats, shift, leave balance).',
        script: 'Talking Points: "Maraming salamat. Ang Dashboard po ang central workplace command. Sa Admin, makikita ang Total Employees (7 active), Today Attendance Rate, at breakdown ng Present, Late, Half-Day, On Leave, at Absent. Sa panig naman ng Employee, nakikita niya ang kanyang personal metrics: Assigned Shift Schedule, Days Present ngayong buwan, punctuality rate, at ang natitira niyang Leave Balance."'
      },
      {
        name: 'Automated TimeClock Widget (DTR Engine & 15-Minute Grace Period)',
        action: 'Ipakita ang TimeClock card. I-highlight ang live Asia/Manila clock, ang 15m Grace badge, at ang dynamic "Present (On Duty)" badge.',
        script: 'Talking Points: "Ito po ang puso ng ating DTR—ang TimeClock Widget. Naka-sync ito sa real-time Asia/Manila time. Mayroon itong Automated Late Detection: Standard shift natin ay 9:00 AM na may 15-minute grace period (hanggang 9:15 AM). Kapag lampas 9:15 AM, automatic itong mamarkahan ng Late. Napaka-importante: Kapag naka-time in na ngunit hindi pa tapos ang shift, dynamic badge itong Present (On Duty) na may live pulsing green dot. Sa pag-clock out lamang ito magiging Present (Full Day), at automatic na kinalkula ng backend formula ang rendered work hours nang walang manual computation."'
      },
      {
        name: 'Overtime (OT) Duty Authorization',
        action: 'Ipakita ang Overtime Authorization section sa TimeClock widget.',
        script: 'Talking Points: "Mahigpit po ang aming compliance feature: Bawal mag-overtime ang regular employee nang walang paunang pahintulot mula kay Admin. Kailangan munang mag-issue si Admin ng Overtime Authorization bago mabuksan ang OT shift button ng empleyado para iwas sa ghost overtime."'
      }
    ],
    '"Matapos po nating makita ang live timekeeping at dashboard metrics, ipapasa ko naman po kay Reporter 3 para ipakita ang talaan sa Attendance Records at ang proseso ng Leave Requests module."'
  );

  // === RENDER REPORTER 3 ===
  renderReporterSection(
    3,
    'Attendance Records / My Attendance & Leave Management Workflow',
    null,
    [
      {
        name: 'Attendance Records (Admin) vs My Attendance (Employee) (/attendance)',
        action: 'Pumunta sa /attendance gamit ang Admin account, ipakita ang multi-filter (Date, Month, Department, Status), pagkatapos mag-switch sa Employee account.',
        script: 'Talking Points: "Salamat. Sa Attendance Records, makikita ni Admin ang kumpletong logs ng lahat ng kawani sa buong organisasyon. Sa panig naman ng empleyado, My Attendance ang tawag dito kung saan sarili lamang niyang data ang accessible para sa data privacy. May multi-filter controls ito ayon sa Petsa, Buwan, Departamento, at Status. Bawat talaan ay may kumpletong detalye: Time In, Time Out, Work Hours, Late Minutes, at Shift Method."'
      },
      {
        name: 'Leave Requests & One-Click Approval Workflow (/leaves)',
        action: 'Pumunta sa /leaves. Ipakita ang application form (Sick, Vacation, Emergency Leave) at ang Admin Approval / Rejection buttons.',
        script: 'Talking Points: "Sa Leave Requests module nag-a-apply ang mga kawani para sa Sick Leave, Vacation Leave, o Emergency Leave. May built-in validation ito: Bawal mag-apply ng date kung saan endDate < startDate, bawal lumagpas sa available leave balance, at bawal ang duplicate dates. Sa panig ni Administrator, mayroon siyang One-Click Review kung saan makikita ang petsa, dahilan, at uri ng leave."'
      },
      {
        name: 'Automated Cross-Module Data Synchronization (Proof of Connected Data)',
        action: 'Ipakita ang record ni Neil Chester Mari Garcia (EMP-1004) ngayong araw sa Attendance at Leaves.',
        script: 'Talking Points (High Impact): "Gusto po naming bigyang-diin na 100% connected ang ating database. Halimbawa po kay Neil Chester Mari Garcia (EMP-1004): Mayroon siyang approved Sick Leave ngayong araw. Dahil approved ito, automatic itong nag-sync sa Attendance Records bilang On Leave, nabawasan ang kanyang leave balance, at hindi siya namarkahan bilang Absent. Kapag sinubukan din niyang mag-time in, bina-block ito ng backend dahil bawal mag-clock in habang naka-approved leave."'
      }
    ],
    '"Ngayong naipakita na po natin ang attendance logs at leave management, ipapasa ko po kay Reporter 4 para sa Employee Directory, Departments, at ang ating Audit Reports & Analytics module."'
  );

  // === RENDER REPORTER 4 ===
  renderReporterSection(
    4,
    'Employee Directory, Departments Hierarchy, Reports & System Wrap-Up',
    null,
    [
      {
        name: 'Employee Directory & Admin Role Delegation (/employees)',
        action: 'Pumunta sa /employees. Buksan ang Add Employee modal, i-check ang "Create login credentials", at ipakita ang System Access Role dropdown.',
        script: 'Talking Points: "Maraming salamat. Hawak po ng Administrator ang Employee Directory module kung saan nakatala ang 7 official staff members. Mayroon itong secure na Admin Delegation: Kapag nagdagdag ng bagong empleyado, maaaring piliin kung Staff Member (Employee) o System Administrator (Admin) ang kanyang magiging access level nang may mataas na security control. Bawal din ang negative salary at bawal ang future hire dates."'
      },
      {
        name: 'Departments Structure (/departments)',
        action: 'Pumunta sa /departments. Ipakita ang 5 divisions (Executive, IT, HR, Operations, Finance) kasama ang manager at budget allocation.',
        script: 'Talking Points: "Dito naka-istruktura ang organisasyon sa 5 pangunahing departamento: Executive, IT & Engineering, Human Resources, Operations & QA, at Finance & Analytics. Bawat isa ay may nakatalagang Department Head, Department Code, at alokasyon para sa maayos na monitoring."'
      },
      {
        name: 'Reports & Analytics (Monthly Summary & 3 Export Formats) (/reports)',
        action: 'Pumunta sa /reports. Ipakita ang Monthly Attendance KPI cards, pagkatapos ay sunod-sunod na i-demo ang Export PDF, Export CSV, at Print buttons.',
        script: 'Talking Points: "Ito po ang executive command module para sa audits. Accurate ang math: Makikita ang Days Worked, On-Time Days, Late Days, Total Rendered Hours, at Compliance Rate. Mayroon tayong 3 export options: 1) Export PDF - nagge-generate ng formal official report na may letterhead at executive signature section gamit ang jsPDF; 2) Export CSV - handang buksan sa Excel para sa payroll computation; at 3) Print - direct print preview para sa paper filing."'
      }
    ],
    null
  );

  // === SYSTEM CONCLUSION SCRIPT ===
  checkPageBreak(25);
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(223, 192, 144);
  doc.text('System Wrap-Up & Closing Statement (Sasabihin ni Reporter 4 para sa buong grupo):', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(241, 245, 249);
  const closingText = '"Sa kabuuan po, ang AttendEase ay hindi lamang simpleng time tracker. Isa po itong kumpletong end-to-end platform na nag-uugnay sa cybersecurity, real-time DTR computation, employee records, leave approvals, at official report generation nang walang papel at walang dayaan. Dito po nagtatapos ang aming presentasyon. Handa na po kaming apat na sagutin ang anumang katanungan ng ating panel at guro. Maraming salamat po!"';
  const splitClosing = doc.splitTextToSize(closingText, contentWidth - 8);
  doc.text(splitClosing, margin + 4, y + 10);
  y += 26;

  // === DEFENSE CHEAT SHEET (TOP 5 PANEL QUESTIONS) ===
  checkPageBreak(50);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 6.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. DEFENSE CHEAT SHEET: TOP 5 COMMON PANEL QUESTIONS & DIRECT ANSWERS', margin + 3, y + 4.5);
  y += 10;

  const faqs = [
    {
      q: '1. Bakit email address ang gamit sa login sa halip na generic username?',
      a: 'Sagot: Para sa enterprise identity verification at proteksyon laban sa credential brute-forcing. Ang paggamit ng institutional email (company domain) ay tinitiyak na rehistrado at beripikadong kawani lamang ang makaka-access sa portal.'
    },
    {
      q: '2. Paano ninyo nasisiguro na accurate ang rendered hours at late computations sa DTR?',
      a: 'Sagot: Ang backend algorithm natin sa attendance route ay nagko-convert ng Time-In at Time-Out sa total minutes mula hatinggabi sa Asia/Manila timezone, kinukuha ang agwat, pino-format sa exact 2-decimal hours (e.g. 8.25 hrs), at nag-a-apply ng 15-minute grace period bago mag-tag ng tardiness.'
    },
    {
      q: '3. Paano naiiwasan ang "Present Whole Day" status kung kaka-time in pa lang ng empleyado?',
      a: 'Sagot: May real-time shift state evaluation ang ating StatusBadge. Kapag may time-in ngunit wala pang time-out (null o "-"), dynamic itong nagpapakita ng "Present (On Duty)" na may live animated pulsing radar dot. Pagkatapos lamang ng shift at pag-log ng time-out ito magiging "Present (Full Day)".'
    },
    {
      q: '4. Paano gumawa ng bagong Admin account nang hindi nabubutas ang security ng system?',
      a: 'Sagot: May dalawang layer: Sa Admin portal (Employee Directory modal), tanging naka-login na Administrator ang may access sa "System Access Role" dropdown. Kung dadaan naman sa public API registration, mandatory ang server-side ADMIN_SECRET_KEY ("AttendEaseAdmin2026!"); kung wala ito, automatic downgrade sa standard employee role.'
    },
    {
      q: '5. Paano nagkakaroon ng data consistency sa pagitan ng Leave module at Attendance module?',
      a: 'Sagot: 100% relational ang data handling natin. Pag na-approve ang isang Leave request, kusa nitong ini-inject ang attendance record bilang "On Leave" para sa araw na iyon, binabawasan ang PTO leave balance, at bina-block ang empleyado sa pag-time in habang naka-leave.'
    }
  ];

  faqs.forEach(faq => {
    checkPageBreak(18);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);

    const qLines = doc.splitTextToSize(faq.q, contentWidth - 8);
    const aLines = doc.splitTextToSize(faq.a, contentWidth - 8);
    const fHeight = 6 + (qLines.length * 3.5) + (aLines.length * 3.5);

    checkPageBreak(fHeight + 3);
    doc.roundedRect(margin, y, contentWidth, fHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(qLines, margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(aLines, margin + 4, y + 5 + (qLines.length * 3.5));

    y += fHeight + 3;
  });

  // Final Header/Footer pass
  drawFooter();

  // Save to target locations
  const downloadsPath = 'C:/Users/ellic/Downloads/AttendEase_4_Person_Presentation_Script_and_Guide.pdf';
  const legacyWorkflowPath = 'C:/Users/ellic/Downloads/Final_Project_Presentation_Script_and_Workflow.pdf';
  const artifactsPath = 'C:/Users/ellic/.gemini/antigravity/brain/082647bd-f84d-4511-a394-572d033ea5af/AttendEase_4_Person_Presentation_Script_and_Guide.pdf';

  const pdfOutput = Buffer.from(doc.output('arraybuffer'));

  fs.writeFileSync(downloadsPath, pdfOutput);
  fs.writeFileSync(legacyWorkflowPath, pdfOutput);
  fs.writeFileSync(artifactsPath, pdfOutput);

  console.log('✅ Successfully generated and saved PDF to:');
  console.log(' 1.', downloadsPath);
  console.log(' 2.', legacyWorkflowPath);
  console.log(' 3.', artifactsPath);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
