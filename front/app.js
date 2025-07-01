const API_STUDENTS_URL = "http://localhost:5001/api/students";
const API_CAREERS_URL = "http://localhost:5001/api/careers";
const API_CATEGORIES_URL = "http://localhost:5001/api/categories";
const API_KEY = "12345ABCDEF";
const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_KEY}`
};

// ======================
// FUNCIÓN: handleApiError
// Maneja y muestra errores de las llamadas a la API. 
// Recibe el error, lo interpreta y muestra un mensaje con SweetAlert2.
// No se comunica directamente con el backend, solo procesa errores de otras funciones.
// ======================
async function handleApiError(error) {
  console.error('API Error:', error);
  let errorMessage = 'Error en el servidor';
  
  if (error.response) {
    try {
      const data = await error.response.json();
      errorMessage = data.message || error.response.statusText;
    } catch (e) {
      errorMessage = error.response.statusText;
    }
  } else if (error.message) {
    errorMessage = error.message;
  }

  await Swal.fire({
    icon: 'error',
    title: 'Error',
    text: errorMessage,
    timer: 3000
  });
  
  return errorMessage;
}

// ======================
// FUNCIÓN: loadCareersIntoSelect
// Carga todas las carreras desde el backend (GET /api/careers) y las inserta en un <select>.
// Se usa para llenar selects de registro y filtrado de estudiantes.
// ======================
async function loadCareersIntoSelect(selectId) {
  try {
    const response = await fetch(API_CAREERS_URL, { headers });
    if (!response.ok) throw new Error("Error al cargar carreras");
    const careers = await response.json();
    
    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML = '';
    
    const defaultOption = selectId.includes('filter') 
      ? '<option value="">Todas las carreras</option>'
      : '<option value="" disabled selected>Seleccione carrera</option>';
    
    selectElement.innerHTML = defaultOption + careers.map(career => `
      <option value="${career.id}">${career.name}</option>
    `).join('');
  } catch (error) {
    await handleApiError(error);
  }
}

// ======================
// FUNCIÓN: registerStudent
// Registra un nuevo estudiante enviando un POST a /api/students con los datos del formulario.
// Antes, verifica que la carrera exista con un GET /api/careers/:id.
// ======================
async function registerStudent() {
  const nameInput = document.getElementById('registerName');
  const careerSelect = document.getElementById('registerCareer');
  const ageInput = document.getElementById('registerEdad');
  const dniInput = document.getElementById('registerDNI');

  const name = nameInput.value.trim();
  const careerId = careerSelect.value;
  const age = ageInput.value;
  const dni = dniInput.value.trim();

  // Validación mejorada
  if (!name || !careerId || !age || !dni) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Todos los campos son obligatorios',
      timer: 2000
    });
    return;
  }

  try {
    const loadingAlert = Swal.fire({
      title: 'Registrando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // Verificar que la carrera exista
    const careerResponse = await fetch(`${API_CAREERS_URL}/${careerId}`, { headers });
    if (!careerResponse.ok) throw new Error("Carrera no encontrada");
    const career = await careerResponse.json();

    // Registrar estudiante
    const response = await fetch(API_STUDENTS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        name, 
        career: career.name,
        age: parseInt(age),
        dni 
      })
    });

    if (!response.ok) throw new Error(await response.text());

    await loadingAlert.close();
    
    await Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: 'Estudiante registrado correctamente',
      timer: 2000,
      showConfirmButton: false
    });

    // Limpiar formulario
    nameInput.value = '';
    careerSelect.selectedIndex = 0;
    ageInput.value = '';
    dniInput.value = '';

    // Recargar tabla
    await loadStudentsTable();
  } catch (error) {
    await handleApiError(error);
  }
}

// ======================
// FUNCIÓN: loadStudentsTable
// Carga todos los estudiantes (GET /api/students) y carreras (GET /api/careers) del backend.
// Aplica filtros locales y renderiza la tabla de estudiantes.
// ======================
async function loadStudentsTable() {
  try {
    const nameSearch = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const careerFilter = document.getElementById('filterCareer')?.value || '';
    
    const [studentsRes, careersRes] = await Promise.all([
      fetch(API_STUDENTS_URL, { headers }),
      fetch(API_CAREERS_URL, { headers })
    ]);
    
    if (!studentsRes.ok || !careersRes.ok) {
      throw new Error('Error al cargar datos');
    }
    
    let [students, careers] = await Promise.all([
      studentsRes.json(),
      careersRes.json()
    ]);

    // Aplicar filtros
    if (nameSearch) {
      students = students.filter(s => 
        s.name.toLowerCase().includes(nameSearch) || 
        s.dni.toLowerCase().includes(nameSearch)
      );
    }

    if (careerFilter) {
      const selectedCareer = careers.find(c => c.id == careerFilter);
      if (selectedCareer) {
        students = students.filter(s => s.career === selectedCareer.name);
      }
    }

    // Renderizar tabla
    const tbody = document.getElementById('studentsTableBody');
    if (tbody) {
      tbody.innerHTML = students.length > 0
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
                  <i class="bi bi-trash"></i> Eliminar
                </button>
              </td>
            </tr>
          `).join('')
        : `<tr>
            <td colspan="6" class="text-center text-muted py-4">
              <i class="bi bi-people display-6 d-block mb-2"></i>
              No hay estudiantes registrados
            </td>
          </tr>`;
    }
  } catch (error) {
    await handleApiError(error);
  }
}

