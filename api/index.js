// ============================
// IMPORTACIÓN DE MÓDULOS Y CONFIGURACIÓN INICIAL
// ============================
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 5001;

// API Key ficticia para autenticación de las peticiones
const API_KEY = '12345ABCDEF';

// ============================
// MIDDLEWARES
// ============================

// Habilita CORS para permitir peticiones desde el frontend
app.use(cors());
// Permite recibir y procesar JSON en las peticiones
app.use(express.json());

// ============================
// ARCHIVOS DE DATOS
// ============================

// Rutas de los archivos donde se almacenan los datos
const STUDENTS_FILE = './students.json';
const CAREERS_FILE = './careers.json';
const CATEGORIES_FILE = './categories.json';

// ============================
// FUNCIONES DE UTILIDAD PARA ARCHIVOS
// ============================

// Leer estudiantes desde archivo
function loadStudents() {
    try {
        const data = fs.readFileSync(STUDENTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading students, using empty list.", error);
        return [];
    }
}

// Guardar estudiantes en archivo
function saveStudents(students) {
    try {
        fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
    } catch (error) {
        console.error("Error saving students:", error);
    }
}

// Leer carreras desde archivo
function loadCareers() {
    try {
        const data = fs.readFileSync(CAREERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading careers, using empty list.", error);
        return [];
    }
}

// Guardar carreras en archivo
function saveCareers(careers) {
    try {
        fs.writeFileSync(CAREERS_FILE, JSON.stringify(careers, null, 2));
    } catch (error) {
        console.error("Error saving careers:", error);
    }
}

// Leer categorías desde archivo
function loadCategories() {
    try {
        const data = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error("Error loading categories, using empty list.", error);
        return [];
    }
}

// Guardar categorías en archivo
function saveCategories(categories) {
    try {
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    } catch (error) {
        console.error("Error saving categories:", error);
    }
}

// ============================
// INICIALIZACIÓN DE DATOS EN MEMORIA
// ============================

// Carga los datos de los archivos al iniciar el servidor
let students = loadStudents();
let careers = loadCareers();
let categories = loadCategories();

// ============================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================

// Verifica que la API Key enviada en el header sea válida
app.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized. Invalid API Key.' });
    }
    next();
});

// ============================
// ENDPOINTS DE LA API
// ============================

// ----------- ESTUDIANTES -----------

// Registrar nuevo estudiante
app.post('/api/students', (req, res) => {
    const { name, career, age, dni } = req.body;

    // Validación de campos obligatorios
    if (!name || !career) {
        return res.status(400).json({ error: "Missing required fields: name and career." });
    }

    // Genera un nuevo ID incremental
    const newStudentId = students.length ? students[students.length - 1].id + 1 : 1;

    // Crea el objeto estudiante
    const newStudent = {
        id: newStudentId,
        name,
        career,
        age,
        dni,
    };

    students.push(newStudent);
    saveStudents(students); // Guarda los cambios en el archivo

    return res.status(201).json({ message: "Student registered successfully.", student: newStudent });
});

// Consultar estudiante por ID
app.get('/api/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({ error: "Student not found." });
    }

    return res.status(200).json(student);
});

// Consultar todos los estudiantes
app.get('/api/students', (req, res) => {
    return res.status(200).json(students);
});

// Eliminar estudiante por ID
app.delete('/api/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Student not found for deletion." });
    }

    students.splice(index, 1);
    saveStudents(students); // Guarda los cambios

    return res.status(200).json({ message: "Student deleted successfully." });
});

// ----------- CARRERAS -----------

