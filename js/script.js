document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
            const isExpanded = navList.classList.contains('active');
            navToggle.setAttribute('aria-expanded', isExpanded);
            navToggle.setAttribute('aria-label', isExpanded ? 'Close navigation' : 'Open navigation');
            // Toggle icon between bars and times
            const icon = navToggle.querySelector('i');
            if (navList.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navList.classList.contains('active')) {
                navList.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.setAttribute('aria-label', 'Open navigation');
                const icon = navToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // 2. Sticky Header & Active Link Highlight
    const header = document.getElementById('header');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        // Sticky Header
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Active Link Highlight
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // Add offset for fixed header
            if (scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
        
        // Special case for home (when scrolled to very top)
        if (window.scrollY < 100) {
            navLinks.forEach(link => link.classList.remove('active'));
            const homeLink = document.querySelector('.nav-link[href="#home"]');
            if (homeLink) homeLink.classList.add('active');
        }
    });

    // 3. Scroll Animations using Intersection Observer
    const animatedElements = document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: Stop observing once animated if you only want it to animate once
                // observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        scrollObserver.observe(el);
    });

    // 4. Lightbox functionality for Gallery
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-item');
    let lastGalleryItem = null;
    let suppressGalleryClick = false;

    if (galleryItems.length > 0 && lightbox) {
        const openLightbox = item => {
            const img = item.querySelector('img');
            if (!img) return;
            lastGalleryItem = item;
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            closeBtn.focus();
        };

        const closeLightbox = () => {
            lightbox.classList.remove('is-open');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (lastGalleryItem) lastGalleryItem.focus();
        };

        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                if (suppressGalleryClick) {
                    suppressGalleryClick = false;
                    return;
                }
                openLightbox(item);
            });

            item.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openLightbox(item);
                }
            });
        });

        closeBtn.addEventListener('click', closeLightbox);

        lightbox.addEventListener('click', event => {
            if (event.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
                closeLightbox();
            }
        });
    }

    const galleryTrack = document.querySelector('.gallery-grid');
    if (galleryTrack) {
        const galleryCards = galleryTrack.querySelectorAll('.gallery-item');
        const updateGalleryDepth = () => {
            const trackBounds = galleryTrack.getBoundingClientRect();
            const trackCenter = trackBounds.left + trackBounds.width / 2;
            galleryCards.forEach(card => {
                const cardBounds = card.getBoundingClientRect();
                const distance = (trackCenter - (cardBounds.left + cardBounds.width / 2)) / (trackBounds.width / 2);
                const offset = Math.max(-1, Math.min(1, distance));
                card.style.setProperty('--gallery-tilt', `${-offset * 8}deg`);
                card.style.setProperty('--gallery-depth', `${(1 - Math.abs(offset)) * 18}px`);
            });
        };

        galleryTrack.addEventListener('scroll', updateGalleryDepth, { passive: true });
        window.addEventListener('resize', updateGalleryDepth);
        updateGalleryDepth();

        document.querySelectorAll('[data-gallery-direction]').forEach(button => {
            button.addEventListener('click', () => {
                const firstItem = galleryTrack.querySelector('.gallery-item');
                if (!firstItem) return;
                const direction = Number(button.getAttribute('data-gallery-direction'));
                const gap = parseFloat(getComputedStyle(galleryTrack).columnGap) || 0;
                galleryTrack.scrollBy({
                    left: direction * (firstItem.getBoundingClientRect().width + gap),
                    behavior: 'smooth'
                });
            });
        });

        let pointerStart = null;
        let startingScroll = 0;
        galleryTrack.addEventListener('pointerdown', event => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            pointerStart = event.clientX;
            startingScroll = galleryTrack.scrollLeft;
        });

        galleryTrack.addEventListener('pointermove', event => {
            if (pointerStart === null) return;
            const distance = event.clientX - pointerStart;
            if (Math.abs(distance) > 5) {
                galleryTrack.classList.add('is-dragging');
                suppressGalleryClick = true;
                galleryTrack.scrollLeft = startingScroll - distance;
            }
        });

        const stopDragging = () => {
            pointerStart = null;
            galleryTrack.classList.remove('is-dragging');
            if (suppressGalleryClick) {
                window.setTimeout(() => {
                    suppressGalleryClick = false;
                }, 100);
            }
        };

        galleryTrack.addEventListener('pointerup', stopDragging);
        galleryTrack.addEventListener('pointercancel', stopDragging);
        galleryTrack.addEventListener('pointerleave', stopDragging);
    }

    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('pointermove', event => {
            if (event.pointerType !== 'mouse') return;
            const bounds = card.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width;
            const y = (event.clientY - bounds.top) / bounds.height;
            const rotateY = (x - 0.5) * 7;
            const rotateX = (0.5 - y) * 7;
            card.style.setProperty('--glare-x', `${x * 100}%`);
            card.style.setProperty('--glare-y', `${y * 100}%`);
            card.style.transform = `perspective(850px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('pointerleave', () => {
            card.style.transform = '';
        });
    });

    const heroStage = document.querySelector('.hero-stage');
    if (heroStage) {
        heroStage.addEventListener('pointermove', event => {
            if (event.pointerType !== 'mouse') return;
            const bounds = heroStage.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            heroStage.style.setProperty('--pointer-x', `${x * 9}deg`);
            heroStage.style.setProperty('--pointer-y', `${-y * 7}deg`);
            heroStage.style.setProperty('--frame-left-x', `${-x * 15}px`);
            heroStage.style.setProperty('--frame-left-y', `${-y * 12}px`);
            heroStage.style.setProperty('--frame-right-x', `${x * 19}px`);
            heroStage.style.setProperty('--frame-right-y', `${y * 14}px`);
        });

        heroStage.addEventListener('pointerleave', () => {
            heroStage.style.setProperty('--pointer-x', '0deg');
            heroStage.style.setProperty('--pointer-y', '0deg');
            heroStage.style.setProperty('--frame-left-x', '0px');
            heroStage.style.setProperty('--frame-left-y', '0px');
            heroStage.style.setProperty('--frame-right-x', '0px');
            heroStage.style.setProperty('--frame-right-y', '0px');
        });
    }
});
