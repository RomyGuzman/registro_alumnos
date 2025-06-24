const API_URL = "http://localhost:5001/api/students";
const API_KEY = "12345ABCDEF";

// Headers comunes para todas las peticiones
const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`
};
//nuevo comentario para probar el commit
// Funciones de servicio que retornan Promesas
async function registerStudentService(name, career) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, career })
    });
    return response.json();
}

async function getStudentByIdService(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "GET",
        headers
    });
    return response.json();
}

async function getStudentsByCareerService(career) {
    const response = await fetch(`${API_URL}?career=${career}`, {
        method: "GET",
        headers
    });
    return response.json();
}

async function deleteStudentService(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers
    });
    return response.json();
}

// Funciones que manejan eventos de la interfaz

async function registerStudent() {
    const name = document.getElementById('registerName').value.trim();
    const career = document.getElementById('registerCareer').value.trim();
    const resultContainer = document.getElementById('registerResult');

    if (!name || !career) {
        alert("Please fill in both Name and Career fields.");
        return;
    }

    try {
        const result = await registerStudentService(name, career);

        // Mostrar la respuesta de forma permanente
        resultContainer.innerHTML = `
            <strong>Registration Successful!</strong><br><br>
            <strong>ID:</strong> ${result.student.id}<br>
            <strong>Name:</strong> ${result.student.name}<br>
            <strong>Career:</strong> ${result.student.career}
        `;

        // Limpia los inputs
        document.getElementById('registerName').value = '';
        document.getElementById('registerCareer').value = '';

    } catch (error) {
        console.error("Error registering student:", error);
        resultContainer.textContent = "Failed to register student.";
    }
}


async function getStudentById() {
    const id = document.getElementById('studentId').value.trim();

    if (!id) {
        alert("Please enter a Student ID.");
        return;
    }

    try {
        const student = await getStudentByIdService(id);
        const resultContainer = document.getElementById('getResult');
        if (student.error) {
            resultContainer.textContent = student.error;
        } else {
            resultContainer.innerHTML = `
                <strong>ID:</strong> ${student.id}<br>
                <strong>Name:</strong> ${student.name}<br>
                <strong>Career:</strong> ${student.career}
            `;
        }
    } catch (error) {
        console.error("Error fetching student:", error);
        document.getElementById('getResult').textContent = "Failed to fetch student.";
    }
}

async function getStudentsByCareer() {
    const career = document.getElementById('careerFilter').value.trim();

    if (!career) {
        alert("Please enter a Career to filter.");
        return;
    }

    try {
        const students = await getStudentsByCareerService(career);
        const resultContainer = document.getElementById('careerResult');

        if (students.length === 0) {
            resultContainer.textContent = "No students found for that career.";
            return;
        }

        // Limpiar resultados anteriores
        resultContainer.innerHTML = '';

        // Usamos forEach para recorrer y construir el HTML manualmente
        students.forEach(student => {
            const studentDiv = document.createElement('div');
            studentDiv.classList.add('student-card');
            studentDiv.innerHTML = `
                <strong>ID:</strong> ${student.id}<br>
                <strong>Name:</strong> ${student.name}<br>
                <strong>Career:</strong> ${student.career}
            `;
            resultContainer.appendChild(studentDiv);

            // Separador entre tarjetas (opcional)
            const hr = document.createElement('hr');
            resultContainer.appendChild(hr);
        });

    } catch (error) {
        console.error("Error fetching students:", error);
        document.getElementById('careerResult').textContent = "Failed to fetch students.";
    }
}


// NOTA EDUCATIVA:
// Alternativa .map() para transformar un array en un nuevo array de resultados HTML.
// El método .map() es ideal cuando quieres "transformar" y "devolver" un nuevo array.
// Ejemplo:
// const htmlElements = students.map(student => `<div>${student.name}</div>`).join('');

// En cambio, .forEach() simplemente recorre el array y ejecuta una acción por cada elemento.
// Es más fácil de entende, porque no devuelve nada, solo "hace cosas".
// Aquí usamos forEach para ir creando y agregando manualmente los elementos al HTML.
// resultContainer.innerHTML = students.map(student => 
//     <div class="student-card">
//         <strong>ID:</strong> ${student.id}<br>
//         <strong>Name:</strong> ${student.name}<br>
//         <strong>Career:</strong> ${student.career}
//     </div>
// ).join('<hr>');

async function deleteStudent() {
    const id = document.getElementById('deleteId').value.trim();

    if (!id) {
        alert("Please enter a Student ID to delete.");
        return;
    }

    try {
        const result = await deleteStudentService(id);
        document.getElementById('deleteResult').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        console.error("Error deleting student:", error);
        document.getElementById('deleteResult').textContent = "Failed to delete student.";
    }
}
