const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const helmet = require('helmet');
const axios = require('axios');
const cheerio = require('cheerio');

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "https://ajax.googleapis.com"]
    }
  })
);


app.use(cors()); // Habilitar CORS para todas las solicitudes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
}); 

mongoose.connect('mongodb://localhost:27017/usuarios', {
  useUnifiedTopology: true,
  useNewUrlParser: true
}).then(() => {
  console.log('Conexión exitosa a MongoDB');
}).catch((error) => {
  console.error('Error de conexión a MongoDB:', error);
});
mongoose.connection.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));

const navigationHistorySchema = new mongoose.Schema({
  title: String,
  url: String,
  visitedAt: { type: Date, default: Date.now }, // Fecha de la primera visita
  visitCount: { type: Number, default: 1 }, // Contador de visitas a esta URL
  lastVisitedAt: { type: Date, default: Date.now } // Fecha de la última visita
});

const navigationProfileSchema = new mongoose.Schema({
  name: String,
  age : { type: Number, default: 0 },
  password: String,
  navigationHistory: [navigationHistorySchema],
  blockedWebsites: [String]
});

const usuarioSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
   
  navigationProfiles: [navigationProfileSchema],
   resetPasswordToken: { type: String, default: null },
   activeProfileName: { type: String, default: null }
  
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  Usuario.findOne({ username: username, password: password })
    .then(usuario => {
      if (usuario) {
        res.json({ success: true, message: '¡Inicio de sesión exitoso!' });
      } else {
        res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
      }
    })
    .catch(error => {
      console.error('Error al buscar usuario:', error);
      res.status(500).json({ success: false, message: 'Error en el servidor' });
    });
});

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  // Verificar si el email tiene un formato válido
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Formato de email inválido' });
  }

  // Verificar la longitud del email
  if (email.length > 254) {
    return res.status(400).json({ success: false, message: 'El email es demasiado largo' });
  }

  // Lista de dominios de correo electrónico permitidos
  const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com'];

  // Extraer el dominio del email y verificar si está en la lista de permitidos
  const domainPart = email.split('@')[1];
  if (!allowedDomains.includes(domainPart)) {
    return res.status(400).json({ success: false, message: 'El dominio del email no está permitido' });
  }

  // Primero verifica si el email ya está registrado
  Usuario.findOne({ email: email })
    .then(usuarioPorEmail => {
      if (usuarioPorEmail) {
        res.status(400).json({ success: false, message: 'Email ya registrado' });
      } else {
        // Si el email no está registrado, verifica si el nombre de usuario ya existe
        Usuario.findOne({ username: username })
          .then(usuarioExistente => {
            if (usuarioExistente) {
              res.status(400).json({ success: false, message: 'El usuario ya existe' });
            } else {
              // Si ni el email ni el usuario están registrados, crea el nuevo usuario
              const nuevoUsuario = new Usuario({ username: username, email: email, password: password });
              nuevoUsuario.save()
                .then(() => {
                  res.json({ success: true, message: '¡Usuario registrado exitosamente!' });
                })
                .catch(error => {
                  console.error('Error al guardar nuevo usuario:', error);
                  res.status(500).json({ success: false, message: 'Error en el servidor' });
                });
            }
          })
          .catch(error => {
            console.error('Error al buscar usuario existente:', error);
            res.status(500).json({ success: false, message: 'Error en el servidor' });
          });
      }
    })
    .catch(error => {
      console.error('Error al verificar el email:', error);
      res.status(500).json({ success: false, message: 'Error en el servidor' });
    });
});



app.put('/update-profile/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;
  const { newName, newPassword } = req.body;

  console.log("Received newName:", newName);
  console.log("Received newPassword:", newPassword);

  try {
      const usuario = await Usuario.findOne({ username: username });
      if (!usuario) {
          return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      const profile = usuario.navigationProfiles.find(p => p.name === profileName);
      if (!profile) {
          return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      }

      // Update the profile details
      profile.name = newName || profile.name;
      if (newPassword !== undefined) { // Explicitly check for undefined
          profile.password = newPassword;
      }

      await usuario.save();
      res.json({ success: true, message: 'Perfil actualizado exitosamente' });
  } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar el perfil' });
  }
});


