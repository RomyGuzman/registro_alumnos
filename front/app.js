const API_STUDENTS_URL = "http://localhost:5001/api/students"; // URL para acceder a la API de estudiantes
const API_CAREERS_URL = "http://localhost:5001/api/careers"; // URL para acceder a la API de carreras
const API_CATEGORIES_URL = "http://localhost:5001/api/categories"; // URL para acceder a la API de categorías
const API_KEY = "12345ABCDEF"; // Clave de API para autenticación
const headers = {
  "Content-Type": "application/json", // Tipo de contenido para las solicitudes
  "Authorization": `Bearer ${API_KEY}` // Autenticación con la clave de API
};

// ======================
// FUNCIONES UTILITARIAS
// ======================

/**
 * Muestra un mensaje emergente (toast) en la parte superior derecha de la pantalla.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} icon - El icono a mostrar (por defecto es 'success').
 */
function showToast(message, icon = 'success') {
  Swal.fire({
    title: message,
    icon,
    toast: true,
    position: 'top-end',
    timer: 5000,
    timerProgressBar: true,
    showConfirmButton: false,
  });
}

/**
 * Valida si el DNI es correcto (7 u 8 dígitos).
 * @param {string} dni - El DNI a validar.
 * @returns {boolean} - Retorna true si es válido, false en caso contrario.
 */
function isValidDNI(dni) {
  return /^[0-9]{7,8}$/.test(dni); // Expresión regular para validar el formato del DNI
}

// ======================
// MÓDULO DE ESTUDIANTES
// ======================

/**
 * Carga las carreras en un elemento select.
 * @param {string} selectId - El ID del elemento select donde se cargarán las carreras.
 */
async function loadCareersIntoSelect(selectId) {
  try {
    const response = await fetch(API_CAREERS_URL, { headers }); // Realiza la solicitud a la API de carreras
    if (!response.ok) throw new Error("Error al cargar carreras"); // Manejo de errores si la respuesta no es correcta
    const careers = await response.json(); // Convierte la respuesta a JSON
    const selectElement = document.getElementById(selectId); // Obtiene el elemento select por su ID

    // Establece las opciones iniciales del select
    selectElement.innerHTML = selectId === 'filterCareer'
      ? '<option value="" selected>Todas las carreras</option>'
      : '<option value="" disabled selected>Seleccione carrera</option>';

    // Ordena las carreras y las agrega al select
    careers.sort((a, b) => a.name.localeCompare(b.name)).forEach(career => {
      const option = document.createElement('option');
      option.value = career.id; // Establece el valor de la opción
      option.textContent = career.name; // Establece el texto de la opción
      selectElement.appendChild(option); // Agrega la opción al select
    });
  } catch (error) {
    console.error(error); // Muestra el error en la consola
    showToast(error.message, 'error'); // Muestra un mensaje de error
  }
}

/**
 * Registra un nuevo estudiante.
 */
async function registerStudent() {
  const name = document.getElementById('registerName').value.trim(); // Obtiene el nombre del estudiante
  const careerId = document.getElementById('registerCareer').value; // Obtiene el ID de la carrera seleccionada
  const age = document.getElementById('registerEdad').value; // Obtiene la edad del estudiante
  const dni = document.getElementById('registerDNI').value.trim(); // Obtiene el DNI del estudiante

  // Validaciones de los campos
  if (!name || name.length < 3) return showToast('El nombre debe tener al menos 3 caracteres', 'error');
  if (!careerId) return showToast('Debe seleccionar una carrera', 'error');
  if (!age || age < 15 || age > 80) return showToast('La edad debe estar entre 15 y 80 años', 'error');
  if (!dni || !isValidDNI(dni)) return showToast('El DNI debe tener 7 u 8 dígitos', 'error');

  Swal.fire({ title: 'Registrando...', didOpen: Swal.showLoading, allowOutsideClick: false }); // Muestra un loader

  try {
    const careerResponse = await fetch(`${API_CAREERS_URL}/${careerId}`, { headers }); // Verifica si la carrera existe
    if (!careerResponse.ok) throw new Error("Carrera no encontrada"); // Manejo de errores si la carrera no se encuentra
    const careerData = await careerResponse.json(); // Convierte la respuesta a JSON

    // Realiza la solicitud para registrar al estudiante
    const response = await fetch(API_STUDENTS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, career: careerData.name, age: parseInt(age), dni }) // Envía los datos del estudiante
    });

    if (!response.ok) {
      const errorData = await response.json(); // Convierte la respuesta de error a JSON
      throw new Error(errorData.message || 'Error al registrar estudiante'); // Manejo de errores
    }

    Swal.close(); // Cierra el loader
    showToast('Estudiante registrado correctamente', 'success'); // Muestra mensaje de éxito

    // Limpia los campos del formulario
    document.getElementById('registerName').value = '';
    document.getElementById('registerCareer').selectedIndex = 0;
    document.getElementById('registerEdad').value = '';
    document.getElementById('registerDNI').value = '';
    loadStudentsTable(); // Carga la tabla de estudiantes

  } catch (error) {
    Swal.close(); // Cierra el loader
    Swal.fire('Error', error.message || 'Error al registrar', 'error'); // Muestra mensaje de error
  }
}

