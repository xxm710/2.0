// Global Variables
let activeSection = 'cover';
let coverCanvas, coverCtx;

let coverParticles = [];
let mousePos = { x: -999, y: -999 };
let expansions = [];


// Flower cluster definitions for cover canvas - 17 clusters spread across full screen
const DEFS = [
    { fxf: 0.05, fyf: 0.08, rf: 0.12, k: 5 },
    { fxf: 0.25, fyf: 0.12, rf: 0.15, k: 6 },
    { fxf: 0.45, fyf: 0.08, rf: 0.13, k: 4 },
    { fxf: 0.65, fyf: 0.15, rf: 0.16, k: 7 },
    { fxf: 0.85, fyf: 0.10, rf: 0.14, k: 5 },
    { fxf: 0.10, fyf: 0.35, rf: 0.18, k: 8 },
    { fxf: 0.30, fyf: 0.40, rf: 0.20, k: 6 },
    { fxf: 0.50, fyf: 0.35, rf: 0.17, k: 5 },
    { fxf: 0.70, fyf: 0.45, rf: 0.19, k: 7 },
    { fxf: 0.90, fyf: 0.38, rf: 0.15, k: 6 },
    { fxf: 0.08, fyf: 0.65, rf: 0.16, k: 4 },
    { fxf: 0.22, fyf: 0.72, rf: 0.18, k: 8 },
    { fxf: 0.38, fyf: 0.68, rf: 0.14, k: 5 },
    { fxf: 0.58, fyf: 0.75, rf: 0.20, k: 6 },
    { fxf: 0.78, fyf: 0.70, rf: 0.17, k: 7 },
    { fxf: 0.95, fyf: 0.65, rf: 0.15, k: 5 },
    { fxf: 0.50, fyf: 0.92, rf: 0.18, k: 8 },
];

const INDIGO_PALETTE = [
    "#21486A", "#2e5e84", "#3a7299", "#4a8aae",
    "#6ba3c0", "#8fbfd4", "#b4d4e3", "#dce8ef",
    "#1a3a56", "#163048", "#c8dde8",
];

// Utility Functions
function randomColor() {
    return INDIGO_PALETTE[Math.floor(Math.random() * INDIGO_PALETTE.length)];
}

function rosePoint(k, theta, R) {
    const r = R * Math.cos(k * theta);
    return [r * Math.cos(theta), r * Math.sin(theta)];
}

function buildParticles(cluster, canvasW, canvasH, count) {
    const cx = cluster.fxf * canvasW;
    const cy = cluster.fyf * canvasH;
    const R = cluster.rf * Math.min(canvasW, canvasH);
    const particles = [];

    for (let i = 0; i < count; i++) {
        const isOutline = Math.random() > 0.30;
        let tx, ty;

        if (isOutline) {
            const theta = Math.random() * Math.PI * 2;
            const [px, py] = rosePoint(cluster.k, theta, R);
            tx = cx + px + (Math.random() - 0.5) * 6;
            ty = cy + py + (Math.random() - 0.5) * 6;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * R * 0.55;
            tx = cx + Math.cos(angle) * dist;
            ty = cy + Math.sin(angle) * dist;
        }

        const glow = Math.random() < 0.08;
        const r = glow ? 5 + Math.random() * 5 : 1.2 + Math.random() * 2.5;

        particles.push({
            x: tx + (Math.random() - 0.5) * canvasW * 0.3,
            y: ty + (Math.random() - 0.5) * canvasH * 0.3,
            tx,
            ty,
            vx: 0,
            vy: 0,
            r,
            color: randomColor(),
            alpha: 0.55 + Math.random() * 0.45,
            glow,
        });
    }
    return particles;
}

// Scroll Functions
function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        // 使用更精确的滚动方法，计算元素的绝对位置
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        
        window.scrollTo({
            top: absoluteElementTop,
            behavior: 'smooth'
        });
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initReturnButtons() {
    const returnButtons = document.querySelectorAll('[data-scroll-top]');

    returnButtons.forEach((button) => {
        button.addEventListener('click', () => {
            scrollToSection('cover');
        });
    });
}

function closeModal() {
    const modal = document.getElementById('pattern-modal');
    modal.style.display = 'none';
}

// Cover Canvas Animation
function initCoverCanvas() {
    coverCanvas = document.getElementById('cover-canvas');
    coverCtx = coverCanvas.getContext('2d');

    resizeCoverCanvas();
    window.addEventListener('resize', resizeCoverCanvas);

    coverCanvas.addEventListener('mousemove', handleCoverMouseMove);

    // Initialize expansion states
    expansions = DEFS.map(() => ({ scale: 1, target: 1 }));

    animateCoverCanvas();
}