app.get('/get-profile/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
    }

    res.json({ success: true, profile: profile });
  } catch (error) {
    console.error('Error al buscar el perfil:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

app.post('/add-navigation-profile/:username', async (req, res) => {
  const { username } = req.params;
  const { name, age, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Verificar si ya existe un perfil con el mismo nombre
    const existingProfile = usuario.navigationProfiles.find(profile => profile.name.toLowerCase() === name.toLowerCase());
    if (existingProfile) {
      return res.status(409).json({ success: false, message: 'Ya existe un perfil con ese nombre' });
    }

    // Crear el nuevo perfil de navegación
    const newProfile = {
      name: name,
      age: age,
      password: password,
      navigationHistory: [],
      blockedWebsites: []
    };

    // Añadir el nuevo perfil al usuario
    usuario.navigationProfiles.push(newProfile);
    await usuario.save();

    res.json({ success: true, message: 'Perfil de navegación añadido exitosamente' });
  } catch (error) {
    console.error('Error al añadir perfil de navegación:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Ruta para agregar un perfil de navegación a un usuario
app.post('/add-navigation-history/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;
  const { url } = req.body;

  if (!url.trim()) {
    return res.status(400).json({ success: false, message: 'URL no puede estar vacía' });
  }

  // Verificar si la URL es accesible mediante HTTP
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.status(400).json({ success: false, message: 'URL no soportada para extracción de título' });
  }

  try {
    // Realizar una solicitud HTTP a la URL para obtener el HTML
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const pageTitle = $('title').text(); // Extraer el título de la página

    const usuario = await Usuario.findOne({ username: username, 'navigationProfiles.name': profileName });
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario o perfil no encontrado' });
    }

    const profile = usuario.navigationProfiles.find(p => p.name === profileName);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
    }

    // Buscar si la URL ya existe en el historial
    let historyEntry = profile.navigationHistory.find(entry => entry.url === url);
    if (historyEntry) {
      // Si la URL ya existe, incrementar el contador y actualizar la fecha de última visita
      historyEntry.visitCount += 1;
      historyEntry.lastVisitedAt = new Date();
    } else {
      // Si la URL no existe, agregar una nueva entrada al historial
      profile.navigationHistory.push({
        title: pageTitle,
        url: url,
        visitedAt: new Date(),
        visitCount: 1,
        lastVisitedAt: new Date()
      });
    }

    await usuario.save();
    res.json({ success: true, message: 'Historial actualizado exitosamente', pageTitle: pageTitle });
  } catch (error) {
    console.error('Error al agregar al historial de navegación o al extraer el título:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});
// Ruta para obtener todos los perfiles de navegación de un usuario
app.get('/get-navigation-profiles/:username', async (req, res) => {
  const username = req.params.username;
  const page = parseInt(req.query.page) || 1; // Obtener el número de página de los parámetros de consulta, por defecto es 1
  const limit = parseInt(req.query.limit) || 10; // Obtener el límite de elementos por página, por defecto es 10
  const skip = (page - 1) * limit; // Calcular el número de elementos a omitir

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    // Filtrar los perfiles de navegación para la paginación
    const navigationProfiles = usuario.navigationProfiles.slice(skip, skip + limit);

    res.json({
      success: true,
      navigationProfiles: navigationProfiles,
      currentPage: page,
      totalPages: Math.ceil(usuario.navigationProfiles.length / limit)
    });
  } catch (error) {
    console.error('Error al obtener perfiles de navegación:', error);
    res.status(500).json({ success: false, message: 'Error al obtener perfiles de navegación' });
  }
});

// Ruta para actualizar el nombre de un perfil de navegación
app.put('/update-profile-name/:username/:oldName', async (req, res) => {
  const { newName } = req.body;
  const { username, oldName } = req.params;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === oldName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    profile.name = newName;
    await usuario.save();

    res.json({ success: true, message: 'Nombre de perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el nombre del perfil:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el nombre del perfil' });
  }
});

app.delete('/delete-navigation-profile/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    usuario.navigationProfiles = usuario.navigationProfiles.filter(profile => profile.name !== profileName);
    await usuario.save();

    res.json({ success: true, message: 'Perfil eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el perfil:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el perfil' });
  }
});

// Ruta para bloquear una URL
app.post('/block-website/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;
  const { websiteUrl } = req.body;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    // Agregar la URL bloqueada al perfil de navegación
    profile.blockedWebsites.push(websiteUrl);
    await usuario.save();

    res.json({ success: true, message: 'URL bloqueada exitosamente' });
  } catch (error) {
    console.error('Error al bloquear la URL:', error);
    res.status(500).json({ success: false, message: 'Error al bloquear la URL' });
  }
});

app.get('/get-blocked-urls/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    // Devolver las URLs bloqueadas en formato JSON
    res.json({ success: true, blockedUrls: profile.blockedWebsites });
  } catch (error) {
    console.error('Error al obtener las URLs bloqueadas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las URLs bloqueadas' });
  }
});


app.post('/set-active-navigation-profile/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;

  try {
      const usuario = await Usuario.findOne({ username: username });
      if (!usuario) {
          res.status(404).json({ success: false, message: 'Usuario no encontrado' });
          return;
      }

      const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
      if (!profile) {
          res.status(404).json({ success: false, message: 'Perfil no encontrado' });
          return;
      }

      // Actualizar el nombre del perfil activo en el documento del usuario
      usuario.activeProfileName = profileName; // Asumiendo que has añadido este campo al modelo
      await usuario.save();

      // Obtener las URLs bloqueadas del perfil
      const blockedWebsites = profile.blockedWebsites;

      res.json({ success: true, message: 'Perfil establecido como activo', blockedWebsites: blockedWebsites });
  } catch (error) {
      console.error('Error al establecer el perfil activo:', error);
      res.status(500).json({ success: false, message: 'Error al establecer el perfil activo' });
  }
});