// ======================
// FUNCIÓN: deleteStudent
// Elimina un estudiante enviando un DELETE a /api/students/:id.
// Muestra confirmación y feedback con SweetAlert2.
// ======================
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
      const loadingAlert = Swal.fire({
        title: 'Eliminando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await fetch(`${API_STUDENTS_URL}/${id}`, {
        method: "DELETE",
        headers
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      await loadingAlert.close();
      
      await Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Estudiante eliminado correctamente',
        timer: 1500,
        showConfirmButton: false
      });
      
      await loadStudentsTable();
    }
  } catch (error) {
    await handleApiError(error);
  }
}

// ======================
// OBJETO: CareerManager
// Métodos para interactuar con el backend de carreras:
// - register: POST /api/careers
// - getAll: GET /api/careers
// - delete: DELETE /api/careers/:id
// ======================
const CareerManager = {
    async register(name, duration, categoryId) {
        try {
            const response = await fetch(API_CAREERS_URL, {
                method: "POST",
                headers,
                body: JSON.stringify({ name, duration, categoryId })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Error al registrar carrera");
            }
            
            return await response.json();
        } catch (error) {
            console.error("Error registrando carrera:", error);
            throw error;
        }
    },

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

    async delete(id) {
        try {
            const response = await fetch(`${API_CAREERS_URL}/${id}`, {
                method: "DELETE",
                headers
            });
            
            if (!response.ok) throw new Error("Error al eliminar");
            return await response.json();
        } catch (error) {
            console.error("Error eliminando carrera:", error);
            throw error;
        }
    }
};

// ======================
// OBJETO: CareerUI
// Métodos para manejar la UI de carreras y comunicarse con CareerManager:
// - handleRegister: registra carrera (POST /api/careers)
// - loadCategories: carga categorías para el select (GET /api/categories)
// - loadCareers: carga y muestra carreras (GET /api/careers)
// - deleteCareer: elimina carrera (DELETE /api/careers/:id)
// - renderCareers: renderiza la tabla de carreras
// ======================
const CareerUI = {
    async handleRegister() {
        const nameInput = document.getElementById('registerName');
        const durationInput = document.getElementById('registerDuration');
        const categorySelect = document.getElementById('registerCategory');
        
        const name = nameInput.value.trim();
        const duration = durationInput.value.trim();
        const categoryId = Number(categorySelect.value);

        if (!name || !duration || !categoryId) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Todos los campos son obligatorios',
                timer: 2000
            });
            return;
        }

        try {
            const loadingAlert = Swal.fire({
                title: 'Registrando...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            await CareerManager.register(name, duration, categoryId);
            
            await loadingAlert.close();
            
            await Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Carrera registrada correctamente',
                timer: 2000,
                showConfirmButton: false
            });

            nameInput.value = '';
            durationInput.value = '';
            categorySelect.selectedIndex = 0;

            await this.loadCareers();
        } catch (error) {
            await handleApiError(error);
        }
    },

    async loadCategories() {
        try {
            const response = await fetch(API_CATEGORIES_URL, { headers });
            if (!response.ok) throw new Error("Error al cargar categorías");
            
            const categories = await response.json();
            const select = document.getElementById('registerCategory');
            
            if (select) {
                select.innerHTML = `
                    <option value="" disabled selected>Seleccione categoría</option>
                    ${categories.map(cat => `
                        <option value="${cat.id}">${cat.name}</option>
                    `).join('')}
                `;
            }
            
            return categories;
        } catch (error) {
            await handleApiError(error);
            return [];
        }
    },

    async loadCareers() {
        try {
            const careers = await CareerManager.getAll();
            const tbody = document.getElementById('careersTableBody');
            
            if (tbody) {
                tbody.innerHTML = careers.length > 0
                    ? careers.map(career => `
                        <tr>
                            <td>${career.id}</td>
                            <td>${career.name}</td>
                            <td>${career.duration} años</td>
                            <td>${career.category?.name || 'Sin categoría'}</td>
                            <td class="text-end">
                                <button onclick="CareerUI.deleteCareer('${career.id}')" 
                                    class="btn btn-sm btn-danger">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            </td>
                        </tr>
                    `).join('')
                    : `<tr>
                        <td colspan="5" class="text-center text-muted py-4">
                            <i class="bi bi-book display-6 d-block mb-2"></i>
                            No hay carreras registradas
                        </td>
                    </tr>`;
            }
        } catch (error) {
            await handleApiError(error);
        }
    },

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
                const loadingAlert = Swal.fire({
                    title: 'Eliminando...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                await CareerManager.delete(id);
                
                await loadingAlert.close();
                
                await Swal.fire({
                    icon: 'success',
                    title: 'Eliminada',
                    text: 'Carrera eliminada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });

                await this.loadCareers();
            }
        } catch (error) {
            await handleApiError(error);
        }
    },

    renderCareers(careers) {
      const tbody = document.getElementById('careersTableBody');
      if (tbody) {
        tbody.innerHTML = careers.length > 0
          ? careers.map(career => `
              <tr>
                <td>${career.id}</td>
                <td>${career.name}</td>
                <td>${career.duration} años</td>
                <td>${career.category?.name || 'Sin categoría'}</td>
                <td class="text-end">
                  <button onclick="CareerUI.deleteCareer('${career.id}')" 
                    class="btn btn-sm btn-danger">
                    <i class="bi bi-trash"></i> Eliminar
                  </button>
                </td>
              </tr>
            `).join('')
          : `<tr>
              <td colspan="5" class="text-center text-muted py-4">
                <i class="bi bi-book display-6 d-block mb-2"></i>
                No hay carreras registradas
              </td>
            </tr>`;
      }
    }
};

