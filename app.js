const { useState, useEffect, useRef } = React;

const GITHUB_URL = 'https://github.com/golu-kumarpandey';

// ============ SCROLL REVEAL HOOK ============
const useScrollReveal = (direction = 'left', delay = 0) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener?.('change', updateMotionPreference);

    if (mediaQuery.matches) {
      setIsVisible(true);
      return () => mediaQuery.removeEventListener?.('change', updateMotionPreference);
    }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener?.('change', updateMotionPreference);
    };
  }, []);
  const base = prefersReducedMotion ? '' : 'transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform';
  const hidden = direction === 'left' ? 'opacity-0 -translate-x-8 sm:-translate-x-16'
    : direction === 'right' ? 'opacity-0 translate-x-8 sm:translate-x-16'
    : 'opacity-0 translate-y-8 sm:translate-y-12';
  return {
    ref,
    className: `${base} ${isVisible ? 'opacity-100 translate-x-0 translate-y-0' : hidden}`,
    style: prefersReducedMotion ? undefined : { transitionDelay: `${delay}ms` },
  };
};

// ============ READING PROGRESS ============
const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };
    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return <div className="fixed left-0 top-0 z-[100] h-1 bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.7)] transition-[width] duration-150" style={{ width: `${progress}%` }} aria-hidden="true" />;
};

