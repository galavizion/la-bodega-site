(() => {
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mainMenu');

  if (!header || !toggle || !menu) return;

  const setScrolled = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  const openMenu = () => {
    header.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    header.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  // Cierra al dar click en un link del menú
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) closeMenu();
  });

  // Cierra con Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Si cambias a desktop, cierra el menú para evitar estados raros
  window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
    if (e.matches) closeMenu();
  });


    // Manejo de submenus en móvil
  const submenuToggles = document.querySelectorAll('.submenu-toggle');

  submenuToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const parent = btn.closest('.has-submenu');

      // Cierra otros submenus abiertos (opcional pero limpio)
      document.querySelectorAll('.has-submenu.is-open')
        .forEach(item => {
          if (item !== parent) item.classList.remove('is-open');
        });

      parent.classList.toggle('is-open');
    });
  });// Submenu: click en móvil (y accesible)
const submenuButtons = document.querySelectorAll('.submenu-toggle');

const closeAllSubmenus = () => {
  document.querySelectorAll('.has-submenu.is-open').forEach(li => {
    li.classList.remove('is-open');
    const btn = li.querySelector('.submenu-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });
};

submenuButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const li = btn.closest('.has-submenu');
    if (!li) return;

    const willOpen = !li.classList.contains('is-open');

    // cierra otros
    closeAllSubmenus();

    // abre/cierra el actual
    if (willOpen) {
      li.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      li.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
});

// Cuando cierras el menú principal, cierra submenus también
const originalCloseMenu = closeMenu;
closeMenu = () => {
  originalCloseMenu();
  closeAllSubmenus();
};

// Si cambias a desktop, limpia estados
window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
  if (e.matches) closeAllSubmenus();
});


  // Actualiza sombra
  window.addEventListener('scroll', setScrolled, { passive: true });
  setScrolled();
})();