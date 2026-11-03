document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. EXPORTAR DICCIONARIO A EXCEL
  // ==========================================
  const btnExportar = document.getElementById('btn-exportar-db');
  if (btnExportar) {
    btnExportar.addEventListener('click', () => {
      const usersDB = JSON.parse(localStorage.getItem('usersDB')) || {};
      
      // Obtener fecha actual en formato DD-MM-AAAA
      const hoy = new Date();
      const dia = String(hoy.getDate()).padStart(2, '0');
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const anio = hoy.getFullYear();
      const fechaActual = `${dia}-${mes}-${anio}`;

      let filasUsuarios = "";
      let id = 1;
      for (const [username, data] of Object.entries(usersDB)) {
        const nombre = data.name || 'Sin nombre';
        const email = data.email || 'Sin correo';
        const rol = (username === 'admin') ? 'Administrador' : 'Estudiante';
        
        filasUsuarios += `
          <tr>
            <td class="center">${id}</td>
            <td>${username}</td>
            <td>${nombre}</td>
            <td>${email}</td>
            <td>${rol}</td>
          </tr>
        `;
        id++;
      }

      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            .header-bg { background-color: #d9d9d9; font-weight: bold; text-align: center; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <!-- CABECERA DEL MÓDULO CON FECHA DINÁMICA -->
            <tr>
              <td colspan="4" class="bold">Modulo: Usuarios</td>
              <td colspan="4" class="bold">Fecha de creación: ${fechaActual}</td>
              <td colspan="3" class="bold">Fecha de Modificación: ${fechaActual}</td>
            </tr>
            
            <tr><td colspan="11" class="header-bg">Información de la Tabla</td></tr>
            <tr>
              <td colspan="5">Nombre: Usuario</td>
              <td colspan="6">Alias: Usuarios</td>
            </tr>
            <tr>
              <td colspan="11">Descripción: Almacena los datos de los estudiantes y administradores.</td>
            </tr>
            
            <!-- CAMPOS DE LA TABLA -->
            <tr><td colspan="11" class="header-bg">Información de los campos</td></tr>
            <tr class="header-bg">
              <td>Id</td><td>Campo</td><td>Alias</td><td>Descripción</td><td>Tipo</td><td>Long</td>
              <td>Primary</td><td>Foreign</td><td>Not Null</td><td>Valor Defecto</td><td>Fecha Modificación</td>
            </tr>
            <tr>
              <td class="center">1</td><td>id_usuario</td><td>id</td><td>Identificador único del usuario</td>
              <td>Int</td><td class="center">11</td><td class="center bold">X</td><td></td><td class="center bold">X</td><td class="center">0001</td><td class="center">${fechaActual}</td>
            </tr>
            <tr>
              <td class="center">2</td><td>nom_usuario</td><td>nombre</td><td>Nombre de pila del usuario</td>
              <td>Varchar</td><td class="center">50</td><td></td><td></td><td class="center bold">X</td><td></td><td class="center">${fechaActual}</td>
            </tr>
            <tr>
              <td class="center">3</td><td>ape_usuario</td><td>apellido</td><td>Apellidos del usuario</td>
              <td>Varchar</td><td class="center">50</td><td></td><td></td><td class="center bold">X</td><td></td><td class="center">${fechaActual}</td>
            </tr>
            <tr>
              <td class="center">4</td><td>email</td><td>correo</td><td>Correo electrónico para contacto</td>
              <td>Varchar</td><td class="center">100</td><td></td><td></td><td class="center bold">X</td><td></td><td class="center">${fechaActual}</td>
            </tr>
            <tr>
              <td class="center">5</td><td>pass</td><td>contrasena</td><td>Contraseña local</td>
              <td>Varchar</td><td class="center">255</td><td></td><td></td><td class="center bold">X</td><td></td><td class="center">${fechaActual}</td>
            </tr>

            <!-- DATOS REALES AUTOMÁTICOS -->
            <tr><td colspan="11" class="header-bg">Datos Reales Registrados en la App</td></tr>
            <tr class="header-bg">
              <td colspan="2">ID</td><td colspan="3">Nombre de Usuario</td><td colspan="3">Nombre Completo</td><td colspan="2">Correo Electrónico</td><td>Rol</td>
            </tr>
            ${filasUsuarios}

            <!-- RELACIONES -->
            <tr><td colspan="11" class="header-bg">Información de las claves foráneas</td></tr>
            <tr class="header-bg">
              <td colspan="3">Nombre Clave</td><td colspan="3">Tabla Foránea</td><td colspan="2">Campo en tabla padre</td><td colspan="3">Campo en tabla foránea</td>
            </tr>
            <tr><td colspan="11" class="center">(No aplica - Es la tabla principal)</td></tr>

            <tr><td colspan="11" class="header-bg">Tablas con las que se relaciona</td></tr>
            <tr><td colspan="11">• Progreso (1 a Muchos)<br>• Ranking (1 a Muchos)</td></tr>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "Diccionario_BaseDeDatos.xls");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // ==========================================
  // 2. BACKUP COMPLETO DE LA BASE DE DATOS
  // ==========================================
  const btnBackup = document.getElementById('btn-backup-db');
  if (btnBackup) {
    btnBackup.addEventListener('click', () => {
      const backupData = {};
      // Extraemos TODOS los datos del localStorage (usuarios, progreso, ranking, logros)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backupData[key] = localStorage.getItem(key);
      }

      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fecha = new Date().toISOString().split('T')[0];
      
      link.setAttribute("href", url);
      link.setAttribute("download", `Backup_PixelVocacional_${fecha}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // ==========================================
  // 3. RESTAURAR BASE DE DATOS
  // ==========================================
  const btnRestore = document.getElementById('btn-restore-db');
  const inputRestore = document.getElementById('input-restore-db');

  if (btnRestore && inputRestore) {
    btnRestore.addEventListener('click', () => {
      inputRestore.click(); // Abre el explorador de archivos
    });

    inputRestore.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          
          if (confirm("⚠️ ADVERTENCIA: Esto reemplazará todos los datos actuales (usuarios, puntajes, logros). ¿Estás seguro de restaurar este Backup?")) {
            // Limpiamos el localStorage actual
            localStorage.clear();
            
            // Restauramos los datos del archivo
            for (const key in backupData) {
              localStorage.setItem(key, backupData[key]);
            }
            
            alert("✅ Base de Datos restaurada con éxito. La página se recargará.");
            location.reload();
          }
        } catch (error) {
          alert("❌ Error: El archivo seleccionado no es un Backup válido (.json).");
        }
      };
      reader.readAsText(file);
    });
  }
});