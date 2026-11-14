import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const menuButton = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

menuButton.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".nav-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

document.getElementById("year").textContent = new Date().getFullYear();



/* =========================================
   INTERACTIVE CYBER GRID 3D ANIMATION
   Mouse Interaction + Click Ripple Effect
========================================= */

const cyberCanvas = document.getElementById("cyber-background");

if (cyberCanvas) {

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 23, 48);
    camera.lookAt(0, 0, -18);

    const renderer = new THREE.WebGLRenderer({
        canvas: cyberCanvas,
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.5)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    // Warna utama
    const purple = new THREE.Color("#ff3b2f");

    // Membuat permukaan wireframe
    const segments = window.innerWidth < 768 ? 85 : 120;

    const geometry = new THREE.PlaneGeometry(
        150, 150, segments, segments
    );

    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
        color: purple,
        wireframe: true,
        transparent: true,
        opacity: 0.42
    });

    const terrain = new THREE.Mesh(
        geometry,
        material
    );

    terrain.position.set(0, -8, -25);
    scene.add(terrain);

    // Menyimpan posisi awal vertex
    const positions = geometry.attributes.position;

    const originalPositions = positions.array.slice();

    // Raycaster untuk mendeteksi posisi mouse
    const raycaster = new THREE.Raycaster();

    const pointer = new THREE.Vector2();

    let mousePosition = null;

    let isPointerInside = false;

    // Menyimpan gelombang klik
    const ripples = [];

    const maxRipples = 8;

    // Membaca posisi mouse
    function updatePointer(event) {

        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;

        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const intersections = raycaster.intersectObject(terrain);

        if (intersections.length > 0) {

            mousePosition = intersections[0].point.clone();

            isPointerInside = true;

        } else {

            isPointerInside = false;

        }
    }

    // Interaksi gerakan mouse
    window.addEventListener("pointermove", (event) => {

        updatePointer(event);

    }, { passive: true });

    // Interaksi klik / sentuhan
    window.addEventListener("pointerdown", (event) => {

        updatePointer(event);

        if (!mousePosition) return;

        // Maksimal 8 gelombang bersamaan
        if (ripples.length >= maxRipples) {
            ripples.shift();
        }

        ripples.push({
            x: mousePosition.x,
            z: mousePosition.z,
            start: performance.now(),
            strength: 3.2
        });

    }, { passive: true });

    // Menghentikan efek hover ketika pointer keluar
    document.addEventListener("pointerleave", () => {

        isPointerInside = false;

    });

    // Animasi utama
    let animationFrame;

    function animate(time) {

        animationFrame = requestAnimationFrame(animate);

        const t = time * 0.0005;

        const now = performance.now();

        // Menghapus gelombang yang sudah selesai
        for (let i = ripples.length - 1; i >= 0; i--) {

            if (now - ripples[i].start > 2600) {

                ripples.splice(i, 1);

            }

        }

        // Menggerakkan setiap titik grid
        for (let i = 0; i < positions.count; i++) {

            const x = originalPositions[i * 3];

            const z = originalPositions[i * 3 + 2];

            // Gelombang dasar
            let wave =

                Math.sin(x * 0.09 + t * 2) * 1.2 +

                Math.cos(z * 0.08 + t * 1.5) * 1.0 +

                Math.sin((x + z) * 0.04 + t) * 0.7;

            // Efek gelombang ketika mouse bergerak
            if (isPointerInside && mousePosition) {

                const dx = x + terrain.position.x - mousePosition.x;

                const dz = z + terrain.position.z - mousePosition.z;

                const distance = Math.sqrt(dx * dx + dz * dz);

                const hoverWave =
                    Math.exp(-distance * distance / 65) * 0.65;

                wave += hoverWave;

            }

            // Efek riak ketika layar diklik
            for (const ripple of ripples) {

                const age = (now - ripple.start) / 1000;

                const dx = x + terrain.position.x - ripple.x;

                const dz = z + terrain.position.z - ripple.z;

                const distance = Math.sqrt(dx * dx + dz * dz);

                const radius = distance - age * 19;

                const attenuation = Math.exp(-age * 1.7);

                const rippleWave =

                    Math.sin(radius * 0.65) *

                    Math.exp(-Math.pow(radius / 22, 2)) *

                    attenuation *

                    ripple.strength;

                wave += rippleWave;

            }

            positions.setY(i, wave);

        }

        positions.needsUpdate = true;

        // Render scene
        renderer.render(scene, camera);

    }

    animate(0);

    // Responsive resize
    window.addEventListener("resize", () => {

        camera.aspect = window.innerWidth / window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 1.5)
        );

    });

    // Membersihkan animasi ketika tab tidak aktif
    document.addEventListener("visibilitychange", () => {

        if (document.hidden) {

            cancelAnimationFrame(animationFrame);

        } else {

            animate(0);

        }

    });

}