/**
 * Carga la tabla de estudiantes y aplica filtros si es necesario.
 */
async function loadStudentsTable() {
  try {
    const nameSearch = document.getElementById('searchInput')?.value.toLowerCase(); // Obtiene el texto de búsqueda
    const careerFilter = document.getElementById('filterCareer')?.value; // Obtiene el filtro de carrera

    const response = await fetch(API_STUDENTS_URL, { headers }); // Realiza la solicitud a la API de estudiantes
    if (!response.ok) throw new Error("Error al obtener estudiantes"); // Manejo de errores
    let students = await response.json(); // Convierte la respuesta a JSON

    // Aplica el filtro por nombre
    if (nameSearch) {
      students = students.filter(s => s.name.toLowerCase().includes(nameSearch) || s.dni.includes(nameSearch));
    }
    // Aplica el filtro por carrera
    if (careerFilter) {
      const careerData = await (await fetch(`${API_CAREERS_URL}/${careerFilter}`, { headers })).json();
      students = students.filter(s => s.career === careerData.name);
    }

    const tbody = document.getElementById('studentsTableBody'); // Obtiene el cuerpo de la tabla
    const totalSpan = document.getElementById('totalStudents'); // Obtiene el elemento que muestra el total de estudiantes

    // Actualiza la tabla con los estudiantes
    if (tbody) {
      tbody.innerHTML = students.length ? students.map(student => `
        <tr>
          <td>${student.id}</td>
          <td>${student.name}</td>
          <td>${student.career}</td>
          <td>${student.age}</td>
          <td>${student.dni}</td>
          <td class="text-end">
            <button onclick="deleteStudent('${student.id}')" class="btn btn-sm btn-danger">
              <i class="bi bi-trash"></i> Eliminar
            </button>
          </td>
        </tr>`).join('') :
        '<tr><td colspan="6" class="text-center text-muted">No se encontraron estudiantes</td></tr>';
    }
    if (totalSpan) totalSpan.textContent = students.length; // Actualiza el total de estudiantes
  } catch (error) {
    const tbody = document.getElementById('studentsTableBody'); // Obtiene el cuerpo de la tabla
    if (tbody) {
      tbody.innerHTML = `
        <tr><td colspan="6" class="text-center text-danger">${error.message}</td></tr>`; // Muestra mensaje de error en la tabla
    }
    if (document.getElementById('totalStudents')) document.getElementById('totalStudents').textContent = '0'; // Resetea el total
  }
}

/**
 * Elimina un estudiante por su ID.
 * @param {string} id - El ID del estudiante a eliminar.
 */