// Ruta para obtener el historial de navegación de un perfil
app.get('/get-navigation-history/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;
  const page = parseInt(req.query.page) || 1; // Número de página, por defecto es 1
  const limit = parseInt(req.query.limit) || 10; // Cantidad de elementos por página, por defecto es 10
  const skip = (page - 1) * limit; // Cálculo de cuántos elementos omitir

  try {
    const usuario = await Usuario.findOne({ username: username, 'navigationProfiles.name': profileName });
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario o perfil no encontrado' });
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
    }

    // Aplicar paginación al historial de navegación
    const paginatedItems = profile.navigationHistory.slice(skip, skip + limit);
    const totalCount = profile.navigationHistory.length;

    res.json({
      success: true,
      navigationHistory: paginatedItems,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount: totalCount
    });
  } catch (error) {
    console.error('Error al obtener el historial de navegación:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Ruta para eliminar una visita del historial de navegación de un perfil
app.delete('/delete-navigation-history/:username/:profileName/:url', async (req, res) => {
  const { username, profileName, url } = req.params;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    // Eliminar la visita del historial de navegación del perfil
    profile.navigationHistory = profile.navigationHistory.filter(history => history.url !== url);
    await usuario.save();

    res.json({ success: true, message: 'Visita eliminada del historial de navegación' });
  } catch (error) {
    console.error('Error al eliminar visita del historial de navegación:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar visita del historial de navegación' });
  }
});





// Ruta para desbloquear una URL
app.post('/unblock-website/:username/:profileName', async (req, res) => {
  const { username, profileName } = req.params;
  const { websiteUrl } = req.body;

  try {
    const usuario = await Usuario.findOne({ username: username });
    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const profile = usuario.navigationProfiles.find(profile => profile.name === profileName);
    if (!profile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    // Eliminar la URL bloqueada del perfil de navegación
    profile.blockedWebsites = profile.blockedWebsites.filter(url => url !== websiteUrl);
    await usuario.save();

    res.json({ success: true, message: 'URL desbloqueada exitosamente' });
  } catch (error) {
    console.error('Error al desbloquear la URL:', error);
    res.status(500).json({ success: false, message: 'Error al desbloquear la URL' });
  }
});

const generarToken = () => {
  return crypto.randomBytes(20).toString('hex'); // Genera un token único de 20 bytes en formato hexadecimal
};

function generarYGuardarTokenRecuperacion(email) {
  const tokenRecuperacion = generarToken(); // Generar un token único
  const resetPasswordExpires = Date.now() + 3600000; // Establecer la fecha de vencimiento del token (1 hora en este ejemplo)

  Usuario.findOneAndUpdate({ email: email }, { resetPasswordToken: tokenRecuperacion, resetPasswordExpires: resetPasswordExpires })
      .then(usuario => {
          if (!usuario) {
              console.log("No se encontró ningún usuario con este correo electrónico.");
              return; // Si no se encuentra el usuario, no se guarda el token
          }
          console.log("Token de recuperación generado y guardado en el usuario:", tokenRecuperacion);
      })
      .catch(error => {
          console.error('Error al guardar el token de recuperación en el usuario:', error);
      });
}



// Ruta para solicitar restablecimiento de contraseña
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  // Generar y guardar el token de recuperación en el usuario
  generarYGuardarTokenRecuperacion(email);

  // Envía la respuesta al cliente
  res.json({ success: true, message: 'Se ha enviado un correo electrónico con un enlace para restablecer la contraseña' });
});

// Ruta para restablecer la contraseña
app.post('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  console.log("Token recibido en el servidor:", token);
  console.log("Contraseña recibida en el servidor:", password);

  // Añadir impresión de la fecha y hora actual para verificar problemas de sincronización
  const now = new Date();
  console.log("Fecha y hora actual del servidor:", now);

  Usuario.findOne({ resetPasswordToken: token, resetPasswordExpiration: { $gt: now } })
    .then(usuario => {
      if (!usuario) {
        console.log("Token proporcionado:", token);
        console.log("Fecha y hora actual para comparación:", now);
        console.log("No se encontró ningún usuario con el token proporcionado o el token ha expirado.");
        return res.status(400).json({ success: false, message: 'El enlace de restablecimiento es inválido o ha expirado' });
      }

      console.log("Usuario encontrado:", usuario.username); // Añadir impresión del nombre de usuario encontrado

      usuario.password = password;
      usuario.resetPasswordToken = undefined;
      usuario.resetPasswordExpiration = undefined;

      usuario.save()
        .then(() => {
          console.log("Contraseña restablecida correctamente para el usuario:", usuario.username);
          res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
        })
        .catch(error => {
          console.error('Error al guardar los cambios en la base de datos:', error);
          res.status(500).json({ success: false, message: 'Error al guardar los cambios en la base de datos' });
        });
    })
    .catch(error => {
      console.error('Error al buscar usuario con token:', error);
      res.status(500).json({ success: false, message: 'Error al buscar usuario en la base de datos' });
    });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});