// ======================
// FUNCIÓN: handleApiError (duplicada, ya definida arriba)
// ======================

// ======================
// OBJETO: CategoryManager
// Métodos para interactuar con el backend de categorías:
// - register: POST /api/categories
// - getAll: GET /api/categories
// - delete: DELETE /api/categories/:id
// ======================
const CategoryManager = {
  async register(name) {
    try {
      const response = await fetch(API_CATEGORIES_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ name })
      });
      
      if (!response.ok) throw new Error("Error al registrar categoría");
      return await response.json();
    } catch (error) {
      console.error("Error registrando categoría:", error);
      throw error;
    }
  },

  async getAll() {
    try {
      const response = await fetch(API_CATEGORIES_URL, { headers });
      if (!response.ok) throw new Error("Error al obtener categorías");
      return await response.json();
    } catch (error) {
      console.error("Error obteniendo categorías:", error);
      return [];
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_CATEGORIES_URL}/${id}`, {
        method: "DELETE",
        headers
      });
      
      if (!response.ok) throw new Error("Error al eliminar categoría");
      return await response.json();
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      throw error;
    }
  }
};

// ======================
// OBJETO: CategoryUI
// Métodos para manejar la UI de categorías y comunicarse con CategoryManager:
// - handleRegister: registra categoría (POST /api/categories)
// - loadCategories: carga y muestra categorías (GET /api/categories)
// - deleteCategory: elimina categoría (DELETE /api/categories/:id)
// - renderCategories: renderiza la tabla de categorías
// ======================
const CategoryUI = {
  async handleRegister() {
    const nameInput = document.getElementById('registerName');
    const name = nameInput.value.trim();
    
    if (!name) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe ingresar un nombre válido',
        timer: 2000
      });
      return;
    }

    try {
      const loadingAlert = Swal.fire({
        title: 'Registrando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await CategoryManager.register(name);
      
      await loadingAlert.close();
      
      await Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Categoría registrada correctamente',
        timer: 2000,
        showConfirmButton: false
      });

      nameInput.value = '';
      await this.loadCategories();
    } catch (error) {
      await handleApiError(error);
    }
  },

  async loadCategories() {
    try {
      const categories = await CategoryManager.getAll();
      const tbody = document.getElementById('categoriesTableBody');
      
      if (tbody) {
        tbody.innerHTML = categories.length > 0
          ? categories.map(category => `
              <tr>
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td class="text-end">
                  <button onclick="CategoryUI.deleteCategory('${category.id}')" 
                    class="btn btn-sm btn-danger">
                    <i class="bi bi-trash"></i> Eliminar
                  </button>
                </td>
              </tr>
            `).join('')
          : `<tr>
              <td colspan="3" class="text-center text-muted py-4">
                <i class="bi bi-tags display-6 d-block mb-2"></i>
                No hay categorías registradas
              </td>
            </tr>`;
      }
    } catch (error) {
      await handleApiError(error);
    }
  },

  async deleteCategory(id) {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar categoría?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar'
      });

      if (result.isConfirmed) {
        const loadingAlert = Swal.fire({
          title: 'Eliminando...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        await CategoryManager.delete(id);
        
        await loadingAlert.close();
        
        await Swal.fire({
          icon: 'success',
          title: 'Eliminada',
          text: 'Categoría eliminada correctamente',
          timer: 1500,
          showConfirmButton: false
        });

        await this.loadCategories();
      }
    } catch (error) {
      await handleApiError(error);
    }
  },

  renderCategories(categories) {
    const tbody = document.getElementById('categoriesTableBody');
    if (tbody) {
      tbody.innerHTML = categories.length > 0
        ? categories.map(category => `
            <tr>
              <td>${category.id}</td>
              <td>${category.name}</td>
              <td class="text-end">
                <button onclick="CategoryUI.deleteCategory('${category.id}')" 
                  class="btn btn-sm btn-danger">
                  <i class="bi bi-trash"></i> Eliminar
                </button>
              </td>
            </tr>
          `).join('')
        : `<tr>
            <td colspan="3" class="text-center text-muted py-4">
              <i class="bi bi-tags display-6 d-block mb-2"></i>
              No hay categorías registradas
            </td>
          </tr>`;
    }
  }
};

// ======================
// INICIALIZACIÓN GLOBAL
// Detecta la página actual y ejecuta la inicialización correspondiente.
// Configura eventos de filtrado y registro según la página.
// ======================
document.addEventListener('DOMContentLoaded', async () => {
  // Manejo de errores no capturados
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled rejection:', event.reason);
    handleApiError(event.reason);
    event.preventDefault();
  });

  // Configurar navbar activa
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Inicializar módulos según la página
  if (currentPage === 'estudiantes.html') {
    await loadCareersIntoSelect('registerCareer');
    await loadCareersIntoSelect('filterCareer');
    await loadStudentsTable();
  } 
  else if (currentPage === 'carreras.html') {
    await CareerUI.loadCategories();
    await CareerUI.loadCareers();

    // Configurar filtrado
    const filterForm = document.getElementById('filterCareerForm');
    if (filterForm) {
      filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameValue = document.getElementById('filterCareerName').value.toLowerCase();
        const durationValue = document.getElementById('filterCareerDuration').value.toLowerCase();
        const careers = await CareerManager.getAll();
        const filtered = careers.filter(career =>
          career.name.toLowerCase().includes(nameValue) &&
          (durationValue === "" || career.duration.toString().toLowerCase().includes(durationValue))
        );
        CareerUI.renderCareers(filtered);
      });
    }
  }
  else if (currentPage === 'categorias.html') {
    await CategoryUI.loadCategories();

    // Configurar evento del botón de registro
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
      registerBtn.addEventListener('click', () => CategoryUI.handleRegister());
    }

    // Configurar filtrado
    const filterForm = document.getElementById('filterCategoryForm');
    if (filterForm) {
      filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const filterValue = document.getElementById('filterCategoryName').value.toLowerCase();
        const categories = await CategoryManager.getAll();
        const filtered = categories.filter(cat => cat.name.toLowerCase().includes(filterValue));
        CategoryUI.renderCategories(filtered);
      });
    }
  }
});