async function deleteStudent(id) {
  const result = await Swal.fire({
    title: '¿Eliminar estudiante?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#3498db',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return; // Si no se confirma, se cancela la acción

  Swal.fire({ title: 'Eliminando...', didOpen: Swal.showLoading, allowOutsideClick: false }); // Muestra un loader

  try {
    const response = await fetch(`${API_STUDENTS_URL}/${id}`, { method: "DELETE", headers }); // Realiza la solicitud para eliminar al estudiante
    if (!response.ok) {
      const errorData = await response.json(); // Convierte la respuesta de error a JSON
      throw new Error(errorData.message || 'Error al eliminar'); // Manejo de errores
    }

    Swal.close(); // Cierra el loader
    showToast('Estudiante eliminado correctamente', 'success'); // Muestra mensaje de éxito
    await loadStudentsTable(); // Recarga la tabla de estudiantes

  } catch (error) {
    Swal.close(); // Cierra el loader
    Swal.fire('Error', error.message || 'Error al eliminar', 'error'); // Muestra mensaje de error
  }
}

/**
 * Limpia los filtros de búsqueda y recarga la tabla de estudiantes.
 */
function clearFilters() {
  const searchInput = document.getElementById('searchInput'); // Obtiene el campo de búsqueda
  const filterCareer = document.getElementById('filterCareer'); // Obtiene el filtro de carrera
  if (searchInput) searchInput.value = ''; // Limpia el campo de búsqueda
  if (filterCareer) filterCareer.selectedIndex = 0; // Resetea el filtro de carrera
  loadStudentsTable(); // Recarga la tabla de estudiantes
}

// ===================
// MÓDULO DE CARRERAS
// ===================

const CareerManager = {
  /**
   * Registra una nueva carrera.
   * @param {string} name - Nombre de la carrera.
   * @param {number} duration - Duración de la carrera en años.
   * @param {string} categoryName - Nombre de la categoría a la que pertenece la carrera.
   */
  async register(name, duration, categoryName) {
    const loader = Swal.fire({ title: 'Registrando carrera', didOpen: Swal.showLoading, allowOutsideClick: false }); // Muestra un loader
    try {
      const response = await fetch(API_CAREERS_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, duration, categoryName }) // Envía los datos de la nueva carrera
      });

      if (!response.ok) throw new Error((await response.json()).message || "Error en el servidor"); // Manejo de errores
      Swal.close(); // Cierra el loader
      showToast('Carrera registrada correctamente', 'success'); // Muestra mensaje de éxito
      return response.json(); // Retorna los datos de la carrera registrada
    } catch (error) {
      Swal.close(); // Cierra el loader
      Swal.fire('Error', error.message, 'error'); // Muestra mensaje de error
      throw error; // Lanza el error para manejo posterior
    }
  },

  /**
   * Obtiene todas las carreras registradas.
   * @returns {Promise<Array>} - Retorna un array con las carreras.
   */
  async getAll() {
    try {
      const response = await fetch(API_CAREERS_URL, { headers }); // Realiza la solicitud a la API de carreras
      if (!response.ok) throw new Error("Error al obtener carreras"); // Manejo de errores
      return (await response.json()).sort((a, b) => a.name.localeCompare(b.name)); // Retorna las carreras ordenadas
    } catch (error) {
      Swal.fire('Error', error.message, 'error'); // Muestra mensaje de error
      return []; // Retorna un array vacío en caso de error
    }
  },

  /**
   * Elimina una carrera por su ID.
   * @param {string} id - El ID de la carrera a eliminar.
   */
  async delete(id) {
    Swal.fire({ title: 'Eliminando carrera...', didOpen: Swal.showLoading, allowOutsideClick: false }); // Muestra un loader
    try {
      const response = await fetch(`${API_CAREERS_URL}/${id}`, { method: "DELETE", headers }); // Realiza la solicitud para eliminar la carrera
      if (!response.ok) throw new Error((await response.json()).message || "Error al eliminar"); // Manejo de errores
      Swal.close(); // Cierra el loader
      showToast('Carrera eliminada correctamente', 'success'); // Muestra mensaje de éxito
      return response.json(); // Retorna los datos de la carrera eliminada
    } catch (error) {
      Swal.close(); // Cierra el loader
      Swal.fire('Error', error.message, 'error'); // Muestra mensaje de error
      throw error; // Lanza el error para manejo posterior
    }
  }
};