/* =========================================
   FEATURED WORKS - PROJECT DETAIL MODAL
========================================= */

(() => {

    const modal = document.getElementById("projectModal");

    if (!modal) return;

    const modalTitle = document.getElementById("modalTitle");
    const modalCategory = document.getElementById("modalCategory");
    const modalDescription = document.getElementById("modalDescription");
    const modalOverview = document.getElementById("modalOverview");
    const modalTechnologies = document.getElementById("modalTechnologies");

    const detailButtons = document.querySelectorAll("[data-project]");
    const closeButtons = modal.querySelectorAll("[data-close-modal]");

    let lastFocusedElement = null;

    const projects = {

        gym: {
            category: "WEB DEVELOPMENT / EXPERT SYSTEM",

            title: "ND Fitness Expert System",

            description:
                "Aplikasi sistem pakar berbasis web untuk membantu menentukan rekomendasi program latihan fitness berdasarkan kondisi tubuh dan riwayat cedera.",

            overview:
                "Proyek ini dikembangkan untuk membantu member memperoleh rekomendasi program latihan yang lebih sesuai dengan kondisi tubuhnya. Sistem menggunakan metode Forward Chaining untuk menelusuri fakta dan aturan yang tersedia hingga menghasilkan rekomendasi program latihan. Aplikasi dibangun menggunakan PHP dengan framework Laravel 12, Bootstrap sebagai pendukung antarmuka, serta MySQL sebagai basis data.",

            technologies: [
                "PHP",
                "Laravel 12",
                "Bootstrap",
                "MySQL",
                "Forward Chaining"
            ]
        },

        mirakas: {
            category: "WEB DEVELOPMENT / COMPANY PROFILE",

            title: "MIRAKAS Company Profile",

            description:
                "Pengembangan website profil perusahaan untuk memperkenalkan identitas, informasi, serta layanan MIRAKAS kepada masyarakat.",

            overview:
                "Proyek ini berfokus pada penyajian informasi perusahaan melalui media website. Website company profile berfungsi sebagai media informasi dan representasi digital perusahaan sehingga pengunjung dapat mengenal perusahaan serta layanan yang ditawarkan dengan lebih mudah.",

            technologies: [
                "Website Development",
                "Company Profile",
                "UI Design"
            ]
        },

        crm: {
            category: "WEB DEVELOPMENT / CRM",

            title: "CRM Event Management",

            description:
                "Aplikasi berbasis web untuk membantu pengelolaan kegiatan perusahaan, pembagian tugas, dan pemantauan progres pekerjaan.",

            overview:
                "Proyek ini dirancang untuk membantu proses pengelolaan event perusahaan secara lebih terorganisasi. Sistem mendukung pencatatan kegiatan, pengelolaan tugas, pembagian tanggung jawab, serta pemantauan status pekerjaan sehingga aktivitas tim dapat dipantau melalui satu sistem terpusat.",

            technologies: [
                "Web Application",
                "CRM",
                "Event Management",
                "Task Management",
                "Database"
            ]
        },

        design: {
            category: "CREATIVE DESIGN / DIGITAL MARKETING",

            title: "Digital Marketing & Poster Design",

            description:
                "Pembuatan materi visual berupa poster promosi untuk mendukung pemasaran dan publikasi layanan perusahaan melalui media sosial.",

            overview:
                "Proyek ini mencakup pembuatan berbagai desain poster promosi MIRAKAS Fingerprint untuk kebutuhan publikasi Instagram dan media sosial perusahaan. Desain disesuaikan dengan informasi kegiatan, paket layanan, identitas visual, serta lokasi promosi. Proses pengerjaan menggunakan Canva dan Figma.",

            technologies: [
                "Canva",
                "Figma",
                "Poster Design",
                "Instagram",
                "Digital Marketing"
            ]
        }

    };


    // OPEN MODAL

    detailButtons.forEach(button => {

        button.addEventListener("click", () => {

            const project = projects[button.dataset.project];

            if (!project) return;

            lastFocusedElement = button;

            modalCategory.textContent = project.category;
            modalTitle.textContent = project.title;
            modalDescription.textContent = project.description;
            modalOverview.textContent = project.overview;

            modalTechnologies.innerHTML = "";

            project.technologies.forEach(technology => {

                const tag = document.createElement("span");

                tag.textContent = technology;

                modalTechnologies.appendChild(tag);

            });

            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");

            document.body.style.overflow = "hidden";

            modal.querySelector(".modal-close").focus();

        });

    });


    // CLOSE MODAL

    function closeModal() {

        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }

    }


    closeButtons.forEach(button => {

        button.addEventListener("click", closeModal);

    });


    // CLOSE WITH ESCAPE

    document.addEventListener("keydown", event => {

        if (
            event.key === "Escape" &&
            modal.classList.contains("active")
        ) {
            closeModal();
        }

    });

})();