// ============ TOAST NOTIFICATION ============
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const icon = type === 'success'
    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
    : type === 'error'
    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>;

  return (
    <div className="fixed bottom-6 right-6 z-[200] toast-enter">
      <div className={`${bgColor} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm`}>
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

// ============ ROBUST PDF GENERATOR WITH ENHANCED DOWNLOAD ============
const generateResumePDF = async (onResult) => {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { 
      onResult('error', 'PDF library not loaded. Please refresh the page and try again.'); 
      return false; 
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    let y = 50;
    const pageBreakCheck = (need = 30) => { if (y + need > 800) { doc.addPage(); y = 50; } };
    const accent = [249, 115, 22]; const navy = [30, 33, 57]; const gray = [107, 114, 128];

    doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(...navy);
    doc.text('GOLU PANDEY', 40, y); y += 22;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(...accent);
    doc.text('Frontend Developer  |  React.js & TypeScript', 40, y); y += 30;
    doc.setDrawColor(...accent); doc.setLineWidth(2);
    doc.line(40, y, W - 40, y); y += 25;

    const sectionHead = (title) => {
      pageBreakCheck(40);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...accent);
      doc.text(title.toUpperCase(), 40, y); y += 6;
      doc.setDrawColor(...accent); doc.setLineWidth(0.5);
      doc.line(40, y, 40 + doc.getTextWidth(title.toUpperCase()) + 4, y); y += 16;
    };
    const textBlock = (text, opts = {}) => {
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal'); doc.setFontSize(opts.size || 10);
      doc.setTextColor(...(opts.color || [55, 65, 81]));
      doc.splitTextToSize(text, W - 80).forEach(line => { pageBreakCheck(14); doc.text(line, opts.indent ? 55 : 40, y); y += 13; });
    };
    const bulletList = (items) => {
      items.forEach(b => {
        pageBreakCheck(30);
        doc.setTextColor(55, 65, 81); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.splitTextToSize('• ' + b, W - 95).forEach(line => { doc.text(line, 55, y); y += 13; });
        y += 3;
      });
    };

    sectionHead('Info');
    [['Address:', 'Aurangabad, Bihar'], ['Phone:', '+91 9939117874'], ['Email:', 'golu.g.pandey@outlook.com'], ['GitHub:', 'github.com/golu-kumarpandey'], ['LinkedIn:', 'linkedin.com/in/golu-pandey']].forEach(([label, value]) => {
      pageBreakCheck(16);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...navy); doc.setFontSize(10);
      doc.text(label, 40, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
      doc.text(value, 120, y); y += 15;
    });
    y += 8;

    sectionHead('Skills');
    [['Frontend:', 'JavaScript, TypeScript, React.js, React Hooks, Redux Toolkit, React Router, HTML5, CSS3, Tailwind CSS, Bootstrap, Formik, Yup, responsive and mobile-first design, Figma-to-React'],
     ['Backend & Data:', 'Node.js, Express.js, Python, MongoDB, SQLite, Sequelize (ORM), Mongoose (ODM)'],
     ['APIs & Tools:', 'REST APIs, JWT, Socket.IO, Axios, Stripe, Cloudinary, Git, GitHub, Postman']].forEach(([label, value]) => {
      pageBreakCheck(30);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...navy); doc.text(label, 40, y); y += 14;
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
      doc.splitTextToSize(value, W - 100).forEach(line => { doc.text(line, 55, y); y += 13; });
      y += 4;
    });
    y += 4;

    sectionHead('Languages');
    textBlock('Hindi (Fluent)   |   English (Intermediate)   |   Telugu (Basic)'); y += 6;
    sectionHead('Profile');
    textBlock('Frontend developer pursuing an MCA, with two internships building responsive React interfaces. Built full-stack commerce and messaging applications with REST APIs, JWT authentication and real-time updates. Interested in developing AI-powered web applications.');
    y += 6;

    sectionHead('Employment History');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...navy);
    doc.text('Frontend Developer Intern, Young Mind', 40, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
    doc.text('Tirupati, Andhra Pradesh  |  Jul - Sep 2025', W - 40, y, { align: 'right' }); y += 15;
    bulletList([
      'Built responsive React and TypeScript interfaces with reusable Tailwind CSS components, Redux Toolkit for shared state, and Formik and Yup for form validation.',
      'Protected routes with JWT authentication and authorization. Collaborated using Git and GitHub.',
    ]); y += 8;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...navy);
    doc.text('Frontend Developer Intern, Infasta Soft Solution', 40, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
    doc.text('Hyderabad, Telangana  |  Mar - Jun 2025', W - 40, y, { align: 'right' }); y += 15;
    bulletList(['Developed interactive React and TypeScript components, managed state with Redux Toolkit and added JWT authentication to protected React Router routes.']);
    y += 8;

    sectionHead('Projects');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...navy);
    doc.text('Multi-Vendor E-Commerce Platform', 40, y); y += 15;
    bulletList([
      'Built customer, vendor and admin dashboards with React, Redux Toolkit, Node.js, Express.js and MongoDB. Enforced role-based access with JWT and protected routes.',
      'Implemented listings, wish lists, carts, Stripe checkout, ratings and reviews. Added inventory tools, product banners and admin-to-vendor payment transfers.',
      'Connected customers, vendors and admins through Socket.IO chat and notifications. Built responsive Tailwind CSS screens, called REST APIs with Axios and handled image uploads with Cloudinary.',
    ]); y += 8;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...navy);
    doc.text('Real-Time Chat Application', 40, y); y += 15;
    bulletList([
      'Built one-to-one messaging with React, Node.js, Express.js and Socket.IO, including typing indicators, online status, offline status and incoming message notifications.',
      'Implemented authentication, session management and message deletion. Stored and retrieved chat history using backend APIs and MongoDB.',
    ]); y += 8;

    sectionHead('Education');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...navy);
    doc.text('Master of Computer Applications (MCA)', 40, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
    doc.text('2025 - 2027 (expected)', W - 40, y, { align: 'right' }); y += 14;
    doc.setFontSize(10); doc.setTextColor(55, 65, 81);
    doc.text('Indira Gandhi National Open University', 55, y); y += 18;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...navy);
    doc.text('Bachelor of Computer Applications (BCA)', 40, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
    doc.text('2020 - 2023', W - 40, y, { align: 'right' }); y += 14;
    doc.setFontSize(10); doc.setTextColor(55, 65, 81);
    doc.text('Magadh University, Bodh Gaya', 55, y); y += 18;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...navy);
    doc.text('Intermediate (12th) 2018-2020  |  Secondary (10th) 2017-2018', 40, y); y += 14;
    doc.setFontSize(10); doc.setTextColor(55, 65, 81);
    doc.text('Bihar School Examination Board, Patna', 55, y); y += 14;

    sectionHead('Achievements');
    textBlock('Completed two frontend internships and built React applications that combine authenticated REST APIs with live messaging and notifications.');

    const fileName = 'Golu_Pandey_Resume.pdf';
    
    // Enhanced download with multiple attempts and better error handling
    const attemptDownload = () => {
      return new Promise((resolve) => {
        try {
          const blob = doc.output('blob');
          const url = URL.createObjectURL(blob);
          
          // Create a more persistent download link
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.setAttribute('download', fileName);
          link.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
          
          document.body.appendChild(link);
          
          // Multiple click attempts with small delays
          let attempts = 0;
          const maxAttempts = 3;
          
          const tryClick = () => {
            attempts++;
            try {
              link.click();
              console.log(`Download attempt ${attempts} triggered`);
              
              // Wait longer before cleanup to ensure download starts
              setTimeout(() => {
                try {
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  resolve(true);
                } catch (cleanupErr) {
                  console.warn('Cleanup error:', cleanupErr);
                  resolve(true); // Still resolve as success
                }
              }, 1000);
            } catch (clickErr) {
              console.error(`Click attempt ${attempts} failed:`, clickErr);
              if (attempts < maxAttempts) {
                setTimeout(tryClick, 200);
              } else {
                resolve(false);
              }
            }
          };
          
          // Start first attempt after a small delay
          setTimeout(tryClick, 100);
        } catch (err) {
          console.error('Download setup failed:', err);
          resolve(false);
        }
      });
    };

    const success = await attemptDownload();
    
    if (success) {
      onResult('success', 'Resume downloaded successfully! Check your Downloads folder.');
      return true;
    } else {
      // Final fallback: try data URI
      try {
        const dataUri = doc.output('datauristring');
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 1000);
        onResult('success', 'Resume download initiated. Check your Downloads folder.');
        return true;
      } catch (fallbackErr) {
        console.error('All download methods failed:', fallbackErr);
        onResult('error', 'Download failed. Please try a different browser or right-click and "Save as PDF".');
        return false;
      }
    }
  } catch (err) {
    console.error('PDF generation failed:', err);
    onResult('error', 'PDF generation failed: ' + (err.message || 'unknown error'));
    return false;
  }
};

