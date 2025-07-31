// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Header background on scroll
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(15, 23, 42, 0.98)';
        header.style.boxShadow = '0 2px 20px rgba(255, 107, 53, 0.2)';
    } else {
        header.style.background = 'rgba(15, 23, 42, 0.95)';
        header.style.boxShadow = 'none';
    }
});

// Mobile menu toggle
const mobileMenuBtn = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = '#0f172a';
        navLinks.style.flexDirection = 'column';
        navLinks.style.padding = '1rem';
        navLinks.style.boxShadow = '0 2px 10px rgba(255,107,53,0.2)';
        navLinks.style.border = '1px solid rgba(255,107,53,0.1)';
    });
}

// Form submission
document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const budget = formData.get('budget');
    const message = formData.get('message');
    
    const whatsappMessage = `Olá Sergio! Meu nome é ${name}.

📧 Email: ${email}
📱 WhatsApp: ${phone}
💰 Orçamento: ${budget}

Mensagem: ${message}

Gostaria de saber mais sobre seus serviços de gestão de tráfego pago.`;
    
    const whatsappUrl = `https://wa.me/5511984969596?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
});

// Counter animation for stats
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = counter.innerText;
        const numericTarget = parseInt(target.replace(/[^\d]/g, ''));
        let current = 0;
        const increment = numericTarget / 50;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= numericTarget) {
                counter.innerText = target;
                clearInterval(timer);
            } else {
                if (target.includes('%')) {
                    counter.innerText = Math.floor(current) + '%';
                } else if (target.includes('R$')) {
                    counter.innerText = 'R$ ' + Math.floor(current / 1000000) + 'M+';
                } else {
                    counter.innerText = Math.floor(current) + (target.includes('+') ? '+' : '');
                }
            }
        }, 50);
    });
}

// Trigger counter animation when stats section is visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target);
        }
    });
});

const statsSection = document.querySelector('.stats');
if (statsSection) {
    observer.observe(statsSection);
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav') && navLinks && navLinks.style.display === 'flex') {
        navLinks.style.display = 'none';
    }
});

// Sticky CTA behavior
let lastScrollTop = 0;
const stickyCTA = document.querySelector('.sticky-cta-mobile');

if (stickyCTA) {
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 500 && scrollTop > lastScrollTop) {
            // Scrolling down and past hero section
            stickyCTA.classList.add('show');
        } else if (scrollTop < lastScrollTop) {
            // Scrolling up
            stickyCTA.classList.remove('show');
        }
        
        lastScrollTop = scrollTop;
    });
}

// Lazy loading for better performance
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}