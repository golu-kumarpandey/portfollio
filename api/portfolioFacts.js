const portfolioFacts = {
  profile: `Golu Pandey is a Frontend Developer pursuing an MCA, with two internships building responsive React interfaces. He built full-stack commerce and messaging applications with REST APIs, JWT authentication and real-time updates. He is interested in developing AI-powered web applications.`,
  skills: `Frontend: JavaScript, TypeScript, React.js, React Hooks, Redux Toolkit, React Router, HTML5, CSS3, Tailwind CSS, Bootstrap, Formik, Yup, responsive and mobile-first design, Figma-to-React. Backend & Data: Node.js, Express.js, Python, MongoDB, SQLite, Sequelize (ORM), Mongoose (ODM). APIs & Tools: REST APIs, JWT, Socket.IO, Axios, Stripe, Cloudinary, Git, GitHub, Postman.`,
  experience: `Frontend Developer Intern, Young Minds — Tirupati, Andhra Pradesh — Jul - Sep 2025. Built responsive React and TypeScript interfaces with reusable Tailwind CSS components, Redux Toolkit for shared state, and Formik and Yup for form validation. Protected routes with JWT authentication and authorization. Collaborated using Git and GitHub.
Frontend Developer Intern, Infasta Soft Solution — Hyderabad, Telangana — Mar - Jun 2025. Developed interactive React and TypeScript components, managed state with Redux Toolkit and added JWT authentication to protected React Router routes.`,
  projects: `Multi-Vendor E-Commerce Platform: Built customer, vendor and admin dashboards with React, Redux Toolkit, Node.js, Express.js and MongoDB. Enforced role-based access with JWT and protected routes. Implemented listings, wish lists, carts, Stripe checkout, ratings and reviews. Added inventory tools, product banners and admin-to-vendor payment transfers. Connected customers, vendors and admins through Socket.IO chat and notifications. Built responsive Tailwind CSS screens, called REST APIs with Axios and handled image uploads with Cloudinary.
Real-Time Chat Application: Built one-to-one messaging with React, Node.js, Express.js and Socket.IO, including typing indicators, online status, offline status and incoming message notifications. Implemented authentication, session management and message deletion. Stored and retrieved chat history using backend APIs and MongoDB.
Portfolio Website: React, Tailwind CSS, Responsive, Animations.`,
  education: `Master of Computer Applications (MCA), 2025 - 2027 (expected), Indira Gandhi National Open University. Bachelor of Computer Applications (BCA), 2020 - 2023, Magadh University, Bodh Gaya. Intermediate (12th) 2018-2020 and Secondary (10th) 2017-2018, Bihar School Examination Board, Patna.`,
  contact: `Email: golu.g.pandey@outlook.com. Phone: +91 9939117874. Location: Aurangabad, Bihar. GitHub: https://github.com/golu-kumarpandey. LinkedIn: https://linkedin.com/in/golu-pandey. WhatsApp: https://wa.me/918809658299. Résumé: https://golu-kumarpandey.github.io/portfollio/golu_aaply_resume.pdf.`
};

function selectFacts(message) {
  const text = message.toLowerCase();
  const sections = new Set();
  if (/contact|email|phone|call|reach|linkedin|github|whatsapp|resume|résumé|cv|download/.test(text)) sections.add('contact');
  if (/project|portfolio|react|commerce|chat|messag|socket|stripe|cloudinary|feature/.test(text)) sections.add('projects');
  if (/experience|intern|work|employ|company|young mind|infasta/.test(text)) sections.add('experience');
  if (/skill|technology|tech stack|know|tool|language/.test(text)) sections.add('skills');
  if (/education|degree|mca|bca|university|study|college|school/.test(text)) sections.add('education');
  if (/about|profile|background|who is/.test(text)) sections.add('profile');
  return [...sections].map((section) => `${section.toUpperCase()}\n${portfolioFacts[section]}`).join('\n\n');
}

module.exports = { portfolioFacts, selectFacts };
