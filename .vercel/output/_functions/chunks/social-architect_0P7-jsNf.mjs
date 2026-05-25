function render({ slots: ___SLOTS___ }) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <script src="/script/meta-logic.js" is:inline></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Social Architect | LinkedIn & X Mobile Hook Formatter | Emmy STACK01</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">

    <meta name="title" content="Social Architect | LinkedIn & X Mobile Hook Formatter">
    <meta name="description" content="Stop the scroll with Social Architect. Preview and optimize your social media hooks for mobile. Toggle between Corporate and Chaos modes for high-performance content.">
    <meta name="keywords" content="social media hook generator, mobile post previewer, LinkedIn hook formatter, X thread preview, content optimization tool, Emmy STACK01, digital marketing tools Nigeria">
    <link rel="canonical" href="https://emmystack01.com/tools/social-architect">
    <meta name="robots" content="index, follow">
    <meta name="author" content="Emmy STACK01">
    <meta name="theme-color" content="#10b981"> <meta property="og:type" content="website">
    <meta property="og:url" content="https://emmystack01.com/tools/social-architect">
    <meta property="og:title" content="Social Architect | Preview & Optimize Your Hooks">
    <meta property="og:description" content="Stop the scroll. Use our mobile previewer to see exactly where your LinkedIn and X posts get cut off.">
    <meta property="og:image" content="https://emmystack01.com/asset/social-architect-og.jpg"> 
    <meta property="og:site_name" content="Social Architect by Emmy STACK01">

    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://emmystack01.com/tools/social-architect">
    <meta property="twitter:title" content="Social Architect | Stop the Scroll">
    <meta property="twitter:description" content="Precision hook formatting and mobile preview tool for high-performance creators.">
    <meta property="twitter:image" content="https://emmystack01.com/asset/social-architect-og.jpg">

    <link rel="apple-touch-icon" sizes="180x180" href="https://emmystack01.com/favicon_io/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://emmystack01.com/favicon_io/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://emmystack01.com/favicon_io/favicon-16x16.png">
    <link rel="manifest" href="https://emmystack01.com/favicon_io/site.webmanifest">

    
    <style>
        :root {
            --emmy-green: #10b981;
            --zinc-900: #18181b;
            
            /* Light Theme Defaults */
            --bg-main: #f4f4f5;
            --card-bg: #ffffff;
            --text-main: #18181b;
            --border: #e4e4e7;
            --glass-bg: rgba(255, 255, 255, 0.8);
        }

        .dark-mode {
            --bg-main: #09090b;
            --card-bg: #111113;
            --text-main: #f4f4f5;
            --border: #27272a;
            --glass-bg: rgba(17, 17, 19, 0.8);
        }

        body {
            background-color: var(--bg-main);
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            transition: background 0.3s ease;
            margin: 0;
            padding-bottom: 50px;
        }

        .container { 
            max-width: 1100px; 
            margin: auto; 
            padding: 20px;
        }

        /* HEADER & NAV */
        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
        }

        .nav-wrapper {
            display: flex;
            align-items: center;
            position: relative;
            padding: 10px;
        }

        .back-circle {
            width: 35px;
            height: 35px;
            background: linear-gradient(90deg, hsla(160, 84%, 39%), hsla(215, 60%, 44%));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: inherit;
            font-size: 1.2rem;
            z-index: 2; /* Sits on top */
            border: 5px solid var(--bg-main); /* Matches your page background to create the 'cut' */
            margin-right: -25px; /* This creates the overlap effect */
            transition: 0.3s ease;
        }

        .pill-nav {
            display: flex;
            align-items: center;
            padding: 8px 20px 8px 25px; /* Extra left padding to account for the overlap */
            gap: 10px;
            background: linear-gradient(90deg, hsla(160, 84%, 39%, 0.667), hsla(215, 60%, 44%, 0.567));
            border-radius: 50px;
            border: 1px solid var(--emmy-green);
            z-index: 1;
            backdrop-filter: blur(10px); /* Glassmorphism touch */
        }

        .nav-title {
            font-weight: 700;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
            color: inherit;
        }

        /* Hover effect to make it feel premium */
        .back-circle:hover {
            transform: translateX(-3px);
            filter: brightness(1.2);
            border-right: 6px solid var(--bg-main);
        }


        /* THEME TOGGLE */
        .theme-switch {
            cursor: pointer;
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--card-bg);
            border: 1px solid var(--border);
            color: var(--text-main);
        }

        /* DASHBOARD LAYOUT */
        .main-content {
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 40px;
            align-items: start;
        }

        @media (max-width: 900px) {
            .main-content { grid-template-columns: 1fr; }
            .phone-column { order: -1; }
        }

        /* INPUT AREA */
        .editor-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            padding: 24px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        textarea {
            width: 100%;
            height: 250px;
            background: transparent;
            color: var(--text-main);
            border: none;
            outline: none;
            font-size: 1rem;
            resize: none;
            font-family: inherit;
        }

        .tone-bar {
            display: flex;
            gap: 12px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
        }

        .btn {
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s;
            border: 1px solid var(--border);
            background: var(--bg-main);
            color: var(--text-main);
        }

        .btn-active { background: linear-gradient(90deg, hsla(160, 84%, 39%, 0.867), hsla(215, 60%, 44%, 0.767)); color: white; border-color: var(--emmy-green); }

        h1{
            font-size: clamp(1.8rem, 5vw, 2.5rem);
            font-family: 'JetBrains Mono';
        }

        /* PHONE PREVIEW (Sticky) */
        .phone-column {
            position: sticky;
            top: 20px;
            z-index: 10;
        }

        .phone-shell {
            width: 300px;
            height: 580px;
            border: 12px solid #1f2937;
            border-radius: 3rem;
            background: #1f2937;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
        }

        .notch {
            position: absolute;
            top: 0; left: 50%;
            transform: translateX(-50%);
            width: 120px; height: 18px;
            background: #1f2937;
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
            z-index: 10;
        }

        .screen {
            height: 100%;
            padding: 20px;
            padding-top: 40px;
            background: white;
            color: #111;
            overflow-y: auto;
            transition: 0.3s;
        }

        #previewText{
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            width: 100%;
        }

        .dark-mode .screen { background: #0D1117; color: #e5e7eb; }

        .cutoff {
            position: absolute;
            top: 220px; /* The "Hook" limit */
            left: 0;
            right: 0;
            border-top: 1px dashed rgba(255, 71, 87, 0.5);
            display: flex;
            justify-content: center;
            pointer-events: none;
        }

        .cutoff-label {
            position: absolute;
            right: 0; top: -12px;
            background: #ef4444; color: white;
            font-size: 9px; padding: 2px 6px; border-radius: 4px;
        }


        #phoneScreen {
            height: 100%;             /* Fills the phone shell */
            overflow-y: auto;         /* Enables vertical scrolling */
            overflow-x: hidden;       /* Prevents side-to-side wiggling */
            padding: 20px;            /* Gives the text breathing room */
            scrollbar-gutter: stable; /* Prevents the layout from jumping when bar appears */
        }

        /* Custom Scrollbar Styling (The "Emmy STACK" Look) */
        #phoneScreen::-webkit-scrollbar {
            width: 5px;               /* Keeps it very slim */
        }

        #phoneScreen::-webkit-scrollbar-track {
            background: transparent;  /* Keeps the background clean */
            margin: 10px 0;           /* Stops the bar from hitting the notch or bottom curve */
        }

        #phoneScreen::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2); /* Subtle white for Dark Mode */
            border-radius: 10px;      /* Makes it rounded */
        }

        #phoneScreen::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.322); /* Changes color when you hover over it */
        }


        /* COPY BUTTON */
        .copy-btn {
            width: 100%;
            margin-top: 20px;
            padding: 14px;
            background: var(--text-main);
            color: var(--bg-main);
            border-radius: 12px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            border: none;
            transition: 0.3s;
        }

        .copy-btn.copied { background: var(--emmy-green); color: white; }
       

        /* FOOTER */
        footer {
            text-align: center;
            margin-top: 60px;
            color: #71717a;
        }
        
        .p {
            position: relative;
            text-decoration: none;
            color: var(--text);
        }

        .p::after {
            content: "";
            position: absolute;
            left: 0;
            bottom: -2px;
            width: 0%;
            height: 2px;
            background: linear-gradient(90deg, #10b981, #3b82f6);
            transition: width 0.3s ease;
        }

        .p:hover {
            color: #10b981;
        }

        .p:hover::after {
            width: 100%;
        }

        

        .socials { display: flex; justify-content: center; gap: 20px; }
        .socials a {
            text-decoration: none;
            display: flex; justify-content: center; align-items: center;
            width: 45px; height: 45px;
            background: linear-gradient(90deg, hsla(160, 84%, 39%, 0.867), hsla(215, 60%, 44%, 0.767));
            border: 1px solid var(--glass-border);
            border-radius: 50%;
            color: white;
            transition: 0.3s;
        }

        .socials a:hover {
            transform: translateY(-3px);
        }
        

        /* MOBILE: Stack them and remove sticky to prevent overlapping */
        @media (max-width: 900px) {
            .container { 
                max-width: 1100px; 
                margin: auto; 
                padding: 10px; /* Reduced from 20px for mobile */
                width: 100%;
                box-sizing: border-box;
            }

            /* The Grid Logic */
            .main-content {
                display: flex;
                flex-direction: column;
                gap: 15px; /* Tighten gap for mobile */
            }

            .editor-column {
                order: 1; /* Editor comes first so you can type */
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .editor-card {
                background: var(--card-bg);
                border: 1px solid var(--border);
                padding: 20px;
                border-radius: 12px;
                width: 100%; /* Ensure it fills the screen */
                box-sizing: border-box;
            }

            textarea {
                width: 100%;
                min-height: 200px;
            }

            .phone-column {
                order: 2; /* Phone comes after */
                position: relative; /* NO STICKY HERE */
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .phone-shell {
                transform: scale(0.8); /* Slight shrink to fit mobile screens better */
                margin-top: -20px;
            }
            
            .copy-btn {
                position: sticky;
                bottom: 15px;
                z-index: 100;
                box-shadow: 0 -5px 15px rgba(0,0,0,0.2);
            }

        }

        @media (max-width: 600px) {
            .phone-shell {
                transform: scale(0.75); /* Shrinks the phone so it fits mobile screens better */
                margin-top: -20px;
            }
            .nav-wrapper { transform: scale(0.9); transform-origin: left; }
        }
    </style>
</head>
<body> 
    <div class="container">
        <nav>
            <div class="nav-wrapper">
                <a href="/" class="back-circle">
                    <i class="ri-arrow-left-line"></i>
                </a>
                <div class="pill-nav">
                    <img src="/asset/emmy-stack01-logo.png" alt="Logo" height="18">
                    <span class="nav-title">SOCIAL ARCHITECT</span>
                </div>
            </div>
            
            <button class="theme-switch" onclick="toggleTheme()" id="themeBtn">
                <i class="ri-sun-line"></i>
            </button>
        </nav>
        <header>
            <h1>Social Media Hook Formatter and Mobile Preview Tool</h1>
            <div class="nav-title" style="display:none;" aria-hidden="true">SOCIAL ARCHITECT</div>
        </header>
        <main class="main-content">
            <section class="editor-column">
                <div class="editor-card">
                    <textarea id="userInput" placeholder="Paste your raw thoughts or a long paragraph here..."></textarea>
                    
                    <div class="tone-bar">
                        <button onclick="updateTone('corporate', this)" class="btn btn-active" id="btnCorp"><i class="ri-briefcase-4-line"></i> <span>Corporate</span></button>
                        <button onclick="updateTone('chaos', this)" class="btn" id="btnChaos"><i class="ri-flashlight-line"></i> <span>Chaos</span></button>
                    </div>
                </div>

                <div id="vibeDisplay" style="margin-top: 20px; padding: 15px; border-radius: 12px; background: var(--border); font-size: 0.85rem; opacity: 0.8;">
                    Vibe Check: Ready for input.
                </div>
            </section>

            <section class="phone-column">
                <div class="phone-shell">
                    <div class="notch"></div>
                    <div class="screen" id="phoneScreen">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; opacity: 0.3;">
                            <div style="width: 30px; height: 30px; border-radius: 50%; background: currentColor;"></div>
                            <div style="width: 80px; height: 8px; border-radius: 4px; background: currentColor;"></div>
                        </div>
                        <div class="content">
                            <p id="previewText">Your optimized post will appear here in real-time...</p>
                        </div>
                        <div class="cutoff">
                            <span class="cutoff-label">SEE MORE CUTOFF</span>
                        </div>
                    </div>
                </div>

                <button class="copy-btn" id="copyBtn">
                    <i class="ri-file-copy-line"></i>
                    <span class="btn-text">Copy for Mobile</span>
                </button>
            </section>
        </main>

        <footer>
            <p>Built by <a class="p" href="https://emmystack01.com/">Emmy STACK01</a></p>
            <div class="socials">
                <a href="https://x.com/Emmy_STACK01"><i class="ri-twitter-x-line"></i></a>
                <a href="https://wa.me/2349076991076"><i class="ri-whatsapp-fill"></i></a>
            </div>
        </footer>
    </div>

    <script is:inline>
        // --- LOGIC ENGINE ---
        const lexicons = {
            corporate: ['strategy', 'launch', 'result', 'optimized', 'professional', 'performance', 'identity', 'integrated', 'revenue', 'growth'],
            chaos: ['insane', 'stop', 'warning', 'boring', 'mid', 'future', 'fast', 'killer', 'game-changer', 'unlimited']
        };

        const cruncher = {
            fillers: /\\b(actually|really|basically|just|very|literally|think|maybe|sort of|kind of)\\b/gi,
            process(text, tone) {
                let clean = text.replace(this.fillers, '').replace(/[ \\t]+/g, ' ').trim();
                return tone === 'chaos' ? this.applyChaos(clean) : this.applyCorporate(clean);
            },
            applyChaos(text) {
                return text.split(/[.!?]+\\s/).map((s, i) => i === 0 ? \`⚡ \${s.toUpperCase()}!\` : s).join('\\n\\n');
            },
            applyCorporate(text) {
                let s = text.split(/[.!?]+\\s/);
                if (s.length <= 1) return text;
                return \`\${s.shift()}\\n\\n\${s.map(line => \`• \${line}\`).join('\\n')}\`;
            }
        };

        // --- UI HANDLERS ---
        const inputArea = document.getElementById('userInput');
        const previewText = document.getElementById('previewText');
        const vibeDisplay = document.getElementById('vibeDisplay');
        let currentTone = 'corporate';

        function updateVibeAnalysis(text) {
            const words = text.toLowerCase().split(/\\s+/);
            let corpScore = 0;
            let chaosScore = 0;

            words.forEach(word => {
                if (lexicons.corporate.includes(word)) corpScore++;
                if (lexicons.chaos.includes(word)) chaosScore++;
            });

            // Match the icons exactly as they are in the HTML
            const briefcase = document.querySelector('.ri-briefcase-4-line');
            const lightning = document.querySelector('.ri-flashlight-line');

            // Reset styles safely
            [briefcase, lightning].forEach(icon => {
                if (icon) {
                    icon.style.color = "inherit";
                    icon.style.transform = "scale(1)";
                    icon.style.filter = "none";
                }
            });

            // Apply Active State with a 'Glow'
            if (corpScore > chaosScore && briefcase) {
                briefcase.style.color = "#00ff88";
                briefcase.style.transform = "scale(1.4)";
                briefcase.style.filter = "drop-shadow(0 0 8px #00ff88)";
            } else if (chaosScore > corpScore && lightning) {
                lightning.style.color = "#ff4757";
                lightning.style.transform = "scale(1.4)";
                lightning.style.filter = "drop-shadow(0 0 8px #ff4757)";
            }
        }

        function updateTone(tone, btn) {
            currentTone = tone;
            document.querySelectorAll('.btn').forEach(b => b.classList.remove('btn-active'));
            btn.classList.add('btn-active');
            render();
        }

        function toggleTheme() {
            const isDark = document.body.classList.toggle('dark-mode');
            
            // Save the preference: 'enabled' or 'disabled'
            localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
            
            document.getElementById('themeBtn').innerHTML = isDark ? 
                '<i class="ri-sun-line"></i>' : 
                '<i class="ri-moon-line"></i>';
        }

        function render() {
            const val = inputArea.value;
            if (!val) {
                previewText.textContent = "Your optimized post will appear here in real-time...";
                return;
            }
            
            const result = cruncher.process(val, currentTone);
            previewText.textContent = result;
            window.lastResult = result;
            
            // Run sentiment check
            updateVibeAnalysis(val);
            
            // Length Vibe logic
            vibeDisplay.innerHTML = val.length > 280 ? 
                "⚠️ Length: High (Thread mode recommended)" : 
                "✅ Length: Mobile optimized";
        }

        inputArea.addEventListener('input', render);

        // --- COPY LOGIC ---
        document.getElementById('copyBtn').addEventListener('click', function() {
            const txt = window.lastResult || inputArea.value;
            navigator.clipboard.writeText(txt);
            
            this.classList.add('copied');
            this.innerHTML = '<i class="ri-check-line"></i> Copied!';
            
            setTimeout(() => {
                this.classList.remove('copied');
                this.innerHTML = '<i class="ri-file-copy-line"></i> Copy for Mobile';
            }, 2000);
        });

        // --- INITIALIZE THEME ON LOAD ---
        const savedTheme = localStorage.getItem('darkMode');

        if (savedTheme === 'enabled') {
            document.body.classList.add('dark-mode');
            document.getElementById('themeBtn').innerHTML = '<i class="ri-sun-line"></i>';
        }
    </script>
</body>
</html>`
	}
render["astro:html"] = true;

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: render
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