// Registrar nueva carrera
app.post('/api/careers', (req, res) => {
    const { name, duration, categoryName } = req.body;

    // Validación de campos obligatorios
    if (!name || !duration || !categoryName) {
        return res.status(400).json({ 
            success: false,
            error: "Nombre, duración y categoría son campos obligatorios" 
        });
    }

    // Validar que la categoría exista (comparación insensible a mayúsculas)
    const categoryExists = categories.some(c => 
        c.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (!categoryExists) {
        return res.status(404).json({
            success: false,
            error: "La categoría especificada no existe"
        });
    }

    // Crear nueva carrera
    const newCareer = {
        id: Date.now(), // ID único basado en timestamp
        name,
        duration,
        categoryName
    };

    // Agregar y guardar
    careers.push(newCareer);
    
    try {
        saveCareers(careers);
        return res.status(201).json({
            success: true,
            message: "Carrera registrada exitosamente",
            career: newCareer
        });
    } catch (error) {
        console.error("Error al guardar:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno al guardar la carrera"
        });
    }
});

// Consultar carrera por ID
app.get('/api/careers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const career = careers.find(c => c.id === id);

    if (!career) {
        return res.status(404).json({ error: "Career not found." });
    }

    return res.status(200).json(career);
});

// Consultar todas las carreras o filtrar por nombre
app.get('/api/careers', (req, res) => {
    const careerName = req.query.name;

    if (careerName) {
        const filteredCareers = careers.filter(c => c.name.toLowerCase() === careerName.toLowerCase());
        return res.status(200).json(filteredCareers);
    }
    return res.status(200).json(careers);
});

// Borrar carrera por ID
app.delete('/api/careers/:id', (req, res) => {
    const id = parseInt(req.params.id); 
    const index = careers.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Career not found for deletion." });
    }

    // Verificar si hay estudiantes asociados a la carrera
    const studentsInCareer = students.filter(s => s.career.toLowerCase() === careers[index].name.toLowerCase());
    if (studentsInCareer.length > 0) {
        return res.status(400).json({ error: "Cannot delete career with associated students." });
    }

    careers.splice(index, 1);
    saveCareers(careers); // Guarda los cambios

    return res.status(200).json({ message: "Career deleted successfully." });
});

// ----------- CATEGORÍAS -----------

// Registrar nueva categoría
app.post('/api/categories', (req, res) => {
    const { name } = req.body;

    // Validación de campo obligatorio
    if (!name) {
        return res.status(400).json({ error: "Missing required field: name." });
    }

    // Verifica si la categoría ya existe (insensible a mayúsculas)
    const existingCategory = categories.find(c => c.name.toLowerCase() === name.toLowerCase());

    if (existingCategory) {
        return res.status(409).json({ error: "Career category already exists." });
    }

    // Genera un nuevo ID incremental
    const newCategoryId = categories.length ? categories[categories.length - 1].id + 1 : 1;

    // Crea el objeto categoría
    const newCategory = {
        id: newCategoryId,
        name
    };

    categories.push(newCategory);
    saveCategories(categories); // Guarda los cambios

    // Devuelve el objeto completo
    return res.status(201).json({ message: "Career category registered successfully.", category: newCategory });
});

// Consultar categoría de carrera por ID
app.get('/api/categories/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const category = categories.find(c => c.id === id);

    if (!category) {
        return res.status(404).json({ error: "Career category not found." });
    }

    return res.status(200).json(category);
});

// Consultar todas las categorías o filtrar por nombre
app.get('/api/categories', (req, res) => {
    const categoryName = req.query.name;

    if (categoryName) {
        const filteredCategories = categories.filter(c => c.name.toLowerCase() === categoryName.toLowerCase());
        return res.status(200).json(filteredCategories);
    }
    return res.status(200).json(categories);
});

// Borrar categoría de carrera por ID
app.delete('/api/categories/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = categories.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Career category not found for deletion." });
    }

    // Verificar si hay carreras asociadas a la categoría
    const careersInCategory = careers.filter(c => c.categoryId === id);
    if (careersInCategory.length > 0) {
        return res.status(400).json({ error: "Cannot delete category with associated careers." });
    }

    categories.splice(index, 1);
    saveCategories(categories); // Guarda los cambios

    return res.status(200).json({ message: "Career category deleted successfully." });
});

// ============================
// INICIO DEL SERVIDOR
// ============================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