// ============ RESUME MODAL ============
const ResumeModal = ({ isOpen, onClose, darkMode, showToast }) => {
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 300));
    await generateResumePDF((type, message) => {
      showToast(type, message);
      setDownloading(false);
      if (type === 'success') setTimeout(onClose, 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col`} role="dialog" aria-modal="true">
        <div className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold truncate">Resume Preview</h3>
              <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>Golu_Pandey_Resume.pdf</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`} aria-label="Close modal">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto min-h-0 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} p-3 sm:p-6`}>
          <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-3xl mx-auto p-6 sm:p-10 text-[11px] sm:text-sm leading-relaxed">
            <div className="border-b-2 border-orange-500 pb-4 mb-5">
              <h1 className="text-xl sm:text-3xl font-bold text-[#1e2139]">GOLU PANDEY</h1>
              <p className="text-orange-500 text-xs sm:text-sm mt-1">Frontend Developer  |  React.js & TypeScript</p>
            </div>
            <Section title="Info">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs sm:text-sm">
                <dt className="font-bold text-[#1e2139]">Address:</dt><dd className="text-gray-600">Aurangabad, Bihar</dd>
                <dt className="font-bold text-[#1e2139]">Phone:</dt><dd className="text-gray-600">+91 9939117874</dd>
                <dt className="font-bold text-[#1e2139]">Email:</dt><dd className="text-gray-600 break-all">golu.g.pandey@outlook.com</dd>
                <dt className="font-bold text-[#1e2139]">GitHub:</dt><dd className="text-gray-600 break-all">github.com/golu-kumarpandey</dd>
                <dt className="font-bold text-[#1e2139]">LinkedIn:</dt><dd className="text-gray-600 break-all">linkedin.com/in/golu-pandey</dd>
              </dl>
            </Section>
            <Section title="Skills">
              <div className="space-y-2 text-xs sm:text-sm">
                <SkillLine label="Frontend:" value="JavaScript, TypeScript, React.js, React Hooks, Redux Toolkit, React Router, HTML5, CSS3, Tailwind CSS, Bootstrap, Formik, Yup, responsive and mobile-first design, Figma-to-React"/>
                <SkillLine label="Backend & Data:" value="Node.js, Express.js, Python, MongoDB, SQLite, Sequelize (ORM), Mongoose (ODM)"/>
                <SkillLine label="APIs & Tools:" value="REST APIs, JWT, Socket.IO, Axios, Stripe, Cloudinary, Git, GitHub, Postman"/>
              </div>
            </Section>
            <Section title="Languages">
              <p className="text-xs sm:text-sm text-gray-700">Hindi (Fluent) &nbsp;|&nbsp; English (Intermediate) &nbsp;|&nbsp; Telugu (Basic)</p>
            </Section>
            <Section title="Profile">
              <p className="text-xs sm:text-sm text-gray-700">Frontend developer pursuing an MCA, with two internships building responsive React interfaces. Built full-stack commerce and messaging applications with REST APIs, JWT authentication and real-time updates. Interested in developing AI-powered web applications.</p>
            </Section>
            <Section title="Employment History">
              <Job title="Frontend Developer Intern, Young Mind" meta="Tirupati, Andhra Pradesh  |  Jul - Sep 2025" points={[
                'Built responsive React and TypeScript interfaces with reusable Tailwind CSS components, Redux Toolkit for shared state, and Formik and Yup for form validation.',
                'Protected routes with JWT authentication and authorization. Collaborated using Git and GitHub.',
              ]}/>
              <Job title="Frontend Developer Intern, Infasta Soft Solution" meta="Hyderabad, Telangana  |  Mar - Jun 2025" points={[
                'Developed interactive React and TypeScript components, managed state with Redux Toolkit and added JWT authentication to protected React Router routes.',
              ]}/>
            </Section>
            <Section title="Projects">
              <Project title="Multi-Vendor E-Commerce Platform" points={[
                'Built customer, vendor and admin dashboards with React, Redux Toolkit, Node.js, Express.js and MongoDB. Enforced role-based access with JWT and protected routes.',
                'Implemented listings, wish lists, carts, Stripe checkout, ratings and reviews. Added inventory tools, product banners and admin-to-vendor payment transfers.',
                'Connected customers, vendors and admins through Socket.IO chat and notifications. Built responsive Tailwind CSS screens, called REST APIs with Axios and handled image uploads with Cloudinary.',
              ]}/>
              <Project title="Real-Time Chat Application" points={[
                'Built one-to-one messaging with React, Node.js, Express.js and Socket.IO, including typing indicators, online status, offline status and incoming message notifications.',
                'Implemented authentication, session management and message deletion. Stored and retrieved chat history using backend APIs and MongoDB.',
              ]}/>
            </Section>
            <Section title="Education">
              <Edu title="Master of Computer Applications (MCA)" meta="2025 - 2027 (expected)" place="Indira Gandhi National Open University"/>
              <Edu title="Bachelor of Computer Applications (BCA)" meta="2020 - 2023" place="Magadh University, Bodh Gaya"/>
              <Edu title="Intermediate (12th) 2018-2020  |  Secondary (10th) 2017-2018" place="Bihar School Examination Board, Patna"/>
            </Section>
            <Section title="Achievements" last>
              <p className="text-xs sm:text-sm text-gray-700">Completed two frontend internships and built React applications that combine authenticated REST APIs with live messaging and notifications.</p>
            </Section>
          </div>
        </div>

        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0`}>
          <button onClick={onClose} disabled={downloading} className={`w-full sm:w-auto px-5 py-2.5 rounded-full font-medium transition-colors text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} disabled:opacity-60`}>Cancel</button>
          <button onClick={handleDownload} disabled={downloading} className="w-full sm:w-auto bg-orange-500 text-white px-5 sm:px-6 py-2.5 rounded-full font-medium hover:bg-orange-600 transition-colors inline-flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed">
            {downloading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                Generating PDF…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children, last }) => (
  <div className={`mb-4 ${last ? '' : 'pb-3'}`}>
    <h2 className="text-[#f97316] font-bold text-xs sm:text-sm uppercase tracking-wide mb-2 pb-1 border-b border-orange-100 inline-block pr-2">{title}</h2>
    <div className="mt-2">{children}</div>
  </div>
);
const SkillLine = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:gap-3">
    <span className="font-bold text-[#1e2139] sm:w-32 flex-shrink-0">{label}</span>
    <span className="text-gray-700">{value}</span>
  </div>
);
const Job = ({ title, meta, points }) => (
  <div className="mb-3">
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
      <h3 className="font-bold text-[#1e2139] text-sm">{title}</h3>
      <span className="text-xs text-gray-500">{meta}</span>
    </div>
    <ul className="mt-1.5 space-y-1 text-xs sm:text-sm text-gray-700">
      {points.map((p, i) => <li key={i} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-orange-500">{p}</li>)}
    </ul>
  </div>
);
const Project = ({ title, points }) => (
  <div className="mb-3">
    <h3 className="font-bold text-[#1e2139] text-sm">{title}</h3>
    <ul className="mt-1.5 space-y-1 text-xs sm:text-sm text-gray-700">
      {points.map((p, i) => <li key={i} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-orange-500">{p}</li>)}
    </ul>
  </div>
);
const Edu = ({ title, meta, place }) => (
  <div className="mb-2">
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
      <h3 className="font-bold text-[#1e2139] text-sm">{title}</h3>
      {meta && <span className="text-xs text-gray-500">{meta}</span>}
    </div>
    {place && <p className="text-xs sm:text-sm text-gray-700 pl-3">{place}</p>}
  </div>
);

// ============ NAVBAR (Fixed active section tracking) ============
const Navbar = ({ darkMode, setDarkMode, activeSection, onNavClick }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    { label: 'Home', section: 'home' },
    { label: 'About', section: 'resume' },
    { label: 'Service', section: 'service' },
    { label: 'Project', section: 'portfolio' },
    { label: 'Contact', section: 'contact' },
  ];
  
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e) => { if (!e.target.closest('nav')) setMobileOpen(false); };
    const handleEsc = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('click', handleClick); document.removeEventListener('keydown', handleEsc); };
  }, [mobileOpen]);

  return (
    <nav className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#1e2139] text-white'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] sm:text-xs">P</div>
            <span className="font-bold text-sm sm:text-base">Portfolio</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a key={item.label} href={`#${item.section}`} onClick={(e) => { e.preventDefault(); onNavClick(item.section); }}
                className={`px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSection === item.section ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                {item.label}
              </a>
            ))}
            <button onClick={() => setDarkMode(!darkMode)} className="ml-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center justify-center hover:scale-110 hover:rotate-12" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              <span className="text-sm leading-none" aria-hidden="true">{darkMode ? '☀️' : '🌙'}</span>
            </button>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center justify-center hover:scale-110 hover:rotate-12" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              <span className="text-sm leading-none" aria-hidden="true">{darkMode ? '☀️' : '🌙'}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setMobileOpen(!mobileOpen); }} className="w-9 h-9 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" aria-label="Toggle menu" aria-expanded={mobileOpen}>
              <svg className={`w-5 h-5 transition-transform duration-300 ${mobileOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>}
              </svg>
            </button>
          </div>
        </div>
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${mobileOpen ? 'max-h-96 opacity-100 pb-4 pt-2' : 'max-h-0 opacity-0'}`} style={{ borderTop: mobileOpen ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
          <div className={`flex flex-col gap-1 transition-all duration-300 ${mobileOpen ? 'translate-y-0' : '-translate-y-2'}`}>
            {navItems.map((item, i) => (
              <a key={item.label} href={`#${item.section}`}
                onClick={(e) => { e.preventDefault(); onNavClick(item.section); setMobileOpen(false); }}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeSection === item.section ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                style={{ transitionDelay: mobileOpen ? `${i * 50}ms` : '0ms', opacity: mobileOpen ? 1 : 0, transform: mobileOpen ? 'translateX(0)' : 'translateX(-10px)' }}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ darkMode, onOpenResume }) => {
  const r1 = useScrollReveal('left');
  const r2 = useScrollReveal('right');
  return (
    <section id="home" className={`${darkMode ? 'bg-gray-800' : 'bg-white'} scroll-mt-16 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          <div ref={r1.ref} style={r1.style} className={`${r1.className} order-2 lg:order-1 space-y-4 sm:space-y-6`}>
            <div>
              <p className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">Hello!</p>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'} leading-tight`}>
                I'm <span className="text-orange-500">Golu Pandey</span>,<br className="hidden sm:block"/>
                <span className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">Frontend Developer</span>
              </h1>
            </div>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4 sm:p-5 border-l-4 border-orange-500`}>
              <div className="text-orange-500 text-xl sm:text-2xl mb-1 sm:mb-2">"</div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-xs sm:text-sm leading-relaxed`}>
                Frontend developer pursuing an MCA, with two internships building responsive React interfaces. Built full-stack commerce and messaging applications with REST APIs, JWT authentication and real-time updates.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-1 sm:pt-2">
              <a href="#portfolio" onClick={(e) => { e.preventDefault(); document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' }); }} className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 text-sm sm:text-base">
                Portfolio
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </a>
              <button onClick={onOpenResume} className={`inline-flex items-center gap-2 border-2 ${darkMode ? 'border-white text-white hover:bg-white hover:text-gray-900' : 'border-[#1e2139] text-[#1e2139] hover:bg-[#1e2139] hover:text-white'} px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium transition-colors text-sm sm:text-base`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Download Resume
              </button>
            </div>
          </div>
          <div ref={r2.ref} style={r2.style} className={`${r2.className} order-1 lg:order-2 relative flex justify-center`}>
            <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 bg-orange-400 rounded-t-full"></div>
              <div className="relative z-10 w-40 h-52 sm:w-52 sm:h-72 lg:w-64 lg:h-80 xl:w-72 xl:h-96 mx-auto">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=face" alt="Golu Pandey" className="w-full h-full object-cover object-top rounded-t-full"/>
              </div>
              <div className={`absolute top-2 sm:top-4 right-0 sm:right-2 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg sm:rounded-xl shadow-xl p-2 sm:p-3 z-20`}>
                <div className="flex items-center gap-1 mb-0.5">
                  {[...Array(5)].map((_, i) => <svg key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                </div>
                <p className={`text-sm sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'}`}>6 Months</p>
                <p className="text-[9px] sm:text-xs text-gray-500">Experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Services = ({ darkMode }) => {
  const services = [
    { title: 'Frontend Development', description: 'Building responsive React and TypeScript interfaces with modern tools like Redux Toolkit and Tailwind CSS.' },
    { title: 'Full-Stack Development', description: 'Developing complete applications with Node.js, Express.js, MongoDB and REST APIs with JWT authentication.' },
    { title: 'UI/UX Implementation', description: 'Converting Figma designs to pixel-perfect React components with mobile-first responsive approach.' },
  ];
  const reveals = [useScrollReveal('left', 0), useScrollReveal('up', 100), useScrollReveal('right', 200)];
  return (
    <section id="service" className={`${darkMode ? 'bg-gray-900' : 'bg-[#1e2139]'} scroll-mt-16 text-white py-12 sm:py-16 lg:py-24 relative transition-colors duration-300`}>
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-block w-12 h-1 bg-orange-500 rounded-full mb-4"></div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">My <span className="text-orange-500">Services</span></h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {services.map((s, i) => (
            <div key={i} ref={reveals[i].ref} style={reveals[i].style} className={`${reveals[i].className} group bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2`}>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 relative h-32 sm:h-40 flex items-center justify-center">
                <div className="w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-lg shadow-lg p-2">
                  <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                  <div className="w-full h-8 sm:h-10 bg-orange-100 rounded mb-1"></div>
                  <div className="w-full h-1 bg-gray-200 rounded mb-1"></div>
                  <div className="w-full h-1 bg-gray-200 rounded"></div>
                </div>
                <div className="absolute bottom-2 right-2 w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{s.title}</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const WorkExperience = ({ darkMode }) => {
  const exps = [
    { company: 'Young Mind', period: 'Jul 2025 - Sep 2025', role: 'Frontend Developer Intern', description: 'Built responsive React and TypeScript interfaces with reusable Tailwind CSS components, Redux Toolkit for shared state, and Formik and Yup for form validation. Protected routes with JWT authentication.', side: 'left' },
    { company: 'Infasta Soft Solution', period: 'Mar 2025 - Jun 2025', role: 'Frontend Developer Intern', description: 'Developed interactive React and TypeScript components, managed state with Redux Toolkit and added JWT authentication to protected React Router routes.', side: 'right' },
    { company: 'MCA — IGNOU', period: '2025 - 2027 (expected)', role: 'Master of Computer Applications', description: 'Pursuing MCA from Indira Gandhi National Open University while building real-world projects with modern web technologies.', side: 'left' },
  ];
  const reveals = [useScrollReveal('left', 0), useScrollReveal('right', 120), useScrollReveal('left', 240)];
  return (
    <section id="resume" className={`${darkMode ? 'bg-gray-800' : 'bg-white'} scroll-mt-16 py-12 sm:py-16 lg:py-24 transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-block w-12 h-1 bg-orange-500 rounded-full mb-4"></div>
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'}`}>My Work <span className="text-orange-500">Experience</span></h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-10 sm:space-y-14">
            {exps.map((e, i) => (
              <div key={i} ref={reveals[i].ref} style={reveals[i].style} className={`${reveals[i].className} relative`}>
                <div className="absolute left-4 md:left-1/2 top-1.5 w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full border-2 sm:border-[3px] border-white shadow-lg z-10 -translate-x-1/2"></div>
                <div className="pl-10 md:pl-0 md:grid md:grid-cols-2 md:gap-8 lg:gap-12">
                  <div className={`${e.side === 'left' ? 'md:text-right md:pr-8' : 'md:text-left md:order-2 md:pl-8'} mb-2 md:mb-0`}>
                    <h3 className={`text-base sm:text-lg lg:text-xl font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'} mb-1 leading-tight`}>{e.company}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">{e.period}</p>
                  </div>
                  <div className={`${e.side === 'right' ? 'md:text-right md:pr-8 md:order-1' : 'md:text-left md:pl-8'}`}>
                    <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-orange-500 mb-1 sm:mb-2">{e.role}</h4>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-xs sm:text-sm leading-relaxed`}>{e.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const WhyHireMe = ({ darkMode, onOpenResume }) => {
  const r1 = useScrollReveal('left');
  const r2 = useScrollReveal('right');
  return (
    <section id="hire" className={`${darkMode ? 'bg-gray-700' : 'bg-[#e0f2fe]'} scroll-mt-16 py-12 sm:py-16 lg:py-24 relative transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div ref={r1.ref} style={r1.style} className={`${r1.className} flex justify-center lg:justify-start`}>
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop&crop=face" alt="Golu" className="w-full max-w-xs sm:max-w-sm lg:max-w-md mx-auto object-cover object-top rounded-3xl shadow-2xl" style={{ aspectRatio: '4/5' }}/>
          </div>
          <div ref={r2.ref} style={r2.style} className={`${r2.className} text-center lg:text-left`}>
            <div className="inline-block w-12 h-1 bg-orange-500 rounded-full mb-4"></div>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'} mb-4 sm:mb-6`}>Why <span className="text-orange-500">Hire me?</span></h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0">
              <div className="text-center lg:text-left"><p className={`text-3xl sm:text-4xl font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'}`}>2</p><p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Internships</p></div>
              <div className="text-center lg:text-left"><p className={`text-3xl sm:text-4xl font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'}`}>6<span className="text-xl sm:text-2xl">mo</span></p><p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Experience</p></div>
            </div>
            <button onClick={onOpenResume} className={`inline-flex items-center gap-2 ${darkMode ? 'bg-white text-gray-900 hover:bg-orange-500 hover:text-white' : 'bg-white text-[#1e2139] hover:bg-orange-500 hover:text-white'} px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium transition-colors shadow-lg text-sm sm:text-base`}>
              Download Resume
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const Portfolio = ({ darkMode, onOpenResume }) => {
  const [cat, setCat] = useState('All');
  const cats = ['All', 'Full-Stack', 'Frontend', 'Real-Time'];
  const projects = [
    { title: 'Multi-Vendor E-Commerce Platform', category: 'Full-Stack', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop', tech: ['React','Node.js','MongoDB','Stripe','Socket.IO'], github: GITHUB_URL },
    { title: 'Real-Time Chat Application', category: 'Real-Time', image: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=600&h=400&fit=crop', tech: ['React','Socket.IO','Node.js','MongoDB','JWT'], github: GITHUB_URL },
    { title: 'Portfolio Website', category: 'Frontend', image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&h=400&fit=crop', tech: ['React','Tailwind CSS','Responsive','Animations'], github: GITHUB_URL },
  ];
  const filtered = cat === 'All' ? projects : projects.filter(p => p.category === cat);
  const r1 = useScrollReveal('left', 0); const r2 = useScrollReveal('right', 140);
  return (
    <section id="portfolio" className={`${darkMode ? 'bg-gray-800' : 'bg-white'} scroll-mt-16 py-12 sm:py-16 lg:py-24 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
          <div ref={r1.ref} style={r1.style} className={r1.className}>
            <div className="inline-block w-12 h-1 bg-orange-500 rounded-full mb-4"></div>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'}`}>Lets have a look at<br/>my <span className="text-orange-500">Portfolio</span></h2>
          </div>
          <button onClick={onOpenResume} ref={r2.ref} style={r2.style} className={`${r2.className} bg-orange-500 text-white px-5 sm:px-6 py-2 rounded-full font-medium hover:bg-orange-600 transition-colors text-sm sm:text-base self-start sm:self-auto`}>Download Resume</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {filtered.map((p) => (
            <div key={p.title} className="group cursor-pointer bg-white dark:bg-gray-700 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <a href={p.github} target="_blank" rel="noopener noreferrer" className="block relative overflow-hidden" aria-label={`View ${p.title} on GitHub`}>
                <img src={p.image} alt={p.title} className="w-full h-48 sm:h-56 lg:h-64 object-cover group-hover:scale-105 transition-transform duration-500"/>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white text-gray-900 px-4 py-2.5 rounded-full inline-flex items-center gap-2 font-medium text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                    View on GitHub
                  </div>
                </div>
              </a>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`text-sm sm:text-base font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'}`}>{p.title}</h3>
                  <a href={p.github} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`flex-shrink-0 w-8 h-8 rounded-full ${darkMode ? 'bg-gray-600 hover:bg-orange-500' : 'bg-gray-100 hover:bg-orange-500 hover:text-white'} flex items-center justify-center transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} aria-label={`View ${p.title} source on GitHub`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                  </a>
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.tech.map(t => <span key={t} className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-orange-100 text-orange-700'}`}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${cat === c ? 'bg-orange-500 text-white' : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}`}>{c}</button>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials = ({ darkMode }) => {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const items = [
    { name: 'Young Mind Team', role: 'Internship Supervisor', text: 'Golu delivered exceptional React interfaces during his internship. His work with Redux Toolkit and Tailwind CSS was impressive and production-ready.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=youngmind' },
    { name: 'Infasta Soft Solution', role: 'Project Manager', text: 'Excellent frontend developer with strong TypeScript skills. Golu built interactive components and implemented JWT authentication seamlessly.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=infasta' },
    { name: 'MCA Professor', role: 'Academic Mentor', text: 'A dedicated student who combines academic learning with practical projects. His full-stack e-commerce and chat applications demonstrate real-world problem solving.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=professor' },
  ];
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setIdx(p => {
        const max = isMobile ? items.length - 1 : Math.max(0, items.length - 3);
        return p >= max ? 0 : p + 1;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [auto, isMobile, items.length]);
  const goTo = (i) => { setIdx(i); setAuto(false); setTimeout(() => setAuto(true), 8000); };
  const width = isMobile ? 100 : 100 / 3;
  return (
    <section className={`${darkMode ? 'bg-gray-900' : 'bg-[#1e2139]'} text-white py-12 sm:py-16 lg:py-24 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-block w-12 h-1 bg-orange-500 rounded-full mb-4"></div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">Testimonials that<br/>Speak to <span className="text-orange-500">My Results</span></h2>
        </div>
        <div className="relative">
          <button onClick={() => { const max = isMobile ? items.length - 1 : Math.max(0, items.length - 3); goTo(idx <= 0 ? max : idx - 1); }} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center shadow-lg" aria-label="Previous">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={() => { const max = isMobile ? items.length - 1 : Math.max(0, items.length - 3); goTo(idx >= max ? 0 : idx + 1); }} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center shadow-lg" aria-label="Next">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          <div className="overflow-hidden rounded-2xl px-2 sm:px-4">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * width}%)` }}>
              {items.map((t, i) => (
                <div key={i} className="flex-shrink-0 px-1 sm:px-2" style={{ width: `${width}%` }}>
                  <div className="relative bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 h-full">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                      <img src={t.avatar} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-700"/>
                      <div className="min-w-0"><h4 className="font-semibold text-sm sm:text-base truncate">{t.name}</h4><p className="text-[10px] sm:text-xs text-gray-400">{t.role}</p></div>
                    </div>
                    <div className="flex mb-3">{[...Array(5)].map((_, i) => <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}</div>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {items.map((_, i) => <button key={i} onClick={() => goTo(i)} className={`h-2 rounded-full transition-all ${i === idx ? 'bg-orange-500 w-6 sm:w-8' : 'bg-white/30 w-2'}`} aria-label={`Slide ${i+1}`}/>)}
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection = ({ darkMode }) => {
  const [email, setEmail] = useState('');
  const r = useScrollReveal('up');
  return (
    <section className={`${darkMode ? 'bg-gray-800' : 'bg-white'} py-12 sm:py-16 lg:py-24 transition-colors duration-300`}>
      <div ref={r.ref} style={r.style} className={`${r.className} max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 text-center`}>
        <h2 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'} mb-6 sm:mb-8`}>Have an Awesome Project<br/>Idea? <span className="text-orange-500">Let's Discuss</span></h2>
        <div className="max-w-xl mx-auto mb-6 sm:mb-8">
          <div className={`flex items-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full p-1.5 sm:p-2 shadow-lg`}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-full flex items-center justify-center ml-1 sm:ml-2 flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter Email Address" className={`flex-1 bg-transparent px-3 sm:px-4 py-2 text-xs sm:text-sm ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-700 placeholder-gray-400'} outline-none min-w-0`}/>
            <button className="bg-orange-500 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-medium hover:bg-orange-600 flex-shrink-0 text-xs sm:text-sm">Send</button>
          </div>
        </div>
      </div>
    </section>
  );
};

const Blog = ({ darkMode }) => {
  const posts = [
    { category: 'React', title: 'Building Multi-Vendor E-Commerce with React & Node.js', author: 'Golu Pandey', date: 'Sep 2025', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop', bg: 'bg-purple-500' },
    { category: 'Socket.IO', title: 'Real-Time Messaging: From Concept to Production', author: 'Golu Pandey', date: 'Jun 2025', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop', bg: 'bg-green-500' },
    { category: 'TypeScript', title: 'Type-Safe React Development with TypeScript', author: 'Golu Pandey', date: 'Mar 2025', image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&h=400&fit=crop', bg: 'bg-blue-500' },
  ];
  const reveals = [useScrollReveal('left', 0), useScrollReveal('up', 100), useScrollReveal('right', 200)];
  return (
    <section className={`${darkMode ? 'bg-gray-800' : 'bg-white'} py-12 sm:py-16 lg:py-24 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="inline-block w-12 h-1 bg-orange-500 rounded-full mb-4"></div>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'}`}>From my<br/><span className="text-orange-500">blog post</span></h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {posts.map((p, i) => (
            <div key={i} ref={reveals[i].ref} style={reveals[i].style} className={`${reveals[i].className} group cursor-pointer`}>
              <div className={`${p.bg} rounded-2xl p-4 sm:p-6 relative transition-transform duration-300 hover:-translate-y-2`}>
                <div className="bg-white rounded-xl p-3 shadow-lg"><img src={p.image} className="w-full h-32 sm:h-40 object-cover rounded-lg"/></div>
                <p className="text-white text-xs sm:text-sm font-medium mt-3">{p.category}</p>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 mb-1"><span>{p.author}</span><span>•</span><span>{p.date}</span></div>
                <h3 className={`text-sm sm:text-base lg:text-lg font-bold ${darkMode ? 'text-white' : 'text-[#1e2139]'}`}>{p.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = ({ darkMode }) => {
  return (
    <footer id="contact" className={`${darkMode ? 'bg-gray-900' : 'bg-[#1e2139]'} scroll-mt-16 text-white py-12 sm:py-16 lg:py-24 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">Lets Connect there</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] sm:text-xs">P</div>
              <span className="font-bold text-sm sm:text-base">Portfolio</span>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">Frontend Developer specializing in React, TypeScript and modern web technologies.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm sm:text-base">Navigation</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li><a href="#home" className="hover:text-orange-500">Home</a></li>
              <li><a href="#resume" className="hover:text-orange-500">About</a></li>
              <li><a href="#service" className="hover:text-orange-500">Services</a></li>
              <li><a href="#portfolio" className="hover:text-orange-500">Portfolio</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm sm:text-base">Contact</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li>+91 9939117874</li>
              <li className="break-all">golu.g.pandey@outlook.com</li>
              <li>Aurangabad, Bihar</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm sm:text-base">Links</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li><a href="https://github.com/golu-kumarpandey" target="_blank" rel="noreferrer" className="hover:text-orange-500 inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                GitHub
              </a></li>
              <li><a href="https://linkedin.com/in/golu-pandey" target="_blank" rel="noreferrer" className="hover:text-orange-500">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-400">
          <p>© 2025 Golu Pandey. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// ============ APP (Scroll-aware navigation) ============
function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [active, setActive] = useState('home');
  const [toast, setToast] = useState(null);
  const activeRef = useRef('home');

  useEffect(() => {
    const ids = ['home', 'resume', 'service', 'hire', 'portfolio', 'contact'];
    let ticking = false;

    const updateActiveSection = () => {
      const marker = window.scrollY + 120;
      let current = ids[0];
      ids.forEach(id => {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= marker) current = id;
      });
      if (activeRef.current !== current) {
        activeRef.current = current;
        setActive(current);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateActiveSection);
        ticking = true;
      }
    };

    updateActiveSection();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, []);

  const openResume = () => setResumeOpen(true);
  
  // Smooth scroll with active section update
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      // Immediately update active section when clicking nav
      setActive(id);
      activeRef.current = id;
      
      // Smooth scroll
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const showToast = (type, message) => setToast({ type, message, key: Date.now() });
  const hideToast = () => setToast(null);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300`}>
      <ScrollProgress />
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} activeSection={active} onNavClick={scrollTo}/>
      <Hero darkMode={darkMode} onOpenResume={openResume}/>
      <WorkExperience darkMode={darkMode}/>
      <Services darkMode={darkMode}/>
      <WhyHireMe darkMode={darkMode} onOpenResume={openResume}/>
      <Portfolio darkMode={darkMode} onOpenResume={openResume}/>
      <Testimonials darkMode={darkMode}/>
      <CTASection darkMode={darkMode}/>
      <Blog darkMode={darkMode}/>
      <Footer darkMode={darkMode}/>
      <ResumeModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} darkMode={darkMode} showToast={showToast}/>
      {toast && <Toast key={toast.key} type={toast.type} message={toast.message} onClose={hideToast}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
