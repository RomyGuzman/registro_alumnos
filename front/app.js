const API_STUDENTS_URL = "http://localhost:5001/api/students";
const API_CAREERS_URL = "http://localhost:5001/api/careers";
const API_CATEGORIES_URL = "http://localhost:5001/api/categories";
const API_KEY = "12345ABCDEF";
const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_KEY}`
};

// ======================
// MÓDULO DE ESTUDIANTES
// ======================

// Cargar Carreras en Select
// Esta función carga las carreras disponibles en un elemento select dado su ID.
async function loadCareersIntoSelect(selectId) {
  try {
    const response = await fetch(API_CAREERS_URL, { headers });
    if (!response.ok) throw new Error("Error al cargar carreras");
    const careers = await response.json();
    
    const selectElement = document.getElementById(selectId);
    const isFilter = selectId === 'filterCareer';
    
    selectElement.innerHTML = isFilter
      ? '<option value="" selected>Todas las carreras</option>'
      : '<option value="" disabled selected>Seleccione carrera</option>';
    
    selectElement.innerHTML += careers.map(career => `
      <option value="${career.id}">${career.name}</option>
    `).join('');
  } catch (error) {
    console.error("Error cargando carreras:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar las carreras'
    });
  }
}

// Registro de Estudiante
// Esta función registra un nuevo estudiante con los datos proporcionados en el formulario.
async function registerStudent() {
  const name = document.getElementById('registerName').value.trim();
  const careerId = document.getElementById('registerCareer').value;
  const age = document.getElementById('registerEdad').value;
  const dni = document.getElementById('registerDNI').value.trim();

  if (!name || !careerId || !age || !dni) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Todos los campos son obligatorios'
    });
    return;
  }

  try {
    const careerResponse = await fetch(`${API_CAREERS_URL}/${careerId}`, { headers });
    if (!careerResponse.ok) throw new Error("Carrera no encontrada");
    const careerData = await careerResponse.json();

    const response = await fetch(API_STUDENTS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        name, 
        career: careerData.name,
        age, 
        dni 
      })
    });

    if (!response.ok) throw new Error(await response.text());

    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: 'Estudiante registrado correctamente',
      timer: 2000
    });

    // Limpiar formulario
    document.getElementById('registerName').value = '';
    document.getElementById('registerCareer').selectedIndex = 0;
    document.getElementById('registerEdad').value = '';
    document.getElementById('registerDNI').value = '';

    // Recargar tabla
    loadStudentsTable();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Error al registrar estudiante'
    });
  }
}

// Cargar tabla de estudiantes
// Esta función carga y muestra la lista de estudiantes en una tabla, aplicando filtros si es necesario.
async function loadStudentsTable() {
  try {
    const nameSearch = document.getElementById('searchInput').value.toLowerCase();
    const careerFilter = document.getElementById('filterCareer').value;

    const response = await fetch(API_STUDENTS_URL, { headers });
    if (!response.ok) throw new Error("Error al obtener estudiantes");
    
    let students = await response.json();

    // Aplicar filtros
    if (nameSearch) {
      students = students.filter(s => 
        s.name.toLowerCase().includes(nameSearch) || 
        s.dni.includes(nameSearch)
      );
    }

    if (careerFilter) {
      const careerResponse = await fetch(`${API_CAREERS_URL}/${careerFilter}`, { headers });
      if (!careerResponse.ok) throw new Error("Error al filtrar por carrera");
      const careerData = await careerResponse.json();
      
      students = students.filter(s => s.career === careerData.name);
    }

    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = students.length 
      ? students.map(student => `
          <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.career}</td>
            <td>${student.age}</td>
            <td>${student.dni}</td>
            <td class="text-end">
              <button onclick="deleteStudent('${student.id}')" 
                      class="btn btn-sm btn-danger">
                Eliminar
              </button>
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="6" class="text-center text-muted">No se encontraron estudiantes</td></tr>`;
  } catch (error) {
    console.error("Error cargando estudiantes:", error);
    document.getElementById('studentsTableBody').innerHTML = `
      <tr><td colspan="6" class="text-center text-danger">Error al cargar estudiantes</td></tr>`;
  }
}

// Eliminar estudiante
// Esta función elimina un estudiante dado su ID después de confirmar la acción.
async function deleteStudent(id) {
  try {
    const result = await Swal.fire({
      title: '¿Eliminar estudiante?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      const response = await fetch(`${API_STUDENTS_URL}/${id}`, {
        method: "DELETE",
        headers
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Estudiante eliminado correctamente',
        timer: 1500
      });
      
      loadStudentsTable();
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Error al eliminar estudiante'
    });
  }
}

// Limpiar filtros
// Esta función restablece los filtros de búsqueda y recarga la tabla de estudiantes.
function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterCareer').selectedIndex = 0;
  loadStudentsTable();
}

// Inicialización
// Esta función se ejecuta al cargar el documento y carga las carreras y estudiantes.
document.addEventListener('DOMContentLoaded', () => {
  loadCareersIntoSelect('registerCareer');
  loadCareersIntoSelect('filterCareer');
  loadStudentsTable();
});


// ===================
// MÓDULO DE CARRERAS (VERSIÓN CORREGIDA)
// ===================
const CareerManager = {
  // Registrar carrera
  // Esta función registra una nueva carrera con los datos proporcionados.
  async register(name, duration, categoryName) {
    try {
      const response = await fetch(API_CAREERS_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, duration, categoryName })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en el servidor");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error registrando carrera:", error);
      throw error;
    }
  },

  // Obtener todas las carreras
  // Esta función obtiene y devuelve todas las carreras registradas.
  async getAll() {
    try {
      const response = await fetch(API_CAREERS_URL, { headers });
      if (!response.ok) throw new Error("Error al obtener carreras");
      return await response.json();
    } catch (error) {
      console.error("Error obteniendo carreras:", error);
      return [];
    }
  },

  // Eliminar carrera
  // Esta función elimina una carrera dada su ID.
  async delete(id) {
    try {
      const response = await fetch(`${API_CAREERS_URL}/${id}`, {
        method: "DELETE",
        headers
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      console.error("Error eliminando carrera:", error);
      throw new Error("No se pudo eliminar la carrera");
    }
  }
};

const CareerUI = {
  // Manejar registro de carrera
  // Esta función gestiona el registro de una nueva carrera a través de la interfaz de usuario.
  async handleRegister() {
    const nameInput = document.getElementById('registerName');
    const durationInput = document.getElementById('registerDuration');
    const categorySelect = document.getElementById('registerCategory');
    
    const name = nameInput.value.trim();
    const duration = durationInput.value.trim();
    const categoryName = categorySelect.options[categorySelect.selectedIndex].text;

    // Validación mejorada
    if (!name || !duration || !categoryName || categorySelect.value === "") {
      Swal.fire({
        icon: 'error',
        title: 'Campos incompletos',
        text: 'Nombre, duración y categoría son campos obligatorios',
        timer: 3000
      });
      return;
    }

    try {
      const swal = Swal.fire({
        title: 'Registrando carrera',
        html: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const result = await CareerManager.register(name, duration, categoryName);

      swal.close();
      Swal.fire({
        icon: 'success',
        title: '¡Registrado!',
        text: result.message || 'Carrera registrada correctamente',
        timer: 2000,
        showConfirmButton: false
      });

      // Limpiar formulario
      nameInput.value = '';
      durationInput.value = '';
      categorySelect.selectedIndex = 0;

      // Actualizar tabla
      await this.loadCareers();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: error.message || 'Ocurrió un error desconocido',
        timer: 3000
      });
    }
  },

  // Cargar categorías en el select
  // Esta función carga las categorías disponibles en un elemento select.
  async loadCategoriesIntoSelect() {
    try {
      const response = await fetch(API_CATEGORIES_URL, { headers });
      if (!response.ok) throw new Error("Error al cargar categorías");
      const categories = await response.json();
      
      const select = document.getElementById('registerCategory');
      select.innerHTML = `
        <option value="" disabled selected>Seleccione una categoría</option>
        ${categories.map(cat => `
          <option value="${cat.id}">${cat.name}</option>
        `).join('')}
      `;
    } catch (error) {
      console.error("Error cargando categorías:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las categorías'
      });
    }
  },

  // Cargar carreras en la tabla
  // Esta función carga y muestra la lista de carreras en una tabla.
  async loadCareers() {
    try {
      const careers = await CareerManager.getAll();
      const tbody = document.getElementById('careersTableBody');
      
      if (!tbody) return;

      if (careers.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-muted">
              No hay carreras registradas
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = careers.map(career => `
        <tr data-career-id="${career.id}">
          <td>${career.id}</td>
          <td>${career.name}</td>
          <td>${career.duration} años</td>
          <td>${career.categoryName}</td>
          <td class="text-end">
            <button onclick="CareerUI.deleteCareer('${career.id}')" 
                    class="btn btn-sm btn-danger">
              Eliminar
            </button>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error("Error mostrando carreras:", error);
      const tbody = document.getElementById('careersTableBody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-danger">
              Error al cargar las carreras
            </td>
          </tr>`;
      }
    }
  },

  // Eliminar carrera
  // Esta función elimina una carrera dada su ID después de confirmar la acción.
  async deleteCareer(id) {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar carrera?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar'
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await CareerManager.delete(id);
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminada!',
          text: 'Carrera eliminada correctamente',
          timer: 1500,
          showConfirmButton: false
        });

        await this.loadCareers();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al eliminar la carrera'
      });
    }
  }
};

// ===================
// INICIALIZACIÓN
// ===================
// Esta función se ejecuta al cargar el documento y carga las carreras y categorías.
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('careersTableBody')) {
    CareerUI.loadCareers();
    CareerUI.loadCategoriesIntoSelect();
  }
});


// ======================
// MÓDULO DE CATEGORÍAS
// ======================

// Módulo de Categorías (Versión mejorada)
const CategoryManager = {
  API_URL: "http://localhost:5001/api/categories",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer 12345ABCDEF"
  },

  // Registrar nueva categoría
  // Esta función registra una nueva categoría con el nombre proporcionado.
  async register(name) {
    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ name })
      });
      
      if (!response.ok) throw new Error("Error en el servidor");
      return await response.json();
    } catch (error) {
      console.error("Error registrando categoría:", error);
      throw error;
    }
  },

  // Obtener todas las categorías
  // Esta función obtiene y devuelve todas las categorías registradas.
  async getAll() {
    try {
      const response = await fetch(this.API_URL, {
        headers: this.headers
      });
      
      if (!response.ok) throw new Error("Error al obtener categorías");
      return await response.json();
    } catch (error) {
      console.error("Error obteniendo categorías:", error);
      return [];
    }
  },

  // Eliminar categoría
  // Esta función elimina una categoría dada su ID.
  async delete(id) {
    try {
      const response = await fetch(`${this.API_URL}/${id}`, {
        method: "DELETE",
        headers: this.headers
      });
      
      if (!response.ok) throw new Error("Error al eliminar");
      return await response.json();
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      throw error;
    }
  }
};

// Controlador de interfaz para categorías
const CategoryUI = {
  // Cargar tabla de categorías
  // Esta función carga y muestra la lista de categorías en una tabla.
  async loadCategories() {
    try {
      const categories = await CategoryManager.getAll();
      const tbody = document.getElementById('categoriesTableBody');
      
      tbody.innerHTML = categories.length > 0 
        ? categories.map(cat => `
            <tr data-category-id="${cat.id}">
              <td>${cat.id}</td>
              <td>${cat.name}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-danger delete-btn" data-id="${cat.id}">
                  Eliminar
                </button>
              </td>
            </tr>
          `).join('')
        : `<tr><td colspan="3" class="text-center text-muted">No hay categorías registradas</td></tr>`;
      
      // Agregar event listeners a los botones
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => this.deleteCategory(btn.dataset.id));
      });
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  },

  // Manejar registro
  // Esta función gestiona el registro de una nueva categoría a través de la interfaz de usuario.
  async handleRegister() {
    const nameInput = document.getElementById('registerName');
    const name = nameInput.value.trim();
    
    if (!name) {
      Swal.fire('Error', 'Debe ingresar un nombre válido', 'warning');
      return;
    }

    try {
      Swal.fire({
        title: 'Registrando...',
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const result = await CategoryManager.register(name);
      
      Swal.fire({
        icon: 'success',
        title: '¡Registrado!',
        text: 'Categoría creada exitosamente',
        timer: 1500,
        showConfirmButton: false
      });

      nameInput.value = '';
      await this.loadCategories();
    } catch (error) {
      Swal.fire('Error', error.message || 'Error al registrar categoría', 'error');
    }
  },

  // Manejar eliminación
  // Esta función elimina una categoría dada su ID después de confirmar la acción.
  async deleteCategory(id) {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar categoría?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando...',
          allowEscapeKey: false,
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await CategoryManager.delete(id);
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminada!',
          text: 'Categoría eliminada correctamente',
          timer: 1500,
          showConfirmButton: false
        });

        await this.loadCategories();
      }
    } catch (error) {
      Swal.fire('Error', error.message || 'Error al eliminar categoría', 'error');
    }
  }
};

// Inicialización
// Esta función se ejecuta al cargar el documento y carga las categorías iniciales.
document.addEventListener('DOMContentLoaded', () => {
  // Aplicar clase específica a la página
  document.body.classList.add('category-page');
  
  // Cargar categorías iniciales
  CategoryUI.loadCategories();
  
  // Configurar botón de registro
  document.getElementById('registerBtn')?.addEventListener('click', () => {
    CategoryUI.handleRegister();
  });
});
