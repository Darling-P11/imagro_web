// =============== MOSTRAR SIDEBAR ===============
// =============== MOSTRAR SIDEBAR ===============
// =============== MOSTRAR SIDEBAR ===============
// =============== MOSTRAR Y OCULTAR SIDEBAR ===============
const showSidebar = (toggleId, sidebarId, headerId, mainId) => {
  const toggle = document.getElementById(toggleId),
    sidebar = document.getElementById(sidebarId),
    header = document.getElementById(headerId),
    main = document.getElementById(mainId),
    body = document.body;

  if (toggle && sidebar && header && main) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("show-sidebar"); // Mostrar/ocultar sidebar
      body.classList.toggle("sidebar-collapsed"); // Agregar clase al body

      // Ajustar el header y main dinámicamente
      if (body.classList.contains("sidebar-collapsed")) {
        header.style.marginLeft = "90px";
        header.style.width = "calc(100% - 90px)";
        main.style.paddingLeft = "90px";
      } else {
        header.style.marginLeft = "316px";
        header.style.width = "calc(100% - 316px)";
        main.style.paddingLeft = "316px";
      }
    });
  }
};

// Llamada a la función
showSidebar("header-toggle", "sidebar", "header", "main");



  
  
  // =============== ENLACE ACTIVO ===============
  const sidebarLink = document.querySelectorAll('.sidebar__list a');
  
  function linkColor() {
    sidebarLink.forEach((l) => l.classList.remove('active-link'));
    this.classList.add('active-link');
  }
  
  sidebarLink.forEach((l) => l.addEventListener('click', linkColor));
  
  // =============== MODO OSCURO/CLARO ===============
  const themeButton = document.getElementById('theme-button');
  const darkTheme = 'dark-theme';
  const iconTheme = 'ri-sun-fill';
  
  // Verificar tema previamente seleccionado
  const selectedTheme = localStorage.getItem('selected-theme');
  const selectedIcon = localStorage.getItem('selected-icon');
  
  // Obtener tema actual
  const getCurrentTheme = () => (document.body.classList.contains(darkTheme) ? 'dark' : 'light');
  const getCurrentIcon = () => (themeButton.classList.contains(iconTheme) ? 'ri-moon-clear-fill' : 'ri-sun-fill');
  
  // Validar el tema previamente seleccionado
  if (selectedTheme) {
    document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme);
    themeButton.classList[selectedIcon === 'ri-moon-clear-fill' ? 'add' : 'remove'](iconTheme);
  }
  
  // Activar/desactivar tema con el botón
  themeButton.addEventListener('click', () => {
    document.body.classList.toggle(darkTheme);
    themeButton.classList.toggle(iconTheme);
  
    // Guardar la selección en localStorage
    localStorage.setItem('selected-theme', getCurrentTheme());
    localStorage.setItem('selected-icon', getCurrentIcon());
  });
  