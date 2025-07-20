export interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  tags: string[];
  code: string;
  thumbnail?: string;
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'blank',
    title: 'Blank HTML Page',
    description: 'Start with a clean HTML5 document',
    tags: ['html', 'css', 'starter'],
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My New Project</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Your New Project!</h1>
        <p>Start building something amazing. You can ask Claude AI to help you add features, styling, and functionality.</p>
    </div>
</body>
</html>`
  },
  {
    id: 'landing-page',
    title: 'Landing Page',
    description: 'Modern landing page with hero section',
    tags: ['html', 'css', 'landing', 'marketing'],
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Product - Make Life Better</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 100px 20px;
            text-align: center;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .hero-content {
            max-width: 600px;
        }
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 20px;
            font-weight: 700;
        }
        .hero p {
            font-size: 1.2rem;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        .cta-button {
            display: inline-block;
            background: white;
            color: #667eea;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: transform 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .features {
            padding: 80px 20px;
            background: #f8f9fa;
        }
        .features-grid {
            max-width: 1000px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        .feature {
            text-align: center;
            padding: 30px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .feature h3 {
            color: #667eea;
            margin-bottom: 15px;
        }
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <section class="hero">
        <div class="hero-content">
            <h1>Your Amazing Product</h1>
            <p>Transform your workflow with our revolutionary solution that saves you time and boosts productivity.</p>
            <a href="#features" class="cta-button">Get Started Today</a>
        </div>
    </section>

    <section class="features" id="features">
        <div class="features-grid">
            <div class="feature">
                <h3>Fast & Reliable</h3>
                <p>Built for speed and reliability with 99.9% uptime guarantee.</p>
            </div>
            <div class="feature">
                <h3>Easy to Use</h3>
                <p>Intuitive interface that anyone can master in minutes.</p>
            </div>
            <div class="feature">
                <h3>24/7 Support</h3>
                <p>Our team is always here to help you succeed.</p>
            </div>
        </div>
    </section>
</body>
</html>`
  },
  {
    id: 'portfolio',
    title: 'Personal Portfolio',
    description: 'Clean portfolio website template',
    tags: ['html', 'css', 'portfolio', 'personal'],
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>John Doe - Developer & Designer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 0 20px;
        }
        header {
            background: #2c3e50;
            color: white;
            padding: 2rem 0;
            text-align: center;
        }
        .profile-img {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: #3498db;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            font-weight: bold;
        }
        nav {
            background: #34495e;
            padding: 1rem 0;
        }
        nav ul {
            list-style: none;
            display: flex;
            justify-content: center;
            gap: 30px;
        }
        nav a {
            color: white;
            text-decoration: none;
            padding: 10px 15px;
            border-radius: 5px;
            transition: background 0.3s;
        }
        nav a:hover {
            background: #2c3e50;
        }
        section {
            padding: 60px 0;
        }
        .section-title {
            text-align: center;
            margin-bottom: 40px;
            color: #2c3e50;
            font-size: 2.5rem;
        }
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .skill {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }
        .project {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .project:hover {
            transform: translateY(-5px);
        }
        .project-image {
            height: 200px;
            background: linear-gradient(45deg, #3498db, #2ecc71);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
        }
        .project-content {
            padding: 20px;
        }
        footer {
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 40px 0;
        }
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
        }
        @media (max-width: 768px) {
            nav ul {
                flex-direction: column;
                gap: 10px;
            }
            .contact-info {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="profile-img">JD</div>
            <h1>John Doe</h1>
            <p>Full Stack Developer & UI/UX Designer</p>
        </div>
    </header>

    <nav>
        <div class="container">
            <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#skills">Skills</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <section id="about">
        <div class="container">
            <h2 class="section-title">About Me</h2>
            <p>I'm a passionate developer with 5+ years of experience creating beautiful and functional web applications. I love turning complex problems into simple, beautiful designs.</p>
        </div>
    </section>

    <section id="skills" style="background: #f8f9fa;">
        <div class="container">
            <h2 class="section-title">Skills</h2>
            <div class="skills-grid">
                <div class="skill">
                    <h3>Frontend</h3>
                    <p>React, Vue.js, HTML5, CSS3, JavaScript</p>
                </div>
                <div class="skill">
                    <h3>Backend</h3>
                    <p>Node.js, Python, PostgreSQL, MongoDB</p>
                </div>
                <div class="skill">
                    <h3>Design</h3>
                    <p>Figma, Adobe XD, UI/UX Design</p>
                </div>
            </div>
        </div>
    </section>

    <section id="projects">
        <div class="container">
            <h2 class="section-title">My Projects</h2>
            <div class="projects-grid">
                <div class="project">
                    <div class="project-image">E-commerce Platform</div>
                    <div class="project-content">
                        <h3>E-commerce Platform</h3>
                        <p>Full-stack e-commerce solution with React and Node.js</p>
                    </div>
                </div>
                <div class="project">
                    <div class="project-image">Task Management App</div>
                    <div class="project-content">
                        <h3>Task Management App</h3>
                        <p>Collaborative task management tool with real-time updates</p>
                    </div>
                </div>
                <div class="project">
                    <div class="project-image">Weather Dashboard</div>
                    <div class="project-content">
                        <h3>Weather Dashboard</h3>
                        <p>Beautiful weather app with forecasts and maps</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer id="contact">
        <div class="container">
            <h2>Let's Work Together</h2>
            <p>I'm always interested in new opportunities and projects.</p>
            <div class="contact-info">
                <div>📧 john.doe@email.com</div>
                <div>📱 (555) 123-4567</div>
                <div>🌐 linkedin.com/in/johndoe</div>
            </div>
        </div>
    </footer>
</body>
</html>`
  },
  {
    id: 'dashboard',
    title: 'Admin Dashboard',
    description: 'Modern admin dashboard layout',
    tags: ['html', 'css', 'dashboard', 'admin'],
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
        }
        .dashboard {
            display: flex;
            min-height: 100vh;
        }
        .sidebar {
            width: 250px;
            background: #2c3e50;
            color: white;
            padding: 20px 0;
        }
        .logo {
            text-align: center;
            padding: 20px;
            font-size: 1.5rem;
            font-weight: bold;
            border-bottom: 1px solid #34495e;
            margin-bottom: 20px;
        }
        .nav-item {
            padding: 15px 25px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .nav-item:hover {
            background: #34495e;
        }
        .main-content {
            flex: 1;
            padding: 30px;
        }
        .header {
            background: white;
            padding: 20px 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #3498db;
        }
        .stat-label {
            color: #7f8c8d;
            margin-top: 5px;
        }
        .chart-section {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .chart-placeholder {
            height: 300px;
            background: linear-gradient(45deg, #3498db, #2ecc71);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
        }
        .table-section {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .table-header {
            background: #f8f9fa;
            padding: 20px 30px;
            border-bottom: 1px solid #dee2e6;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 15px 30px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .status {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .status.active {
            background: #d4edda;
            color: #155724;
        }
        .status.pending {
            background: #fff3cd;
            color: #856404;
        }
        @media (max-width: 768px) {
            .dashboard {
                flex-direction: column;
            }
            .sidebar {
                width: 100%;
                height: auto;
            }
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="sidebar">
            <div class="logo">Dashboard</div>
            <div class="nav-item">📊 Overview</div>
            <div class="nav-item">👥 Users</div>
            <div class="nav-item">📈 Analytics</div>
            <div class="nav-item">💰 Revenue</div>
            <div class="nav-item">⚙️ Settings</div>
        </div>
        
        <div class="main-content">
            <div class="header">
                <h1>Dashboard Overview</h1>
                <div>Welcome back, Admin!</div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">2,543</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">$12,430</div>
                    <div class="stat-label">Revenue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">892</div>
                    <div class="stat-label">Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">99.2%</div>
                    <div class="stat-label">Uptime</div>
                </div>
            </div>
            
            <div class="chart-section">
                <h2 style="margin-bottom: 20px;">Monthly Revenue</h2>
                <div class="chart-placeholder">
                    Chart visualization would go here
                </div>
            </div>
            
            <div class="table-section">
                <div class="table-header">
                    <h2>Recent Orders</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>#1234</td>
                            <td>John Doe</td>
                            <td>$299.00</td>
                            <td><span class="status active">Active</span></td>
                            <td>2024-01-15</td>
                        </tr>
                        <tr>
                            <td>#1235</td>
                            <td>Jane Smith</td>
                            <td>$156.00</td>
                            <td><span class="status pending">Pending</span></td>
                            <td>2024-01-14</td>
                        </tr>
                        <tr>
                            <td>#1236</td>
                            <td>Mike Johnson</td>
                            <td>$89.00</td>
                            <td><span class="status active">Active</span></td>
                            <td>2024-01-13</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>`
  },
  {
    id: 'blog',
    title: 'Blog Template',
    description: 'Clean and minimal blog layout',
    tags: ['html', 'css', 'blog', 'content'],
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Blog - Thoughts & Ideas</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Georgia, 'Times New Roman', serif;
            line-height: 1.7;
            color: #333;
            background: #fafafa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
        }
        header {
            background: white;
            border-bottom: 1px solid #e0e0e0;
            padding: 30px 0;
            text-align: center;
        }
        .blog-title {
            font-size: 2.5rem;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        .blog-subtitle {
            color: #7f8c8d;
            font-style: italic;
        }
        nav {
            background: white;
            padding: 15px 0;
            border-bottom: 1px solid #e0e0e0;
            margin-bottom: 40px;
        }
        nav ul {
            list-style: none;
            display: flex;
            justify-content: center;
            gap: 30px;
        }
        nav a {
            color: #2c3e50;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
        }
        nav a:hover {
            color: #3498db;
        }
        main {
            padding: 40px 0;
        }
        .post {
            background: white;
            margin-bottom: 40px;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .post-header {
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .post-title {
            font-size: 1.8rem;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        .post-meta {
            color: #7f8c8d;
            font-size: 0.9rem;
            display: flex;
            gap: 20px;
        }
        .post-content p {
            margin-bottom: 20px;
        }
        .read-more {
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
        }
        .read-more:hover {
            text-decoration: underline;
        }
        .sidebar {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            margin-top: 40px;
        }
        .sidebar h3 {
            margin-bottom: 20px;
            color: #2c3e50;
        }
        .sidebar ul {
            list-style: none;
        }
        .sidebar li {
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .sidebar a {
            color: #7f8c8d;
            text-decoration: none;
        }
        .sidebar a:hover {
            color: #3498db;
        }
        footer {
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 40px 0;
            margin-top: 60px;
        }
        @media (max-width: 768px) {
            .blog-title {
                font-size: 2rem;
            }
            nav ul {
                flex-direction: column;
                gap: 15px;
            }
            .post {
                padding: 25px;
            }
            .post-meta {
                flex-direction: column;
                gap: 5px;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1 class="blog-title">My Blog</h1>
            <p class="blog-subtitle">Thoughts, ideas, and stories from my journey</p>
        </div>
    </header>

    <nav>
        <div class="container">
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#categories">Categories</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <main>
        <div class="container">
            <article class="post">
                <header class="post-header">
                    <h2 class="post-title">The Future of Web Development</h2>
                    <div class="post-meta">
                        <span>January 15, 2024</span>
                        <span>By John Doe</span>
                        <span>5 min read</span>
                    </div>
                </header>
                <div class="post-content">
                    <p>Web development has come a long way in the past decade. From simple static websites to complex, interactive applications, the landscape continues to evolve at a rapid pace.</p>
                    <p>In this post, I explore the emerging trends and technologies that are shaping the future of how we build for the web. From AI-powered development tools to new frameworks and paradigms...</p>
                    <a href="#" class="read-more">Continue reading →</a>
                </div>
            </article>

            <article class="post">
                <header class="post-header">
                    <h2 class="post-title">Building Better User Experiences</h2>
                    <div class="post-meta">
                        <span>January 10, 2024</span>
                        <span>By John Doe</span>
                        <span>3 min read</span>
                    </div>
                </header>
                <div class="post-content">
                    <p>User experience design is more than just making things look pretty. It's about understanding your users' needs, behaviors, and motivations to create meaningful digital experiences.</p>
                    <p>Here are some key principles I've learned from years of designing and developing user-centered applications...</p>
                    <a href="#" class="read-more">Continue reading →</a>
                </div>
            </article>

            <div class="sidebar">
                <h3>Popular Posts</h3>
                <ul>
                    <li><a href="#">Getting Started with React Hooks</a></li>
                    <li><a href="#">CSS Grid vs Flexbox: When to Use What</a></li>
                    <li><a href="#">The Complete Guide to Node.js</a></li>
                    <li><a href="#">Modern JavaScript ES6+ Features</a></li>
                </ul>

                <h3 style="margin-top: 40px;">Categories</h3>
                <ul>
                    <li><a href="#">Web Development (12)</a></li>
                    <li><a href="#">Design (8)</a></li>
                    <li><a href="#">JavaScript (15)</a></li>
                    <li><a href="#">Career (5)</a></li>
                </ul>
            </div>
        </div>
    </main>

    <footer>
        <div class="container">
            <p>&copy; 2024 My Blog. All rights reserved.</p>
            <p>Follow me on social media for updates</p>
        </div>
    </footer>
</body>
</html>`
  }
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return projectTemplates.find(template => template.id === id);
}

export function getRandomTemplate(): ProjectTemplate {
  const randomIndex = Math.floor(Math.random() * projectTemplates.length);
  return projectTemplates[randomIndex];
}