function resizeCoverCanvas() {
    coverCanvas.width = window.innerWidth;
    coverCanvas.height = window.innerHeight;
    
    coverParticles = DEFS.map(def => {
        const count = 100 + Math.floor(Math.random() * 31);
        return buildParticles(def, coverCanvas.width, coverCanvas.height, count);
    });
}

function handleCoverMouseMove(e) {
    const rect = coverCanvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;

    // Expansion check
    DEFS.forEach((def, i) => {
        const cx = def.fxf * coverCanvas.width;
        const cy = def.fyf * coverCanvas.height;
        const R = def.rf * Math.min(coverCanvas.width, coverCanvas.height);
        const dx = mousePos.x - cx;
        const dy = mousePos.y - cy;
        expansions[i].target = Math.sqrt(dx * dx + dy * dy) < R * 1.3 ? 1.7 : 1;
    });
}

function animateCoverCanvas() {
    coverCtx.clearRect(0, 0, coverCanvas.width, coverCanvas.height);

    const REPEL_R = 80;
    const SPRING = 0.045;
    const DAMP = 0.82;
    const REPEL_STR = 3.5;

    coverParticles.forEach((cluster, ci) => {
        const exp = expansions[ci];
        exp.scale += (exp.target - exp.scale) * 0.06;
        const cxBase = DEFS[ci].fxf * coverCanvas.width;
        const cyBase = DEFS[ci].fyf * coverCanvas.height;

        cluster.forEach(p => {
            const stx = cxBase + (p.tx - cxBase) * exp.scale;
            const sty = cyBase + (p.ty - cyBase) * exp.scale;

            p.vx += (stx - p.x) * SPRING;
            p.vy += (sty - p.y) * SPRING;

            const dx = p.x - mousePos.x;
            const dy = p.y - mousePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < REPEL_R && dist > 0) {
                const force = (REPEL_R - dist) / REPEL_R;
                p.vx += (dx / dist) * force * REPEL_STR;
                p.vy += (dy / dist) * force * REPEL_STR;
            }

            p.vx *= DAMP;
            p.vy *= DAMP;
            p.x += p.vx;
            p.y += p.vy;

            coverCtx.save();
            coverCtx.globalAlpha = p.alpha;
            if (p.glow) {
                coverCtx.shadowColor = p.color;
                coverCtx.shadowBlur = 14;
            }
            coverCtx.beginPath();
            coverCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            coverCtx.fillStyle = p.color;
            coverCtx.fill();
            coverCtx.restore();
        });
    });

    requestAnimationFrame(animateCoverCanvas);
}

// Intersection Observer for Animations
function initAnimations() {
    const animateElements = document.querySelectorAll('.animate-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    animateElements.forEach(el => observer.observe(el));
}

function initPrintingText() {
    const printingElements = document.querySelectorAll('.printing-text');

    printingElements.forEach((element) => {
        if (element.dataset.processed === 'true') return;

        const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text) return;

        const delayOffset = Number.parseFloat(element.dataset.delayOffset || '0');
        const words = text.split(' ');
        const fragment = document.createDocumentFragment();

        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.className = 'printing-word';
            span.textContent = word;
            span.style.setProperty('--word-delay', `${delayOffset + index * 0.05}s`);
            fragment.appendChild(span);
        });

        element.textContent = '';
        element.appendChild(fragment);
        element.dataset.processed = 'true';
    });
}

// Sidebar Navigation Observer
function initSidebarObserver() {
    const sections = ['cover', 'intro', 'chapter1', 'chapter2', 'chapter3', 'artwork', 'conclusion', 'references'];
    const sidebar = document.getElementById('sidebar-nav');
    const navButtons = document.querySelectorAll('.sidebar-nav-links button');

    // 初始状态：强制隐藏导航栏
    sidebar.classList.add('hidden');

    const observer = new IntersectionObserver((entries) => {
        let best = null;
        for (const e of entries) {
            if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) {
                best = e;
            }
        }
        if (best) {
            activeSection = best.target.id;
            updateActiveNav();
            
            // Show/hide sidebar - 使用更严格的判断
            if (activeSection === 'cover' && best.intersectionRatio > 0.5) {
                sidebar.classList.add('hidden');
            } else if (activeSection !== 'cover') {
                sidebar.classList.remove('hidden');
            }
        }
    }, { threshold: [0.2, 0.5, 0.7] });

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

function updateActiveNav() {
    const navButtons = document.querySelectorAll('.sidebar-nav-links button');
    navButtons.forEach(btn => {
        const section = btn.dataset.section;
        const dot = btn.querySelector('.nav-dot');
        if (section === activeSection) {
            btn.classList.add('active');
            dot.textContent = '●';
        } else {
            btn.classList.remove('active');
            dot.textContent = '○';
        }
    });
}