const CareerUI = {
  /**
   * Maneja el registro de una nueva carrera desde la interfaz de usuario.
   */
  async handleRegister() {
    const nameInput = document.getElementById('registerName'); // Obtiene el campo de nombre
    const durationInput = document.getElementById('registerDuration'); // Obtiene el campo de duración
    const categorySelect = document.getElementById('registerCategory'); // Obtiene el select de categorías
    const name = nameInput.value.trim(); // Obtiene el nombre de la carrera
    const duration = durationInput.value.trim(); // Obtiene la duración de la carrera
    const categoryName = categorySelect.options[categorySelect.selectedIndex]?.text; // Obtiene el nombre de la categoría seleccionada

    // Validaciones de los campos
    if (!name || name.length < 3) return showToast('El nombre debe tener al menos 3 caracteres', 'error');
    if (!duration || isNaN(duration) || duration < 1 || duration > 10) return showToast('La duración debe ser entre 1 y 10 años', 'error');
    if (!categoryName || categorySelect.value === "") return showToast('Debe seleccionar una categoría válida', 'error');

    try {
      await CareerManager.register(name, duration, categoryName); // Registra la carrera
      nameInput.value = ''; // Limpia el campo de nombre
      durationInput.value = ''; // Limpia el campo de duración
      categorySelect.selectedIndex = 0; // Resetea el select de categorías
      await this.loadCareers(); // Recarga la lista de carreras
    } catch {}
  },

  /**
   * Carga las categorías en un select para el registro de carreras.
   */
  async loadCategoriesIntoSelect() {
    try {
      const categories = await CategoryManager.getAll(); // Obtiene todas las categorías
      const select = document.getElementById('registerCategory'); // Obtiene el select de categorías
      select.innerHTML = '<option value="" disabled selected>Seleccione una categoría</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join(''); // Agrega las categorías al select
    } catch {}
  },

  /**
   * Carga la lista de carreras en la interfaz de usuario.
   */
  async loadCareers() {
    try {
      const careers = await CareerManager.getAll(); // Obtiene todas las carreras
      const tbody = document.getElementById('careersTableBody'); // Obtiene el cuerpo de la tabla de carreras
      if (!tbody) return;

      // Actualiza la tabla con las carreras
      tbody.innerHTML = careers.length ? careers.map(career => `
        <tr>
          <td>${career.id}</td>
          <td>${career.name}</td>
          <td>${career.duration} años</td>
          <td>${career.categoryName}</td>
          <td class="text-end">
            <button onclick="CareerUI.deleteCareer('${career.id}')" class="btn btn-sm btn-danger">
              <i class="bi bi-trash"></i> Eliminar
            </button>
          </td>
        </tr>`).join('') : '<tr><td colspan="5" class="text-center">No hay carreras registradas</td></tr>';
    } catch (error) {
      const tbody = document.getElementById('careersTableBody'); // Obtiene el cuerpo de la tabla de carreras
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${error.message}</td></tr>`; // Muestra mensaje de error en la tabla
    }
  },

  /**
   * Elimina una carrera por su ID.
   * @param {string} id - El ID de la carrera a eliminar.
   */
  async deleteCareer(id) {
    const result = await Swal.fire({ title: '¿Eliminar carrera?', text: "Esta acción no se puede deshacer", icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if (!result.isConfirmed) return; // Si no se confirma, se cancela la acción
    try {
      await CareerManager.delete(id); // Elimina la carrera
      await this.loadCareers(); // Recarga la lista de carreras
    } catch {}
  }
};

// ======================
// MÓDULO DE CATEGORÍAS
// ======================

const CategoryManager = {
  /**
   * Registra una nueva categoría.
   * @param {string} name - Nombre de la categoría.
   */
  async register(name) {
    Swal.fire({ title: 'Registrando categoría', didOpen: Swal.showLoading, allowOutsideClick: false }); // Muestra un loader
    try {
      const response = await fetch(API_CATEGORIES_URL, { method: "POST", headers, body: JSON.stringify({ name }) }); // Realiza la solicitud para registrar la categoría
      if (!response.ok) throw new Error((await response.json()).message || "Error en el servidor"); // Manejo de errores
      Swal.close(); // Cierra el loader
      showToast('Categoría registrada correctamente', 'success'); // Muestra mensaje de éxito
      return response.json(); // Retorna los datos de la categoría registrada
    } catch (error) {
      Swal.close(); // Cierra el loader
      Swal.fire('Error', error.message, 'error'); // Muestra mensaje de error
      throw error; // Lanza el error para manejo posterior
    }
  },

  /**
   * Obtiene todas las categorías registradas.
   * @returns {Promise<Array>} - Retorna un array con las categorías.
   */
  async getAll() {
    try {
      const response = await fetch(API_CATEGORIES_URL, { headers }); // Realiza la solicitud a la API de categorías
      if (!response.ok) throw new Error("Error al obtener categorías"); // Manejo de errores
      return (await response.json()).sort((a, b) => a.name.localeCompare(b.name)); // Retorna las categorías ordenadas
    } catch (error) {
      Swal.fire('Error', error.message, 'error'); // Muestra mensaje de error
      return []; // Retorna un array vacío en caso de error
    }
  },

  /**
   * Elimina una categoría por su ID.
   * @param {string} id - El ID de la categoría a eliminar.
   */
  async delete(id) {
    Swal.fire({ title: 'Eliminando categoría', didOpen: Swal.showLoading, allowOutsideClick: false }); // Muestra un loader
    try {
      const response = await fetch(`${API_CATEGORIES_URL}/${id}`, { method: "DELETE", headers }); // Realiza la solicitud para eliminar la categoría
      if (!response.ok) throw new Error((await response.json()).message || "Error al eliminar"); // Manejo de errores
      Swal.close(); // Cierra el loader
      showToast('Categoría eliminada correctamente', 'success'); // Muestra mensaje de éxito
      return response.json(); // Retorna los datos de la categoría eliminada
    } catch (error) {
      Swal.close(); // Cierra el loader
      Swal.fire('Error', error.message, 'error'); // Muestra mensaje de error
      throw error; // Lanza el error para manejo posterior
    }
  }
};

const CategoryUI = {
  /**
   * Maneja el registro de una nueva categoría desde la interfaz de usuario.
   */
  async handleRegister() {
    const nameInput = document.getElementById('registerName'); // Obtiene el campo de nombre
    const name = nameInput.value.trim(); // Obtiene el nombre de la categoría
    if (!name || name.length < 3) return showToast('El nombre debe tener al menos 3 caracteres', 'error'); // Validación del nombre

    try {
      await CategoryManager.register(name); // Registra la categoría
      nameInput.value = ''; // Limpia el campo de nombre
      await this.loadCategories(); // Recarga la lista de categorías
    } catch {}
  },

  /**
   * Carga la lista de categorías en la interfaz de usuario.
   */
  async loadCategories() {
    try {
      const categories = await CategoryManager.getAll(); // Obtiene todas las categorías
      const tbody = document.getElementById('categoriesTableBody'); // Obtiene el cuerpo de la tabla de categorías
      if (!tbody) return; // Si no existe el cuerpo de la tabla, sale de la función

      // Actualiza la tabla con las categorías
      tbody.innerHTML = categories.length ? categories.map(cat => `
        <tr>
          <td>${cat.id}</td>
          <td>${cat.name}</td>
          <td class="text-end">
            <button onclick="CategoryUI.deleteCategory('${cat.id}')" class="btn btn-sm btn-danger">
              <i class="bi bi-trash"></i> Eliminar
            </button>
          </td>
        </tr>`).join('') :
        '<tr><td colspan="3" class="text-center">No hay categorías registradas</td></tr>'; // Mensaje si no hay categorías
    } catch (error) {
      const tbody = document.getElementById('categoriesTableBody'); // Obtiene el cuerpo de la tabla de categorías
      if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${error.message}</td></tr>`; // Muestra mensaje de error en la tabla
    }
  },

  /**
   * Elimina una categoría por su ID.
   * @param {string} id - El ID de la categoría a eliminar.
   */
  async deleteCategory(id) {
    const result = await Swal.fire({ title: '¿Eliminar categoría?', text: "Esta acción no se puede deshacer", icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if (!result.isConfirmed) return; // Si no se confirma, se cancela la acción
    try {
      await CategoryManager.delete(id); // Elimina la categoría
      await this.loadCategories(); // Recarga la lista de categorías
    } catch {}
  }
};

// ======================
// FUNCIONES DE FILTRADO
// ======================

/**
 * Filtra las carreras según el texto ingresado en el campo de búsqueda.
 * Obtiene todas las carreras y actualiza la tabla con las carreras que coinciden con el texto de búsqueda.
 */
async function filterCareers() {
  const searchInput = document.getElementById('searchCareerInput').value.toLowerCase(); // Obtiene el texto de búsqueda
  const careers = await CareerManager.getAll(); // Obtener todas las carreras
  const filteredCareers = careers.filter(career => career.name.toLowerCase().includes(searchInput)); // Filtra las carreras
  updateCareersTable(filteredCareers); // Actualiza la tabla con las carreras filtradas
}

/**
 * Filtra las categorías según el texto ingresado en el campo de búsqueda.
 * Obtiene todas las categorías y actualiza la tabla con las categorías que coinciden con el texto de búsqueda.
 */
async function filterCategories() {
  const searchInput = document.getElementById('searchCategoryInput').value.toLowerCase(); // Obtiene el texto de búsqueda
  const categories = await CategoryManager.getAll(); // Obtener todas las categorías
  const filteredCategories = categories.filter(category => category.name.toLowerCase().includes(searchInput)); // Filtra las categorías
  updateCategoriesTable(filteredCategories); // Actualiza la tabla con las categorías filtradas
}

/**
 * Actualiza la tabla de carreras con los datos proporcionados.
 * @param {Array} careers - Array de carreras a mostrar en la tabla.
 */
function updateCareersTable(careers) {
  const tbody = document.getElementById('careersTableBody'); // Obtiene el cuerpo de la tabla de carreras
  tbody.innerHTML = careers.length ? careers.map(career => `
    <tr>
      <td>${career.id}</td>
      <td>${career.name}</td>
      <td>${career.duration} años</td>
      <td>${career.categoryName}</td>
      <td class="text-end">
        <button onclick="CareerUI.deleteCareer('${career.id}')" class="btn btn-sm btn-danger">
          <i class="bi bi-trash"></i> Eliminar
        </button>
      </td>
    </tr>`).join('') : '<tr><td colspan="5" class="text-center">No hay carreras registradas</td></tr>'; // Mensaje si no hay carreras
}

/**
 * Actualiza la tabla de categorías con los datos proporcionados.
 * @param {Array} categories - Array de categorías a mostrar en la tabla.
 */
function updateCategoriesTable(categories) {
  const tbody = document.getElementById('categoriesTableBody'); // Obtiene el cuerpo de la tabla de categorías
  tbody.innerHTML = categories.length ? categories.map(cat => `
    <tr>
      <td>${cat.id}</td>
      <td>${cat.name}</td>
      <td class="text-end">
        <button onclick="CategoryUI.deleteCategory('${cat.id}')" class="btn btn-sm btn-danger">
          <i class="bi bi-trash"></i> Eliminar
        </button>
      </td>
    </tr>`).join('') : '<tr><td colspan="3" class="text-center">No hay categorías registradas</td></tr>'; // Mensaje si no hay categorías
}

// ======================
// INICIALIZACIÓN
// ======================

/**
 * Inicializa la aplicación al cargar el documento.
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const path = window.location.pathname.split('/').pop(); // Obtiene el nombre del archivo actual
    if (path === 'estudiantes.html' || path === '') {
      await Promise.all([loadCareersIntoSelect('registerCareer'), loadCareersIntoSelect('filterCareer')]); // Carga las carreras en los selects
      await loadStudentsTable(); // Carga la tabla de estudiantes
    } else if (path === 'carreras.html') {
      await Promise.all([CareerUI.loadCareers(), CareerUI.loadCategoriesIntoSelect()]); // Carga las carreras y categorías
    } else if (path === 'categorias.html') {
      await CategoryUI.loadCategories(); // Carga la lista de categorías
    }
  } catch (error) {
    Swal.fire('Error', 'Error al inicializar la aplicación', 'error'); // Muestra mensaje de error si ocurre un problema
  }
});