/* =========================================
   TECH STACK FILTER
========================================= */

(() => {

    const filterButtons = document.querySelectorAll(
        ".skill-filter-btn"
    );

    const skillCards = document.querySelectorAll(
        ".tech-skill-card"
    );

    const emptyMessage = document.getElementById(
        "skillsEmpty"
    );

    const skillsGrid = document.getElementById(
        "techSkillsGrid"
    );

    if (!filterButtons.length || !skillCards.length) {
        return;
    }

    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            const selectedCategory = button.dataset.filter;

            // UPDATE ACTIVE BUTTON

            filterButtons.forEach(item => {

                const isActive = item === button;

                item.classList.toggle("active", isActive);

                item.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );

            });

            // FILTER SKILL CARDS

            let visibleCount = 0;

            skillCards.forEach(card => {

                const cardCategory = card.dataset.category;

                const shouldShow =
                    selectedCategory === "all" ||
                    cardCategory === selectedCategory;

                card.hidden = !shouldShow;

                if (shouldShow) {
                    visibleCount++;
                }

            });

            // EMPTY CATEGORY MESSAGE

            if (emptyMessage) {

                emptyMessage.hidden = visibleCount !== 0;

            }

            if (skillsGrid) {

                skillsGrid.hidden = visibleCount === 0;

            }

        });

    });

})();


/* =========================================
   AUTO ACTIVE NAVIGATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const navLinks = document.querySelectorAll(
        ".nav-menu .nav-link[href^='#']"
    );

    const sections = Array.from(navLinks)
        .map(link => document.getElementById(
            link.getAttribute("href").slice(1)
        ))
        .filter(Boolean);

    if (!sections.length) return;

    function setActiveNavigation(id) {

        navLinks.forEach(link => {

            const isActive =
                link.getAttribute("href") === `#${id}`;

            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }

        });
    }

    function updateActiveNavigation() {

        const scrollPosition = window.scrollY;
        const headerHeight =
            document.querySelector(".site-header")
            ?.offsetHeight || 78;

        // Saat berada di cover, tidak ada menu aktif.
        const firstSection = sections[0];

        if (
            firstSection &&
            scrollPosition + headerHeight + 100 <
            firstSection.offsetTop
        ) {
            setActiveNavigation("");
            return;
        }

        // Aktifkan section yang melewati garis navigasi.
        const checkpoint =
            scrollPosition + headerHeight +
            window.innerHeight * 0.25;

        let currentSection = sections[0].id;

        sections.forEach(section => {
            if (section.offsetTop <= checkpoint) {
                currentSection = section.id;
            }
        });

        // Pastikan section terakhir aktif di ujung halaman.
        const nearBottom =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 5;

        if (nearBottom) {
            currentSection = sections[sections.length - 1].id;
        }

        setActiveNavigation(currentSection);
    }

    let ticking = false;

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveNavigation();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener(
        "resize",
        updateActiveNavigation
    );

    window.addEventListener(
        "hashchange",
        updateActiveNavigation
    );

    updateActiveNavigation();

});


/* =========================================
   LATEST POSTS CAROUSEL
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const track = document.getElementById("galleryTrack");
    const nextBtn = document.getElementById("galleryNext");
    const prevBtn = document.getElementById("galleryPrev");

    if (!track || !nextBtn || !prevBtn) return;

    function getSlideDistance() {
        const card = track.querySelector(".gallery-card");

        if (!card) return 300;

        const gap = parseFloat(
            getComputedStyle(track).gap
        ) || 24;

        return card.offsetWidth + gap;
    }

    nextBtn.addEventListener("click", () => {
        track.scrollBy({
            left: getSlideDistance(),
            behavior: "smooth"
        });
    });

    prevBtn.addEventListener("click", () => {
        track.scrollBy({
            left: -getSlideDistance(),
            behavior: "smooth"
        });
    });

});