// Highlight Text Animation
function initHighlightText() {
    const culturalMurder1 = document.getElementById('cultural-murder-1');
    const culturalMurder2 = document.getElementById('cultural-murder-2');

    const observer1 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                culturalMurder1.style.animation = 'pulse-text 0.5s ease-in-out';
                setTimeout(() => {
                    culturalMurder1.style.animation = '';
                }, 500);
            }
        });
    }, { threshold: 0.6 });

    observer1.observe(culturalMurder1);

    const observer2 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                culturalMurder2.style.animation = 'pulse-text 0.6s ease-in-out infinite';
                culturalMurder2.style.animationDelay = '2.9s';
            } else {
                culturalMurder2.style.animation = '';
            }
        });
    }, { threshold: 0.8 });

    observer2.observe(culturalMurder2);
}

// Modal Close on Overlay Click
function initModalClose() {
    const modal = document.getElementById('pattern-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Carousel Functions
let carousels = [];
let autoSlideIntervals = [];

function initCarousels() {
    const wrappers = document.querySelectorAll('.carousel-wrapper');

    wrappers.forEach((wrapper, index) => {
        const images = wrapper.querySelectorAll('img');
        const dotsContainer = wrapper.parentElement.querySelector('.carousel-dots');
        const imageNameContainer = wrapper.parentElement.querySelector('.carousel-image-name');

        // Create dots
        images.forEach((img, i) => {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => goToSlide(index, i);
            dotsContainer.appendChild(dot);
        });

        // Initialize state
        carousels[index] = {
            wrapper: wrapper,
            images: images,
            dots: dotsContainer.querySelectorAll('.carousel-dot'),
            imageNameContainer: imageNameContainer,
            currentIndex: 0
        };

        // Set first image active
        images[0].classList.add('active');

        // Show first image name
        updateImageName(index);

        // Start auto-sliding
        startAutoSlide(index);
    });
}

function updateImageName(carouselIndex) {
    const carousel = carousels[carouselIndex];
    if (!carousel || !carousel.imageNameContainer) return;

    const currentImage = carousel.images[carousel.currentIndex];
    const imageName = currentImage.getAttribute('data-name');

    // Remove file extension
    let displayName = imageName || '';
    if (displayName) {
        // Remove .png, .jpg, .jpeg, etc.
        displayName = displayName.replace(/\.(png|jpg|jpeg|gif|bmp|webp)$/i, '');
    }

    carousel.imageNameContainer.textContent = displayName;
}

function goToSlide(carouselIndex, slideIndex) {
    const carousel = carousels[carouselIndex];
    if (!carousel) return;

    carousel.images[carousel.currentIndex].classList.remove('active');
    carousel.dots[carousel.currentIndex].classList.remove('active');

    carousel.currentIndex = slideIndex;
    carousel.images[carousel.currentIndex].classList.add('active');
    carousel.dots[carousel.currentIndex].classList.add('active');

    // Update image name
    updateImageName(carouselIndex);
}

function nextSlide(carouselIndex) {
    const carousel = carousels[carouselIndex];
    if (!carousel) return;

    const nextIndex = (carousel.currentIndex + 1) % carousel.images.length;
    goToSlide(carouselIndex, nextIndex);

    // Reset auto-slide timer
    resetAutoSlide(carouselIndex);
}

function prevSlide(carouselIndex) {
    const carousel = carousels[carouselIndex];
    if (!carousel) return;

    const prevIndex = (carousel.currentIndex - 1 + carousel.images.length) % carousel.images.length;
    goToSlide(carouselIndex, prevIndex);

    // Reset auto-slide timer
    resetAutoSlide(carouselIndex);
}

function startAutoSlide(carouselIndex) {
    // Clear existing interval if any
    if (autoSlideIntervals[carouselIndex]) {
        clearInterval(autoSlideIntervals[carouselIndex]);
    }

    // Start new interval - 3 seconds per slide
    autoSlideIntervals[carouselIndex] = setInterval(() => {
        nextSlide(carouselIndex);
    }, 3000);
}

function resetAutoSlide(carouselIndex) {
    // Stop current auto-slide
    if (autoSlideIntervals[carouselIndex]) {
        clearInterval(autoSlideIntervals[carouselIndex]);
    }

    // Restart after user interaction
    setTimeout(() => {
        startAutoSlide(carouselIndex);
    }, 5000); // Wait 5 seconds before resuming auto-slide
}

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
    initCoverCanvas();
    initPrintingText();
    initAnimations();
    initSidebarObserver();
    initHighlightText();
    initModalClose();
    initCarousels();
    initReturnButtons();
});
